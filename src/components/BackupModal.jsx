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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-white/[0.08] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-sm">
              💾
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white">
                JSON Backup & Cross-Device Sync
              </h3>
              <p className="text-xs text-white/40">
                IndexedDB Export / Import for Test C Validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <span>📥</span>
            <span>Export Backup</span>
          </button>

          <label className="py-2.5 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 font-medium text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer text-center">
            <span>📂</span>
            <span>Upload JSON</span>
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
          <label className="text-[11px] font-medium text-white/40 block mb-1">
            Raw JSON Backup Data:
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste KaamFlow JSON backup here to restore..."
            rows={6}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 font-mono text-[11px] text-white/80 focus:outline-none focus:border-white/20 resize-none"
          />
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-2.5 rounded-lg text-xs font-medium ${
            statusMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <button
            onClick={handleImport}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-xs transition cursor-pointer"
          >
            🔄 Restore to Local Database
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/10 text-white/70 font-medium text-xs cursor-pointer transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
