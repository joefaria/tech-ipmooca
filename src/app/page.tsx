'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { SALAS, SalaId } from '@/lib/salas';
import { Pergunta } from '@/types/pergunta';
import { SalaSelector } from '@/components/student/sala-selector';
import { QuestionForm } from '@/components/student/question-form';
import { QuestionCard } from '@/components/student/question-card';

const SALA_STORAGE_KEY = 'ebd-sala-selecionada';

export default function HomePage() {
  const [sala, setSala] = useState<SalaId | ''>('');
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(SALA_STORAGE_KEY) as SalaId | null;
    if (saved && SALAS.some((s) => s.id === saved)) {
      setSala(saved);
    }
  }, []);

  function handleSalaChange(newSala: SalaId) {
    setSala(newSala);
    localStorage.setItem(SALA_STORAGE_KEY, newSala);
  }

  useEffect(() => {
    if (!sala) return;

    supabase
      .from('perguntas')
      .select('*')
      .eq('sala', sala)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPerguntas((data as Pergunta[]) ?? []));

    const channel = supabase
      .channel(`perguntas-${sala}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'perguntas',
        filter: `sala=eq.${sala}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPerguntas((prev) => [payload.new as Pergunta, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setPerguntas((prev) =>
            prev.map((p) => p.id === payload.new.id ? payload.new as Pergunta : p)
          );
        } else if (payload.eventType === 'DELETE') {
          setPerguntas((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sala]);

  const sorted = [
    ...perguntas.filter((p) => p.status === 'destacada'),
    ...perguntas.filter((p) => p.status === 'pendente'),
    ...perguntas.filter((p) => p.status === 'respondida'),
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-5 py-8">
        <div className="mb-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">EBD</p>
          <h1 className="text-2xl font-semibold text-gray-900">Perguntas</h1>
          <p className="text-sm text-gray-500 mt-1">Anônimo · Sem identificação</p>
        </div>

        <div className="flex flex-col gap-4 mb-10">
          <SalaSelector value={sala} onChange={handleSalaChange} />
          <QuestionForm sala={sala} />
        </div>

        {sala && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-4">
              Perguntas desta sala
              {perguntas.length > 0 && (
                <span className="ml-2 text-gray-300">({perguntas.length})</span>
              )}
            </p>

            {perguntas.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-12">
                Nenhuma pergunta ainda.<br />Seja o primeiro!
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {sorted.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <QuestionCard pergunta={p} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
