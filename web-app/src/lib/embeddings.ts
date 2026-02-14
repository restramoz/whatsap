// src/lib/embeddings.ts
// Memory Subsystem — Supabase pgvector + Google text-embedding-004
// Handles semantic search (retrieval) and memory storage (save)

import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { Document } from '@langchain/core/documents';
import { getSupabaseClient } from './supabase';
import { cleanTextForEmbedding, logger } from './utils';

// --- Embedding Model (Lazy Init) ---
let embeddingsInstance: GoogleGenerativeAIEmbeddings | null = null;

function getEmbeddings() {
    if (!embeddingsInstance) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not set");

        embeddingsInstance = new GoogleGenerativeAIEmbeddings({
            apiKey,
            model: 'gemini-embedding-001',
        });
    }
    return embeddingsInstance;
}

// --- Vector Store (Lazy Init) ---
let vectorStoreInstance: SupabaseVectorStore | null = null;

function getVectorStore() {
    if (!vectorStoreInstance) {
        vectorStoreInstance = new SupabaseVectorStore(getEmbeddings(), {
            client: getSupabaseClient(),
            tableName: 'chat_history',
            queryName: 'match_documents',
        });
    }
    return vectorStoreInstance;
}

/**
 * Deep-clean text for embedding: strip emojis, special chars, normalize whitespace.
 * Google text-embedding-004 returns empty vectors for emoji-heavy or short texts.
 */
function sanitizeForVector(text: string): string {
    return text
        .replace(/[\u{1F600}-\u{1F9FF}]/gu, '')   // emojis
        .replace(/[\u{2600}-\u{27BF}]/gu, '')      // misc symbols
        .replace(/[\u{FE00}-\u{FEFF}]/gu, '')      // variation selectors
        .replace(/[\u{200B}-\u{200F}]/gu, '')       // zero-width chars
        .replace(/[*_~`#>|]/g, '')                  // markdown chars
        .replace(/[\n\r]+/g, ' ')                   // newlines → space
        .replace(/\s{2,}/g, ' ')                    // collapse spaces
        .trim();
}

/**
 * Search memory for relevant past conversations.
 * Privacy filter: results are scoped to the sender's phoneNumber.
 */
export async function searchMemory(query: string, phoneNumber: string): Promise<string> {
    try {
        const safeQuery = sanitizeForVector(cleanTextForEmbedding(query));
        if (safeQuery.length < 3) return '';

        const results = await getVectorStore().similaritySearch(safeQuery, 3, {
            phoneNumber,
        });

        if (results.length > 0) {
            logger.info('Ingatan', `Mengambil ${results.length} data.`);
            return results.map((doc) => doc.pageContent).join('\n');
        }
        return '';
    } catch (error: any) {
        logger.warn('Ingatan', 'Gagal ambil data — melanjutkan tanpa memori.');
        return '';
    }
}

/**
 * Save conversation pair (User + AI) to vector memory.
 * Runs in background — failures are logged but don't crash the pipeline.
 */
export async function saveMemory(phoneNumber: string, userMsg: string, aiMsg: string): Promise<void> {
    try {
        // Validate inputs
        if (!aiMsg || aiMsg.trim().length === 0) {
            logger.warn('Memori', 'AI tidak merespon teks, memori tidak disimpan.');
            return;
        }

        const cleanUser = sanitizeForVector(cleanTextForEmbedding(userMsg));
        const cleanAI = sanitizeForVector(cleanTextForEmbedding(aiMsg));
        const combinedContent = `User: ${cleanUser}\nIngrid: ${cleanAI}`;

        // Must have enough substance to produce a valid embedding
        if (cleanUser.length < 2 || cleanAI.length < 5 || combinedContent.length < 20) {
            logger.warn('Memori', 'Konten terlalu pendek untuk embedding yang valid.');
            return;
        }

        await getVectorStore().addDocuments([
            new Document({
                pageContent: combinedContent,
                metadata: { phoneNumber },
            }),
        ]);

        logger.info('Memori', 'Disimpan.');
    } catch (error: any) {
        logger.error('Memori', 'Penyimpanan gagal.', error);
    }
}

