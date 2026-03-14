/**
 * Frontend Logger Module
 * Provides simple logging functionality for debugging and error tracking
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  debug: (data: any, message?: string) => {
    if (isDevelopment) {
      console.debug(message || 'Debug:', data);
    }
  },
  info: (data: any, message?: string) => {
    console.info(message || 'Info:', data);
  },
  warn: (data: any, message?: string) => {
    console.warn(message || 'Warning:', data);
  },
  error: (data: any, message?: string) => {
    console.error(message || 'Error:', data);
  },
};
