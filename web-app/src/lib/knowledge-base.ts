// src/lib/knowledge-base.ts
// De Royal Nirwana — Complete Property Knowledge Base + Asset Mapping

// ─────────────────────────────────────────────
// PROPERTY DATA
// ─────────────────────────────────────────────

export const PROPERTY_INFO = {
    name: 'De Royal Nirwana',
    developer: 'De Royal Group',
    location: 'Jl. Rawisari, Mulyorejo, Sukun, Kota Malang',
    bookingFee: 10_000_000, // Rp 10 Juta
    dpNormal: 0.30,  // 30%
    dpMinimum: 0.10, // 10% untuk budget pas-pasan
    inHouseMaxYears: 2,
    kprMaxYears: 15,
    partnerBanks: ['BTN', 'Bank Jatim', 'Bank BSI'],
    bankNote: 'Fleksibel dengan bank pilihan user di luar PKS.',
    bpjsRules: 'Wajib ikut minimal 3 program BPJS dan sudah menjadi peserta BPJS selama minimal 2 tahun.',
    promoActive: 'Cashback Rp 5 Juta berlaku sampai akhir Februari 2025.',
};

export const PAYMENT_SCHEMES = {
    cash: 'Pembayaran tunai penuh.',
    inHouse: 'Cicilan langsung ke developer, maksimal 2 tahun.',
    kpr: 'Kredit Pemilikan Rumah via bank, tenor hingga 15 tahun.',
};

// ─────────────────────────────────────────────
// UNIT TYPES & PRICING
// ─────────────────────────────────────────────

export interface UnitType {
    type: string;
    landArea: number;
    status: 'inden' | 'ready_stock';
    kavling?: string;
    cashPrice: number;
    description: string;
}

export const UNIT_TYPES: UnitType[] = [
    // --- INDEN (Scandinavian Style, bangun baru) ---
    { type: '25/60', landArea: 60, status: 'inden', cashPrice: 265_000_000, description: 'Type 25 — LB 25m², LT 60m². Cocok untuk pasangan muda atau hunian kompak.' },
    { type: '30/60', landArea: 60, status: 'inden', cashPrice: 285_000_000, description: 'Type 30 — LB 30m², LT 60m². Layout 2 kamar tidur yang efisien.' },
    { type: '36/60', landArea: 60, status: 'inden', cashPrice: 340_000_000, description: 'Type 36 — LB 36m², LT 60m². Populer untuk keluarga kecil, 2KT 1KM.' },
    { type: '45/60', landArea: 60, status: 'inden', cashPrice: 460_000_000, description: 'Type 45 — LB 45m², LT 60m². Premium inden, lebih luas dan nyaman.' },
    // --- READY STOCK ---
    { type: '29/60', landArea: 60, status: 'ready_stock', kavling: '22', cashPrice: 300_000_000, description: 'Type 29 Ready Stock — Kavling 22. Siap huni.' },
    { type: '26/60', landArea: 60, status: 'ready_stock', kavling: '55A', cashPrice: 285_000_000, description: 'Type 26 Ready Stock — Kavling 55A. Siap huni.' },
    { type: '34/60', landArea: 60, status: 'ready_stock', kavling: '52', cashPrice: 330_000_000, description: 'Type 34 Ready Stock — Kavling 52. Siap huni.' },
    { type: '34/60', landArea: 60, status: 'ready_stock', kavling: '43', cashPrice: 330_000_000, description: 'Type 34 Ready Stock — Kavling 43. Siap huni.' },
];

export const KAVLING_READY = ['22', '43', '52', '55A'];

// ─────────────────────────────────────────────
// REQUIRED DOCUMENTS
// ─────────────────────────────────────────────

export const REQUIRED_DOCUMENTS = {
    umum: [
        'FC KTP',
        'Kartu Keluarga (KK)',
        'NPWP',
        'Surat Nikah',
        'Tabungan 3 bulan terakhir',
        'Pas foto 2x4 warna',
    ],
    pns: [
        'SK Pengangkatan',
        'Slip Gaji',
        'SK Penghasilan',
    ],
    swasta: [
        'Slip Gaji / SK Penghasilan dari perusahaan',
        'SK Kerja',
    ],
    wiraswasta: [
        'FC SIUP',
        'TDP',
        'NPWP Usaha',
        'Rekening Koran 6 bulan terakhir',
    ],
    note: 'Calon pembeli bersedia wawancara online/offline.',
};

// ─────────────────────────────────────────────
// ASSET ACCESS PROTOCOL (Hidden Tags)
// ─────────────────────────────────────────────

export interface AssetMapping {
    tag: string;
    type: 'image' | 'document';
    paths: string[];
    description: string;
}

export const ASSET_MAP: AssetMapping[] = [
    // --- Documents ---
    { tag: 'pricelist', type: 'document', paths: ['public/pricelist.pdf'], description: 'Pricelist De Royal Nirwana' },
    { tag: 'pricelist_img', type: 'image', paths: ['public/pricelist.png.jpg'], description: 'Pricelist De Royal Nirwana (gambar)' },
    { tag: 'katalog', type: 'document', paths: ['public/katalog.pdf'], description: 'Katalog lengkap De Royal Nirwana' },
    // --- Siteplan ---
    { tag: 'siteplan', type: 'image', paths: ['public/siteplan/siteplan.jpg'], description: 'Siteplan De Royal Nirwana' },
    // --- Scandinavian / Inden Types (foto rumah + denah) ---
    { tag: 'type25', type: 'image', paths: ['public/scandinavian/type25/rumah.jpg', 'public/scandinavian/type25/denah.jpg'], description: 'Foto & Denah Type 25 (Scandinavian/Inden)' },
    { tag: 'type30', type: 'image', paths: ['public/scandinavian/type30/rumah.jpg', 'public/scandinavian/type30/denah.jpg'], description: 'Foto & Denah Type 30 (Scandinavian/Inden)' },
    // --- Ready Stock Types (foto rumah + denah) ---
    { tag: 'type22', type: 'image', paths: ['public/readystok/type22/rumah.jpg', 'public/readystok/type22/denah.jpg'], description: 'Foto & Denah Kavling 22 Ready Stock (Type 29)' },
    { tag: 'type43', type: 'image', paths: ['public/readystok/type43/rumah.jpg', 'public/readystok/type43/denah.jpg'], description: 'Foto & Denah Kavling 43 Ready Stock (Type 34)' },
    { tag: 'type52', type: 'image', paths: ['public/readystok/type52/rumah.jpg', 'public/readystok/type52/denah.jpg'], description: 'Foto & Denah Kavling 52 Ready Stock (Type 34)' },
    { tag: 'type55A', type: 'image', paths: ['public/readystok/type55A/rumah.jpg', 'public/readystok/type55A/denah.jpg'], description: 'Foto & Denah Kavling 55A Ready Stock (Type 26)' },
    // --- Alias tags (type 36/45 = referensi scandinavian) ---
    { tag: 'type36', type: 'image', paths: ['public/scandinavian/type25/rumah.jpg'], description: 'Foto Type 36 (konsep Scandinavian, inden bangun)' },
    { tag: 'type45', type: 'image', paths: ['public/scandinavian/type30/rumah.jpg'], description: 'Foto Type 45 (konsep Scandinavian, inden bangun)' },
    // --- Denah only (floor plan) ---
    { tag: 'denah25', type: 'image', paths: ['public/scandinavian/type25/denah.jpg'], description: 'Denah Type 25' },
    { tag: 'denah30', type: 'image', paths: ['public/scandinavian/type30/denah.jpg'], description: 'Denah Type 30' },
    // --- Video ---
    { tag: 'video_lokasi', type: 'document', paths: ['public/video/video_lokasi.mp4'], description: 'Video Lokasi De Royal Nirwana' },
    { tag: 'video_ready', type: 'document', paths: ['public/video/video_ready.mp4'], description: 'Video Unit Ready Stock' },
];

/**
 * Get asset paths by tag name.
 */
export function getAssetByTag(tag: string): AssetMapping | undefined {
    return ASSET_MAP.find(a => a.tag.toLowerCase() === tag.toLowerCase());
}

/**
 * Parse [SEND:xxx] tags from AI response.
 * Returns { cleanText, assets[] }
 */
export function parseAssetTags(response: string): { cleanText: string; assets: AssetMapping[] } {
    const tagRegex = /\[SEND:(\w+)\]/gi;
    const assets: AssetMapping[] = [];
    let match;

    while ((match = tagRegex.exec(response)) !== null) {
        const asset = getAssetByTag(match[1]);
        if (asset) assets.push(asset);
    }

    const cleanText = response.replace(tagRegex, '').trim();
    return { cleanText, assets };
}

// ─────────────────────────────────────────────
// LEAD PROFILING CHECKLIST (Hidden from user)
// ─────────────────────────────────────────────

export interface LeadProfile {
    nama: string;
    minat_lokasi: string;
    tipe_bangunan: string;
    alamat_domisili: string;
    pekerjaan: string;
    instansi: string;
    kisaran_budget: string;
    rencana_pola_bayar: string;
    rencana_dp: string;
    in_house_duration: string;
    tanggal_ceklok: string;
    jam_ceklok: string;
    sentiment: string;
    phone_number: string;
    pushname: string;
    last_contact: string;
    status: 'new' | 'warm' | 'hot' | 'closed' | 'cold';
}

export const EMPTY_LEAD: LeadProfile = {
    nama: '',
    minat_lokasi: '',
    tipe_bangunan: '',
    alamat_domisili: '',
    pekerjaan: '',
    instansi: '',
    kisaran_budget: '',
    rencana_pola_bayar: '',
    rencana_dp: '',
    in_house_duration: '',
    tanggal_ceklok: '',
    jam_ceklok: '',
    sentiment: 'neutral',
    phone_number: '',
    pushname: '',
    last_contact: '',
    status: 'new',
};

// ─────────────────────────────────────────────
// BUILD KNOWLEDGE STRING FOR PROMPT
// ─────────────────────────────────────────────

export function buildKnowledgeString(): string {
    const units = UNIT_TYPES.map(u => {
        const price = `Rp ${(u.cashPrice / 1_000_000).toFixed(0)} Juta`;
        const kav = u.kavling ? ` (Kavling ${u.kavling})` : '';
        return `- Type ${u.type}${kav}: ${price} [${u.status === 'ready_stock' ? 'READY STOCK' : 'INDEN'}] — ${u.description}`;
    }).join('\n');

    const docsUmum = REQUIRED_DOCUMENTS.umum.join(', ');
    const docsPNS = REQUIRED_DOCUMENTS.pns.join(', ');
    const docsSwasta = REQUIRED_DOCUMENTS.swasta.join(', ');
    const docsWiraswasta = REQUIRED_DOCUMENTS.wiraswasta.join(', ');

    return `
=== DE ROYAL NIRWANA — KNOWLEDGE BASE ===

📍 LOKASI: ${PROPERTY_INFO.location}
💰 BOOKING KAVLING: Rp ${(PROPERTY_INFO.bookingFee / 1_000_000).toFixed(0)} Juta
📊 DP: ${(PROPERTY_INFO.dpNormal * 100)}% (normal) atau ${(PROPERTY_INFO.dpMinimum * 100)}% (budget pas-pasan)
🏦 BANK PKS: ${PROPERTY_INFO.partnerBanks.join(', ')}. ${PROPERTY_INFO.bankNote}
🎯 PROMO: ${PROPERTY_INFO.promoActive}

SKEMA PEMBAYARAN:
- Cash: Bayar tunai penuh
- InHouse: Cicilan ke developer, maksimal ${PROPERTY_INFO.inHouseMaxYears} tahun
- KPR: Via bank, tenor hingga ${PROPERTY_INFO.kprMaxYears} tahun

DAFTAR UNIT & HARGA CASH:
${units}

KAVLING READY STOCK TERSEDIA: ${KAVLING_READY.join(', ')}

DOKUMEN YANG DIPERLUKAN:
- Umum: ${docsUmum}
- PNS: + ${docsPNS}
- Pegawai Swasta: + ${docsSwasta}
- Wiraswasta: + ${docsWiraswasta}
- ${REQUIRED_DOCUMENTS.note}

ATURAN BPJS: ${PROPERTY_INFO.bpjsRules}

ASSET YANG BISA DIKIRIM (gunakan tag [SEND:xxx]):
- [SEND:pricelist] → Kirim PDF Pricelist
- [SEND:pricelist_img] → Kirim gambar Pricelist
- [SEND:katalog] → Kirim PDF Katalog lengkap
- [SEND:siteplan] → Kirim gambar Siteplan
- [SEND:type25] → Foto & Denah Type 25 (Scandinavian/Inden)
- [SEND:type30] → Foto & Denah Type 30 (Scandinavian/Inden)
- [SEND:type36] → Foto Type 36 (Scandinavian, inden bangun)
- [SEND:type45] → Foto Type 45 (Scandinavian, inden bangun)
- [SEND:type22] → Foto & Denah Kavling 22 Ready Stock (Type 29)
- [SEND:type43] → Foto & Denah Kavling 43 Ready Stock (Type 34)
- [SEND:type52] → Foto & Denah Kavling 52 Ready Stock (Type 34)
- [SEND:type55A] → Foto & Denah Kavling 55A Ready Stock (Type 26)
- [SEND:denah25] → Denah Type 25
- [SEND:denah30] → Denah Type 30
- [SEND:video_lokasi] → Video Lokasi De Royal Nirwana
- [SEND:video_ready] → Video Unit Ready Stock
`.trim();
}
