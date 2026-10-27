'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getLocalShortcuts,
  addLocalShortcut,
  updateLocalShortcut,
  deleteLocalShortcut,
  resetLocalShortcuts,
  exportShortcutsJson,
  importShortcutsJson,
  Shortcut,
} from '@/lib/storage';

export default function Settings() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Add Form State
  const [name, setName] = useState<string>('');
  const [icon, setIcon] = useState<string>('🚀');
  const [type, setType] = useState<'app' | 'url'>('app');
  const [target, setTarget] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editIcon, setEditIcon] = useState<string>('');
  const [editType, setEditType] = useState<'app' | 'url'>('app');
  const [editTarget, setEditTarget] = useState<string>('');

  // Backup / Sync State
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const fetchShortcuts = useCallback(() => {
    try {
      const data = getLocalShortcuts();
      setShortcuts(data);
    } catch (err) {
      console.error('Error fetching shortcuts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShortcuts();

    const handleSync = () => fetchShortcuts();
    window.addEventListener('storage', handleSync);
    window.addEventListener('deck-shortcuts-changed', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('deck-shortcuts-changed', handleSync);
    };
  }, [fetchShortcuts]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // URL Validation Helper
  const isValidUrl = (str: string): boolean => {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain
      'localhost|' + // localhost
      '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})' + // IP
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port/path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query
      '(\\#[-a-z\\d_]*)?$', // fragment
      'i'
    );
    return pattern.test(str);
  };

  const handleAddShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validation
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!target.trim()) {
      setFormError('Target is required');
      return;
    }

    if (type === 'url') {
      if (!isValidUrl(target.trim())) {
        setFormError('Please enter a valid URL (e.g. google.com or https://google.com)');
        return;
      }
    }

    setSubmitting(true);
    try {
      addLocalShortcut({
        name: name.trim(),
        icon: icon.trim() || '🚀',
        type,
        target: target.trim(),
      });

      setToast({ message: 'Shortcut saved to localStorage', type: 'success' });
      // Reset form
      setName('');
      setIcon('🚀');
      setType('app');
      setTarget('');
      fetchShortcuts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add shortcut');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (shortcut: Shortcut) => {
    setEditingId(shortcut.id);
    setEditName(shortcut.name);
    setEditIcon(shortcut.icon);
    setEditType(shortcut.type);
    setEditTarget(shortcut.target);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      setToast({ message: 'Name cannot be empty', type: 'error' });
      return;
    }
    if (!editTarget.trim()) {
      setToast({ message: 'Target cannot be empty', type: 'error' });
      return;
    }
    if (editType === 'url' && !isValidUrl(editTarget.trim())) {
      setToast({ message: 'Invalid URL format', type: 'error' });
      return;
    }

    try {
      updateLocalShortcut(id, {
        name: editName.trim(),
        icon: editIcon.trim(),
        type: editType,
        target: editTarget.trim(),
      });

      setToast({ message: 'Shortcut updated in localStorage', type: 'success' });
      setEditingId(null);
      fetchShortcuts();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update shortcut', type: 'error' });
    }
  };

  const handleDeleteShortcut = (id: string, shortcutName: string) => {
    if (!confirm(`Are you sure you want to delete "${shortcutName}" from this device?`)) return;

    try {
      deleteLocalShortcut(id);
      setToast({ message: 'Shortcut deleted', type: 'success' });
      fetchShortcuts();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete shortcut', type: 'error' });
    }
  };

  const handleResetDefaults = () => {
    if (!confirm('Reset all shortcuts to default configuration? Any custom shortcuts on this device will be replaced.')) {
      return;
    }
    resetLocalShortcuts();
    setToast({ message: 'Deck reset to default shortcuts', type: 'success' });
    fetchShortcuts();
  };

  const handleCopyExport = async () => {
    try {
      const json = exportShortcutsJson();
      await navigator.clipboard.writeText(json);
      setSyncStatus('Copied shortcuts JSON to clipboard!');
      setToast({ message: 'Export JSON copied to clipboard', type: 'success' });
    } catch (err) {
      setSyncStatus('Failed to copy to clipboard automatically. You can copy the text below manually.');
    }
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) {
      setSyncStatus('Error: Please paste a valid JSON array into the box.');
      return;
    }

    const result = importShortcutsJson(importText.trim());
    if (result.success) {
      setToast({ message: `Successfully imported ${result.count} shortcuts!`, type: 'success' });
      setImportText('');
      setShowSyncModal(false);
      fetchShortcuts();
    } else {
      setSyncStatus(`Import error: ${result.error}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 relative select-none">
      {/* Toast Notifications */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div
            className={`flex items-center gap-3 border px-4 py-3 rounded-md shadow-2xl font-mono text-xs uppercase tracking-wider ${
              toast.type === 'success'
                ? 'bg-[#10b981]/15 border-[#10b981] text-emerald-400'
                : 'bg-[#ef4444]/15 border-[#ef4444] text-rose-400'
            }`}
          >
            <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Sync / Export Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0f13] border border-[#232a35] rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232a35] pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                  [⇄] Sync & Backup (LocalStorage)
                </h3>
                <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
                  Transfer your shortcuts between your Mac and Tablet
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setSyncStatus(null);
                }}
                className="text-slate-500 hover:text-white font-mono text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {syncStatus && (
              <div className="text-xs font-mono p-2.5 rounded border border-[#3d8bff]/30 bg-[#3d8bff]/10 text-slate-300">
                {syncStatus}
              </div>
            )}

            {/* Export Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-300">
                  Step 1: Export from this device
                </span>
                <button
                  type="button"
                  onClick={handleCopyExport}
                  className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border border-[#3d8bff] bg-[#3d8bff]/10 text-[#3d8bff] hover:bg-[#3d8bff]/20 rounded keycap-button"
                >
                  Copy JSON to Clipboard
                </button>
              </div>
              <p className="text-[9px] font-mono text-slate-500 leading-relaxed">
                Click above on your Mac to copy all configured shortcuts, then paste them on your tablet below.
              </p>
            </div>

            {/* Import Section */}
            <div className="space-y-2 border-t border-[#232a35]/70 pt-4">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-300 block">
                Step 2: Import on target device
              </span>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='Paste shortcuts JSON here (e.g. [{"name":"Chrome", ...}])'
                rows={5}
                className="w-full bg-[#13171c] border border-[#232a35] rounded p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#3d8bff] resize-none"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSyncModal(false);
                    setSyncStatus(null);
                  }}
                  className="px-3 py-1.5 text-xs font-mono uppercase text-slate-400 border border-[#232a35] hover:text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  className="px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border border-[#10b981] bg-[#10b981]/20 text-emerald-400 hover:bg-[#10b981]/30 rounded keycap-button"
                >
                  Apply & Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#232a35]/60 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display uppercase">
            Deck Configuration
          </h1>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mt-1">
            Shortcuts are stored directly in your browser&apos;s localStorage
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowSyncModal(true)}
            className="px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border border-[#3d8bff] bg-[#3d8bff]/10 text-[#3d8bff] hover:bg-[#3d8bff]/20 rounded keycap-button"
          >
            ⇄ Sync / Export
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border border-[#2d3748] text-slate-400 hover:text-white hover:border-slate-500 rounded keycap-button"
          >
            ↺ Defaults
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Add Shortcut Form (5 columns) */}
        <div className="lg:col-span-5 bg-[#0c0f13] border border-[#232a35] rounded-lg p-6 space-y-6">
          <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase font-mono border-b border-[#232a35]/50 pb-2">
            [+] Create Shortcut
          </h2>

          <form onSubmit={handleAddShortcut} className="space-y-4">
            {formError && (
              <div className="border border-rose-500/50 bg-rose-500/10 text-rose-400 text-xs font-mono p-3 rounded uppercase tracking-wider">
                ⚠️ {formError}
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
                Shortcut Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Google Chrome, VS Code"
                className="w-full bg-[#13171c] border border-[#232a35] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#3d8bff] font-mono"
              />
            </div>

            {/* Icon & Type segment row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Icon Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
                  Icon (Emoji / Text)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="e.g. 🌐"
                  className="w-full bg-[#13171c] border border-[#232a35] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#3d8bff] font-mono text-center"
                />
              </div>

              {/* Type Switcher */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
                  Trigger Type
                </label>
                <div className="grid grid-cols-2 bg-[#13171c] border border-[#232a35] p-1 rounded">
                  <button
                    type="button"
                    onClick={() => setType('app')}
                    className={`py-1 text-xs font-mono uppercase rounded transition-colors ${
                      type === 'app'
                        ? 'bg-[#3d8bff] text-white font-bold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    App
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('url')}
                    className={`py-1 text-xs font-mono uppercase rounded transition-colors ${
                      type === 'url'
                        ? 'bg-[#ffb347] text-[#0b0d10] font-bold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    URL
                  </button>
                </div>
              </div>
            </div>

            {/* Target Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
                  Execution Target
                </label>
                <span className="text-[9px] font-mono text-slate-500">
                  {type === 'app' ? 'macOS App Path/Name' : 'Destination URL'}
                </span>
              </div>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={
                  type === 'app'
                    ? 'e.g. Google Chrome, Terminal, Slack'
                    : 'e.g. google.com, youtube.com'
                }
                className="w-full bg-[#13171c] border border-[#232a35] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#3d8bff] font-mono"
              />
              <p className="text-[9px] font-mono text-slate-500 leading-normal">
                {type === 'app'
                  ? 'Must match the application name in /Applications on host Mac'
                  : 'Automatically prepended with https:// if protocol is omitted'}
              </p>
            </div>

            {/* Add Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2.5 mt-2 text-xs font-mono font-bold tracking-wider uppercase keycap-button ${
                type === 'app'
                  ? 'border-[#3d8bff] text-[#3d8bff] hover:bg-[#3d8bff]/10'
                  : 'border-[#ffb347] text-[#ffb347] hover:bg-[#ffb347]/10'
              }`}
            >
              {submitting ? 'Adding...' : '[ Save Shortcut to LocalStorage ]'}
            </button>
          </form>
        </div>

        {/* Right Column: Existing Shortcuts List (7 columns) */}
        <div className="lg:col-span-7 bg-[#0c0f13] border border-[#232a35] rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#232a35]/50 pb-2">
            <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase font-mono">
              [=] Browser Inventory ({shortcuts.length})
            </h2>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Saved in localStorage
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">
                Reading localStorage...
              </p>
            </div>
          ) : shortcuts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#232a35] rounded-md space-y-3">
              <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">
                No active shortcuts in browser
              </p>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-1 text-[10px] font-mono uppercase text-[#3d8bff] hover:underline"
              >
                Load default shortcuts
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {shortcuts.map((shortcut) => {
                const isEditing = editingId === shortcut.id;

                if (isEditing) {
                  return (
                    <div
                      key={shortcut.id}
                      className="border border-[#3d8bff] bg-[#3d8bff]/5 p-4 rounded-md space-y-3"
                    >
                      <div className="grid grid-cols-12 gap-3">
                        {/* Edit Icon */}
                        <div className="col-span-3">
                          <label className="text-[8px] font-mono text-slate-400 block uppercase">Icon</label>
                          <input
                            type="text"
                            value={editIcon}
                            onChange={(e) => setEditIcon(e.target.value)}
                            className="w-full bg-[#13171c] border border-[#232a35] rounded px-2 py-1 text-xs text-slate-200 font-mono text-center"
                          />
                        </div>

                        {/* Edit Name */}
                        <div className="col-span-9">
                          <label className="text-[8px] font-mono text-slate-400 block uppercase">Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-[#13171c] border border-[#232a35] rounded px-2 py-1 text-xs text-slate-200 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-3">
                        {/* Edit Type */}
                        <div className="col-span-4">
                          <label className="text-[8px] font-mono text-slate-400 block uppercase">Type</label>
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as 'app' | 'url')}
                            className="w-full bg-[#13171c] border border-[#232a35] rounded px-2 py-1 text-xs text-slate-200 font-mono"
                          >
                            <option value="app">App</option>
                            <option value="url">URL</option>
                          </select>
                        </div>

                        {/* Edit Target */}
                        <div className="col-span-8">
                          <label className="text-[8px] font-mono text-slate-400 block uppercase">Target</label>
                          <input
                            type="text"
                            value={editTarget}
                            onChange={(e) => setEditTarget(e.target.value)}
                            className="w-full bg-[#13171c] border border-[#232a35] rounded px-2 py-1 text-xs text-slate-200 font-mono"
                          />
                        </div>
                      </div>

                      {/* Edit Actions */}
                      <div className="flex justify-end gap-2 pt-1.5 border-t border-[#232a35]/50">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 border border-[#232a35] hover:text-slate-300 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(shortcut.id)}
                          className="px-3 py-1.5 text-[10px] font-mono uppercase bg-[#3d8bff]/20 text-[#3d8bff] border border-[#3d8bff]/50 hover:bg-[#3d8bff]/30 rounded font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between p-3 bg-[#13171c] border border-[#232a35] rounded-md hover:border-slate-700 transition-colors"
                  >
                    {/* Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl select-none">{shortcut.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-display uppercase tracking-wider text-slate-200">
                            {shortcut.name}
                          </span>
                          <span
                            className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded border uppercase tracking-wider ${
                              shortcut.type === 'app'
                                ? 'bg-[#3d8bff]/10 border-[#3d8bff]/20 text-[#3d8bff]'
                                : 'bg-[#ffb347]/10 border-[#ffb347]/20 text-[#ffb347]'
                            }`}
                          >
                            {shortcut.type}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 truncate block mt-0.5 max-w-[280px]">
                          {shortcut.target}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleStartEdit(shortcut)}
                        className="px-2.5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-[#232a35]/40 border border-[#2d3748] text-slate-400 hover:text-white hover:border-slate-500 rounded keycap-button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteShortcut(shortcut.id, shortcut.name)}
                        className="px-2.5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-rose-950/15 border border-rose-900/40 text-rose-400 hover:text-rose-300 hover:border-rose-700 rounded keycap-button"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
