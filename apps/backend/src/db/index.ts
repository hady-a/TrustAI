import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

const { Pool } = pkg;

// ============================================================================
// PRODUCTION-GRADE DATABASE POOL CONFIGURATION
// ============================================================================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,                           // Maximum connections in pool
    min: 2,                            // Minimum connections to maintain
    idleTimeoutMillis: 30000,          // Close connections after 30s idle
    connectionTimeoutMillis: 2000,     // 2s timeout when acquiring connection
    allowExitOnIdle: false,            // Don't exit when idle
    application_name: 'trustai-backend',
});

// ============================================================================
// ERROR HANDLING & LOGGING
// ============================================================================

pool.on('error', (err: Error) => {
    console.error('❌ Unexpected error on idle client:', err);
    console.error('   This usually means the connection was dropped by the database');
});

pool.on('connect', () => {
    console.log('✅ New database connection established');
});

pool.on('remove', () => {
    console.log('⚠️  Database connection removed from pool');
});

// ============================================================================
// DATABASE HEALTH CHECK FUNCTION
// ============================================================================

export async function checkDatabaseConnection(maxRetries = 5): Promise<boolean> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT 1 as health_check');
            client.release();
            
            if (result.rows[0].health_check === 1) {
                console.log(`✅ Database connection verified (attempt ${attempt}/${maxRetries})`);
                return true;
            }
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const errorMsg = lastError.message;
            
            console.warn(`⚠️  Database connection attempt ${attempt}/${maxRetries} failed:`, errorMsg);
            
            // Don't retry on certain errors
            if (errorMsg.includes('password')) {
                console.error('❌ Authentication error - check DATABASE_URL credentials');
                return false;
            }
            
            if (errorMsg.includes('does not exist')) {
                console.error('❌ Database does not exist - run migrations with: npm run db:push');
                return false;
            }
            
            // Wait before retry
            if (attempt < maxRetries) {
                const delayMs = 2000 * attempt; // Exponential backoff: 2s, 4s, 6s, etc
                console.log(`   Retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    
    console.error(`❌ Database connection failed after ${maxRetries} attempts`);
    console.error(`   Last error: ${lastError?.message}`);
    return false;
}

// ============================================================================
// SAFE QUERY WRAPPER WITH RETRY LOGIC
// ============================================================================

export async function safeQuery<T>(
    queryFn: () => Promise<T>,
    context: string = 'query'
): Promise<T> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await queryFn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const errorMsg = lastError.message;

            // Check if it's a connection error that warrants a retry
            const isConnError = 
                errorMsg.includes('ECONNRESET') ||
                errorMsg.includes('ECONNREFUSED') ||
                errorMsg.includes('ETIMEDOUT') ||
                errorMsg.includes('terminated') ||
                errorMsg.includes('connection closed');

            if (isConnError && attempt < maxRetries) {
                console.warn(`⚠️  [${context}] Connection error on attempt ${attempt}/${maxRetries}, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
            }

            // Non-retryable error or last attempt
            console.error(`❌ [${context}] Failed after ${attempt} attempt(s):`, errorMsg);
            throw error;
        }
    }

    throw lastError || new Error(`${context} failed after ${maxRetries} attempts`);
}

// ============================================================================
// DRIZZLE ORM INITIALIZATION
// ============================================================================

export const db = drizzle(pool, { schema });

// ============================================================================
// EXPORTS
// ============================================================================

export { pool };
export type Database = typeof db;

