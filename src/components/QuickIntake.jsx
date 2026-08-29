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

  // Synchronous live parsing on every keystroke
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

  const handleSelectPreset = (preset) => {
    setRawText(preset.message);
    setIsEditing(false);
    setEditForm(null);
  };

  const handleClear = () => {
    setRawText('');
    setIsEditing(false);
    setEditForm(null);
  };

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
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const randomPreset = DEMO_PRESETS[Math.floor(Math.random() * DEMO_PRESETS.length)];
      setTimeout(() => {
        setRawText(randomPreset.message);
        setIsRecording(false);
      }, 600);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && parsed) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">

      {/* Input Row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 relative">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste any WhatsApp message or Hinglish text…"
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none transition resize-none leading-relaxed"
          />
          {rawText && (
            <button onClick={handleClear} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer">✕</button>
          )}
        </div>

        <div className="flex flex-col gap-1.5 pt-0.5">
          <select
            onChange={(e) => {
              const idx = e.target.value;
              if (idx !== '') handleSelectPreset(DEMO_PRESETS[idx]);
            }}
            defaultValue=""
            className="text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none hover:border-slate-300 transition"
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
                ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            🎙️ {isRecording ? 'Listening…' : 'Voice'}
          </button>
        </div>
      </div>

      {/* Parsed Preview */}
      {parsed && (
        <div className="mt-4 border border-slate-100 rounded-lg bg-slate-50/50 p-4 space-y-3">

          {/* Top row: auto-detected domain + amount */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Auto-Detected:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                {domainLabel[parsed.domain] || '📦 Custom'}
              </span>
            </div>
            {parsed.amount !== null && (
              <span className="font-mono font-semibold text-slate-800">₹{parsed.amount.toLocaleString('en-IN')}</span>
            )}
          </div>

          {/* Entity grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">

            <div>
              <p className="text-[11px] text-slate-400 mb-0.5">Customer</p>
              <p className="font-medium text-slate-800">{parsed.customer || <span className="text-slate-400 italic">Walk-in</span>}</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 mb-0.5">Due</p>
              <p className="font-medium text-slate-800">{parsed.due_date || <span className="text-slate-400 italic">—</span>}</p>
            </div>

            <div className="col-span-2">
              <p className="text-[11px] text-slate-400 mb-0.5">Items</p>
              {parsed.items.length === 0 ? (
                <p className="text-slate-400 italic">No items detected</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {parsed.items.map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-md px-2 py-0.5 text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">{item.quantity}×</span>
                      <span className="capitalize">{item.description}</span>
                      {Object.entries(item.attributes || {}).map(([k, v]) => (
                        <span key={k} className="text-slate-400 ml-0.5">{k}: {String(v)}</span>
                      ))}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Action row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                if (!isEditing) {
                  setEditForm({
                    customer: parsed.customer || '',
                    due_date: parsed.due_date || '',
                    amount: parsed.amount !== null ? parsed.amount : '',
                    domain: parsed.domain || 'custom',
                  });
                }
                setIsEditing(!isEditing);
              }}
              className="text-xs text-slate-500 hover:text-slate-700 transition cursor-pointer"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition active:scale-[0.97] cursor-pointer"
            >
              Save ↵
            </button>
          </div>

          {/* Inline Edit */}
          {isEditing && editForm && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Customer</label>
                <input type="text" value={editForm.customer} onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Domain</label>
                <select value={editForm.domain} onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-400">
                  <option value="tailor">🧵 Tailor</option>
                  <option value="tiffin">🍱 Tiffin</option>
                  <option value="electrician">⚡ Electrician</option>
                  <option value="baker">🎂 Baker</option>
                  <option value="custom">📦 Custom</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Due Date</label>
                <input type="date" value={editForm.due_date || ''} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Amount (₹)</label>
                <input type="number" value={editForm.amount || ''} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} placeholder="₹"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-slate-400" />
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
