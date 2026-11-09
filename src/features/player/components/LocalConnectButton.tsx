'use client';

import React, { useState, useEffect } from 'react';
import { Power, Check, Radio } from 'lucide-react';

export const LocalConnectButton: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTunnelOnline, setIsTunnelOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'a8ead6af9a2e9d762a087839b245b246ef2da951889a9912';

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const res = await fetch(`https://gist.githubusercontent.com/du-vrgs/32466da6692cf6e85f1ae35fc410189d/raw/current_tunnel_url.txt?t=${Date.now()}`);
      if (res.ok) {
        const url = (await res.text()).trim();
        setIsTunnelOnline(url.startsWith('https://'));
      } else {
        setIsTunnelOnline(false);
      }
    } catch {
      setIsTunnelOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const storedToken = localStorage.getItem('mptreco_admin_token');

    if (token === adminToken || storedToken === adminToken) {
      setIsAdmin(true);
      if (token) {
        localStorage.setItem('mptreco_admin_token', token);
      }
      checkStatus();
    }
  }, [adminToken]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs shadow-md">
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isTunnelOnline
              ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
              : 'bg-amber-400'
          }`}
        />
        <span className="font-semibold text-zinc-200 hidden sm:inline">
          {isTunnelOnline ? 'Túnel Conectado' : 'Túnel Offline'}
        </span>
      </div>

      <button
        onClick={checkStatus}
        disabled={isChecking}
        title="Verificar status do túnel"
        className="ml-1 p-1 hover:text-white text-zinc-400 transition-colors"
      >
        <Radio className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-sky-400' : ''}`} />
      </button>
    </div>
  );
};
