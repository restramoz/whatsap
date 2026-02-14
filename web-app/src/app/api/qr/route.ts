// /api/qr — Proxy endpoint to wa-service QR code
// Since HF Spaces only exposes port 7860 (Next.js),
// we proxy the QR request to wa-service running internally on port 3001

import { NextResponse } from 'next/server';

const WA_SERVICE_URL = process.env.WA_SERVICE_URL || 'http://localhost:3001';

export async function GET() {
    try {
        const res = await fetch(`${WA_SERVICE_URL}/qr`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(5000),
        });

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        // If wa-service is unreachable, return a friendly status
        return NextResponse.json({
            state: 'unreachable',
            message: 'WA Service tidak aktif atau belum siap.',
        }, { status: 503 });
    }
}
