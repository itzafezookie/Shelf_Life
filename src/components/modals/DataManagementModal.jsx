import React, { useState } from 'react';
import { X, Download, Upload, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { exportImportService } from '../../services/exportImportService';

export function DataManagementModal({ onDataReload, palette, isDark }) {
  const { isDataManagementOpen, setDataManagementOpen } = useUIStore();
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const primaryColor = palette?.primary || '#0284c7';
  const textOnPrimary = palette?.textOnPrimary || '#ffffff';

  if (!isDataManagementOpen) return null;

  const handleExport = async () => {
    try {
      await exportImportService.exportData();
      setStatusMessage('Library backup exported to your downloads folder!');
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage('Failed to export data: ' + err.message);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await exportImportService.importData(file);
      setStatusMessage(`Restored ${result.booksCount} books and ${result.sessionsCount} sessions!`);
      setErrorMessage(null);
      if (onDataReload) onDataReload();
    } catch (err) {
      setErrorMessage('Import failed: ' + err.message);
      setStatusMessage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-colors duration-300 ${
          isDark
            ? 'bg-[#15141b] border-white/10 text-[#f5f5f4]'
            : 'bg-white border-[#eae3d8] text-[#292524]'
        }`}
      >
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-white/10 bg-[#1c1a24]' : 'border-[#eae3d8] bg-[#fbf9f6]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" style={{ color: primaryColor }} />
            <h3 className="text-base font-bold font-editorial">Library Archive & Backup</h3>
          </div>
          <button
            onClick={() => setDataManagementOpen(false)}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-stone-400 hover:text-white hover:bg-white/10'
                : 'text-stone-400 hover:text-stone-700 hover:bg-[#ede7dd]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            All your books, reading progress, and sessions are safely stored locally on your device in Dexie IndexedDB. You can export a JSON archive anytime to transfer to another device.
          </p>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                isDark
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                isDark
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3 pt-1">
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                isDark ? 'bg-[#1c1a24] border-white/10' : 'bg-[#fbf9f6] border-[#ede7dd]'
              }`}
            >
              <div>
                <h4 className="text-xs font-bold font-editorial">Export Library Archive</h4>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Download a .json backup file
                </p>
              </div>
              <button
                onClick={handleExport}
                className="py-1.5 px-3 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: primaryColor,
                  color: textOnPrimary,
                  boxShadow: isDark ? `0 2px 10px ${primaryColor}40` : undefined
                }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>

            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                isDark ? 'bg-[#1c1a24] border-white/10' : 'bg-[#fbf9f6] border-[#ede7dd]'
              }`}
            >
              <div>
                <h4 className="text-xs font-bold font-editorial">Restore Library Archive</h4>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Import previously saved .json archive
                </p>
              </div>
              <label
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-all ${
                  isDark
                    ? 'bg-[#22202c] text-stone-200 hover:bg-[#2c2938] border border-white/10'
                    : 'btn-cozy btn-cozy-secondary'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setDataManagementOpen(false)}
              className={`w-full py-2 text-xs rounded-xl font-semibold transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#22202c] text-stone-300 hover:bg-[#2c2938] border border-white/10'
                  : 'btn-cozy btn-cozy-secondary'
              }`}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
