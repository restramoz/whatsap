// src/lib/ingrid-prompt.ts
// Ingrid AI Marketing — De Royal Nirwana
// Tone: Natural, Singkat, Manusiawi
// ═══════════════════════════════════════════════════════════

import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { invokeWithRotation } from './ai-models';
import { buildKnowledgeString } from './knowledge-base';

// Inject knowledge base once at module load
const KNOWLEDGE = buildKnowledgeString();

// ─────────────────────────────────────────────
// SYSTEM PROMPT — NATURAL SALES PERSONA
// ─────────────────────────────────────────────
function buildSystemPrompt(time: string): string {
   return `
Kamu adalah Ingrid, agen properti di De Royal Nirwana, Malang.
Kamu ngobrol seperti teman biasa yang kebetulan kerja di properti — bukan customer service, bukan robot.

Waktu: ${time}
Lokasi: Malang, Jawa Timur

${KNOWLEDGE}

## CARA BICARA
- Balas singkat. Maksimal 2-3 kalimat pendek per pesan, kayak chat WA beneran.
- Jangan pake bold, italic, bullet list, atau formatting apapun.
- JANGAN banyak emoji. Boleh 1 emoji per pesan, tapi lebih sering tanpa emoji sama sekali.
- Bahasa santai tapi sopan. Boleh pake singkatan wajar (gak, udah, nih, sih, dll).
- Panggil user "Kak" — jangan "Kakak", jangan "Bestie", jangan "Sahabat".
- Jangan pake kata-kata marketing yang berlebihan seperti "WOW", "AMAZING", "LUAR BIASA".

## CARA JUALAN
- Jangan langsung dump semua info. Kasih sedikit-sedikit, bikin penasaran.
- Kalau ditanya ready stock, bilang tersedia tapi terbatas. Tawarkan 1 unit yang paling cocok, jangan list semua.
- Selalu tutup dengan pertanyaan balik supaya obrolan lanjut.
- Kalau user tanya harga, kasih range-nya aja dulu, tanya rencana pembayaran mereka.
- Kalau user mau survey, langsung tanya jadwalnya — jangan kebanyakan basa-basi.

## CONTOH NADA BICARA YANG BENAR
User: "Ada ready stock gak?"
Ingrid: "Ada Kak, tapi tinggal beberapa unit aja. Yang paling oke di harga 285 juta. Mau tau detailnya?"

User: "Harganya berapa?"
Ingrid: "Mulai dari 265 juta Kak. Rencananya mau cash, cicil, atau KPR?"

User: "Makasih ya"
Ingrid: "Sama-sama Kak. Kabarin aja kalau mau liat lokasi."

## YANG DILARANG
- Jangan bikin respon lebih dari 3 kalimat.
- Jangan narasi panjang atau storytelling.
- Jangan kasih list lebih dari 2 pilihan.
- Jangan kirim foto/dokumen kecuali user minta.
- Jangan pake markdown formatting (bold, italic, heading).
`.trim();
}

// ─────────────────────────────────────────────
// POST-PROCESSING: BERSIHKAN OUTPUT AI
// ─────────────────────────────────────────────

function cleanResponse(raw: string): string {
   let text = raw.trim();

   // Hapus markdown formatting (bold, italic, heading)
   text = text.replace(/\*\*([^*]+)\*\*/g, '$1');  // **bold** → bold
   text = text.replace(/\*([^*]+)\*/g, '$1');        // *italic* → italic
   text = text.replace(/^#{1,6}\s+/gm, '');          // # heading → heading
   text = text.replace(/^[-*]\s+/gm, '• ');          // - list → • list (WA friendly)

   // Kurangi emoji berlebih: keep max 1 emoji per pesan
   const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FA9F}\u{1FAA0}-\u{1FAFF}]/gu;
   const emojis = text.match(emojiRegex);
   if (emojis && emojis.length > 1) {
      // Keep only the last emoji, remove the rest
      let kept = false;
      text = text.replace(emojiRegex, (match) => {
         if (!kept && match === emojis[emojis.length - 1]) {
            kept = true;
            return match;
         }
         return kept ? '' : '';
      });
   }

   // Potong kalau kepanjangan (max ~500 char)
   if (text.length > 500) {
      // Cari titik atau tanda tanya terakhir sebelum batas
      const cutoff = text.lastIndexOf('.', 500);
      const cutoffQ = text.lastIndexOf('?', 500);
      const bestCut = Math.max(cutoff, cutoffQ);
      if (bestCut > 200) {
         text = text.substring(0, bestCut + 1);
      } else {
         text = text.substring(0, 500).trim();
      }
   }

   // Bersihkan spasi/newline berlebih
   text = text.replace(/\n{3,}/g, '\n\n');
   text = text.replace(/  +/g, ' ');

   return text.trim();
}

// ─────────────────────────────────────────────
// RESPONSE GENERATOR
// ─────────────────────────────────────────────

export async function generateResponse(
   input: string,
   context: string,
   time: string,
   pushname: string = 'User'
): Promise<string> {

   const systemInstruction = buildSystemPrompt(time);

   const userMessageContent = `
[RIWAYAT CHAT]:
${context || 'Belum ada riwayat. Mulai obrolan.'}

[PESAN BARU]:
${pushname}: ${input}

Balas singkat & natural, kayak WA biasa. Max 2-3 kalimat.
Ingrid:`;

   const messages = [
      new SystemMessage(systemInstruction),
      new HumanMessage(userMessageContent),
   ];

   try {
      const result = await invokeWithRotation(messages);

      let rawText = '';
      if (typeof result.content === 'string') {
         rawText = result.content;
      } else if (Array.isArray(result.content)) {
         rawText = result.content.map((c: any) => c.text || '').join('');
      } else {
         rawText = String(result.content);
      }

      return cleanResponse(rawText);

   } catch (error) {
      console.error('❌ AI Generation Failed:', error);
      return "Maaf Kak, lagi ada gangguan. Coba lagi ya sebentar.";
   }
}