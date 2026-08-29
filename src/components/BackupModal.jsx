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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              💾
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900">
                1-Click JSON Backup & Cross-Device Sync
              </h3>
              <p className="text-xs text-slate-500">
                IndexedDB Export / Import for Test C Validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <span>📥</span>
            <span>Export & Download Backup</span>
          </button>

          <label className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer text-center">
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
          <label className="text-[11px] font-bold text-slate-600 block mb-1">
            Raw JSON Backup Data:
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste KaamFlow JSON backup here to restore..."
            rows={7}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-[11px] text-slate-800 focus:outline-none focus:border-amber-500 resize-none shadow-inner"
          />
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-2.5 rounded-lg text-xs font-bold ${
            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <button
            onClick={handleImport}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            🔄 Restore to Local Database
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
