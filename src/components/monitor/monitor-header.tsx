'use client';

import { WifiHigh } from '@phosphor-icons/react';
import { SALAS, SalaId } from '@/lib/salas';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonitorHeaderProps {
  sala: SalaId;
  connected: boolean;
  onSalaChange: (sala: SalaId) => void;
}

export function MonitorHeader({ sala, connected, onSalaChange }: MonitorHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 px-5 border-b bg-background sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <span className="font-semibold text-sm">Monitor EBD</span>
        <WifiHigh
          size={14}
          weight="duotone"
          className={`transition-colors duration-500 ${connected ? 'text-primary' : 'text-muted-foreground/30'}`}
        />
      </div>
      <Select value={sala} onValueChange={(v) => onSalaChange(v as SalaId)}>
        <SelectTrigger className="w-[160px] h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SALAS.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
