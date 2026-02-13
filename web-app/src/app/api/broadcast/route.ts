// src/app/api/broadcast/route.ts
// Broadcast API — Send bulk messages via WA Service

import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils';

const WA_SERVICE_URL = process.env.WA_SERVICE_URL || 'http://localhost:3001';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { contacts, message } = body;

        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return NextResponse.json({ error: 'Parameter "contacts" (array) required' }, { status: 400 });
        }
        if (!message || message.trim() === '') {
            return NextResponse.json({ error: 'Parameter "message" required' }, { status: 400 });
        }

        logger.info('Broadcast', `Sending to ${contacts.length} contacts...`);

        // Send to WA Service broadcast endpoint
        const res = await fetch(`${WA_SERVICE_URL}/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contacts, message }),
        });

        const data = await res.json();

        if (res.ok) {
            logger.info('Broadcast', `Broadcast initiated for ${contacts.length} contacts.`);
            return NextResponse.json({ success: true, ...data });
        } else {
            return NextResponse.json({ error: data.error || 'Broadcast failed' }, { status: res.status });
        }
    } catch (error: any) {
        logger.error('Broadcast', 'Error sending broadcast.', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
