import { useState, useMemo } from 'react';
import { parseOffline } from '../parser/core/parser';
import { DEMO_PRESETS } from '../data/presets';

export default function QuickIntake({ onSaveOrder }) {
  const [rawText, setRawText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const domainLabel = {
    tailor: '🧵 Tailor', tiffin: '🍱 Tiffin', electrician: '⚡ Electrical',
    baker: '🎂 Bakery', custom: '📦 Custom', general: '📦 Custom',
  };

  const parsed = useMemo(() => {
    if (!rawText.trim()) return null;
    try {
      const res = parseOffline({ message: rawText, received_at: new Date().toISOString() });
      return {
        id: res.id || 'ord-live',
        customer: res.customer || null,
        domain: res.domain || 'custom',
        items: Array.isArray(res.items) ? res.items : [],
        due_date: res.due_date || null,
        amount: res.amount !== undefined ? res.amount : null,
        references_prior_order: Boolean(res.references_prior_order),
        confidence: typeof res.confidence === 'number' ? res.confidence : 0.85,
        needs_clarification: Boolean(res.needs_clarification),
      };
    } catch {
      return null;
    }
  }, [rawText]);

  const handleSelectPreset = (preset) => { setRawText(preset.message); setIsEditing(false); setEditForm(null); };
  const handleClear = () => { setRawText(''); setIsEditing(false); setEditForm(null); };

  const handleSave = () => {
    if (!parsed) return;
    const finalDomain = editForm?.domain || parsed.domain || 'custom';
    const finalData = isEditing && editForm ? {
      ...parsed,
      customer: editForm.customer || parsed.customer,
      due_date: editForm.due_date || parsed.due_date,
      amount: editForm.amount !== '' && editForm.amount !== null ? Number(editForm.amount) : parsed.amount,
      domain: finalDomain,
    } : { ...parsed, domain: finalDomain };
    onSaveOrder(finalData, rawText, finalDomain);
    handleClear();
  };

  const toggleVoiceSim = () => {
    if (isRecording) { setIsRecording(false); return; }
    setIsRecording(true);
    const rp = DEMO_PRESETS[Math.floor(Math.random() * DEMO_PRESETS.length)];
    setTimeout(() => { setRawText(rp.message); setIsRecording(false); }, 600);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey && parsed) { e.preventDefault(); handleSave(); } };

  return (
    <div className="bg-white/[0.04] backdrop-blur-md rounded-xl border border-white/[0.06] p-5 mb-5">

      {/* Input row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 relative">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste any WhatsApp message or Hinglish text…"
            rows={2}
            className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-white/20 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none transition resize-none leading-relaxed"
          />
          {rawText && (
            <button onClick={handleClear} className="absolute top-2 right-2 text-white/30 hover:text-white/60 text-xs cursor-pointer">✕</button>
          )}
        </div>

        <div className="flex flex-col gap-1.5 pt-0.5">
          <select
            onChange={(e) => { const idx = e.target.value; if (idx !== '') handleSelectPreset(DEMO_PRESETS[idx]); }}
            defaultValue=""
            className="text-xs text-white/50 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none hover:border-white/15 transition"
          >
            <option value="" disabled>Presets</option>
            {DEMO_PRESETS.map((p, idx) => (
              <option key={idx} value={idx}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={toggleVoiceSim}
            className={`text-xs rounded-lg px-2 py-1.5 border transition cursor-pointer ${
              isRecording
                ? 'bg-red-500/20 border-red-500/30 text-red-400 animate-pulse'
                : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:border-white/15'
            }`}
          >
            🎙️ {isRecording ? 'Listening…' : 'Voice'}
          </button>
        </div>
      </div>

      {/* Live parsed preview */}
      {parsed && (
        <div className="mt-4 border border-white/[0.06] rounded-lg bg-white/[0.03] p-4 space-y-3">

          {/* Domain + Amount */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-white/35">Auto-Detected:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-white/70 font-medium">
                {domainLabel[parsed.domain] || '📦 Custom'}
              </span>
            </div>
            {parsed.amount !== null && (
              <span className="font-mono font-semibold text-white/90">₹{parsed.amount.toLocaleString('en-IN')}</span>
            )}
          </div>

          {/* Entity grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-white/30 mb-0.5">Customer</p>
              <p className="font-medium text-white/80">{parsed.customer || <span className="text-white/25 italic">Walk-in</span>}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/30 mb-0.5">Due</p>
              <p className="font-medium text-white/80 font-mono">{parsed.due_date || <span className="text-white/25 italic">—</span>}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-white/30 mb-0.5">Items</p>
              {parsed.items.length === 0 ? (
                <p className="text-white/25 italic">No items detected</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {parsed.items.map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-white/[0.05] border border-white/[0.08] rounded-md px-2 py-0.5 text-xs text-white/60">
                      <span className="font-semibold text-white/90">{item.quantity}×</span>
                      <span className="capitalize">{item.description}</span>
                      {Object.entries(item.attributes || {}).map(([k, v]) => (
                        <span key={k} className="text-white/30 ml-0.5">{k}: {String(v)}</span>
                      ))}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <button
              onClick={() => {
                if (!isEditing) {
                  setEditForm({
                    customer: parsed.customer || '', due_date: parsed.due_date || '',
                    amount: parsed.amount !== null ? parsed.amount : '', domain: parsed.domain || 'custom',
                  });
                }
                setIsEditing(!isEditing);
              }}
              className="text-xs text-white/40 hover:text-white/70 transition cursor-pointer"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition active:scale-[0.97] cursor-pointer"
            >
              Save ↵
            </button>
          </div>

          {/* Inline edit form */}
          {isEditing && editForm && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
              <div>
                <label className="text-white/35 block mb-1">Customer</label>
                <input type="text" value={editForm.customer} onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-white/80 focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label className="text-white/35 block mb-1">Domain</label>
                <select value={editForm.domain} onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-white/80 focus:outline-none focus:border-white/20">
                  <option value="tailor">🧵 Tailor</option>
                  <option value="tiffin">🍱 Tiffin</option>
                  <option value="electrician">⚡ Electrician</option>
                  <option value="baker">🎂 Baker</option>
                  <option value="custom">📦 Custom</option>
                </select>
              </div>
              <div>
                <label className="text-white/35 block mb-1">Due Date</label>
                <input type="date" value={editForm.due_date || ''} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-white/80 focus:outline-none focus:border-white/20" />
              </div>
              <div>
                <label className="text-white/35 block mb-1">Amount (₹)</label>
                <input type="number" value={editForm.amount || ''} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} placeholder="₹"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-white/80 font-mono focus:outline-none focus:border-white/20" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
