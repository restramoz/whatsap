// src/lib/ai-models.ts
// ═══════════════════════════════════════════════════════════
// SMART MODEL ROTATION — GOD TIER (OLLAMA CLOUD PRIORITY)
// Strategy: ALWAYS Ollama Cloud First -> Fallback to Groq/Gemini only on error
// ═══════════════════════════════════════════════════════════

import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

// ─────────────────────────────────────────────
// MODEL POOL CONFIGURATION
// ─────────────────────────────────────────────

interface ModelEntry {
    id: string;
    provider: 'ollama-cloud' | 'groq' | 'gemini' | 'openrouter';
    instance: BaseChatModel;
    cooldownUntil: number;
    failCount: number;
}

const COOLDOWN_MS = 60_000;

// --- OLLAMA CLOUD (PRIMARY - CUSTOM HOST) ---
function createOllamaCloudModel(modelName: string): BaseChatModel {
    return new ChatOllama({
        baseUrl: process.env.OLLAMA_CLOUD_HOST || 'https://ollama.com',
        model: modelName,
        temperature: 0.55,
        numPredict: 250,  // ~2-3 kalimat pendek, biar gak melantur
        headers: {
            'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}`
        },
        maxRetries: 1,
    });
}

// --- GROQ MODELS (Fast Fallback) ---
function createGroqModel(modelName: string): BaseChatModel {
    return new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: modelName,
        temperature: 0.55,
        maxTokens: 280,
        maxRetries: 0,
        timeout: 15000,
    });
}

// --- GEMINI MODELS (Stable Fallback) ---
function createGeminiModel(modelName: string): BaseChatModel {
    return new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        model: modelName,
        temperature: 0.6,
        maxRetries: 0,
        maxOutputTokens: 300,
    });
}

// --- OPENROUTER MODELS (Deep Fallback) ---
function createOpenRouterModel(modelName: string): BaseChatModel {
    return new ChatOpenAI({
        openAIApiKey: process.env.OPENROUTER_API_KEY,
        configuration: { baseURL: 'https://openrouter.ai/api/v1' },
        modelName: modelName,
        temperature: 0.6,
        maxTokens: 300,
        maxRetries: 0,
        timeout: 25000,
    });
}

// ─────────────────────────────────────────────
// MODEL POOL — GOD TIER HIERARCHY
// ─────────────────────────────────────────────

let _modelPool: ModelEntry[] | null = null;

function getModelPool(): ModelEntry[] {
    if (!_modelPool) {
        _modelPool = [
            {
                id: 'ollama-cloud-gpt-oss',
                provider: 'ollama-cloud',
                instance: createOllamaCloudModel('gpt-oss:120b'),
                cooldownUntil: 0,
                failCount: 0
            },
            {
                id: 'groq-gpt-oss',
                provider: 'groq',
                instance: createGroqModel('openai/gpt-oss-20b'),
                cooldownUntil: 0,
                failCount: 0
            },
            {
                id: 'gemini-2.5-flash',
                provider: 'gemini',
                instance: createGeminiModel('gemini-2.5-flash'),
                cooldownUntil: 0,
                failCount: 0
            },
            {
                id: 'or-deepseek-r1',
                provider: 'openrouter',
                instance: createOpenRouterModel('deepseek/deepseek-r1:free'),
                cooldownUntil: 0,
                failCount: 0
            },
            {
                id: 'or-nemotron-70b',
                provider: 'openrouter',
                instance: createOpenRouterModel('nvidia/llama-3.1-nemotron-70b-instruct:free'),
                cooldownUntil: 0,
                failCount: 0
            }
        ];
    }
    return _modelPool;
}

// ─────────────────────────────────────────────
// ROTATION ENGINE (WATERFALL PRIORITY)
// ─────────────────────────────────────────────

// FIX: Hapus currentIndex global. Kita tidak mau round-robin.
// Kita mau Priority Check (selalu mulai dari atas).

function isRateLimitError(error: any): boolean {
    const msg = (error?.message || '').toLowerCase();
    const status = error?.status || error?.response?.status || 0;

    // Khusus Ollama Cloud: Cek Auth Error (401/403) atau Connection Refused
    if (msg.includes('401') || msg.includes('unauthorized')) {
        console.error('⚠️ [Ollama Cloud] Unauthorized. Cek API Key.');
        return false; // Auth error jangan di-retry, langsung failover
    }

    return (
        status === 429 ||
        status === 503 ||
        msg.includes('rate_limit') ||
        msg.includes('quota') ||
        msg.includes('too many requests') ||
        msg.includes('overloaded')
    );
}

function getNextAvailableModel(): ModelEntry | null {
    const now = Date.now();
    const pool = getModelPool();

    for (const model of pool) {
        if (now >= model.cooldownUntil) {
            return model;
        }
    }

    let soonest = pool[0];
    for (const m of pool) {
        if (m.cooldownUntil < soonest.cooldownUntil) soonest = m;
    }

    console.warn(`⚠️ Semua model cooldown. Memaksa reset: ${soonest.id}`);
    soonest.cooldownUntil = 0;
    soonest.failCount = 0;
    return soonest;
}

function putOnCooldown(model: ModelEntry): void {
    model.failCount++;
    const multiplier = Math.min(model.failCount, 3);
    model.cooldownUntil = Date.now() + (COOLDOWN_MS * multiplier);
    console.log(`🔄 [Rotasi] ${model.id} cooldown ${(COOLDOWN_MS * multiplier) / 1000}s`);
}

function resetModel(model: ModelEntry): void {
    if (model.failCount > 0) {
        model.failCount = 0;
        model.cooldownUntil = 0;
    }
}

// ─────────────────────────────────────────────
// MAIN INVOKE FUNCTION
// ─────────────────────────────────────────────

export async function invokeWithRotation(messages: any[], maxAttempts = 5): Promise<any> {
    let lastError: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Ambil model terbaik yang tersedia saat ini
        const entry = getNextAvailableModel();
        if (!entry) break;

        try {
            console.log(`🧠 [AI] Attempt ${attempt + 1}: ${entry.id} (${entry.provider})`);
            const result = await entry.instance.invoke(messages);

            // SUKSES: Reset fail count model ini agar siap dipakai lagi di request berikutnya
            resetModel(entry);
            return result;
        } catch (error: any) {
            lastError = error;
            console.error(`❌ [AI] ${entry.id} error: ${error.message}`);

            // GAGAL: Masukkan ke cooldown agar loop berikutnya (Attempt 2)
            // mengambil model prioritas berikutnya di getNextAvailableModel()
            putOnCooldown(entry);
            continue;
        }
    }

    throw new Error(`Semua model gagal setelah rotasi. Last: ${lastError?.message || 'unknown'}`);
}

export function getLlmWithFallback() {
    const pool = getModelPool();
    return (pool[0].instance as any).withFallbacks({
        fallbacks: [pool[1].instance, pool[2].instance],
    });
}

export function getOllamaCloudModel() { return getModelPool()[0].instance; }
export function getGroqModel() { return getModelPool()[1].instance; }
export function getGeminiModel() { return getModelPool()[2].instance; }

export function getModelPoolStatus() {
    const now = Date.now();
    return getModelPool().map(m => ({
        id: m.id,
        provider: m.provider,
        available: now >= m.cooldownUntil,
        failCount: m.failCount,
        cooldownRemaining: Math.max(0, Math.ceil((m.cooldownUntil - now) / 1000)),
    }));
}