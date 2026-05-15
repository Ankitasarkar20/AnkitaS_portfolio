import { useState, useEffect, useRef } from "react";

// ─── Palette ────────────────────────────────────────────────────────────────
const NOTE_COLORS = [
  { bg: "#FEF9C3", border: "#FDE047", tag: "Yellow" },
  { bg: "#FCE7F3", border: "#F9A8D4", tag: "Pink" },
  { bg: "#DCFCE7", border: "#86EFAC", tag: "Green" },
  { bg: "#DBEAFE", border: "#93C5FD", tag: "Blue" },
  { bg: "#EDE9FE", border: "#C4B5FD", tag: "Purple" },
  { bg: "#FFEDD5", border: "#FDBA74", tag: "Orange" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2) + Date.now();
const fmt = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

const STORAGE_KEY = "notecraft_notes_v1";

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function save(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// ─── Styles (injected once) ───────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --cream: #FDFAF4;
  --ink: #1C1A17;
  --ink-light: #6B6560;
  --accent: #D97706;
  --accent-hover: #B45309;
  --danger: #DC2626;
  --card-radius: 14px;
  --shadow: 0 2px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.14);
}

body { background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--ink); }

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Header ── */
.header {
  background: var(--ink);
  color: #fff;
  padding: 18px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 16px rgba(0,0,0,0.25);
}
.header-brand {
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
  letter-spacing: -0.5px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-brand span { color: var(--accent); }

.search-wrap {
  flex: 1 1 220px;
  position: relative;
}
.search-wrap svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-light);
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 9px 12px 9px 38px;
  border-radius: 8px;
  border: none;
  background: rgba(255,255,255,0.1);
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  outline: none;
  transition: background 0.2s;
}
.search-input::placeholder { color: rgba(255,255,255,0.45); }
.search-input:focus { background: rgba(255,255,255,0.18); }

.btn-new {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.18s, transform 0.12s;
  white-space: nowrap;
}
.btn-new:hover { background: var(--accent-hover); transform: translateY(-1px); }
.btn-new:active { transform: translateY(0); }

/* ── Count bar ── */
.count-bar {
  padding: 10px 24px;
  font-size: 0.82rem;
  color: var(--ink-light);
  border-bottom: 1px solid #E8E4DB;
  background: #FAF6EE;
}

/* ── Grid ── */
.notes-grid {
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 20px;
  flex: 1;
}

.empty-state {
  grid-column: 1/-1;
  text-align: center;
  padding: 80px 20px;
  color: var(--ink-light);
}
.empty-state .emoji { font-size: 3rem; margin-bottom: 12px; }
.empty-state h2 { font-family: 'Playfair Display', serif; font-size: 1.4rem; margin-bottom: 6px; color: var(--ink); }
.empty-state p { font-size: 0.9rem; }

/* ── Note card ── */
.note-card {
  border-radius: var(--card-radius);
  border: 2px solid transparent;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--shadow);
  transition: transform 0.18s, box-shadow 0.18s;
  animation: popIn 0.22s ease;
  position: relative;
  overflow: hidden;
}
.note-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }

@keyframes popIn {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.note-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.05rem;
  line-height: 1.35;
  word-break: break-word;
}
.note-body {
  font-size: 0.875rem;
  color: #444;
  line-height: 1.6;
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 120px;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
}
.note-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}
.note-date { font-size: 0.75rem; color: var(--ink-light); }
.note-actions { display: flex; gap: 6px; }

.icon-btn {
  background: rgba(0,0,0,0.07);
  border: none;
  border-radius: 7px;
  padding: 5px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  gap: 4px;
  transition: background 0.15s;
}
.icon-btn:hover { background: rgba(0,0,0,0.14); }
.icon-btn.danger:hover { background: #fee2e2; color: var(--danger); }

/* ── Modal overlay ── */
.overlay {
  position: fixed; inset: 0;
  background: rgba(28,26,23,0.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 200;
  padding: 16px;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

.modal {
  background: #fff;
  border-radius: 18px;
  width: 100%;
  max-width: 520px;
  padding: 28px;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-height: 90vh;
  overflow-y: auto;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.3rem;
}
.close-btn {
  background: #F3F0EA;
  border: none;
  border-radius: 8px;
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background 0.15s;
}
.close-btn:hover { background: #E8E4DB; }

.field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink-light);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}
.field input, .field textarea {
  width: 100%;
  border: 2px solid #E8E4DB;
  border-radius: 10px;
  padding: 10px 14px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s;
  color: var(--ink);
  background: #FDFAF4;
  resize: vertical;
}
.field input:focus, .field textarea:focus { border-color: var(--accent); }
.field textarea { min-height: 140px; line-height: 1.6; }

/* Color picker */
.color-picker { display: flex; gap: 10px; flex-wrap: wrap; }
.color-swatch {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}
.color-swatch:hover { transform: scale(1.15); }
.color-swatch.selected { border-color: var(--ink); transform: scale(1.15); }

.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }

.btn-cancel {
  background: #F3F0EA;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-cancel:hover { background: #E8E4DB; }

.btn-save {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.12s;
}
.btn-save:hover { background: var(--accent-hover); transform: translateY(-1px); }
.btn-save:disabled { opacity: 0.45; pointer-events: none; }

/* Delete confirm modal */
.delete-modal { max-width: 380px; text-align: center; gap: 14px; }
.delete-modal .del-icon { font-size: 2.5rem; }
.delete-modal h2 { font-family: 'Playfair Display', serif; font-size: 1.2rem; }
.delete-modal p { font-size: 0.88rem; color: var(--ink-light); }
.btn-danger {
  background: var(--danger);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-danger:hover { background: #b91c1c; }

/* Char counter */
.char-count { font-size: 0.75rem; color: var(--ink-light); text-align: right; margin-top: 3px; }

/* ── Responsive ── */
@media (max-width: 540px) {
  .header { padding: 14px 16px; gap: 10px; }
  .notes-grid { padding: 16px; gap: 14px; }
  .notes-grid { grid-template-columns: 1fr; }
  .modal { padding: 20px; }
}
`;

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconNote = () => (
  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function NotesApp() {
  const [notes, setNotes] = useState(load);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // "create" | { type:"edit", note } | { type:"delete", id }
  const [form, setForm] = useState({ title: "", body: "", colorIdx: 0 });
  const titleRef = useRef(null);

  // Persist on every change
  useEffect(() => { save(notes); }, [notes]);

  // Focus title when modal opens
  useEffect(() => {
    if (modal && modal !== "delete") setTimeout(() => titleRef.current?.focus(), 80);
  }, [modal]);

  // ── Filtered notes ──
  const filtered = notes.filter(n => {
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
  });

  // ── CRUD handlers ──
  const openCreate = () => {
    setForm({ title: "", body: "", colorIdx: 0 });
    setModal("create");
  };

  const openEdit = (note) => {
    setForm({ title: note.title, body: note.body, colorIdx: note.colorIdx });
    setModal({ type: "edit", note });
  };

  const openDelete = (id) => setModal({ type: "delete", id });

  const closeModal = () => setModal(null);

  // CREATE
  const handleCreate = () => {
    if (!form.title.trim() && !form.body.trim()) return;
    const newNote = {
      id: uid(),
      title: form.title.trim() || "Untitled",
      body: form.body.trim(),
      colorIdx: form.colorIdx,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
    closeModal();
  };

  // UPDATE
  const handleUpdate = () => {
    setNotes(prev =>
      prev.map(n =>
        n.id === modal.note.id
          ? { ...n, title: form.title.trim() || "Untitled", body: form.body.trim(), colorIdx: form.colorIdx, updatedAt: new Date().toISOString() }
          : n
      )
    );
    closeModal();
  };

  // DELETE
  const handleDelete = () => {
    setNotes(prev => prev.filter(n => n.id !== modal.id));
    closeModal();
  };

  const isEditing = modal && modal.type === "edit";
  const isDeleting = modal && modal.type === "delete";
  const isCreating = modal === "create";

  return (
    <>
      <style>{CSS}</style>
      <div className="app-shell">

        {/* ── Header ── */}
        <header className="header">
          <div className="header-brand">
            <IconNote />
            Note<span>craft</span>
          </div>

          <div className="search-wrap">
            <IconSearch />
            <input
              className="search-input"
              placeholder="Search notes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search notes"
            />
          </div>

          <button className="btn-new" onClick={openCreate} aria-label="New note">
            <IconPlus /> New Note
          </button>
        </header>

        {/* ── Count bar ── */}
        <div className="count-bar">
          {search
            ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${search}"`
            : `${notes.length} note${notes.length !== 1 ? "s" : ""} saved`}
        </div>

        {/* ── Notes grid ── */}
        <main className="notes-grid">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">{search ? "🔍" : "📝"}</div>
              <h2>{search ? "No notes found" : "No notes yet"}</h2>
              <p>{search ? `Try a different search term.` : `Click "New Note" to capture your first thought.`}</p>
            </div>
          ) : (
            filtered.map(note => {
              const col = NOTE_COLORS[note.colorIdx] || NOTE_COLORS[0];
              return (
                <article
                  key={note.id}
                  className="note-card"
                  style={{ background: col.bg, borderColor: col.border }}
                >
                  {note.title && <div className="note-title">{note.title}</div>}
                  {note.body && <div className="note-body">{note.body}</div>}
                  <div className="note-footer">
                    <span className="note-date">{fmt(note.updatedAt)}</span>
                    <div className="note-actions">
                      <button className="icon-btn" onClick={() => openEdit(note)} aria-label="Edit note">
                        <IconEdit /> Edit
                      </button>
                      <button className="icon-btn danger" onClick={() => openDelete(note.id)} aria-label="Delete note">
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </main>

        {/* ── Create / Edit Modal ── */}
        {(isCreating || isEditing) && (
          <div className="overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
              <div className="modal-header">
                <h2 className="modal-title" id="modal-title">
                  {isCreating ? "New Note" : "Edit Note"}
                </h2>
                <button className="close-btn" onClick={closeModal} aria-label="Close">✕</button>
              </div>

              {/* Title */}
              <div className="field">
                <label htmlFor="note-title">Title</label>
                <input
                  id="note-title"
                  ref={titleRef}
                  placeholder="Give your note a title…"
                  value={form.title}
                  maxLength={100}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
                <div className="char-count">{form.title.length}/100</div>
              </div>

              {/* Body */}
              <div className="field">
                <label htmlFor="note-body">Content</label>
                <textarea
                  id="note-body"
                  placeholder="Write your thoughts here…"
                  value={form.body}
                  maxLength={2000}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                />
                <div className="char-count">{form.body.length}/2000</div>
              </div>

              {/* Color */}
              <div className="field">
                <label>Color</label>
                <div className="color-picker">
                  {NOTE_COLORS.map((col, i) => (
                    <button
                      key={i}
                      className={`color-swatch${form.colorIdx === i ? " selected" : ""}`}
                      style={{ background: col.bg, borderColor: col.border }}
                      onClick={() => setForm(f => ({ ...f, colorIdx: i }))}
                      aria-label={col.tag}
                      title={col.tag}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button
                  className="btn-save"
                  onClick={isCreating ? handleCreate : handleUpdate}
                  disabled={!form.title.trim() && !form.body.trim()}
                >
                  {isCreating ? "Save Note" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Confirm Modal ── */}
        {isDeleting && (
          <div className="overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="modal delete-modal" role="dialog" aria-modal="true">
              <div className="del-icon">🗑️</div>
              <h2>Delete this note?</h2>
              <p>This action is permanent and cannot be undone.</p>
              <div className="modal-actions" style={{ justifyContent: "center" }}>
                <button className="btn-cancel" onClick={closeModal}>Keep it</button>
                <button className="btn-danger" onClick={handleDelete}>Yes, delete</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
