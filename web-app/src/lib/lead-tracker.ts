// src/lib/lead-tracker.ts
// Lead Tracking System — Extract, save, and manage lead data from conversations

import { getSupabaseClient } from './supabase';
import { getLlmWithFallback } from './ai-models';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { logger } from './utils';
import type { LeadProfile } from './knowledge-base';
import { EMPTY_LEAD } from './knowledge-base';

// ─────────────────────────────────────────────
// LEAD EXTRACTION PROMPT
// ─────────────────────────────────────────────

const EXTRACT_PROMPT = PromptTemplate.fromTemplate(`
Dari percakapan berikut, ekstrak informasi lead (calon pembeli properti) yang bisa ditemukan.
Kembalikan HANYA dalam format JSON yang valid. Jika data tidak ditemukan, isi dengan string kosong "".

Percakapan:
{conversation}

Ekstrak data berikut (JSON only, no markdown):
{{
  "nama": "",
  "minat_lokasi": "",
  "tipe_bangunan": "",
  "alamat_domisili": "",
  "pekerjaan": "",
  "instansi": "",
  "kisaran_budget": "",
  "rencana_pola_bayar": "",
  "rencana_dp": "",
  "in_house_duration": "",
  "tanggal_ceklok": "",
  "jam_ceklok": "",
  "sentiment": "positive|neutral|negative"
}}
`);

function getExtractChain() {
    return EXTRACT_PROMPT.pipe(getLlmWithFallback()).pipe(new StringOutputParser());
}

// ─────────────────────────────────────────────
// SENTIMENT ANALYSIS
// ─────────────────────────────────────────────

const SENTIMENT_PROMPT = PromptTemplate.fromTemplate(`
Analisis sentimen dari pesan berikut. Jawab HANYA dengan salah satu: positive, neutral, negative

Pesan: {text}

Sentimen:`);

function getSentimentChain() {
    return SENTIMENT_PROMPT.pipe(getLlmWithFallback()).pipe(new StringOutputParser());
}

export async function analyzeSentiment(text: string): Promise<string> {
    try {
        const result = await getSentimentChain().invoke({ text });
        const sentiment = result.trim().toLowerCase();
        if (['positive', 'neutral', 'negative'].includes(sentiment)) return sentiment;
        return 'neutral';
    } catch {
        return 'neutral';
    }
}

// ─────────────────────────────────────────────
// LEAD EXTRACTION
// ─────────────────────────────────────────────

export async function extractLeadData(conversation: string): Promise<Partial<LeadProfile>> {
    try {
        const result = await getExtractChain().invoke({ conversation });
        // Try to parse JSON from the response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return {};
    } catch (error: any) {
        logger.warn('LeadExtract', `Gagal extract lead data: ${error.message}`);
        return {};
    }
}

// ─────────────────────────────────────────────
// LEAD CRUD OPERATIONS
// ─────────────────────────────────────────────

/**
 * Save or update lead data. Merges new data with existing data.
 */
export async function saveLead(phoneNumber: string, newData: Partial<LeadProfile>, pushname?: string): Promise<void> {
    try {
        const supabase = getSupabaseClient();

        // Check if lead exists
        const { data: existing } = await supabase
            .from('leads')
            .select('*')
            .eq('phone_number', phoneNumber)
            .single();

        const now = new Date().toISOString();

        if (existing) {
            // Merge: only update fields that have actual data
            const merged: Record<string, any> = {};
            for (const [key, value] of Object.entries(newData)) {
                if (value && String(value).trim() !== '') {
                    merged[key] = value;
                }
            }
            merged.last_contact = now;
            if (pushname) merged.pushname = pushname;

            await supabase
                .from('leads')
                .update(merged)
                .eq('phone_number', phoneNumber);

            logger.info('Lead', `Updated lead: ${phoneNumber}`);
        } else {
            // Create new lead
            const lead = {
                ...EMPTY_LEAD,
                ...newData,
                phone_number: phoneNumber,
                pushname: pushname || '',
                last_contact: now,
                status: 'new',
            };

            await supabase.from('leads').insert(lead);
            logger.info('Lead', `New lead created: ${phoneNumber}`);
        }
    } catch (error: any) {
        logger.error('Lead', 'Gagal save lead.', error);
    }
}

/**
 * Get all leads from database
 */
export async function getLeads(status?: string): Promise<any[]> {
    try {
        const supabase = getSupabaseClient();
        let query = supabase.from('leads').select('*');

        if (status) {
            query = query.eq('status', status);
        }

        // Try ordering by last_contact, fall back to created_at
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error: any) {
        logger.error('Lead', 'Gagal get leads.', error);
        return [];
    }
}

/**
 * Get single lead by phone
 */
export async function getLeadByPhone(phoneNumber: string): Promise<any | null> {
    try {
        const supabase = getSupabaseClient();
        const { data } = await supabase
            .from('leads')
            .select('*')
            .eq('phone_number', phoneNumber)
            .single();
        return data;
    } catch {
        return null;
    }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(phoneNumber: string, status: string): Promise<void> {
    try {
        const supabase = getSupabaseClient();
        await supabase
            .from('leads')
            .update({ status })
            .eq('phone_number', phoneNumber);
    } catch (error: any) {
        logger.error('Lead', 'Gagal update lead status.', error);
    }
}

/**
 * Background: extract lead data from conversation and save
 */
export async function processLeadInBackground(
    phoneNumber: string,
    userMessage: string,
    aiResponse: string,
    pushname?: string
): Promise<void> {
    try {
        const conversation = `User (${pushname || 'User'}): ${userMessage}\nIngrid: ${aiResponse}`;
        const extracted = await extractLeadData(conversation);

        if (Object.values(extracted).some(v => v && String(v).trim() !== '')) {
            await saveLead(phoneNumber, extracted, pushname);
        }
    } catch (error: any) {
        logger.warn('LeadBG', `Background lead extraction failed: ${error.message}`);
    }
}
