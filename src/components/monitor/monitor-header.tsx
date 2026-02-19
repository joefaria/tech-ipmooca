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
    <div className="flex items-center justify-between gap-4 py-4 px-5 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-900">Monitor EBD</span>
        <WifiHigh
          size={16}
          weight="duotone"
          className={connected ? 'text-green-500' : 'text-gray-300'}
        />
      </div>
      <div className="relative">
        <select
          value={sala}
          onChange={(e) => onSalaChange(e.target.value as SalaId)}
          className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200
            bg-white text-sm text-gray-900 outline-none cursor-pointer
            focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          {SALAS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <CaretDown
          size={14}
          weight="duotone"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>
    </div>
  );
}
