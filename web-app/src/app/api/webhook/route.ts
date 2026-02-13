// src/app/api/webhook/route.ts
// Ingrid Webhook Handler — Marketing AI pipeline for De Royal Nirwana (Final Robust Version)

import { NextResponse } from 'next/server';
import { generateResponse } from '@/lib/ingrid-prompt';
import { parseAssetTags } from '@/lib/knowledge-base';
import { getWIBTime } from '@/lib/utils'; // Pastikan utils ada, atau hapus jika tidak perlu
import path from 'path';

// --- OPTIONAL IMPORTS (Bungkus try-catch saat dipakai) ---
// Jika file ini belum sempurna di projectmu, kode tetap akan jalan.
import { searchMemory, saveMemory } from '@/lib/embeddings';
import { processLeadInBackground } from '@/lib/lead-tracker';

// ═══════════════════════════════════════════
// 1. SETUP GLOBAL MEMORY (RAM) - ANTI LOOPING
// ═══════════════════════════════════════════
// Menyimpan 10 chat terakhir per user di RAM server.
// Ini menjamin Ingrid "ingat" konteks instan meskipun database lambat.

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const globalForChat = global as unknown as { chatHistory: Map<string, ChatMessage[]> };
if (!globalForChat.chatHistory) globalForChat.chatHistory = new Map();

const WA_SERVICE_URL = process.env.WA_SERVICE_URL || 'http://localhost:3001';

// ═══════════════════════════════════════════
// 2. MAIN HANDLER
// ═══════════════════════════════════════════
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { from, body: userMessage = '', pushname } = body;

        // --- FILTER: Abaikan Pesan Sampah ---
        if (from.includes('@g.us') || from === 'status@s.whatsapp.net' || !userMessage.trim()) {
            return NextResponse.json({ success: true, ignored: true });
        }

        const wibTime = getWIBTime ? getWIBTime() : new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });
        console.log(`📩 [IN] ${pushname}: "${userMessage}"`);

        // ═══════════════════════════════════════════
        // A. CONTEXT RETRIEVAL (RAM + DB)
        // ═══════════════════════════════════════════

        // 1. Ambil dari RAM (Cepat & Pasti)
        let ramHistory = globalForChat.chatHistory.get(from) || [];

        // Format RAM History menjadi string dialog
        const conversationContext = ramHistory.slice(-10) // Ambil 10 terakhir
            .map(msg => `${msg.role === 'user' ? `User (${pushname})` : 'Ingrid'}: ${msg.content}`)
            .join('\n');

        // 2. Ambil dari DB (Opsional / RAG knowledge)
        let dbContext = '';
        try {
            // Kita anggap searchMemory mengembalikan string info tambahan
            dbContext = await searchMemory(userMessage, from);
        } catch (e) {
            console.warn('⚠️ Gagal ambil database memory (skip):', e);
        }

        // Gabungkan: Prioritas Percakapan RAM + Info Database
        // Format ini yang akan dibaca oleh ingrid-prompt
        const finalContext = `
[RECENT CONVERSATION]:
${conversationContext}

[RELEVANT KNOWLEDGE]:
${dbContext || 'Tidak ada info tambahan.'}
    `.trim();

        // ═══════════════════════════════════════════
        // B. AI GENERATION
        // ═══════════════════════════════════════════
        const rawResponse = await generateResponse(userMessage, finalContext, wibTime, pushname);

        // ═══════════════════════════════════════════
        // C. UPDATE MEMORY (RAM) - SEGERA
        // ═══════════════════════════════════════════
        // Kita simpan SEBELUM kirim WA, agar update tercatat
        ramHistory.push({ role: 'user', content: userMessage });
        ramHistory.push({ role: 'assistant', content: rawResponse });
        globalForChat.chatHistory.set(from, ramHistory);

        // ═══════════════════════════════════════════
        // D. PARSE & SEND TO WA
        // ═══════════════════════════════════════════
        const { cleanText, assets } = parseAssetTags(rawResponse);
        console.log(`📤 [OUT] Ingrid: "${cleanText}"`);

        // 1. Kirim Teks
        try {
            await fetch(`${WA_SERVICE_URL}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: from, message: cleanText }),
            });
        } catch (err: any) {
            console.error('❌ Gagal kirim teks ke WA Service:', err.message);
            // Jangan throw error, lanjut coba kirim gambar kalau ada
        }

        // 2. Kirim Aset (Gambar/File)
        if (assets && assets.length > 0) {
            for (const asset of assets) {
                // Ambil path pertama dari aset
                const relativePath = asset.paths[0];
                if (!relativePath) continue;

                try {
                    // Pastikan path absolut
                    const absolutePath = path.resolve(process.cwd(), relativePath);

                    await fetch(`${WA_SERVICE_URL}/send-media`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: from,
                            filePath: absolutePath,
                            caption: asset.description || ''
                        }),
                    });
                    console.log(`🖼️ [ASSET] Sent: ${asset.tag}`);
                } catch (err: any) {
                    console.error(`❌ Gagal kirim media (${asset.tag}):`, err.message);
                }
            }
        }

        // ═══════════════════════════════════════════
        // E. BACKGROUND TASKS (Fire & Forget)
        // ═══════════════════════════════════════════
        // Jalankan tanpa menunggu (await) agar respon webhook cepat
        (async () => {
            try {
                if (saveMemory) await saveMemory(from, userMessage, rawResponse);
                if (processLeadInBackground) await processLeadInBackground(from, userMessage, rawResponse, pushname);
            } catch (bgError) {
                console.error('⚠️ Background task error:', bgError);
            }
        })();

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('🔥 CRITICAL WEBHOOK ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}