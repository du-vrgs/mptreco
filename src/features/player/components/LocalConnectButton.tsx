'use client';

import React, { useState, useEffect } from 'react';
import { Laptop, QrCode, Check, Copy } from 'lucide-react';

export const LocalConnectButton: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const localIp = '192.168.1.27';
  const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'a8ead6af9a2e9d762a087839b245b246ef2da951889a9912';
  const localUrl = `http://${localIp}:3000/?token=${adminToken}`;

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
    }
  }, [adminToken]);

  const handleCopy = () => {
    navigator.clipboard.writeText(localUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-semibold shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all animate-pulse"
        title="Abrir no Celular via Rede Local"
      >
        <Laptop className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Rodar no Celular</span>
        <span className="sm:hidden">Local</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-emerald-500/50 rounded-2xl p-6 shadow-2xl relative flex flex-col gap-4 text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-emerald-400">
                <Laptop className="w-5 h-5" />
                Acesso Local para Celular
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Conecte seu celular no <strong>mesmo Wi-Fi</strong> deste computador. Abra o link abaixo no navegador do celular (Chrome/Safari) para baixar músicas e ouvir com a tela desligada:
            </p>

            <div className="flex items-center gap-2 p-3 bg-black/70 rounded-xl border border-zinc-700 font-mono text-xs break-all text-emerald-300">
              <span className="flex-1">{localUrl}</span>
              <button
                onClick={handleCopy}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                title="Copiar Link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-zinc-400">
              💡 <strong>Dica Offline:</strong> Uma vez que você baixar ou ouvir a música no celular pela primeira vez, ela fica salva no IndexedDB do aparelho. Depois você pode sair de casa e ouvir no modo avião sem precisar do PC!
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
