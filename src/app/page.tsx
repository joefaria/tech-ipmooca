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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
          setPerguntas((prev) => prev.filter((p) => p.id !== payload.old?.id));
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-lg mx-auto px-5 py-8">

        {/* Header com animação de entrada */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-8"
        >
          <p className="text-xs font-medium text-[#6abf4a] uppercase tracking-widest mb-1">EBD</p>
          <h1 className="text-2xl font-semibold text-[#f0f0f0]">Perguntas</h1>
          <p className="text-sm text-[#555] mt-1">Anônimo · Sem identificação</p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="flex flex-col gap-4 mb-10"
        >
          <SalaSelector value={sala} onChange={handleSalaChange} />
          <QuestionForm sala={sala} />
        </motion.div>

        {/* Feed */}
        <AnimatePresence>
          {sala && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <p className="text-sm font-medium text-[#555] mb-4">
                Perguntas desta sala
                {perguntas.length > 0 && (
                  <motion.span
                    key={perguntas.length}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="ml-2 text-[#444]"
                  >
                    ({perguntas.length})
                  </motion.span>
                )}
              </p>

              <AnimatePresence mode="wait">
                {perguntas.length === 0 ? (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-[#444] text-sm py-12"
                  >
                    Nenhuma pergunta ainda.<br />Seja o primeiro!
                  </motion.p>
                ) : (
                  <motion.div key="list" className="flex flex-col gap-3">
                    <AnimatePresence initial={false}>
                      {sorted.map((p) => (
                        <motion.div
                          key={p.id}
                          layout
                          initial={{ opacity: 0, y: -10, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                          <QuestionCard pergunta={p} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
