// wa-service/index.js
// Ingrid WhatsApp Gateway — Baileys Edition (No-Browser)
// Status: GOD TIER STABILITY 🚀

require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIG ---
const PORT = 7860; // Port Wajib Hugging Face
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook';
const SESSION_DIR = './baileys_auth_info'; // Folder sesi (bukan file lock!)

// Global Socket Variable
let sock;

// --- SERVER SETUP (Agar Space Tetap Hidup) ---
app.get('/', (req, res) => res.send('Ingrid (Baileys Engine) is Running. 🚀'));
app.get('/health', (req, res) => res.json({ status: 'online', engine: 'Baileys' }));

// --- BAILEYS CONNECTION LOGIC ---
async function startIngrid() {
    console.log('🔄 [Ingrid]: Memulai mesin Baileys...');
    
    // 1. Load/Create Session
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    
    // 2. Fetch Latest Version WA
    const { version } = await fetchLatestBaileysVersion();
    console.log(`ℹ️ [Ingrid]: Menggunakan WA versi v${version.join('.')}`);

    // 3. Create Socket (The "Client")
    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }), // Silent biar log bersih
        printQRInTerminal: true, // Baileys otomatis print QR di terminal!
        auth: state,
        browser: ['Ingrid AI', 'Chrome', '1.0.0'], // Menyamar
        connectTimeoutMs: 60000, // Toleransi koneksi lambat
        keepAliveIntervalMs: 10000,
        syncFullHistory: false // Biar hemat RAM & cepat startup
    });

    // 4. Handle Events
    
    // Update Creds (Simpan Sesi)
    sock.ev.on('creds.update', saveCreds);

    // Connection Update (QR, Connecting, Open, Close)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n====================================');
            console.log('📱 SILAKAN SCAN QR DI ATAS');
            console.log('====================================\n');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ [Ingrid]: Koneksi terputus.', lastDisconnect.error, 'Reconnect?', shouldReconnect);
            
            // Reconnect logic
            if (shouldReconnect) {
                startIngrid(); // Panggil diri sendiri (Recursive)
            } else {
                console.log('💀 [Ingrid]: Terlogout. Hapus folder sesi untuk scan ulang.');
            }
        } else if (connection === 'open') {
            console.log('✅ [Ingrid]: TERHUBUNG KE WHATSAPP! SIAP TEMPUR.');
        }
    });

    // Incoming Messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message) continue;
            // Abaikan pesan dari diri sendiri
            if (msg.key.fromMe) continue;

            const from = msg.key.remoteJid;
            const pushName = msg.pushName || 'User';
            
            // Ekstrak teks (sedikit tricky di Baileys dibanding wwebjs)
            const body = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text || 
                         msg.message.imageMessage?.caption || "";

            console.log(`📩 [Pesan] Dari ${pushName}: ${body.substring(0, 20)}...`);

            // WEBHOOK TRIGGER
            try {
                await axios.post(WEBHOOK_URL, {
                    from: from.replace('@s.whatsapp.net', ''), // Format nomor bersih
                    body,
                    pushname: pushName,
                    timestamp: msg.messageTimestamp
                });
            } catch (err) {
                console.error('⚠️ Gagal kirim Webhook:', err.message);
            }
        }
    });
}

// --- API ENDPOINTS (Pengganti yang lama) ---

app.post('/send', async (req, res) => {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ error: 'Data kurang' });

    try {
        // Format nomor Baileys: 628xxx@s.whatsapp.net
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        
        await sock.sendMessage(jid, { text: message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API Server berjalan di port ${PORT}`);
    startIngrid(); // Jalankan Baileys setelah server nyala
});
