// src/lib/utils.ts
// Utility functions for the Ingrid AI System

/**
 * Sanitize text for embedding — removes newlines that cause
 * Google text-embedding-004 to return empty arrays (Error 400).
 * See AI.md Section 4 - Troubleshooting.
 */
export function cleanTextForEmbedding(text: string): string {
    return text.replace(/[\n\r]+/g, ' ').trim();
}

/**
 * Get current time in WIB (Asia/Jakarta) timezone.
 * Used for temporal context in Ingrid's prompt.
 */
export function getWIBTime(): string {
    return new Date().toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Get current date+time in WIB for logging.
 */
export function getWIBDateTime(): string {
    return new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

/**
 * Structured logger with WIB timestamp
 */
export const logger = {
    info: (tag: string, message: string) =>
        console.log(`[${getWIBTime()}] ✅ [${tag}]: ${message}`),
    warn: (tag: string, message: string) =>
        console.warn(`[${getWIBTime()}] ⚠️ [${tag}]: ${message}`),
    error: (tag: string, message: string, error?: any) => {
        console.error(`[${getWIBTime()}] ❌ [${tag}]: ${message}`);
        if (error) console.error('  Detail:', error?.message || error);
    },
    incoming: (pushname: string, message: string) =>
        console.log(`\n[${getWIBTime()}] 📩 Pesan dari ${pushname}: "${message}"`),
    outgoing: (response: string) =>
        console.log(`[${getWIBTime()}] 🤖 [Ingrid]: ${response}`),
};
