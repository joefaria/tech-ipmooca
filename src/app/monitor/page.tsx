'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { updatePerguntaStatus, deletePergunta } from '@/app/actions';
import { SALAS, SalaId } from '@/lib/salas';
import { Pergunta, PerguntaStatus } from '@/types/pergunta';
import { MonitorHeader } from '@/components/monitor/monitor-header';
import { QuestionItem } from '@/components/monitor/question-item';

export default function MonitorPage() {
  const [sala, setSala] = useState<SalaId>(SALAS[0].id);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [connected, setConnected] = useState(false);
  const [showRespondidas, setShowRespondidas] = useState(false);

  useEffect(() => {
    setPerguntas([]);

    supabase
      .from('perguntas')
      .select('*')
      .eq('sala', sala)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPerguntas((data as Pergunta[]) ?? []));

    const channel = supabase
      .channel(`monitor-${sala}`)
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
        }
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [sala]);

  async function handleStatusChange(id: string, status: PerguntaStatus) {
    setPerguntas((prev) =>
      prev.map((p) => p.id === id ? { ...p, status } : p)
    );
    await updatePerguntaStatus(id, status);
  }

  async function handleDelete(id: string) {
    setPerguntas((prev) => prev.filter((p) => p.id !== id));
    await deletePergunta(id);
  }

  const destacadas = perguntas.filter((p) => p.status === 'destacada');
  const pendentes = perguntas.filter((p) => p.status === 'pendente');
  const respondidas = perguntas.filter((p) => p.status === 'respondida');
  const ativas = [...destacadas, ...pendentes];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <MonitorHeader
        sala={sala}
        connected={connected}
        onSalaChange={(s) => setSala(s)}
      />

      <div className="max-w-2xl mx-auto px-5 py-6 flex flex-col gap-3">

        <AnimatePresence mode="wait">
          {ativas.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-[#444] text-sm py-16"
            >
              Nenhuma pergunta pendente nesta sala.
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {ativas.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <QuestionItem
                pergunta={p}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {respondidas.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2"
            >
              <button
                onClick={() => setShowRespondidas(!showRespondidas)}
                className="flex items-center gap-2 text-sm text-[#555] hover:text-[#888] transition-colors py-2"
              >
                <motion.span
                  animate={{ rotate: showRespondidas ? 90 : 0 }}
                  transition={{ duration: 0.15 }}
                  className="inline-block"
                >
                  ▸
                </motion.span>
                Respondidas ({respondidas.length})
              </button>

              <AnimatePresence>
                {showRespondidas && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-3 mt-2 overflow-hidden"
                  >
                    {respondidas.map((p) => (
                      <QuestionItem
                        key={p.id}
                        pergunta={p}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                      />
                    ))}
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
