'use client';

import { CaretDown } from '@phosphor-icons/react';
import { SALAS, SalaId } from '@/lib/salas';

interface SalaSelectorProps {
  value: SalaId | '';
  onChange: (sala: SalaId) => void;
}

export function SalaSelector({ value, onChange }: SalaSelectorProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SalaId)}
        className="w-full appearance-none px-4 py-3 pr-10 rounded-2xl border border-[#2a2a2a]
          bg-[#141414] text-[#e8e8e8] text-base outline-none cursor-pointer
          focus:border-[#6abf4a44] transition-colors duration-150"
      >
        <option value="" disabled>Selecione sua sala...</option>
        {SALAS.map((sala) => (
          <option key={sala.id} value={sala.id}>{sala.label}</option>
        ))}
      </select>
      <CaretDown
        size={18}
        weight="duotone"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none"
      />
    </div>
  );
}
