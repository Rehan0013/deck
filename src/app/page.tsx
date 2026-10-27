'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { executeShortcut } from '@/app/actions';
import { getLocalShortcuts, Shortcut } from '@/lib/storage';

export default function Home() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [executingId, setExecutingId] = useState<string | null>(null);
  
  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch shortcuts from localStorage
  const fetchShortcuts = useCallback(() => {
    try {
      const data = getLocalShortcuts();
      setShortcuts(data);
    } catch (err) {
      console.error('Error reading shortcuts from localStorage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync with localStorage changes across tabs and within the app
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

  // Handle Toast timeout
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Trigger command on host Mac
  const handleLaunch = async (shortcut: Shortcut) => {
    if (executingId) return; // Prevent double taps
    
    setExecutingId(shortcut.id);
    
    try {
      const result = await executeShortcut({
        type: shortcut.type,
        target: shortcut.target,
        name: shortcut.name,
      });
      if (result.success) {
        setToast({
          message: `Launched: ${shortcut.name}`,
          type: 'success',
        });
      } else {
        setToast({
          message: `Failed: ${result.message}`,
          type: 'error',
        });
      }
    } catch (err: any) {
      setToast({
        message: `Error: ${err.message || 'Unknown execution error'}`,
        type: 'error',
      });
    } finally {
      setExecutingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#3d8bff] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="font-mono text-sm tracking-wider text-slate-500 uppercase">
            Reading Local Deck...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 select-none relative">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 border px-4 py-3 rounded-md shadow-2xl font-mono text-xs uppercase tracking-wider ${
              toast.type === 'success'
                ? 'bg-[#10b981]/15 border-[#10b981] text-emerald-400'
                : 'bg-[#ef4444]/15 border-[#ef4444] text-rose-400'
            }`}
          >
            <span className="text-sm">{toast.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Headline & Overview */}
      <div className="flex flex-row items-center justify-between border-b border-[#232a35]/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display uppercase">
            Shortcut Dashboard
          </h1>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mt-1">
            Tap any tile to trigger execution on Host Mac
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block">
            Storage: LocalStorage
          </span>
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block">
            Sync: Realtime
          </span>
        </div>
      </div>

      {shortcuts.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#232a35] rounded-xl p-12 text-center max-w-lg mx-auto mt-12 bg-[#0c0f13]/40">
          <span className="text-5xl mb-4">⌨️</span>
          <h3 className="text-lg font-bold text-white font-display uppercase tracking-wide">
            No Shortcuts Found in Browser
          </h3>
          <p className="text-sm text-slate-500 font-mono mt-2 mb-6 uppercase tracking-wider">
            Create or import shortcuts into your browser storage to populate the deck.
          </p>
          <Link
            href="/settings"
            className="px-6 py-3 text-xs font-mono font-bold tracking-wider uppercase keycap-button border-[#3d8bff] bg-[#3d8bff]/10 text-white hover:bg-[#3d8bff]/20 active:translate-y-[4px] active:border-bottom-width-[2px]"
          >
            Manage Deck Settings
          </Link>
        </div>
      ) : (
        /* Shortcuts Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 py-4">
          {shortcuts.map((shortcut) => {
            const isApp = shortcut.type === 'app';
            
            return (
              <button
                key={shortcut.id}
                onClick={() => handleLaunch(shortcut)}
                disabled={executingId !== null}
                className={`keycap-tile ${
                  isApp ? 'keycap-tile-app' : 'keycap-tile-url'
                } flex flex-col items-center justify-between text-center p-5 aspect-square min-h-[140px] cursor-pointer group`}
              >
                {/* Type Icon Indicator top-right */}
                <div className="w-full flex justify-end">
                  <span
                    className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                      isApp
                        ? 'bg-[#3d8bff]/10 border-[#3d8bff]/30 text-[#3d8bff]'
                        : 'bg-[#ffb347]/10 border-[#ffb347]/30 text-[#ffb347]'
                    }`}
                  >
                    {shortcut.type}
                  </span>
                </div>

                {/* Main Emoji/Icon */}
                <div className="text-4xl my-2 transform group-hover:scale-110 transition-transform duration-150 select-none">
                  {shortcut.icon}
                </div>

                {/* Name Label */}
                <div className="w-full">
                  <p className="font-display font-bold text-xs uppercase text-slate-200 tracking-wider truncate px-1">
                    {shortcut.name}
                  </p>
                  <p className="font-mono text-[9px] text-slate-500 truncate px-1 mt-0.5 group-hover:text-slate-400">
                    {shortcut.target}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
