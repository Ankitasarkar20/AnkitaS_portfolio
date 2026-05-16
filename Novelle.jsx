import { useState, useEffect, useRef } from "react";

// ── Storage ──────────────────────────────────────────────────────────────────
const KEY = "novelle_entries_v2";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const persist = (d) => localStorage.setItem(KEY, JSON.stringify(d));
const uid = () => Math.random().toString(36).slice(2) + Date.now();
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

// ── Moods ────────────────────────────────────────────────────────────────────
const MOODS = [
  { emoji: "🌸", label: "Blooming" },
  { emoji: "🌙", label: "Dreamy" },
  { emoji: "☁️", label: "Cloudy" },
  { emoji: "🕯️", label: "Cozy" },
  { emoji: "🌿", label: "Calm" },
  { emoji: "💜", label: "Loved" },
  { emoji: "✨", label: "Inspired" },
  { emoji: "🍵", label: "Peaceful" },
];

// ── Note card colors ──────────────────────────────────────────────────────────
const CARD_PALETTES = [
  { bg: "rgba(205,180,219,0.22)", border: "#CDB4DB", accent: "#9b72b0" },
  { bg: "rgba(247,214,224,0.25)", border: "#F7D6E0", accent: "#c97b9a" },
  { bg: "rgba(233,216,253,0.25)", border: "#E9D8FD", accent: "#8b6db5" },
  { bg: "rgba(250,247,255,0.4)",  border: "#dcd0f0", accent: "#7a6094" },
  { bg: "rgba(255,240,245,0.3)",  border: "#f5c6d8", accent: "#b5698a" },
  { bg: "rgba(220,208,240,0.28)", border: "#c9b8e8", accent: "#7f5faa" },
];

// ── Quotes ───────────────────────────────────────────────────────────────────
const QUOTES = [
  "She wrote her way through the silence.",
  "Every page a petal, every word a breath.",
  "Quiet minds write the loudest stories.",
  "The ink knows what the heart cannot say.",
  "Her diary was her softest sanctuary.",
];

// ── Global CSS ────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Dancing+Script:wght@500;700&family=Poppins:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --lavender: #CDB4DB;
  --cream: #FAF7FF;
  --light-purple: #E9D8FD;
  --soft-pink: #F7D6E0;
  --ink: #4A4453;
  --ink-light: #7a7088;
  --ink-faint: #b0a8c0;
  --accent: #9b72b0;
  --accent-deep: #7a5490;
  --glass: rgba(255,255,255,0.55);
  --glass-border: rgba(205,180,219,0.4);
  --shadow-sm: 0 2px 12px rgba(155,114,176,0.1);
  --shadow-md: 0 6px 28px rgba(155,114,176,0.15);
  --shadow-lg: 0 16px 48px rgba(155,114,176,0.22);
  --radius: 20px;
  --radius-sm: 12px;
}

html { scroll-behavior: smooth; }

body {
  font-family: 'Poppins', sans-serif;
  background: var(--cream);
  color: var(--ink);
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── Texture background ── */
.app-bg {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 10% 20%, rgba(205,180,219,0.18) 0%, transparent 50%),
    radial-gradient(ellipse at 90% 80%, rgba(247,214,224,0.18) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(233,216,253,0.1) 0%, transparent 70%),
    var(--cream);
  position: relative;
}
.app-bg::before {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23CDB4DB' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

/* ── Header ── */
.header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(250,247,255,0.82);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--glass-border);
  padding: 14px 28px;
  display: flex; align-items: center; gap: 16px;
  animation: slideDown 0.5s ease;
}
@keyframes slideDown { from { opacity:0; transform:translateY(-16px) } to { opacity:1; transform:translateY(0) } }

.logo-wrap { flex: 0 0 auto; }
.logo {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: -0.5px;
  line-height: 1;
}
.logo-tag {
  font-family: 'Dancing Script', cursive;
  font-size: 0.72rem;
  color: var(--ink-light);
  display: block;
  margin-top: -2px;
  letter-spacing: 0.03em;
}

.search-wrap {
  flex: 1 1 200px;
  position: relative;
  max-width: 380px;
}
.search-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: var(--ink-faint); font-size: 0.85rem; pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  border: 1.5px solid var(--glass-border);
  border-radius: 50px;
  background: var(--glass);
  font-family: 'Poppins', sans-serif;
  font-size: 0.82rem;
  color: var(--ink);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input::placeholder { color: var(--ink-faint); }
.search-input:focus { border-color: var(--lavender); box-shadow: 0 0 0 3px rgba(205,180,219,0.2); }

.profile-chip {
  display: flex; align-items: center; gap: 8px;
  background: var(--glass);
  border: 1.5px solid var(--glass-border);
  border-radius: 50px;
  padding: 6px 14px 6px 6px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.profile-chip:hover { box-shadow: var(--shadow-sm); }
.profile-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, var(--lavender), var(--soft-pink));
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
}
.profile-name {
  font-size: 0.8rem; font-weight: 500; color: var(--ink);
}

/* ── Hero welcome ── */
.hero {
  text-align: center;
  padding: 44px 24px 20px;
  animation: fadeUp 0.6s ease 0.1s both;
}
@keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }

.hero-greeting {
  font-family: 'Dancing Script', cursive;
  font-size: 1.5rem;
  color: var(--ink-light);
  margin-bottom: 4px;
}
.hero-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  color: var(--ink);
  line-height: 1.15;
  margin-bottom: 10px;
}
.hero-title em { color: var(--accent); font-style: italic; }
.hero-quote {
  font-family: 'Dancing Script', cursive;
  font-size: 1rem;
  color: var(--ink-faint);
  font-style: italic;
}

/* ── Stats row ── */
.stats-row {
  display: flex; justify-content: center; gap: 16px;
  padding: 16px 24px 0;
  flex-wrap: wrap;
  animation: fadeUp 0.6s ease 0.2s both;
}
.stat-pill {
  background: var(--glass);
  border: 1.5px solid var(--glass-border);
  border-radius: 50px;
  padding: 8px 20px;
  display: flex; align-items: center; gap: 8px;
  font-size: 0.8rem; color: var(--ink-light);
  backdrop-filter: blur(8px);
}
.stat-pill strong { color: var(--accent); font-weight: 600; }

/* ── Mood filter ── */
.mood-bar {
  display: flex; gap: 8px;
  padding: 20px 28px 8px;
  overflow-x: auto;
  scrollbar-width: none;
  animation: fadeUp 0.6s ease 0.25s both;
}
.mood-bar::-webkit-scrollbar { display: none; }
.mood-btn {
  flex: 0 0 auto;
  background: var(--glass);
  border: 1.5px solid var(--glass-border);
  border-radius: 50px;
  padding: 6px 14px;
  font-size: 0.78rem;
  font-family: 'Poppins', sans-serif;
  color: var(--ink-light);
  cursor: pointer;
  display: flex; align-items: center; gap: 5px;
  transition: all 0.18s;
  white-space: nowrap;
}
.mood-btn:hover, .mood-btn.active {
  background: linear-gradient(135deg, rgba(205,180,219,0.4), rgba(247,214,224,0.4));
  border-color: var(--lavender);
  color: var(--accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* ── Grid ── */
.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 24px 28px 100px;
  position: relative; z-index: 1;
}

/* ── Entry card ── */
.entry-card {
  border-radius: var(--radius);
  border: 1.5px solid;
  padding: 22px;
  display: flex; flex-direction: column; gap: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--shadow-sm);
  transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s;
  animation: cardIn 0.3s ease both;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.entry-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, var(--lavender), var(--soft-pink));
  opacity: 0.6;
}
.entry-card:hover { transform: translateY(-5px) scale(1.01); box-shadow: var(--shadow-md); }

@keyframes cardIn {
  from { opacity:0; transform:translateY(16px) scale(0.97) }
  to   { opacity:1; transform:translateY(0) scale(1) }
}

.card-mood { font-size: 1.4rem; line-height: 1; }
.card-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.3;
}
.card-body {
  font-size: 0.8rem;
  color: var(--ink-light);
  line-height: 1.7;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-weight: 300;
}
.card-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid rgba(205,180,219,0.25);
}
.card-date { font-size: 0.7rem; color: var(--ink-faint); }
.card-mood-label {
  font-size: 0.68rem;
  background: rgba(205,180,219,0.2);
  color: var(--accent);
  border-radius: 50px;
  padding: 2px 10px;
  font-weight: 500;
}
.card-actions { display: flex; gap: 6px; }
.card-btn {
  background: rgba(255,255,255,0.6);
  border: 1px solid rgba(205,180,219,0.35);
  border-radius: 8px;
  padding: 5px 9px;
  font-size: 0.72rem;
  cursor: pointer;
  color: var(--ink-light);
  font-family: 'Poppins', sans-serif;
  transition: all 0.15s;
  display: flex; align-items: center; gap: 4px;
}
.card-btn:hover { background: rgba(205,180,219,0.3); color: var(--accent); }
.card-btn.del:hover { background: rgba(247,214,224,0.5); color: #b5698a; border-color: #F7D6E0; }

/* ── Empty state ── */
.empty {
  grid-column: 1/-1;
  text-align: center;
  padding: 80px 20px;
  animation: fadeUp 0.5s ease;
}
.empty-icon { font-size: 3rem; margin-bottom: 14px; display: block; }
.empty h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.6rem; color: var(--ink); margin-bottom: 6px;
}
.empty p { font-size: 0.85rem; color: var(--ink-light); font-weight: 300; }

/* ── FAB ── */
.fab {
  position: fixed; bottom: 28px; right: 28px; z-index: 60;
  background: linear-gradient(135deg, var(--lavender), #b08cc8);
  color: #fff;
  border: none;
  border-radius: 50px;
  padding: 14px 24px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 6px 24px rgba(155,114,176,0.45);
  transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
  animation: fabIn 0.5s ease 0.3s both;
}
@keyframes fabIn { from { opacity:0; transform:scale(0.7) } to { opacity:1; transform:scale(1) } }
.fab:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 10px 32px rgba(155,114,176,0.5); }
.fab:active { transform: scale(0.97); }

/* ── Overlay ── */
.overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(74,68,83,0.45);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  animation: overlayIn 0.18s ease;
}
@keyframes overlayIn { from { opacity:0 } to { opacity:1 } }

/* ── Modal ── */
.modal {
  background: rgba(250,247,255,0.97);
  border-radius: 24px;
  width: 100%; max-width: 580px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  animation: modalIn 0.25s cubic-bezier(.34,1.56,.64,1);
  border: 1.5px solid var(--glass-border);
  scrollbar-width: thin;
  scrollbar-color: var(--lavender) transparent;
}
@keyframes modalIn { from { opacity:0; transform:scale(0.93) translateY(20px) } to { opacity:1; transform:scale(1) translateY(0) } }

.modal-header {
  padding: 26px 28px 0;
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 16px;
}
.modal-header-left {}
.modal-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.6rem; font-weight: 700; color: var(--ink);
}
.modal-subtitle {
  font-family: 'Dancing Script', cursive;
  font-size: 0.9rem; color: var(--ink-faint); margin-top: 2px;
}
.modal-close {
  background: rgba(205,180,219,0.18);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 1rem; color: var(--ink-light);
  transition: background 0.15s;
  flex-shrink: 0;
}
.modal-close:hover { background: rgba(205,180,219,0.35); }

.modal-body { padding: 20px 28px 28px; display: flex; flex-direction: column; gap: 18px; }

/* fields */
.field { display: flex; flex-direction: column; gap: 6px; }
.field label {
  font-size: 0.72rem; font-weight: 600;
  color: var(--ink-light);
  text-transform: uppercase; letter-spacing: 0.08em;
}
.field input, .field textarea {
  width: 100%;
  border: 1.5px solid rgba(205,180,219,0.4);
  border-radius: var(--radius-sm);
  padding: 11px 16px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.875rem;
  color: var(--ink);
  background: rgba(255,255,255,0.7);
  outline: none;
  transition: border-color 0.18s, box-shadow 0.18s;
  resize: vertical;
}
.field input:focus, .field textarea:focus {
  border-color: var(--lavender);
  box-shadow: 0 0 0 3px rgba(205,180,219,0.2);
  background: rgba(255,255,255,0.9);
}
.field textarea { min-height: 150px; line-height: 1.7; }
.char-hint { font-size: 0.7rem; color: var(--ink-faint); text-align: right; }

/* mood picker in modal */
.mood-grid {
  display: flex; flex-wrap: wrap; gap: 8px;
}
.mood-chip {
  background: rgba(255,255,255,0.6);
  border: 1.5px solid rgba(205,180,219,0.35);
  border-radius: 50px;
  padding: 6px 14px;
  font-size: 0.78rem;
  font-family: 'Poppins', sans-serif;
  color: var(--ink-light);
  cursor: pointer;
  display: flex; align-items: center; gap: 5px;
  transition: all 0.15s;
}
.mood-chip:hover { border-color: var(--lavender); color: var(--accent); }
.mood-chip.selected {
  background: linear-gradient(135deg, rgba(205,180,219,0.4), rgba(247,214,224,0.4));
  border-color: var(--lavender);
  color: var(--accent);
  font-weight: 500;
}

/* color picker */
.color-row { display: flex; gap: 10px; }
.color-dot {
  width: 28px; height: 28px; border-radius: 50%;
  border: 2.5px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}
.color-dot:hover { transform: scale(1.2); }
.color-dot.selected { border-color: var(--ink); transform: scale(1.2); }

/* modal actions */
.modal-actions {
  display: flex; gap: 10px; justify-content: flex-end; padding-top: 4px;
}
.btn-ghost {
  background: transparent;
  border: 1.5px solid rgba(205,180,219,0.4);
  border-radius: var(--radius-sm);
  padding: 10px 20px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem; font-weight: 500;
  color: var(--ink-light); cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover { background: rgba(205,180,219,0.15); color: var(--ink); }
.btn-primary {
  background: linear-gradient(135deg, var(--lavender), #b08cc8);
  border: none;
  border-radius: var(--radius-sm);
  padding: 10px 26px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem; font-weight: 600;
  color: #fff; cursor: pointer;
  box-shadow: 0 4px 14px rgba(155,114,176,0.35);
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(155,114,176,0.45); }
.btn-primary:disabled { opacity: 0.45; pointer-events: none; }

/* delete modal */
.del-modal { max-width: 380px; padding: 36px 32px; text-align: center; gap: 14px; display: flex; flex-direction: column; }
.del-icon { font-size: 2.8rem; }
.del-title { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 700; color: var(--ink); }
.del-desc { font-size: 0.83rem; color: var(--ink-light); font-weight: 300; line-height: 1.6; }
.btn-danger {
  background: linear-gradient(135deg, #e8a0b4, #c97b9a);
  border: none; border-radius: var(--radius-sm);
  padding: 10px 26px;
  font-family: 'Poppins', sans-serif; font-size: 0.85rem; font-weight: 600;
  color: #fff; cursor: pointer;
  box-shadow: 0 4px 14px rgba(201,123,154,0.3);
  transition: transform 0.15s;
}
.btn-danger:hover { transform: translateY(-1px); }

/* view modal */
.view-mood-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(205,180,219,0.2);
  border: 1px solid var(--glass-border);
  border-radius: 50px;
  padding: 4px 14px;
  font-size: 0.78rem; color: var(--accent);
  margin-bottom: 4px;
}
.view-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.8rem; font-weight: 700; color: var(--ink);
  line-height: 1.25;
}
.view-date { font-size: 0.75rem; color: var(--ink-faint); margin-top: 4px; }
.view-divider {
  border: none; border-top: 1px solid rgba(205,180,219,0.3);
  margin: 2px 0;
}
.view-body {
  font-size: 0.9rem; color: var(--ink-light);
  line-height: 1.85; font-weight: 300;
  white-space: pre-wrap;
}

/* ── Responsive ── */
@media (max-width: 600px) {
  .header { padding: 12px 16px; gap: 10px; }
  .logo { font-size: 1.5rem; }
  .profile-name { display: none; }
  .entries-grid { padding: 16px 16px 90px; grid-template-columns: 1fr; gap: 14px; }
  .hero { padding: 28px 16px 10px; }
  .mood-bar { padding: 12px 16px 4px; }
  .fab { bottom: 20px; right: 16px; padding: 12px 18px; }
  .modal-header { padding: 20px 20px 0; }
  .modal-body { padding: 16px 20px 24px; }
}
`;

// ── App ───────────────────────────────────────────────────────────────────────
export default function Novelle() {
  const [entries, setEntries] = useState(load);
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", moodIdx: 0, colorIdx: 0 });
  const [quoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const titleRef = useRef(null);

  useEffect(() => { persist(entries); }, [entries]);
  useEffect(() => {
    if ((modal === "create" || (modal?.type === "edit"))) {
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [modal]);

  // filtered
  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q);
    const matchMood = moodFilter === null || e.moodIdx === moodFilter;
    return matchSearch && matchMood;
  });

  // CRUD
  const openCreate = () => {
    setForm({ title: "", body: "", moodIdx: 0, colorIdx: 0 });
    setModal("create");
  };
  const openEdit = (e) => {
    setForm({ title: e.title, body: e.body, moodIdx: e.moodIdx, colorIdx: e.colorIdx });
    setModal({ type: "edit", entry: e });
  };
  const openView = (e) => setModal({ type: "view", entry: e });
  const openDelete = (id) => setModal({ type: "delete", id });
  const closeModal = () => setModal(null);

  const handleCreate = () => {
    if (!form.title.trim() && !form.body.trim()) return;
    const entry = {
      id: uid(), title: form.title.trim() || "Untitled Entry",
      body: form.body.trim(), moodIdx: form.moodIdx, colorIdx: form.colorIdx,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setEntries(p => [entry, ...p]);
    closeModal();
  };

  const handleUpdate = () => {
    setEntries(p => p.map(e => e.id === modal.entry.id
      ? { ...e, title: form.title.trim() || "Untitled Entry", body: form.body.trim(), moodIdx: form.moodIdx, colorIdx: form.colorIdx, updatedAt: new Date().toISOString() }
      : e));
    closeModal();
  };

  const handleDelete = () => {
    setEntries(p => p.filter(e => e.id !== modal.id));
    closeModal();
  };

  const isCreate = modal === "create";
  const isEdit = modal?.type === "edit";
  const isView = modal?.type === "view";
  const isDelete = modal?.type === "delete";

  // mood counts
  const moodCounts = MOODS.map((_, i) => entries.filter(e => e.moodIdx === i).length);

  return (
    <>
      <style>{CSS}</style>
      <div className="app-bg">

        {/* ── Header ── */}
        <header className="header">
          <div className="logo-wrap">
            <div className="logo">Novelle</div>
            <span className="logo-tag">A diary for your quiet moments.</span>
          </div>

          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search your entries…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="profile-chip">
            <div className="profile-avatar">🌸</div>
            <span className="profile-name">Dear Writer</span>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-greeting">Good day, dear writer ✨</div>
          <h1 className="hero-title">Your <em>quiet</em> corner<br/>of the world.</h1>
          <div className="hero-quote">"{QUOTES[quoteIdx]}"</div>
        </section>

        {/* ── Stats ── */}
        <div className="stats-row">
          <div className="stat-pill">📖 <strong>{entries.length}</strong> entries written</div>
          <div className="stat-pill">🌸 <strong>{[...new Set(entries.map(e => e.moodIdx))].length}</strong> moods captured</div>
          <div className="stat-pill">✨ <strong>{entries.filter(e => {
            const d = new Date(e.createdAt); const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length}</strong> this month</div>
        </div>

        {/* ── Mood filter ── */}
        <div className="mood-bar">
          <button
            className={`mood-btn${moodFilter === null ? " active" : ""}`}
            onClick={() => setMoodFilter(null)}
          >✦ All moods</button>
          {MOODS.map((m, i) => (
            <button
              key={i}
              className={`mood-btn${moodFilter === i ? " active" : ""}`}
              onClick={() => setMoodFilter(moodFilter === i ? null : i)}
            >
              {m.emoji} {m.label}
              {moodCounts[i] > 0 && <span style={{ opacity: 0.6 }}>({moodCounts[i]})</span>}
            </button>
          ))}
        </div>

        {/* ── Grid ── */}
        <main className="entries-grid">
          {filtered.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">{search ? "🔍" : "🕯️"}</span>
              <h2>{search ? "No entries found" : "Your diary awaits"}</h2>
              <p>{search ? `Nothing matches "${search}". Try different words.` : "Press the lavender button below to write your first entry."}</p>
            </div>
          ) : filtered.map((entry, idx) => {
            const pal = CARD_PALETTES[entry.colorIdx] || CARD_PALETTES[0];
            const mood = MOODS[entry.moodIdx] || MOODS[0];
            return (
              <article
                key={entry.id}
                className="entry-card"
                style={{ background: pal.bg, borderColor: pal.border, animationDelay: `${idx * 0.05}s` }}
                onClick={() => openView(entry)}
              >
                <div className="card-mood">{mood.emoji}</div>
                <div className="card-title">{entry.title}</div>
                {entry.body && <div className="card-body">{entry.body}</div>}
                <div className="card-footer">
                  <div>
                    <div className="card-date">{fmtDate(entry.updatedAt)}</div>
                    <div className="card-mood-label" style={{ marginTop: 4 }}>{mood.label}</div>
                  </div>
                  <div className="card-actions" onClick={e => e.stopPropagation()}>
                    <button className="card-btn" onClick={() => openEdit(entry)}>✏️ Edit</button>
                    <button className="card-btn del" onClick={() => openDelete(entry.id)}>🗑️</button>
                  </div>
                </div>
              </article>
            );
          })}
        </main>

        {/* ── FAB ── */}
        <button className="fab" onClick={openCreate} aria-label="New Entry">
          ✦ New Entry
        </button>

        {/* ── Create / Edit Modal ── */}
        {(isCreate || isEdit) && (
          <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
            <div className="modal">
              <div className="modal-header">
                <div className="modal-header-left">
                  <div className="modal-title">{isCreate ? "New Entry" : "Edit Entry"}</div>
                  <div className="modal-subtitle">{isCreate ? "What's on your heart today?" : "Refine your words, dear writer."}</div>
                </div>
                <button className="modal-close" onClick={closeModal}>✕</button>
              </div>
              <div className="modal-body">
                <div className="field">
                  <label>Entry Title</label>
                  <input
                    ref={titleRef}
                    placeholder="Give this moment a name…"
                    value={form.title}
                    maxLength={100}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  />
                  <div className="char-hint">{form.title.length}/100</div>
                </div>

                <div className="field">
                  <label>Your Words</label>
                  <textarea
                    placeholder="Pour your thoughts here, freely and beautifully…"
                    value={form.body}
                    maxLength={3000}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  />
                  <div className="char-hint">{form.body.length}/3000</div>
                </div>

                <div className="field">
                  <label>Today's Mood</label>
                  <div className="mood-grid">
                    {MOODS.map((m, i) => (
                      <button
                        key={i}
                        className={`mood-chip${form.moodIdx === i ? " selected" : ""}`}
                        onClick={() => setForm(f => ({ ...f, moodIdx: i }))}
                      >{m.emoji} {m.label}</button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label>Card Color</label>
                  <div className="color-row">
                    {CARD_PALETTES.map((p, i) => (
                      <button
                        key={i}
                        className={`color-dot${form.colorIdx === i ? " selected" : ""}`}
                        style={{ background: p.border }}
                        onClick={() => setForm(f => ({ ...f, colorIdx: i }))}
                        aria-label={`Color ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="btn-ghost" onClick={closeModal}>Discard</button>
                  <button
                    className="btn-primary"
                    onClick={isCreate ? handleCreate : handleUpdate}
                    disabled={!form.title.trim() && !form.body.trim()}
                  >{isCreate ? "Save Entry ✦" : "Save Changes ✦"}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── View Modal ── */}
        {isView && (() => {
          const e = modal.entry;
          const mood = MOODS[e.moodIdx] || MOODS[0];
          const pal = CARD_PALETTES[e.colorIdx] || CARD_PALETTES[0];
          return (
            <div className="overlay" onClick={ev => ev.target === ev.currentTarget && closeModal()}>
              <div className="modal" style={{ borderColor: pal.border }}>
                <div className="modal-header">
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="view-mood-badge">{mood.emoji} {mood.label}</div>
                    <div className="view-title">{e.title}</div>
                    <div className="view-date">{fmtDate(e.createdAt)} · {fmtTime(e.createdAt)}{e.updatedAt !== e.createdAt ? " · edited" : ""}</div>
                  </div>
                  <button className="modal-close" onClick={closeModal}>✕</button>
                </div>
                <div className="modal-body">
                  <hr className="view-divider" />
                  <div className="view-body">{e.body || <em style={{ color: "var(--ink-faint)" }}>No content written yet.</em>}</div>
                  <div className="modal-actions">
                    <button className="btn-ghost" onClick={closeModal}>Close</button>
                    <button className="btn-ghost" onClick={() => { closeModal(); setTimeout(() => openEdit(e), 50); }}>✏️ Edit</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Delete Modal ── */}
        {isDelete && (
          <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
            <div className="modal">
              <div className="del-modal">
                <div className="del-icon">🌸</div>
                <div className="del-title">Let this entry go?</div>
                <div className="del-desc">This entry will be gently removed from your diary. Like petals in the wind — it cannot be brought back.</div>
                <div className="modal-actions" style={{ justifyContent: "center" }}>
                  <button className="btn-ghost" onClick={closeModal}>Keep it</button>
                  <button className="btn-danger" onClick={handleDelete}>Yes, release it</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
