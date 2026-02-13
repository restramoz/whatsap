// wa-service/index.js
// Ingrid WhatsApp Gateway — De Royal Nirwana Marketing AI
// Features: Auto-reply, Media sending, Broadcast, QR Web Display

require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// --- Configuration ---
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook';
const PORT = process.env.PORT || 3001;

// --- State ---
let clientState = 'initializing';
let lastQR = null;       // Store last QR for web display
let messageCount = 0;    // Total messages processed
let startTime = Date.now();

function log(emoji, tag, message) {
    const time = new Date().toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    console.log(`[${time}] ${emoji} [${tag}]: ${message}`);
}

// --- WhatsApp Client ---
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// 1. QR Code Event
client.on('qr', async (qr) => {
    clientState = 'qr';
    lastQR = qr;
    log('📱', 'QR', 'QR Code generated. Scan via terminal or /qr endpoint.');
    qrcodeTerminal.generate(qr, { small: true });
});

// 2. Authentication Event
client.on('authenticated', () => {
    clientState = 'connecting';
    lastQR = null;
    log('🔐', 'Auth', 'Autentikasi berhasil, menghubungkan...');
});

// 3. Ready Event
client.on('ready', () => {
    clientState = 'ready';
    lastQR = null;
    log('✅', 'Ready', 'Ingrid WA Service: TERHUBUNG DAN SIAP!');
});

// 4. Disconnected Event — Auto Reconnect
client.on('disconnected', (reason) => {
    clientState = 'disconnected';
    log('❌', 'Disconnect', `Terputus: ${reason}. Reconnect dalam 5 detik...`);
    setTimeout(() => {
        log('🔄', 'Reconnect', 'Menginisialisasi ulang...');
        clientState = 'initializing';
        client.initialize().catch(err => {
            log('❌', 'Reconnect', `Gagal: ${err.message}`);
        });
    }, 5000);
});

// 5. Auth Failure
client.on('auth_failure', (msg) => {
    clientState = 'disconnected';
    log('❌', 'Auth', `Autentikasi gagal: ${msg}`);
});

// 6. Incoming Message → Forward to AI Brain (Fire & Forget)
client.on('message', async (message) => {
    if (message.isStatus) return;

    const from = message.from;
    const body = message.body;
    const pushname = message._data?.notifyName || 'User';

    messageCount++;
    log('📩', 'Pesan', `Dari ${pushname} (${from}): "${body}"`);

    // Fire and forget — don't wait for AI response
    axios.post(WEBHOOK_URL, {
        from, body, timestamp: message.timestamp, pushname
    }, { timeout: 90000 })
        .then(() => {
            log('✅', 'Webhook', `Diproses oleh brain.`);
        })
        .catch((error) => {
            if (error.code === 'ECONNREFUSED') {
                log('❌', 'Webhook', `Brain tidak berjalan di ${WEBHOOK_URL}`);
            } else if (error.response) {
                log('❌', 'Webhook', `Error ${error.response.status}: ${error.response.data?.error || 'Unknown'}`);
            } else {
                log('❌', 'Webhook', `Gagal: ${error.message}`);
            }
        });
});

// ═══════════════════════════════════════════
// REST API ENDPOINTS
// ═══════════════════════════════════════════

// --- Send Text ---
app.post('/send', async (req, res) => {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ error: '"to" dan "message" wajib.' });
    if (clientState !== 'ready') return res.status(503).json({ error: `WA belum siap (${clientState})` });

    try {
        await client.sendMessage(to, message);
        log('✅', 'Send', `Teks → ${to}`);
        res.json({ success: true });
    } catch (error) {
        log('❌', 'Send', `Gagal → ${to}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// --- Send Media (Image/Document) ---
app.post('/send-media', async (req, res) => {
    const { to, filePath, caption } = req.body;
    if (!to || !filePath) return res.status(400).json({ error: '"to" dan "filePath" wajib.' });
    if (clientState !== 'ready') return res.status(503).json({ error: `WA belum siap (${clientState})` });

    try {
        // Check file exists
        if (!fs.existsSync(filePath)) {
            log('⚠️', 'Media', `File tidak ditemukan: ${filePath}`);
            return res.status(404).json({ error: `File tidak ditemukan: ${filePath}` });
        }

        const media = MessageMedia.fromFilePath(filePath);
        await client.sendMessage(to, media, { caption: caption || '' });
        log('✅', 'Media', `${path.basename(filePath)} → ${to}`);
        res.json({ success: true });
    } catch (error) {
        log('❌', 'Media', `Gagal kirim media → ${to}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// --- Broadcast ---
app.post('/broadcast', async (req, res) => {
    const { contacts, message } = req.body;
    if (!contacts || !Array.isArray(contacts) || !message) {
        return res.status(400).json({ error: '"contacts" (array) dan "message" wajib.' });
    }
    if (clientState !== 'ready') return res.status(503).json({ error: `WA belum siap (${clientState})` });

    log('📢', 'Broadcast', `Mulai kirim ke ${contacts.length} kontak...`);

    // Send immediately response, process in background
    res.json({ success: true, message: `Broadcasting to ${contacts.length} contacts`, total: contacts.length });

    let sent = 0, failed = 0;
    for (const contact of contacts) {
        try {
            // Format number: ensure @c.us suffix
            const number = contact.includes('@') ? contact : `${contact}@c.us`;
            await client.sendMessage(number, message);
            sent++;
            log('✅', 'Broadcast', `${sent}/${contacts.length} → ${number}`);
            // Delay 2s between messages to avoid ban
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
            failed++;
            log('❌', 'Broadcast', `Gagal → ${contact}: ${err.message}`);
        }
    }
    log('📢', 'Broadcast', `Selesai. Terkirim: ${sent}, Gagal: ${failed}`);
});

// --- QR Code (Web Display) ---
app.get('/qr', async (req, res) => {
    if (clientState === 'ready') {
        return res.json({ state: 'ready', message: 'Sudah terhubung, tidak perlu scan QR.' });
    }
    if (!lastQR) {
        return res.json({ state: clientState, message: 'QR belum tersedia. Tunggu...' });
    }

    try {
        const qrDataUrl = await QRCode.toDataURL(lastQR);
        res.json({ state: 'qr', qrCode: qrDataUrl });
    } catch (err) {
        res.status(500).json({ error: 'Gagal generate QR image' });
    }
});

// --- Health Check ---
app.get('/health', (req, res) => {
    res.json({
        service: 'wa-service',
        state: clientState,
        uptime: process.uptime(),
        messagesProcessed: messageCount,
        webhookUrl: WEBHOOK_URL,
    });
});

// --- Graceful Shutdown ---
const shutdown = async () => {
    log('🛑', 'Shutdown', 'Menutup koneksi...');
    try { await client.destroy(); } catch { }
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// --- Start ---
app.listen(PORT, () => {
    log('🚀', 'Server', `REST API @ port ${PORT}`);
    log('🌐', 'Config', `Webhook: ${WEBHOOK_URL}`);
    log('📌', 'Endpoints', '/send, /send-media, /broadcast, /qr, /health');
});

client.initialize();