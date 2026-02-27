'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeSlash, Sun, Moon } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
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
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

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

    setLoading(true);
    supabase
      .from('perguntas')
      .select('*')
      .eq('sala', sala)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error('Erro ao carregar perguntas.');
        setPerguntas((data as Pergunta[]) ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel(`perguntas-${sala}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'perguntas',
        filter: `sala=eq.${sala}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newQ = payload.new as Pergunta;
          setPerguntas((prev) => {
            // Replace matching temp-optimistic entry, or prepend if not present
            const withoutTemp = prev.filter(
              (p) => !(p.id.startsWith('temp-') && p.texto === newQ.texto)
            );
            if (withoutTemp.some((p) => p.id === newQ.id)) return withoutTemp;
            return [newQ, ...withoutTemp];
          });
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

  if (!mounted) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-5 py-10">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.svg" alt="Logo" className="h-8 w-auto opacity-90" />
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              title="Alternar tema"
            >
              {resolvedTheme === 'dark'
                ? <Sun size={16} weight="duotone" />
                : <Moon size={16} weight="duotone" />
              }
            </button>
          </div>

          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
            Escola Bíblica Dominical
          </p>

          <h1 className="text-3xl font-bold text-foreground leading-tight mb-3">
            Igreja Presbiteriana<br />da Mooca
          </h1>

          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Este é um espaço criado para você. Faça sua pergunta, exponha seu pensamento
            ou tire sua dúvida durante a aula. Sem pressão, sem julgamento.
            Todas as contribuições são bem-vindas.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.25 }}
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full
              border border-amber-500/40 bg-amber-500/8 dark:border-[#f5c542]/30 dark:bg-[#f5c542]/8"
          >
            <EyeSlash size={14} weight="duotone" className="text-amber-600 dark:text-[#f5c542]" />
            <span className="text-xs font-medium text-amber-700 dark:text-[#f5c542]/90 tracking-wide">
              Totalmente anônimo. Nenhum dado é coletado.
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
          className="flex flex-col gap-4 mb-10"
        >
          <SalaSelector value={sala} onChange={handleSalaChange} />
          <QuestionForm sala={sala} onCreated={(p) => setPerguntas((prev) => [p, ...prev])} />
        </motion.div>

        <AnimatePresence>
          {sala && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <p className="text-sm font-medium text-muted-foreground/60 mb-4">
                Perguntas desta sala
                {perguntas.length > 0 && (
                  <motion.span
                    key={perguntas.length}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="ml-2 text-muted-foreground/40"
                  >
                    ({perguntas.length})
                  </motion.span>
                )}
              </p>

              <AnimatePresence mode="wait">
                {loading ? (
                  <div key="skeleton" className="flex flex-col gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 rounded-xl bg-card animate-pulse" />
                    ))}
                  </div>
                ) : perguntas.length === 0 ? (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-muted-foreground/40 text-sm py-12"
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
