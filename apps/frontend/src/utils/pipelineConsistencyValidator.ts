/**
 * Pipeline Consistency Validator
 *
 * Tracks data through the complete pipeline:
 * Flask (Backend) → Express (API Service) → Frontend Transform → Component
 *
 * Deep-compares at each layer to detect:
 * - Missing fields
 * - Changed values
 * - Type mismatches
 * - Silent data loss
 */

interface PipelineSnapshot {
  layer: 'flask' | 'express' | 'transform' | 'component';
  timestamp: number;
  data: any;
  summary: {
    fieldCount: number;
    totalSize: number;
    paths: string[];
  };
}

interface FieldDifference {
  path: string;
  type: 'added' | 'removed' | 'changed' | 'type_changed';
  from?: any;
  to?: any;
  severity: 'critical' | 'warning' | 'info';
  description: string;
}

interface PipelineComparison {
  from: PipelineSnapshot;
  to: PipelineSnapshot;
  differences: FieldDifference[];
  summary: {
    totalDifferences: number;
    critical: number;
    warnings: number;
    info: number;
    fieldsPreserved: number;
    fieldsMissing: number;
    fieldsAdded: number;
    fieldsChanged: number;
  };
}

export class PipelineConsistencyValidator {
  private snapshots: PipelineSnapshot[] = [];
  private comparisons: PipelineComparison[] = [];

  /**
   * Capture data snapshot at a pipeline layer
   */
  captureSnapshot(layer: 'flask' | 'express' | 'transform' | 'component', data: any) {
    const snapshot: PipelineSnapshot = {
      layer,
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      summary: {
        fieldCount: this.countFields(data),
        totalSize: JSON.stringify(data).length,
        paths: this.getPaths(data),
      },
    };

    this.snapshots.push(snapshot);

    console.log(`📸 Snapshot captured: ${layer} (${snapshot.summary.fieldCount} fields, ${snapshot.summary.totalSize} bytes)`);

    return snapshot;
  }

  /**
   * Compare two pipeline layers
   */
  compareSnapshots(fromIndex: number, toIndex: number): PipelineComparison {
    if (fromIndex >= this.snapshots.length || toIndex >= this.snapshots.length) {
      throw new Error('Invalid snapshot indices');
    }

    const from = this.snapshots[fromIndex];
    const to = this.snapshots[toIndex];

    const differences = this.deepCompare(from.data, to.data, '');

    const summary = {
      totalDifferences: differences.length,
      critical: differences.filter((d) => d.severity === 'critical').length,
      warnings: differences.filter((d) => d.severity === 'warning').length,
      info: differences.filter((d) => d.severity === 'info').length,
      fieldsPreserved: from.summary.fieldCount - differences.filter((d) => d.type === 'removed').length,
      fieldsMissing: differences.filter((d) => d.type === 'removed').length,
      fieldsAdded: differences.filter((d) => d.type === 'added').length,
      fieldsChanged: differences.filter((d) => d.type === 'changed' || d.type === 'type_changed').length,
    };

    const comparison: PipelineComparison = {
      from,
      to,
      differences,
      summary,
    };

    this.comparisons.push(comparison);

    return comparison;
  }

  /**
   * Deep compare two objects recursively
   */
  private deepCompare(from: any, to: any, path: string): FieldDifference[] {
    const differences: FieldDifference[] = [];

    // Handle null/undefined
    if (from === null && to === null) return differences;
    if (from === undefined && to === undefined) return differences;

    // Handle type mismatches at root
    if (typeof from !== typeof to && path === '') {
      differences.push({
        path: 'root',
        type: 'type_changed',
        from: typeof from,
        to: typeof to,
        severity: 'critical',
        description: `Type mismatch at root: ${typeof from} → ${typeof to}`,
      });
      return differences;
    }

    // Object to object comparison
    if (typeof from === 'object' && typeof to === 'object' && from !== null && to !== null) {
      // Handle arrays
      if (Array.isArray(from) || Array.isArray(to)) {
        if (!Array.isArray(from) || !Array.isArray(to)) {
          differences.push({
            path: path || 'root',
            type: 'type_changed',
            from: Array.isArray(from) ? 'array' : typeof from,
            to: Array.isArray(to) ? 'array' : typeof to,
            severity: 'critical',
            description: `Array mismatch: ${Array.isArray(from) ? 'array' : typeof from} → ${Array.isArray(to) ? 'array' : typeof to}`,
          });
          return differences;
        }

        // Both are arrays - compare lengths and elements
        const maxLen = Math.max(from.length, to.length);
        for (let i = 0; i < maxLen; i++) {
          const newPath = `${path}[${i}]`;
          if (i >= from.length) {
            differences.push({
              path: newPath,
              type: 'added',
              to: to[i],
              severity: 'info',
              description: `New array element added at index ${i}`,
            });
          } else if (i >= to.length) {
            differences.push({
              path: newPath,
              type: 'removed',
              from: from[i],
              severity: 'warning',
              description: `Array element removed at index ${i}`,
            });
          } else {
            differences.push(...this.deepCompare(from[i], to[i], newPath));
          }
        }
      } else {
        // Both are objects - compare keys and values
        const allKeys = new Set([...Object.keys(from), ...Object.keys(to)]);

        for (const key of allKeys) {
          const newPath = path ? `${path}.${key}` : key;
          const fromHas = key in from;
          const toHas = key in to;

          if (!fromHas && toHas) {
            // New field added
            differences.push({
              path: newPath,
              type: 'added',
              to: to[key],
              severity: 'info',
              description: `New field: ${newPath}`,
            });
          } else if (fromHas && !toHas) {
            // Field removed
            differences.push({
              path: newPath,
              type: 'removed',
              from: from[key],
              severity: 'critical',
              description: `Missing field: ${newPath} (was ${this.typeOf(from[key])})`,
            });
          } else {
            // Both have the field - compare values
            const fromVal = from[key];
            const toVal = to[key];
            const fromType = this.typeOf(fromVal);
            const toType = this.typeOf(toVal);

            if (fromType !== toType) {
              differences.push({
                path: newPath,
                type: 'type_changed',
                from: fromVal,
                to: toVal,
                severity: 'warning',
                description: `Type changed: ${fromType} → ${toType}`,
              });
            } else if (typeof fromVal === 'object' && fromVal !== null) {
              // Recurse for nested objects
              differences.push(...this.deepCompare(fromVal, toVal, newPath));
            } else if (fromVal !== toVal) {
              // Primitive value changed
              const severity = this.isNumericDifference(fromVal, toVal) ? 'warning' : 'critical';
              differences.push({
                path: newPath,
                type: 'changed',
                from: fromVal,
                to: toVal,
                severity,
                description: `Value changed: ${this.formatValue(fromVal)} → ${this.formatValue(toVal)}`,
              });
            }
          }
        }
      }
    } else if (from !== to) {
      // Primitive value mismatch
      differences.push({
        path: path || 'root',
        type: 'changed',
        from,
        to,
        severity: 'critical',
        description: `Value mismatch: ${this.formatValue(from)} → ${this.formatValue(to)}`,
      });
    }

    return differences;
  }

  /**
   * Count total fields in object (recursive)
   */
  private countFields(obj: any): number {
    if (obj === null || obj === undefined) return 0;

    let count = 0;

    if (Array.isArray(obj)) {
      count += obj.length;
      for (const item of obj) {
        if (typeof item === 'object') count += this.countFields(item);
      }
    } else if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        count += 1;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          count += this.countFields(obj[key]);
        }
      }
    }

    return count;
  }

  /**
   * Get all paths in object (for summary)
   */
  private getPaths(obj: any, prefix = ''): string[] {
    const paths: string[] = [];

    if (obj === null || obj === undefined) return paths;

    if (Array.isArray(obj)) {
      obj.forEach((item, i) => {
        const path = `${prefix}[${i}]`;
        paths.push(path);
        if (typeof item === 'object' && item !== null) {
          paths.push(...this.getPaths(item, path));
        }
      });
    } else if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        paths.push(path);
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          paths.push(...this.getPaths(obj[key], path));
        }
      }
    }

    return paths;
  }

  /**
   * Get type of value
   */
  private typeOf(val: any): string {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    if (typeof val === 'object') return 'object';
    return typeof val;
  }

  /**
   * Format value for display
   */
  private formatValue(val: any): string {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return `"${val.substring(0, 50)}"`;
    if (typeof val === 'number') return val.toFixed(2);
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (Array.isArray(val)) return `[${val.length} items]`;
    if (typeof val === 'object') return `{...}`;
    return String(val);
  }

  /**
   * Check if numeric difference (rounding tolerance)
   */
  private isNumericDifference(from: any, to: any): boolean {
    if (typeof from !== 'number' || typeof to !== 'number') return false;
    return Math.abs(from - to) < 0.0001; // Small floating point tolerance
  }

  /**
   * Run full pipeline validation
   */
  async validateFullPipeline(
    flaskData: any,
    expressData: any,
    transformedData: any,
    componentData: any
  ): Promise<{
    stages: PipelineComparison[];
    summary: {
      flaskToExpress: PipelineComparison;
      expressToTransform: PipelineComparison;
      transformToComponent: PipelineComparison;
      overallHealth: string;
      criticalIssues: number;
    };
  }> {
    console.log('🔄 Starting Full Pipeline Validation\n');

    // Capture all layers
    this.captureSnapshot('flask', flaskData);
    this.captureSnapshot('express', expressData);
    this.captureSnapshot('transform', transformedData);
    this.captureSnapshot('component', componentData);

    // Compare stages
    const flaskToExpress = this.compareSnapshots(0, 1);
    const expressToTransform = this.compareSnapshots(1, 2);
    const transformToComponent = this.compareSnapshots(2, 3);

    // Log results
    console.group('📊 PIPELINE VALIDATION RESULTS');
    this.logComparison('Flask → Express', flaskToExpress);
    this.logComparison('Express → Transform', expressToTransform);
    this.logComparison('Transform → Component', transformToComponent);
    console.groupEnd();

    const totalCritical =
      flaskToExpress.summary.critical +
      expressToTransform.summary.critical +
      transformToComponent.summary.critical;

    const overallHealth =
      totalCritical === 0
        ? '✅ HEALTHY - No critical issues'
        : `❌ ISSUES - ${totalCritical} critical problems`;

    console.log(`\n${overallHealth}`);

    return {
      stages: [flaskToExpress, expressToTransform, transformToComponent],
      summary: {
        flaskToExpress,
        expressToTransform,
        transformToComponent,
        overallHealth,
        criticalIssues: totalCritical,
      },
    };
  }

  /**
   * Log comparison in readable format
   */
  private logComparison(title: string, comparison: PipelineComparison) {
    console.group(`\n🔀 ${title}`);
    console.log(`From: ${comparison.from.layer} (${comparison.from.summary.fieldCount} fields)`);
    console.log(`To: ${comparison.to.layer} (${comparison.to.summary.fieldCount} fields)`);

    if (comparison.differences.length === 0) {
      console.log('✅ No differences detected');
    } else {
      console.log(`\n⚠️ Found ${comparison.differences.length} differences:`);

      const byType = this.groupBy(comparison.differences, (d) => d.type);

      if (byType.removed && byType.removed.length > 0) {
        console.group(`❌ Removed Fields (${byType.removed.length})`);
        byType.removed.forEach((d) => {
          console.warn(`  - ${d.path}`);
        });
        console.groupEnd();
      }

      if (byType.added && byType.added.length > 0) {
        console.group(`✚ Added Fields (${byType.added.length})`);
        byType.added.forEach((d) => {
          console.log(`  + ${d.path}`);
        });
        console.groupEnd();
      }

      if (byType.changed && byType.changed.length > 0) {
        console.group(`🔄 Changed Values (${byType.changed.length})`);
        byType.changed.forEach((d) => {
          console.warn(`  ${d.path}: ${this.formatValue(d.from)} → ${this.formatValue(d.to)}`);
        });
        console.groupEnd();
      }

      if (byType.type_changed && byType.type_changed.length > 0) {
        console.group(`⚠️ Type Mismatches (${byType.type_changed.length})`);
        byType.type_changed.forEach((d) => {
          console.error(`  ${d.path}: ${d.from} → ${d.to}`);
        });
        console.groupEnd();
      }
    }

    console.log(`\nSummary:`);
    console.log(`  Preserved: ${comparison.summary.fieldsPreserved}`);
    console.log(`  Missing: ${comparison.summary.fieldsMissing}`);
    console.log(`  Added: ${comparison.summary.fieldsAdded}`);
    console.log(`  Changed: ${comparison.summary.fieldsChanged}`);

    console.groupEnd();
  }

  /**
   * Get formatted report
   */
  getReport(): string {
    const lines: string[] = [];

    lines.push('═'.repeat(80));
    lines.push('PIPELINE CONSISTENCY VALIDATION REPORT');
    lines.push('═'.repeat(80));

    for (const comparison of this.comparisons) {
      lines.push(`\n${comparison.from.layer.toUpperCase()} → ${comparison.to.layer.toUpperCase()}`);
      lines.push('-'.repeat(40));

      if (comparison.differences.length === 0) {
        lines.push('✅ No differences');
      } else {
        lines.push(`Total: ${comparison.differences.length}`);
        lines.push(`  ❌ Critical: ${comparison.summary.critical}`);
        lines.push(`  ⚠️ Warnings: ${comparison.summary.warnings}`);
        lines.push(`  ℹ️ Info: ${comparison.summary.info}`);

        // Show critical issues
        const critical = comparison.differences.filter((d) => d.severity === 'critical');
        if (critical.length > 0) {
          lines.push('\n  Critical Issues:');
          critical.forEach((d) => {
            lines.push(`    • ${d.path}: ${d.description}`);
          });
        }
      }
    }

    lines.push('\n' + '═'.repeat(80));

    return lines.join('\n');
  }

  /**
   * Helper: Group array by predicate
   */
  private groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
    return arr.reduce(
      (acc, item) => {
        const key = fn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, T[]>
    );
  }

  /**
   * Reset validator
   */
  reset() {
    this.snapshots = [];
    this.comparisons = [];
  }
}

export const pipelineValidator = new PipelineConsistencyValidator();

/**
 * Convenience function for logging mismatches
 */
export function logMismatch(comparison: PipelineComparison) {
  const critical = comparison.differences.filter((d) => d.severity === 'critical');
  const warnings = comparison.differences.filter((d) => d.severity === 'warning');

  if (critical.length > 0) {
    console.error(`❌ Mismatch: ${critical.length} critical issues`);
    critical.forEach((d) => {
      console.error(`   ${d.path}: ${d.description}`);
    });
  }

  if (warnings.length > 0) {
    console.warn(`⚠️ Mismatch: ${warnings.length} warnings`);
    warnings.forEach((d) => {
      console.warn(`   ${d.path}: ${d.description}`);
    });
  }

  return { critical, warnings };
}

/**
 * Quick validation helper
 */
export function quickValidate(label: string, from: any, to: any): boolean {
  const validator = new PipelineConsistencyValidator();
  validator.captureSnapshot('flask', from);
  validator.captureSnapshot('component', to);
  const result = validator.compareSnapshots(0, 1);

  if (result.differences.length === 0) {
    console.log(`✅ ${label}: Consistent`);
    return true;
  } else {
    console.warn(`⚠️ ${label}: ${result.differences.length} differences`);
    logMismatch(result);
    return false;
  }
}
