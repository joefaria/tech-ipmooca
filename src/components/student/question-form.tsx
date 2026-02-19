'use client';

import { useState } from 'react';
import { PaperPlaneTilt } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { SalaId } from '@/lib/salas';
import { Toast } from '@/components/ui/toast';

interface QuestionFormProps {
  sala: SalaId | '';
}

export function QuestionForm({ sala }: QuestionFormProps) {
  const [texto, setTexto] = useState('');
  const [sending, setSending] = useState(false);
  const [showToast, setShowToast] = useState(false);

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
    if (!error) {
      setTexto('');
      setShowToast(true);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <textarea
            placeholder="Escreva sua pergunta..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={MAX}
            disabled={!sala}
            className="w-full min-h-[120px] px-4 py-3 pb-8 rounded-2xl border border-[#2a2a2a]
              bg-[#141414] text-[#e8e8e8] text-base resize-none outline-none
              focus:border-[#6abf4a55] focus:bg-[#141414]
              placeholder:text-[#444] transition-all duration-150
              disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <span className={`absolute bottom-3 right-4 text-xs tabular-nums transition-colors
            ${nearLimit ? 'text-amber-400' : 'text-[#444]'}`}>
            {MAX - texto.length}
          </span>
        </div>

        <button
          type="submit"
          disabled={!sala || !texto.trim() || sending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
            font-medium text-base text-[#0a0a0a] bg-[#6abf4a]
            hover:bg-[#7dd45c] active:scale-[0.98]
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-150"
        >
          <PaperPlaneTilt size={18} weight="duotone" />
          {sending ? 'Enviando...' : 'Enviar'}
        </button>
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
