'use client';

import { Sun, Moon, WifiHigh, SignOut } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { SALAS, SalaId } from '@/lib/salas';
import { Button } from '@/components/ui/button';
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
  isAdmin: boolean;
  nomeProfessor: string;
  onSalaChange: (sala: SalaId) => void;
  onLogout: () => void;
}

export function MonitorHeader({
  sala,
  connected,
  isAdmin,
  nomeProfessor,
  onSalaChange,
  onLogout,
}: MonitorHeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between gap-4 py-4 px-5 border-b bg-background sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <span className="font-semibold text-sm truncate max-w-[120px]" title={nomeProfessor}>
          {nomeProfessor.split(' ')[0]}
        </span>
        <WifiHigh
          size={14}
          weight="duotone"
          className={`transition-colors duration-500 ${connected ? 'text-primary' : 'text-muted-foreground/30'}`}
        />
      </div>

      <div className="flex items-center gap-2">
        {isAdmin ? (
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
        ) : (
          <span className="text-sm text-muted-foreground">
            {SALAS.find((s) => s.id === sala)?.label}
          </span>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Alternar tema"
        >
          {theme === 'dark' ? (
            <Sun size={15} weight="duotone" />
          ) : (
            <Moon size={15} weight="duotone" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onLogout}
          title="Sair"
        >
          <SignOut size={15} weight="duotone" />
        </Button>
      </div>
    </div>
  );
}
