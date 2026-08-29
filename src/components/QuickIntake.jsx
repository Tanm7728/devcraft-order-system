import { useState, useMemo } from 'react';
import { parseOffline } from '../parser/core/parser';
import { DEMO_PRESETS } from '../data/presets';

export default function QuickIntake({ onSaveOrder }) {
  const [rawText, setRawText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const domainConfig = {
    tailor: { label: 'Tailor & Boutique', icon: '🧵', color: 'border-amber-200 bg-amber-50 text-amber-900' },
    tiffin: { label: 'Tiffin & Meal Service', icon: '🍱', color: 'border-orange-200 bg-orange-50 text-orange-900' },
    electrician: { label: 'Electrical & Repairs', icon: '⚡', color: 'border-sky-200 bg-sky-50 text-sky-900' },
    baker: { label: 'Bakery & Confectionery', icon: '🎂', color: 'border-pink-200 bg-pink-50 text-pink-900' },
    custom: { label: 'Custom / Open-Domain', icon: '📦', color: 'border-purple-200 bg-purple-50 text-purple-900' },
    general: { label: 'Custom / Open-Domain', icon: '📦', color: 'border-purple-200 bg-purple-50 text-purple-900' },
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
      }, 600);
    }
  };

  const currentDomainInfo = parsed ? (domainConfig[parsed.domain] || domainConfig.tailor) : null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs mb-6 relative overflow-hidden">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-black shadow-2xs">
            ✍️
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Universal Smart Intake Box
              </h2>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                Auto-Classify
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Type or paste any messy WhatsApp message, voice transcript, or Hinglish note
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
            className="bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 max-w-[210px] transition cursor-pointer shadow-2xs"
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
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer ${
              isRecording
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
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
          placeholder="Type or paste any unstructured customer text (e.g., 'Ram bol raha hu 3 shirt silwani hai, kal tak de dena ₹1200 mein')..."
          rows={3}
          className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition resize-none font-sans leading-relaxed shadow-inner"
        />

        {rawText && (
          <button
            onClick={handleClear}
            className="absolute top-2.5 right-2.5 text-xs text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded-md transition cursor-pointer shadow-2xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Live Auto-Parsed Output Card */}
      {parsed && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50/90 border border-slate-200 shadow-sm transition-all space-y-3.5">
          
          {/* Header Row: Auto-Detected Domain Badge & Confidence */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Auto-Detected Domain Badge */}
              {currentDomainInfo && (
                <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border font-bold text-xs shadow-2xs ${currentDomainInfo.color}`}>
                  <span>{currentDomainInfo.icon}</span>
                  <span>Auto-Detected: {currentDomainInfo.label}</span>
                </div>
              )}

              {/* Confidence Meter */}
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                parsed.confidence >= 0.85
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : parsed.confidence >= 0.6
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {Math.round(parsed.confidence * 100)}% Extraction Confidence
              </span>

              {parsed.references_prior_order && (
                <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-semibold flex items-center space-x-1">
                  <span>🔄</span>
                  <span>References Prior Order</span>
                </span>
              )}
            </div>

            {/* Needs Clarification Warning Banner */}
            {parsed.needs_clarification && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
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
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Customer</label>
                <div className="text-sm font-bold text-slate-900 flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 mt-1 shadow-2xs">
                  <span className="text-base">👤</span>
                  <span className={parsed.customer ? 'text-slate-900 font-extrabold' : 'text-slate-400 italic'}>
                    {parsed.customer || 'Walk-in Customer'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Due Date (Asia/Kolkata)</label>
                <div className="text-sm font-bold text-amber-700 flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 mt-1 font-mono shadow-2xs">
                  <span className="text-base">📅</span>
                  <span className={parsed.due_date ? 'text-amber-700 font-bold' : 'text-slate-400 italic font-sans font-normal'}>
                    {parsed.due_date || 'No Date Specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Items & Attributes */}
            <div className="md:col-span-2 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Extracted Items ({parsed.items.length})
                </label>
                <div className="text-xs font-bold text-emerald-700 font-mono">
                  Total Amount: {parsed.amount ? `₹${parsed.amount.toLocaleString('en-IN')}` : 'Amount not stated'}
                </div>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {parsed.items.length === 0 ? (
                  <div className="text-xs text-rose-700 italic bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center space-x-1.5">
                    <span>⚠️</span>
                    <span>No distinct items identified in customer message.</span>
                  </div>
                ) : (
                  parsed.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 p-2.5 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-amber-500 text-white font-black flex items-center justify-center text-[10px]">
                          {item.quantity}
                        </span>
                        <span className="font-bold text-slate-900 capitalize">
                          {item.description}
                        </span>
                      </div>

                      {/* Attribute Pills */}
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(item.attributes || {}).map(([attrK, attrV]) => (
                          <span
                            key={attrK}
                            className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-mono border border-slate-200"
                          >
                            <strong className="text-amber-700">{attrK}:</strong> {String(attrV)}
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
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
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
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 transition cursor-pointer shadow-2xs"
            >
              {isEditing ? 'Cancel Adjustment' : '✏️ Adjust Extracted Values'}
            </button>

            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 flex items-center space-x-2 transition active:scale-95 cursor-pointer"
            >
              <span className="text-sm">💾</span>
              <span>1-Click Save Order to Offline DB</span>
            </button>
          </div>

          {/* Inline Edit Form */}
          {isEditing && editForm && (
            <div className="mt-3 p-3.5 bg-white border border-slate-300 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs shadow-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={editForm.customer}
                  onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="text-slate-600 font-bold block mb-1">Category Domain</label>
                <select
                  value={editForm.domain}
                  onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                >
                  <option value="tailor">🧵 Tailor</option>
                  <option value="tiffin">🍱 Tiffin</option>
                  <option value="electrician">⚡ Electrician</option>
                  <option value="baker">🎂 Baker</option>
                  <option value="custom">📦 Custom / Other</option>
                </select>
              </div>
              <div>
                <label className="text-slate-600 font-bold block mb-1">Due Date</label>
                <input
                  type="date"
                  value={editForm.due_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="text-slate-600 font-bold block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={editForm.amount || ''}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  placeholder="₹"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-bold"
                />
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
