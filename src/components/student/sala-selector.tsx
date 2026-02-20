'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SALAS, SalaId } from '@/lib/salas';

interface SalaSelectorProps {
  value: SalaId | '';
  onChange: (sala: SalaId) => void;
}

export function SalaSelector({ value, onChange }: SalaSelectorProps) {
  return (
    <Select value={value || undefined} onValueChange={(v) => onChange(v as SalaId)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione sua sala..." />
      </SelectTrigger>
      <SelectContent>
        {SALAS.map((sala) => (
          <SelectItem key={sala.id} value={sala.id}>
            {sala.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
