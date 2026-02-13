// src/app/api/chat/route.ts
// Direct Chat API — for testing Ingrid Marketing AI from the dashboard

import { NextResponse } from 'next/server';
import { generateResponse } from '@/lib/ingrid-prompt';
import { parseAssetTags } from '@/lib/knowledge-base';
import { getWIBTime } from '@/lib/utils';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, phoneNumber } = body;

        if (!message || message.trim() === '') {
            return NextResponse.json(
                { error: 'Parameter "message" wajib diisi.' },
                { status: 400 }
            );
        }

        const phone = phoneNumber || 'dashboard-test@ingrid.local';
        const wibTime = getWIBTime();

        console.log(`\n[${wibTime}] 📩 Chat Dashboard: "${message}"`);

        // A. RETRIEVAL — try DB memory, gracefully skip on error
        let memoryContext = '';
        try {
            const { searchMemory } = await import('@/lib/embeddings');
            memoryContext = await searchMemory(message, phone);
        } catch (e) {
            console.warn('⚠️ Memory search skipped:', (e as any)?.message);
        }

        // B. GENERATION
        const rawResponse = await generateResponse(message, memoryContext, wibTime, 'Dashboard User');

        // C. PARSE ASSETS
        const { cleanText, assets } = parseAssetTags(rawResponse);
        console.log(`[${wibTime}] 🤖 Ingrid: "${cleanText}"`);

        // D. SAVE MEMORY (fire & forget, non-blocking)
        (async () => {
            try {
                const { saveMemory } = await import('@/lib/embeddings');
                await saveMemory(phone, message, cleanText);
            } catch (e) {
                console.warn('⚠️ Memory save skipped:', (e as any)?.message);
            }
        })();

        return NextResponse.json({
            success: true,
            response: cleanText,
            assets: assets.map(a => ({ tag: a.tag, description: a.description, type: a.type })),
            timestamp: wibTime,
            memoryUsed: !!memoryContext,
        });
    } catch (error: any) {
        console.error('❌ [Chat API] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
