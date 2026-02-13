"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface HealthData {
  system: string;
  timestamp: string;
  overall: string;
  components: {
    supabase: { status: string; message?: string };
    whatsapp: { status: string; state?: string; messagesProcessed?: number };
    apiKeys: { groq: string; gemini: string; openrouter: string };
  };
}

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: string;
  assets?: { tag: string; description: string; type: string }[];
}

interface Lead {
  phone_number: string;
  pushname: string;
  nama: string;
  tipe_bangunan: string;
  kisaran_budget: string;
  rencana_pola_bayar: string;
  pekerjaan: string;
  sentiment: string;
  status: string;
  last_contact: string;
  [key: string]: any;
}

type Tab = "dashboard" | "leads" | "broadcast" | "analytics";

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export default function IngridDashboard() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrState, setQrState] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastContacts, setBroadcastContacts] = useState("");
  const [broadcastStatus, setBroadcastStatus] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── HEALTH ───
  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/health");
      setHealth(await res.json());
    } catch { setHealth(null); }
    finally { setHealthLoading(false); }
  }, []);

  useEffect(() => {
    fetchHealth();
    const i = setInterval(fetchHealth, 30000);
    return () => clearInterval(i);
  }, [fetchHealth]);

  // ─── QR ───
  const fetchQR = useCallback(async () => {
    try {
      const wa = health?.components?.whatsapp;
      if (wa && wa.status === "connected" && wa.state === "ready") {
        setQrState("ready");
        setQrData(null);
        return;
      }
      const res = await fetch("http://localhost:3001/qr");
      const data = await res.json();
      setQrState(data.state || "unknown");
      setQrData(data.qrCode || null);
    } catch {
      setQrState("unreachable");
    }
  }, [health]);

  useEffect(() => {
    if (tab === "dashboard") {
      fetchQR();
      const i = setInterval(fetchQR, 5000);
      return () => clearInterval(i);
    }
  }, [tab, fetchQR]);

  // ─── LEADS ───
  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      setLeads(data.leads || []);
    } catch { setLeads([]); }
    finally { setLeadsLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "leads") fetchLeads();
  }, [tab, fetchLeads]);

  // ─── CHAT ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput(""); setSending(true);
    const ts = () => new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });
    setMessages(p => [...p, { role: "user", content: userMsg, timestamp: ts() }]);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: userMsg }) });
      const data = await res.json();
      setMessages(p => [...p, { role: "ai", content: data.success ? data.response : `⚠️ ${data.error}`, timestamp: data.timestamp || ts(), assets: data.assets }]);
    } catch (err: any) {
      setMessages(p => [...p, { role: "ai", content: `❌ ${err.message}`, timestamp: ts() }]);
    } finally { setSending(false); }
  };

  // ─── BROADCAST ───
  const handleBroadcast = async () => {
    if (!broadcastMsg.trim() || !broadcastContacts.trim()) return;
    setBroadcastStatus("Mengirim...");
    try {
      const contacts = broadcastContacts.split("\n").map(c => c.trim()).filter(Boolean);
      const res = await fetch("/api/broadcast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contacts, message: broadcastMsg }) });
      const data = await res.json();
      setBroadcastStatus(data.success ? `✅ Broadcast ke ${contacts.length} kontak dimulai!` : `❌ ${data.error}`);
    } catch (err: any) { setBroadcastStatus(`❌ ${err.message}`); }
  };

  // ─── HELPERS ───
  const Badge = ({ status }: { status: string }) => {
    const cls: Record<string, string> = { connected: "badge-green", configured: "badge-green", healthy: "badge-green", ready: "badge-green", new: "badge-cyan", warm: "badge-amber", hot: "badge-red", positive: "badge-green", neutral: "badge-amber", negative: "badge-red", error: "badge-red", missing: "badge-red", unreachable: "badge-amber", degraded: "badge-amber", cold: "badge-amber", closed: "badge-green" };
    return <span className={`badge ${cls[status] || "badge-amber"}`}>{status}</span>;
  };

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="header-logo">
          <div className="logo-icon">I</div>
          <div>
            <h1>INGRID</h1>
            <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "block", marginTop: "-2px" }}>AI Marketing • De Royal Nirwana</span>
          </div>
          <span className="version">v2.0</span>
        </div>
        <div className="header-status">
          <span className={`status-dot ${healthLoading ? "checking" : health?.overall === "healthy" ? "online" : "offline"}`} />
          {healthLoading ? "Checking..." : health?.overall === "healthy" ? "System Online" : "Degraded"}
        </div>
      </header>

      {/* TAB NAVIGATION */}
      <nav className="tab-nav">
        {(["dashboard", "leads", "broadcast", "analytics"] as Tab[]).map(t => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {{ dashboard: "🏠 Dashboard", leads: "👥 Leads", broadcast: "📢 Broadcast", analytics: "📊 Analytics" }[t]}
          </button>
        ))}
      </nav>

      {/* ═══ TAB: DASHBOARD ═══ */}
      {tab === "dashboard" && (
        <div className="dashboard">
          {/* Status Grid */}
          <div className="status-grid">
            <div className="glass-card status-card"><span className="label">Supabase</span><div className="value">{healthLoading ? <span className="spinner" /> : <Badge status={health?.components?.supabase?.status || "checking"} />}</div></div>
            <div className="glass-card status-card"><span className="label">WhatsApp</span><div className="value">{healthLoading ? <span className="spinner" /> : <Badge status={health?.components?.whatsapp?.status || "checking"} />}</div></div>
            <div className="glass-card status-card"><span className="label">Overall</span><div className="value">{healthLoading ? <span className="spinner" /> : <Badge status={health?.overall || "checking"} />}</div></div>
          </div>

          {/* QR Panel */}
          <div className="glass-card qr-panel">
            <h3>🔗 WhatsApp Connection</h3>
            <div className="qr-content">
              {qrState === "ready" ? (
                <div className="qr-ready">✅ Terhubung & Siap</div>
              ) : qrData ? (
                <img src={qrData} alt="QR Code" className="qr-image" />
              ) : (
                <div className="qr-waiting"><span className="spinner" /> {qrState === "unreachable" ? "WA Service tidak aktif" : "Menunggu QR Code..."}</div>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="glass-card chat-panel">
            <div className="chat-header">
              <h3>💬 Test Chat Ingrid</h3>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Marketing AI • bypass WA</span>
            </div>
            <div className="chat-messages">
              {messages.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", margin: "auto" }}>Ketik pesan untuk menguji Ingrid...</div>}
              {messages.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.role}`}>
                  <div className="msg-label">{msg.role === "user" ? "You" : "Ingrid"} • {msg.timestamp}</div>
                  {msg.content}
                  {msg.assets && msg.assets.length > 0 && (
                    <div className="msg-assets">{msg.assets.map((a, j) => <span key={j} className="badge badge-cyan">📎 {a.tag}</span>)}</div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-area">
              <input type="text" placeholder="Ketik pesan..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} disabled={sending} />
              <button className="btn-send" onClick={handleSend} disabled={sending || !input.trim()}>{sending ? <span className="spinner" /> : "Kirim"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: LEADS ═══ */}
      {tab === "leads" && (
        <div className="dashboard" style={{ display: "block" }}>
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>👥 Lead Tracking — De Royal Nirwana</h3>
              <button className="btn-send" onClick={fetchLeads} style={{ padding: "8px 16px", fontSize: "0.8rem" }}>🔄 Refresh</button>
            </div>
            {leadsLoading ? (
              <div style={{ textAlign: "center", padding: "40px" }}><span className="spinner" /></div>
            ) : leads.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                Belum ada lead. Lead akan otomatis tercapture saat user chat via WhatsApp.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Phone</th>
                      <th>Tipe</th>
                      <th>Budget</th>
                      <th>Pola Bayar</th>
                      <th>Pekerjaan</th>
                      <th>Sentiment</th>
                      <th>Status</th>
                      <th>Last Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{lead.nama || lead.pushname || "-"}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>{lead.phone_number}</td>
                        <td>{lead.tipe_bangunan || "-"}</td>
                        <td>{lead.kisaran_budget || "-"}</td>
                        <td>{lead.rencana_pola_bayar || "-"}</td>
                        <td>{lead.pekerjaan || "-"}</td>
                        <td><Badge status={lead.sentiment || "neutral"} /></td>
                        <td><Badge status={lead.status || "new"} /></td>
                        <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{lead.last_contact ? new Date(lead.last_contact).toLocaleDateString("id-ID") : "-"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              </div>
            )}
        </div>
        </div >
      )
}

{/* ═══ TAB: BROADCAST ═══ */ }
{
  tab === "broadcast" && (
    <div className="dashboard" style={{ display: "block" }}>
      <div className="glass-card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px" }}>📢 Broadcast Message</h3>
        <div className="broadcast-form">
          <label className="form-label">Nomor Tujuan <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>(satu per baris, format: 628xxxx)</span></label>
          <textarea className="form-textarea" rows={5} placeholder={"6281234567890\n6289876543210"} value={broadcastContacts} onChange={e => setBroadcastContacts(e.target.value)} />
          <label className="form-label" style={{ marginTop: "12px" }}>Pesan</label>
          <textarea className="form-textarea" rows={4} placeholder="Tulis pesan broadcast..." value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} />
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px" }}>
            <button className="btn-send" onClick={handleBroadcast} disabled={!broadcastMsg.trim() || !broadcastContacts.trim()}>📢 Kirim Broadcast</button>
            {broadcastStatus && <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{broadcastStatus}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

{/* ═══ TAB: ANALYTICS ═══ */ }
{
  tab === "analytics" && (
    <div className="dashboard">
      <div className="status-grid">
        <div className="glass-card status-card">
          <span className="label">Total Leads</span>
          <div className="value" style={{ fontSize: "1.5rem", background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{leads.length || "—"}</div>
        </div>
        <div className="glass-card status-card">
          <span className="label">Messages Processed</span>
          <div className="value" style={{ fontSize: "1.5rem", background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{health?.components?.whatsapp?.messagesProcessed ?? "—"}</div>
        </div>
        <div className="glass-card status-card">
          <span className="label">WA Service Uptime</span>
          <div className="value" style={{ fontSize: "1.1rem", color: "var(--accent-green)" }}>{health?.components?.whatsapp?.status === "connected" ? "🟢 Active" : "🔴 Offline"}</div>
        </div>
      </div>

      {/* API Keys */}
      <div className="glass-card keys-panel" style={{ gridColumn: "1 / -1" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "12px" }}>🔑 API Keys</h3>
        <div className="keys-list">
          {["groq", "gemini", "openrouter"].map(k => (
            <div className="key-row" key={k}>
              <span className="key-name">{k.toUpperCase()}_API_KEY</span>
              <Badge status={healthLoading ? "checking" : (health?.components?.apiKeys as any)?.[k] || "missing"} />
            </div>
          ))}
        </div>
      </div>

      {/* Lead Funnel */}
      <div className="glass-card" style={{ gridColumn: "1 / -1", padding: "24px" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "16px" }}>📊 Lead Funnel</h3>
        <div className="funnel-grid">
          {(["new", "warm", "hot", "closed", "cold"] as const).map(s => {
            const count = leads.filter(l => l.status === s).length;
            const colors: Record<string, string> = { new: "var(--accent-cyan)", warm: "var(--accent-amber)", hot: "var(--accent-red)", closed: "var(--accent-green)", cold: "var(--text-muted)" };
            return (
              <div key={s} className="funnel-item">
                <div className="funnel-count" style={{ color: colors[s] }}>{count}</div>
                <div className="funnel-label">{s.toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}
    </>
  );
}
