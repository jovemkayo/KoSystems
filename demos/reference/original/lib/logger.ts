// The public demonstration does not send telemetry or records to external services.
export function logInfo() {}
export function logWarn() {}
export function logError() {}
export function logFatal() {}
export const logger = { info: logInfo, warn: logWarn, error: logError, fatal: logFatal };
