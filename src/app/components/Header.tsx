'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastCheck, setLastCheck] = useState<string>('');

  useEffect(() => {
    let active = true;

    async function checkConnection() {
      try {
        const start = Date.now();
        const res = await fetch('/api/health', { cache: 'no-store' });
        if (res.ok && active) {
          setIsConnected(true);
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastCheck(time);
        } else if (active) {
          setIsConnected(false);
        }
      } catch (err) {
        if (active) {
          setIsConnected(false);
        }
      }
    }

    // Initial check
    checkConnection();

    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="w-full border-b border-[#232a35] bg-[#0c0f13] px-6 py-4 flex flex-row items-center justify-between z-10">
      {/* Brand Logo and Eyebrow */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-wider text-white font-display select-none">
            DECK
          </span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#3d8bff] bg-[#3d8bff]/10 px-1.5 py-0.5 border border-[#3d8bff]/20 rounded">
            v1.0.0
          </span>
        </div>
        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">
          Mac Tablet Remote
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-4">
        <Link
          href="/"
          className={`px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase keycap-button ${
            pathname === '/'
              ? 'bg-[#18202d] border-[#3d8bff] text-white border-bottom-[1px] translate-y-[3px]'
              : 'text-slate-400 border-[#2d3748] hover:border-slate-400 hover:text-white'
          }`}
        >
          [ Grid ]
        </Link>
        <Link
          href="/settings"
          className={`px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase keycap-button ${
            pathname === '/settings'
              ? 'bg-[#18202d] border-[#3d8bff] text-white border-bottom-[1px] translate-y-[3px]'
              : 'text-slate-400 border-[#2d3748] hover:border-slate-400 hover:text-white'
          }`}
        >
          [ Settings ]
        </Link>
      </nav>

      {/* Connection Indicator */}
      <div className="flex items-center gap-3 bg-[#11151c] border border-[#232a35] px-3 py-1.5 rounded-md">
        <div className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isConnected ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isConnected ? 'bg-emerald-500 led-pulse-green' : 'bg-rose-500 led-pulse-red'
            }`}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
            {isConnected ? 'Link: OK' : 'Link: ERR'}
          </span>
          {isConnected && lastCheck && (
            <span className="text-[8px] font-mono text-slate-500">
              {lastCheck}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
