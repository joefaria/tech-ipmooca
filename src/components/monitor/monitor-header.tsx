'use client';

import { CaretDown, WifiHigh } from '@phosphor-icons/react';
import { SALAS, SalaId } from '@/lib/salas';

interface MonitorHeaderProps {
  sala: SalaId;
  connected: boolean;
  onSalaChange: (sala: SalaId) => void;
}

export function MonitorHeader({ sala, connected, onSalaChange }: MonitorHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 px-5 border-b border-[#1e1e1e] bg-[#0a0a0a] sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <span className="font-semibold text-[#e8e8e8]">Monitor EBD</span>
        <WifiHigh
          size={15}
          weight="duotone"
          className={`transition-colors duration-500 ${connected ? 'text-[#6abf4a]' : 'text-[#333]'}`}
        />
      </div>
      <div className="relative">
        <select
          value={sala}
          onChange={(e) => onSalaChange(e.target.value as SalaId)}
          className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#2a2a2a]
            bg-[#141414] text-sm text-[#ccc] outline-none cursor-pointer
            focus:border-[#6abf4a44] transition-colors duration-150"
        >
          {SALAS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <CaretDown
          size={13}
          weight="duotone"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none"
        />
      </div>
    </div>
  );
}
