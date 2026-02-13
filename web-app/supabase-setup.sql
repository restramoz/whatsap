-- ═══════════════════════════════════════════
-- INGRID AI MARKETING — SUPABASE SETUP
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- 1. Enable pgvector extension (if not already)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Drop old chat_history table if dimension mismatch
-- (old was 768d, new gemini-embedding-001 is 3072d)
DROP TABLE IF EXISTS chat_history;

-- 3. Create chat_history table for memory (3072 dimensions)
CREATE TABLE IF NOT EXISTS chat_history (
    id BIGSERIAL PRIMARY KEY,
    content TEXT,
    metadata JSONB,
    embedding VECTOR(3072),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create similarity search function
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(3072),
    match_count INT DEFAULT 3,
    filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
    id BIGINT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        chat_history.id,
        chat_history.content,
        chat_history.metadata,
        1 - (chat_history.embedding <=> query_embedding) AS similarity
    FROM chat_history
    WHERE chat_history.metadata @> filter
    ORDER BY chat_history.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 5. Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id BIGSERIAL PRIMARY KEY,
    phone_number TEXT UNIQUE NOT NULL,
    pushname TEXT DEFAULT '',
    nama TEXT DEFAULT '',
    minat_lokasi TEXT DEFAULT '',
    tipe_bangunan TEXT DEFAULT '',
    alamat_domisili TEXT DEFAULT '',
    pekerjaan TEXT DEFAULT '',
    instansi TEXT DEFAULT '',
    kisaran_budget TEXT DEFAULT '',
    rencana_pola_bayar TEXT DEFAULT '',
    rencana_dp TEXT DEFAULT '',
    in_house_duration TEXT DEFAULT '',
    tanggal_ceklok TEXT DEFAULT '',
    jam_ceklok TEXT DEFAULT '',
    sentiment TEXT DEFAULT 'neutral',
    status TEXT DEFAULT 'new',
    last_contact TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Index for fast lead lookups
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone_number);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
