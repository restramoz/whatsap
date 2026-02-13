// src/app/api/sentiment/route.ts
// Sentiment Analysis API

import { NextResponse } from 'next/server';
import { analyzeSentiment } from '@/lib/lead-tracker';
import { logger } from '@/lib/utils';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { text } = body;

        if (!text || text.trim() === '') {
            return NextResponse.json({ error: 'Parameter "text" required' }, { status: 400 });
        }

        const sentiment = await analyzeSentiment(text);

        return NextResponse.json({
            success: true,
            sentiment,
            text: text.substring(0, 100),
        });
    } catch (error: any) {
        logger.error('Sentiment', 'Error analyzing sentiment.', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
