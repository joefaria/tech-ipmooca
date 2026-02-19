'use client';

import { useState } from 'react';
import { PaperPlaneTilt } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { SalaId } from '@/lib/salas';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Toast } from '@/components/ui/toast';

interface QuestionFormProps {
  sala: SalaId | '';
}

export function QuestionForm({ sala }: QuestionFormProps) {
  const [texto, setTexto] = useState('');
  const [sending, setSending] = useState(false);
  const [showToast, setShowToast] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sala || !texto.trim() || sending) return;

    setSending(true);
    const { error } = await supabase
      .from('perguntas')
      .insert({ sala, texto: texto.trim() });

    setSending(false);
    if (!error) {
      setTexto('');
      setShowToast(true);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Textarea
          placeholder="Escreva sua pergunta..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          charCount={texto.length}
          maxChars={500}
          disabled={!sala}
        />
        <Button
          type="submit"
          disabled={!sala || !texto.trim() || sending}
          className="w-full"
        >
          <PaperPlaneTilt size={18} weight="duotone" />
          {sending ? 'Enviando...' : 'Enviar'}
        </Button>
      </form>
      {showToast && (
        <Toast
          message="Pergunta enviada!"
          onDone={() => setShowToast(false)}
        />
      )}
    </>
  );
}
