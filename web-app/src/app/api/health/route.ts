// src/app/api/health/route.ts
// Health Check Endpoint — returns system component statuses

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

const WA_SERVICE_URL = process.env.WA_SERVICE_URL || 'http://localhost:3001';

export async function GET() {
    const status: Record<string, any> = {
        system: 'Ingrid AI System v1.5.0',
        timestamp: new Date().toISOString(),
        components: {},
    };

    // 1. Check Supabase
    try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.from('chat_history').select('id').limit(1);
        status.components.supabase = error
            ? { status: 'error', message: error.message }
            : { status: 'connected' };
    } catch (e: any) {
        status.components.supabase = { status: 'error', message: e.message };
    }

    // 2. Check WA Service
    try {
        const res = await fetch(`${WA_SERVICE_URL}/health`, {
            signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
            const data = await res.json();
            status.components.whatsapp = { status: 'connected', ...data };
        } else {
            status.components.whatsapp = { status: 'error', httpStatus: res.status };
        }
    } catch (e: any) {
        status.components.whatsapp = { status: 'unreachable', message: e.message };
    }

    // 3. Check API Keys presence
    status.components.apiKeys = {
        groq: !!process.env.GROQ_API_KEY ? 'configured' : 'missing',
        gemini: !!process.env.GEMINI_API_KEY ? 'configured' : 'missing',
        openrouter: !!process.env.OPENROUTER_API_KEY ? 'configured' : 'missing',
    };

    // Overall status
    const allOk = status.components.supabase?.status === 'connected';
    status.overall = allOk ? 'healthy' : 'degraded';

    return NextResponse.json(status, { status: allOk ? 200 : 503 });
}
