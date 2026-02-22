'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { updatePerguntaStatus, deletePergunta } from '@/app/actions';
import { SALAS, SalaId } from '@/lib/salas';
import { Pergunta, PerguntaStatus } from '@/types/pergunta';
import { autenticar, PROFESSOR_STORAGE_KEY, SessaoProfessor } from '@/lib/professores';
import { MonitorHeader } from '@/components/monitor/monitor-header';
import { QuestionItem } from '@/components/monitor/question-item';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// ── LOGIN ─────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: (sessao: SessaoProfessor) => void }) {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const professor = autenticar(senha.trim().toLowerCase());
    if (!professor) {
      setErro(true);
      return;
    }
    const sessao: SessaoProfessor = { senha: senha.trim().toLowerCase(), ...professor };
    localStorage.setItem(PROFESSOR_STORAGE_KEY, JSON.stringify(sessao));
    onLogin(sessao);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-1">Perguntas EBD</h1>
          <p className="text-sm text-muted-foreground">acesso do professor</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            type="password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => { setSenha(e.target.value); setErro(false); }}
            autoFocus
            className={erro ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {erro && (
            <p className="text-xs text-destructive">Senha incorreta. Tente novamente.</p>
          )}
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// ── MONITOR ───────────────────────────────────────────────────────────────────

function MonitorPage({
  sessao,
  onLogout,
}: {
  sessao: SessaoProfessor;
  onLogout: () => void;
}) {
  const [sala, setSala] = useState<SalaId>(sessao.sala);
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
    const anterior = perguntas;
    setPerguntas((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    try {
      await updatePerguntaStatus(id, status);
    } catch {
      setPerguntas(anterior);
      toast.error('Erro ao atualizar. Tente novamente.');
    }
  }

  async function handleDelete(id: string) {
    const anterior = perguntas;
    setPerguntas((prev) => prev.filter((p) => p.id !== id));
    try {
      await deletePergunta(id);
    } catch {
      setPerguntas(anterior);
      toast.error('Erro ao deletar. Tente novamente.');
    }
  }

  const destacadas = perguntas.filter((p) => p.status === 'destacada');
  const pendentes = perguntas.filter((p) => p.status === 'pendente');
  const respondidas = perguntas.filter((p) => p.status === 'respondida');
  const ativas = [...destacadas, ...pendentes];

  return (
    <div className="min-h-screen bg-background">
      <MonitorHeader
        sala={sala}
        connected={connected}
        isAdmin={sessao.isAdmin}
        nomeProfessor={sessao.nome}
        onSalaChange={(s) => setSala(s)}
        onLogout={onLogout}
      />

      <div className="max-w-2xl mx-auto px-5 py-6 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {ativas.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-muted-foreground/40 text-sm py-16"
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
              <button
                onClick={() => setShowRespondidas(!showRespondidas)}
                className="flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors py-2"
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

// ── ROOT ──────────────────────────────────────────────────────────────────────

export default function ProfessorPage() {
  const [sessao, setSessao] = useState<SessaoProfessor | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(PROFESSOR_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SessaoProfessor;
        const professor = autenticar(parsed.senha);
        if (professor) setSessao({ ...professor, senha: parsed.senha });
        else localStorage.removeItem(PROFESSOR_STORAGE_KEY);
      } catch {
        localStorage.removeItem(PROFESSOR_STORAGE_KEY);
      }
    }
    setMounted(true);
  }, []);

  function handleLogout() {
    localStorage.removeItem(PROFESSOR_STORAGE_KEY);
    setSessao(null);
  }

  if (!mounted) return null;

  return (
    <AnimatePresence mode="wait">
      {sessao ? (
        <motion.div key="monitor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <MonitorPage sessao={sessao} onLogout={handleLogout} />
        </motion.div>
      ) : (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoginPage onLogin={setSessao} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
