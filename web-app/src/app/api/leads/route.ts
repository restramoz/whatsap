// src/app/api/leads/route.ts
// Lead Management API — CRUD for lead tracking

import { NextResponse } from 'next/server';
import { getLeads, getLeadByPhone, updateLeadStatus } from '@/lib/lead-tracker';
import { logger } from '@/lib/utils';

// GET — List leads or get single lead by phone
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const phone = url.searchParams.get('phone');
        const status = url.searchParams.get('status');

        if (phone) {
            const lead = await getLeadByPhone(phone);
            if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
            return NextResponse.json({ success: true, lead });
        }

        const leads = await getLeads(status || undefined);
        return NextResponse.json({ success: true, leads, total: leads.length });
    } catch (error: any) {
        logger.error('Leads API', 'Error fetching leads.', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH — Update lead status
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { phoneNumber, status } = body;

        if (!phoneNumber || !status) {
            return NextResponse.json({ error: 'phoneNumber and status required' }, { status: 400 });
        }

        await updateLeadStatus(phoneNumber, status);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        logger.error('Leads API', 'Error updating lead.', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
