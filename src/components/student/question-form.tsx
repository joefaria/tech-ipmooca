'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PaperPlaneTilt } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { SalaId } from '@/lib/salas';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface QuestionFormProps {
  sala: SalaId | '';
}

export function QuestionForm({ sala }: QuestionFormProps) {
  const [texto, setTexto] = useState('');
  const [sending, setSending] = useState(false);

  const MAX = 500;
  const nearLimit = texto.length > MAX * 0.8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sala || !texto.trim() || sending) return;

    setSending(true);
    const { error } = await supabase
      .from('perguntas')
      .insert({ sala, texto: texto.trim() });

    setSending(false);
    if (error) {
      toast.error('Erro ao enviar pergunta. Tente novamente.');
    } else {
      setTexto('');
      toast.success('Pergunta enviada!');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="relative">
        <Textarea
          placeholder="Escreva sua pergunta..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={MAX}
          disabled={!sala}
          className="min-h-[120px] resize-none pb-8"
        />
        <span className={`absolute bottom-3 right-4 text-xs tabular-nums transition-colors
          ${nearLimit ? 'text-amber-400' : 'text-muted-foreground'}`}>
          {MAX - texto.length}
        </span>
      </div>

      <Button
        type="submit"
        disabled={!sala || !texto.trim() || sending}
        className="w-full gap-2"
      >
        <PaperPlaneTilt size={16} weight="duotone" />
        {sending ? 'Enviando...' : 'Enviar'}
      </Button>

      <Link
        href="/professor"
        className="block text-center text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1"
      >
        Acesso do Professor
      </Link>
    </form>
  );
}
