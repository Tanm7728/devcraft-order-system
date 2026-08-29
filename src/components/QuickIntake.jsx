import { useState, useMemo } from 'react';
import { parseOffline } from '../parser/core/parser';
import { DEMO_PRESETS } from '../data/presets';

export default function QuickIntake({ onSaveOrder }) {
  const [rawText, setRawText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const domainConfig = {
    tailor: { label: 'Tailor & Boutique', icon: '🧵', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
    tiffin: { label: 'Tiffin & Meal Service', icon: '🍱', color: 'border-orange-500/40 bg-orange-500/10 text-orange-300' },
    electrician: { label: 'Electrical & Repairs', icon: '⚡', color: 'border-sky-500/40 bg-sky-500/10 text-sky-300' },
    baker: { label: 'Bakery & Confectionery', icon: '🎂', color: 'border-pink-500/40 bg-pink-500/10 text-pink-300' },
  };

  // Instant zero-lag synchronous live parsing on every keystroke
  const parsed = useMemo(() => {
    if (!rawText.trim()) return null;
    try {
      const todayAnchor = new Date().toISOString();
      const res = parseOffline({
        message: rawText,
        received_at: todayAnchor,
      });

      // Ensure fallback structures
      return {
        id: res.id || 'ord-live',
        customer: res.customer || null,
        domain: res.domain || 'tailor',
        items: Array.isArray(res.items) ? res.items : [],
        due_date: res.due_date || null,
        amount: res.amount !== undefined ? res.amount : null,
        references_prior_order: Boolean(res.references_prior_order),
        confidence: typeof res.confidence === 'number' ? res.confidence : 0.85,
        needs_clarification: Boolean(res.needs_clarification),
      };
    } catch (err) {
      console.error('Safe live parse error handled:', err);
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

    const finalDomain = editForm?.domain || parsed.domain || 'tailor';
    const finalData = isEditing && editForm ? {
      ...parsed,
      customer: editForm.customer || parsed.customer,
      due_date: editForm.due_date || parsed.due_date,
      amount: editForm.amount !== '' && editForm.amount !== null ? Number(editForm.amount) : parsed.amount,
      domain: finalDomain,
    } : {
      ...parsed,
      domain: finalDomain,
    };

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
      }, 650);
    }
  };

  const currentDomainInfo = parsed ? (domainConfig[parsed.domain] || domainConfig.tailor) : null;

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-2xl mb-6 relative overflow-hidden">
      
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-32 bg-amber-500/5 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black shadow-inner">
            ⚡
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-100 tracking-tight">
                Universal Smart Intake Box
              </h2>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Auto-Classify
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Paste any messy WhatsApp message, voice transcript, or Hinglish note — zero manual domain switching required
            </p>
          </div>
        </div>

        {/* Action Presets */}
        <div className="flex items-center space-x-2">
          {/* Quick Voice/Preset Demo Dropdown */}
          <select
            onChange={(e) => {
              const idx = e.target.value;
              if (idx !== '') handleSelectPreset(DEMO_PRESETS[idx]);
            }}
            defaultValue=""
            className="bg-slate-950 border border-slate-700/80 hover:border-slate-600 text-amber-300 font-semibold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 max-w-[210px] transition cursor-pointer shadow-sm"
          >
            <option value="" disabled>✨ Judge Demo Presets</option>
            {DEMO_PRESETS.map((p, idx) => (
              <option key={idx} value={idx}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Voice Simulator Button */}
          <button
            onClick={toggleVoiceSim}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer ${
              isRecording
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Simulate Voice Note Transcription"
          >
            <span>🎙️</span>
            <span>{isRecording ? 'Listening...' : 'Voice Note'}</span>
          </button>
        </div>
      </div>

      {/* Input Textarea */}
      <div className="mt-4 relative">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Type or paste any unstructured customer text (e.g., 'Pooja didi bol rahi hu. 2 blouse silwana hai red silk mein. Chest 34 waist 28. Kal tak de dena ₹1200 mein')..."
          rows={3}
          className="w-full bg-slate-950/90 border border-slate-800/90 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition resize-none font-sans leading-relaxed shadow-inner"
        />

        {rawText && (
          <button
            onClick={handleClear}
            className="absolute top-2.5 right-2.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded-md transition cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Live Auto-Parsed Output Card */}
      {parsed && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950/95 border border-slate-800 shadow-xl transition-all space-y-3.5">
          
          {/* Header Row: Auto-Detected Domain Badge & Confidence */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Auto-Detected Domain Badge */}
              {currentDomainInfo && (
                <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border font-bold text-xs shadow-sm ${currentDomainInfo.color}`}>
                  <span>{currentDomainInfo.icon}</span>
                  <span>Auto-Detected: {currentDomainInfo.label}</span>
                </div>
              )}

              {/* Confidence Meter */}
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                parsed.confidence >= 0.85
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : parsed.confidence >= 0.6
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}>
                {Math.round(parsed.confidence * 100)}% Extraction Confidence
              </span>

              {parsed.references_prior_order && (
                <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[11px] font-semibold flex items-center space-x-1">
                  <span>🔄</span>
                  <span>References Prior Order</span>
                </span>
              )}
            </div>

            {/* Needs Clarification Warning Banner */}
            {parsed.needs_clarification && (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse">
                <span>⚠️</span>
                <span>Needs Clarification (Normative Rule)</span>
              </div>
            )}
          </div>

          {/* Form & Entity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Customer & Due Date */}
            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Customer</label>
                <div className="text-sm font-bold text-slate-100 flex items-center space-x-2 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800 mt-1">
                  <span className="text-base">👤</span>
                  <span className={parsed.customer ? 'text-slate-100' : 'text-slate-500 italic'}>
                    {parsed.customer || 'Walk-in / Not Stated'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Due Date (Asia/Kolkata)</label>
                <div className="text-sm font-bold text-amber-400 flex items-center space-x-2 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800 mt-1 font-mono">
                  <span className="text-base">📅</span>
                  <span className={parsed.due_date ? 'text-amber-400' : 'text-slate-500 italic font-sans font-normal'}>
                    {parsed.due_date || 'No Date / Urgent'}
                  </span>
                </div>
              </div>
            </div>

            {/* Items & Attributes */}
            <div className="md:col-span-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Extracted Items ({parsed.items.length})
                </label>
                <div className="text-xs font-bold text-emerald-400 font-mono">
                  Total Amount: {parsed.amount ? `₹${parsed.amount.toLocaleString('en-IN')}` : 'Amount not stated'}
                </div>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {parsed.items.length === 0 ? (
                  <div className="text-xs text-rose-400 italic bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 flex items-center space-x-1.5">
                    <span>⚠️</span>
                    <span>No distinct items identified in customer message.</span>
                  </div>
                ) : (
                  parsed.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[10px]">
                          {item.quantity}
                        </span>
                        <span className="font-bold text-slate-100 capitalize">
                          {item.description}
                        </span>
                      </div>

                      {/* Attribute Pills */}
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(item.attributes || {}).map(([attrK, attrV]) => (
                          <span
                            key={attrK}
                            className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-mono border border-slate-800"
                          >
                            <strong className="text-amber-400">{attrK}:</strong> {String(attrV)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
            <button
              onClick={() => {
                if (!isEditing) {
                  setEditForm({
                    customer: parsed.customer || '',
                    due_date: parsed.due_date || '',
                    amount: parsed.amount !== null ? parsed.amount : '',
                    domain: parsed.domain || 'tailor',
                  });
                }
                setIsEditing(!isEditing);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              {isEditing ? 'Cancel Adjustment' : '✏️ Adjust Extracted Values'}
            </button>

            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center space-x-2 transition active:scale-95 cursor-pointer"
            >
              <span className="text-sm">💾</span>
              <span>1-Click Save Order to Offline DB</span>
            </button>
          </div>

          {/* Inline Edit Form */}
          {isEditing && editForm && (
            <div className="mt-3 p-3.5 bg-slate-900/90 border border-slate-700 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={editForm.customer}
                  onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Category Domain</label>
                <select
                  value={editForm.domain}
                  onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                >
                  <option value="tailor">🧵 Tailor</option>
                  <option value="tiffin">🍱 Tiffin</option>
                  <option value="electrician">⚡ Electrician</option>
                  <option value="baker">🎂 Baker</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={editForm.due_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={editForm.amount || ''}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  placeholder="₹"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                />
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
