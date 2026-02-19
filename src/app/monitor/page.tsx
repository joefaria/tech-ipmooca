'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { SALAS, SalaId } from '@/lib/salas';
import { Pergunta } from '@/types/pergunta';
import { MonitorHeader } from '@/components/monitor/monitor-header';
import { QuestionItem } from '@/components/monitor/question-item';

export default function MonitorPage() {
  const [sala, setSala] = useState<SalaId>(SALAS[0].id);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [connected, setConnected] = useState(false);
  const [showRespondidas, setShowRespondidas] = useState(false);

  useEffect(() => {
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
        } else if (payload.eventType === 'DELETE') {
          setPerguntas((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [sala]);

  const destacadas = perguntas.filter((p) => p.status === 'destacada');
  const pendentes = perguntas.filter((p) => p.status === 'pendente');
  const respondidas = perguntas.filter((p) => p.status === 'respondida');

  return (
    <div className="min-h-screen bg-gray-50">
      <MonitorHeader
        sala={sala}
        connected={connected}
        onSalaChange={(s) => { setSala(s); setPerguntas([]); }}
      />

      <div className="max-w-2xl mx-auto px-5 py-6 flex flex-col gap-3">
        {[...destacadas, ...pendentes].length === 0 && (
          <p className="text-center text-gray-400 text-sm py-16">
            Nenhuma pergunta pendente nesta sala.
          </p>
        )}

        <AnimatePresence initial={false}>
          {[...destacadas, ...pendentes].map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <QuestionItem pergunta={p} />
            </motion.div>
          ))}
        </AnimatePresence>

        {respondidas.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowRespondidas(!showRespondidas)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showRespondidas ? '▾' : '▸'} Respondidas ({respondidas.length})
            </button>
            <AnimatePresence>
              {showRespondidas && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-3 mt-3"
                >
                  {respondidas.map((p) => (
                    <QuestionItem key={p.id} pergunta={p} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
