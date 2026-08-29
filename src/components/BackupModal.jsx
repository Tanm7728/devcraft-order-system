import { useState } from 'react';
import { exportDatabaseToJson, importDatabaseFromJson } from '../db/ordersDb';

export default function BackupModal({ isOpen, onClose, onRefreshData }) {
  const [jsonText, setJsonText] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    const backup = await exportDatabaseToJson();
    setJsonText(backup);
    
    // Trigger browser file download
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaamflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setStatusMessage({ type: 'success', text: 'Database exported and downloaded as JSON!' });
  };

  const handleImport = async () => {
    if (!jsonText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please paste JSON backup data to import.' });
      return;
    }

    const res = await importDatabaseFromJson(jsonText);
    if (res.success) {
      setStatusMessage({ type: 'success', text: `Successfully restored ${res.count} records into IndexedDB!` });
      onRefreshData();
    } else {
      setStatusMessage({ type: 'error', text: `Import failed: ${res.error}` });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              💾
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                1-Click JSON Backup & Cross-Device Sync
              </h3>
              <p className="text-xs text-slate-400">
                IndexedDB Export / Import for Test C Validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5 transition"
          >
            <span>📥</span>
            <span>Export & Download Backup</span>
          </button>

          <label className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer text-center">
            <span>📂</span>
            <span>Upload JSON File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Textarea */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">
            Raw JSON Backup Data:
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste KaamFlow JSON backup here to restore..."
            rows={7}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-amber-500 resize-none"
          />
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-2.5 rounded-lg text-xs font-semibold ${
            statusMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handleImport}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
          >
            🔄 Restore to Local Database
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
