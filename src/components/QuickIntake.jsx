import { useState, useEffect } from 'react';
import { parseMessage } from '../parser/core/parser';
import { DEMO_PRESETS } from '../data/presets';

export default function QuickIntake({ onSaveOrder, defaultDomain = 'tailor' }) {
  const [rawText, setRawText] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(defaultDomain || 'tailor');
  const [parsed, setParsed] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Live real-time parsing with small debounce
  useEffect(() => {
    if (!rawText.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      const todayAnchor = new Date().toISOString();
      const result = parseMessage(rawText, 'DEV-A', selectedDomain, todayAnchor);
      setParsed(result);
      setEditForm({
        customer: result.customer || '',
        due_date: result.due_date || '',
        amount: result.amount !== null ? result.amount : '',
        domain: selectedDomain,
        references_prior_order: result.references_prior_order,
        needs_clarification: result.needs_clarification,
        items: result.items || [],
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [rawText, selectedDomain]);

  const handleSelectPreset = (preset) => {
    setSelectedDomain(preset.domain);
    setRawText(preset.message);
  };

  const handleClear = () => {
    setRawText('');
    setParsed(null);
    setEditForm(null);
  };

  const handleSave = () => {
    if (!parsed) return;
    const finalData = isEditing && editForm ? {
      ...parsed,
      ...editForm,
      amount: editForm.amount !== '' ? Number(editForm.amount) : null,
    } : parsed;

    onSaveOrder(finalData, rawText, selectedDomain);
    handleClear();
    setIsEditing(false);
  };

  const toggleVoiceSim = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      // Simulate quick speech-to-text intake
      const randomPreset = DEMO_PRESETS[Math.floor(Math.random() * DEMO_PRESETS.length)];
      setTimeout(() => {
        setSelectedDomain(randomPreset.domain);
        setRawText(randomPreset.message);
        setIsRecording(false);
      }, 700);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl mb-6">
      
      {/* Header & Preset Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
            ✍️
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Quick Order Intake & Live Parser
            </h2>
            <p className="text-xs text-slate-400">
              Paste messy WhatsApp messages or speech transcripts in Hinglish / Devanagari
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Domain Picker */}
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="tailor">🧵 Tailor</option>
            <option value="tiffin">🍱 Tiffin</option>
            <option value="electrician">⚡ Electrician</option>
            <option value="baker">🎂 Baker</option>
          </select>

          {/* Preset Dropdown */}
          <select
            onChange={(e) => {
              const idx = e.target.value;
              if (idx !== '') handleSelectPreset(DEMO_PRESETS[idx]);
            }}
            defaultValue=""
            className="bg-slate-950 border border-slate-700 text-amber-400 font-semibold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 max-w-[200px] cursor-pointer"
          >
            <option value="" disabled>✨ Voice / Preset Demos</option>
            {DEMO_PRESETS.map((p, idx) => (
              <option key={idx} value={idx}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Voice Simulator Button */}
          <button
            onClick={toggleVoiceSim}
            className={`p-2 rounded-xl border text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
              isRecording
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Simulate Voice Note Transcription"
          >
            <span>🎙️</span>
            <span className="hidden md:inline">{isRecording ? 'Listening...' : 'Mic'}</span>
          </button>
        </div>
      </div>

      {/* Input Textarea */}
      <div className="mt-4 relative">
        <textarea
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            if (!e.target.value.trim()) {
              setParsed(null);
              setEditForm(null);
            }
          }}
          placeholder="Paste raw WhatsApp text (e.g. 'Pooja didi bol rahi hu. 2 blouse silwana hai red silk mein. Pichli baar jaise naap 34 chest. Kal tak ₹1200 mein')..."
          rows={3}
          className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition resize-none font-sans"
        />

        {rawText && (
          <button
            onClick={handleClear}
            className="absolute top-2.5 right-2.5 text-xs text-slate-500 hover:text-slate-300 bg-slate-800 px-2 py-1 rounded-md cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Live Parsed Preview Output */}
      {parsed && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 transition-all">
          
          {/* Header Row: Confidence & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-300">Live Extracted Entities:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                parsed.confidence >= 0.85
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : parsed.confidence >= 0.6
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {Math.round(parsed.confidence * 100)}% Confidence
              </span>

              {parsed.references_prior_order && (
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-semibold">
                  🔄 References Prior Order
                </span>
              )}
            </div>

            {/* Needs Clarification Alert */}
            {parsed.needs_clarification && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse">
                <span>⚠️</span>
                <span>Needs Clarification (Normative Rule Triggered)</span>
              </div>
            )}
          </div>

          {/* Form / Entity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            
            {/* Customer & Due Date */}
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Customer</label>
                <div className="text-sm font-bold text-slate-100 flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 mt-1">
                  <span>👤</span>
                  <span>{parsed.customer || '<Not specified / Walk-in>'}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Due Date (Asia/Kolkata)</label>
                <div className="text-sm font-bold text-amber-400 flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 mt-1">
                  <span>📅</span>
                  <span>{parsed.due_date || 'Unspecified / Urgent'}</span>
                </div>
              </div>
            </div>

            {/* Items & Attributes */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Extracted Items ({parsed.items.length})
                </label>
                <div className="text-xs font-bold text-emerald-400">
                  Total: {parsed.amount ? `₹${parsed.amount}` : 'Amount not stated'}
                </div>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {parsed.items.length === 0 ? (
                  <div className="text-xs text-rose-400 italic bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                    No distinct item identified in message.
                  </div>
                ) : (
                  parsed.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-xs flex flex-wrap items-center justify-between gap-1.5"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[10px]">
                          {item.quantity}
                        </span>
                        <span className="font-bold text-slate-200 capitalize">
                          {item.description}
                        </span>
                      </div>

                      {/* Attribute Pills */}
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(item.attributes || {}).map(([attrK, attrV]) => (
                          <span
                            key={attrK}
                            className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700"
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
          <div className="flex items-center justify-end space-x-2.5 mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              {isEditing ? 'Cancel Edit' : '✏️ Adjust Details'}
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
            >
              <span>💾</span>
              <span>Save Order to Offline DB</span>
            </button>
          </div>

          {/* Inline Edit Form */}
          {isEditing && editForm && (
            <div className="mt-3 p-3 bg-slate-900 border border-slate-700 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={editForm.customer}
                  onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={editForm.due_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={editForm.amount || ''}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  placeholder="₹"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200"
                />
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
