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
        className="w-full appearance-none px-4 py-3 pr-10 rounded-2xl border border-gray-200
          bg-white text-gray-900 text-base outline-none cursor-pointer
          focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
          transition-all duration-150"
      >
        <option value="" disabled>Selecione sua sala...</option>
        {SALAS.map((sala) => (
          <option key={sala.id} value={sala.id}>{sala.label}</option>
        ))}
      </select>
      <CaretDown
        size={18}
        weight="duotone"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  );
}
