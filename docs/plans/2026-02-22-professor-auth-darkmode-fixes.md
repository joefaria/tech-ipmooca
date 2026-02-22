# Professor Auth + Dark Mode + Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adicionar autenticação por senha na rota `/professor`, toggle dark/light mode, corrigir bugs de UX (toast de erro, rollback otimista) e limpar dependências não usadas.

**Architecture:** A autenticação é client-side via `localStorage` — sem sessão de servidor. O mapeamento senha→professor→sala fica em `src/lib/professores.ts`. A rota `/professor` exibe login ou monitor dependendo do estado local. Middleware Next.js protege a rota. As cores hardcoded são substituídas por tokens do design system.

**Tech Stack:** Next.js 16, Tailwind v4, shadcn/ui, next-themes, @phosphor-icons/react, Supabase Realtime, sonner (toasts)

---

## Task 1: Criar `src/lib/professores.ts`

**Files:**
- Create: `src/lib/professores.ts`

**Step 1: Criar o arquivo com mapeamento completo**

```ts
import { SalaId } from '@/lib/salas';

export interface Professor {
  nome: string;
  sala: SalaId;
  isAdmin: boolean;
}

export const PROFESSORES: Record<string, Professor> = {
  jonatasfaria:    { nome: 'Jonatas Faria',      sala: 'verdade-absoluta', isAdmin: true },
  danielmedeiros:  { nome: 'Daniel Medeiros',     sala: 'verdade-absoluta', isAdmin: false },
  guilhermeparize: { nome: 'Guilherme Parize',    sala: 'verdade-absoluta', isAdmin: false },
  agnaldofaria:    { nome: 'Agnaldo Faria',       sala: 'primeira-pedro',   isAdmin: true },
  joaomarcoscazula:{ nome: 'João Marcos Cazula',  sala: 'primeira-pedro',   isAdmin: false },
  elievaristo:     { nome: 'Eli Evaristo',        sala: 'doutrina',         isAdmin: false },
  eliezermendes:   { nome: 'Eliezer Mendes',      sala: 'doutrina',         isAdmin: false },
  itamarcarvalho:  { nome: 'Itamar Carvalho',     sala: 'doutrina',         isAdmin: false },
  enzomatsumoto:   { nome: 'Enzo Matsumoto',      sala: 'amando-deus',      isAdmin: false },
  joaopedrofaria:  { nome: 'João Pedro Faria',    sala: 'amando-deus',      isAdmin: false },
  lucascazula:     { nome: 'Lucas Cazula',        sala: 'amando-deus',      isAdmin: false },
  flavioamerico:   { nome: 'Flávio Américo',      sala: 'familia-crista',   isAdmin: false },
  mauriciopitorri: { nome: 'Maurício Pitorri',    sala: 'familia-crista',   isAdmin: false },
};

export function autenticar(senha: string): Professor | null {
  return PROFESSORES[senha] ?? null;
}

export const PROFESSOR_STORAGE_KEY = 'ebd-professor-auth';

export interface SessaoProfessor {
  senha: string;
  nome: string;
  sala: SalaId;
  isAdmin: boolean;
}
```

**Step 2: Commit**

```bash
git add src/lib/professores.ts
git commit -m "feat: add professores data and auth helper"
```

---

## Task 2: Criar página `/professor` (login + monitor em um arquivo)

**Files:**
- Create: `src/app/professor/page.tsx`

**Step 1: Criar a página**

A página é um componente client-side que lê `localStorage`. Se há sessão salva, renderiza o monitor. Caso contrário, renderiza o login.

```tsx
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
        // Revalida a sessão contra o mapeamento atual
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
```

**Step 2: Commit**

```bash
git add src/app/professor/page.tsx
git commit -m "feat: add /professor page with login and monitor"
```

---

## Task 3: Atualizar `MonitorHeader` (logout + admin dropdown + dark mode toggle)

**Files:**
- Modify: `src/components/monitor/monitor-header.tsx`

**Step 1: Reescrever o componente**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/components/monitor/monitor-header.tsx
git commit -m "feat: monitor header with logout, admin dropdown, dark mode toggle"
```

---

## Task 4: Corrigir `page.tsx` do aluno — cores + dark mode toggle

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Substituir cores hardcoded e adicionar toggle de tema**

Trocar no `page.tsx`:
- `bg-[#0a0a0a]` → `bg-background`
- `text-[#f0f0f0]` → `text-foreground`
- `text-[#888]` → `text-muted-foreground`
- `text-[#555]` / `text-[#444]` → `text-muted-foreground/60` / `text-muted-foreground/40`

Adicionar botão de dark mode no header (ao lado da logo):

```tsx
// Importar no topo
import { Sun, Moon } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';

// Dentro do componente, antes do return:
const { theme, setTheme } = useTheme();

// No JSX, dentro do bloco de logo, adicionar ao lado direito:
<div className="flex items-center justify-between mb-6">
  <img src="/favicon.svg" alt="Logo" className="h-8 w-auto opacity-90" />
  <button
    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
    title="Alternar tema"
  >
    {theme === 'dark' ? <Sun size={16} weight="duotone" /> : <Moon size={16} weight="duotone" />}
  </button>
</div>
```

O arquivo completo resultante:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeSlash, Sun, Moon } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
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
  const { theme, setTheme } = useTheme();

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

  if (!mounted) return null;

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
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              title="Alternar tema"
            >
              {theme === 'dark'
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
            ou tire sua dúvida durante a aula — sem pressão e sem julgamento.
            Todas as contribuições são bem-vindas.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.25 }}
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full
              border border-[#f5c542]/30 bg-[#f5c542]/8"
          >
            <EyeSlash size={14} weight="duotone" className="text-[#f5c542]" />
            <span className="text-xs font-medium text-[#f5c542]/90 tracking-wide">
              100% anônimo — nenhum dado é coletado
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
          <QuestionForm sala={sala} />
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
                {perguntas.length === 0 ? (
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
```

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix: replace hardcoded colors with design tokens, add dark mode toggle"
```

---

## Task 5: Fix toast de erro no `question-form.tsx`

**Files:**
- Modify: `src/components/student/question-form.tsx`

**Step 1: Adicionar `else` com `toast.error`**

Substituir o bloco `if (!error)` atual:

```ts
// ANTES
if (!error) {
  setTexto('');
  toast.success('Pergunta enviada!');
}

// DEPOIS
if (error) {
  toast.error('Erro ao enviar pergunta. Tente novamente.');
} else {
  setTexto('');
  toast.success('Pergunta enviada!');
}
```

**Step 2: Commit**

```bash
git add src/components/student/question-form.tsx
git commit -m "fix: show error toast when question insert fails"
```

---

## Task 6: Extrair `timeAgo()` para `src/lib/utils.ts` e remover duplicatas

**Files:**
- Modify: `src/lib/utils.ts`
- Modify: `src/components/student/question-card.tsx`
- Modify: `src/components/monitor/question-item.tsx`

**Step 1: Adicionar `timeAgo` em `utils.ts`**

```ts
// Adicionar ao final de src/lib/utils.ts
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins === 1) return 'há 1 min';
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? 'há 1h' : `há ${hrs}h`;
}
```

**Step 2: Atualizar `question-card.tsx`**

- Remover a função `timeAgo` local (linhas 7-15)
- Adicionar import: `import { cn, timeAgo } from '@/lib/utils';`

**Step 3: Atualizar `question-item.tsx`**

- Remover a função `timeAgo` local (linhas 22-30)
- Atualizar import: `import { cn, timeAgo } from '@/lib/utils';`

**Step 4: Commit**

```bash
git add src/lib/utils.ts src/components/student/question-card.tsx src/components/monitor/question-item.tsx
git commit -m "refactor: extract timeAgo to utils, remove duplicate"
```

---

## Task 7: Criar `src/middleware.ts` e remover `src/proxy.ts`

**Files:**
- Create: `src/middleware.ts`
- Delete: `src/proxy.ts`

**Step 1: Criar o middleware correto**

O middleware protege `/professor` verificando se há sessão no cookie ou simplesmente deixando passar (a verificação real é client-side via localStorage). Como localStorage não é acessível no middleware, a proteção real é a página de login em si — o middleware aqui serve apenas para redirecionar a rota antiga `/monitor` para `/professor`.

```ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirecionar /monitor (rota antiga) para /professor
  if (pathname.startsWith('/monitor')) {
    return NextResponse.redirect(new URL('/professor', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/monitor/:path*'],
};
```

**Step 2: Deletar `src/proxy.ts`**

```bash
rm src/proxy.ts
```

**Step 3: Commit**

```bash
git add src/middleware.ts
git rm src/proxy.ts
git commit -m "fix: create middleware.ts, redirect /monitor to /professor, remove proxy.ts"
```

---

## Task 8: Remover a rota antiga `/monitor`

**Files:**
- Delete: `src/app/monitor/page.tsx`

**Step 1: Deletar o diretório**

```bash
rm -rf src/app/monitor
```

**Step 2: Commit**

```bash
git rm -r src/app/monitor
git commit -m "chore: remove old /monitor route"
```

---

## Task 9: Limpar dependências não usadas

**Files:**
- Modify: `package.json`
- Delete: `src/components/ui/form.tsx`

**Step 1: Remover pacotes**

```bash
npm uninstall lucide-react react-hook-form @hookform/resolvers zod
```

**Step 2: Remover `form.tsx`**

```bash
rm src/components/ui/form.tsx
git rm src/components/ui/form.tsx
```

**Step 3: Verificar que nada importa os pacotes removidos**

```bash
grep -r "lucide-react\|react-hook-form\|@hookform\|from 'zod'" src/
```

Esperado: nenhum resultado.

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove unused dependencies (lucide-react, react-hook-form, zod)"
```

---

## Task 10: Verificação final

**Step 1: Rodar o build**

```bash
npm run build
```

Esperado: build sem erros.

**Step 2: Testar manualmente**

- Acesse `/` → dark mode toggle funciona, toast de erro aparece ao simular falha
- Acesse `/professor` → tela de login aparece com título "Perguntas EBD" e subtítulo "acesso do professor"
- Digite senha errada → mensagem de erro aparece
- Digite `jonatasfaria` → entra no monitor, dropdown de todas as salas visível
- Digite `danielmedeiros` → entra no monitor, nome da sala fixo (sem dropdown)
- Clique em logout → volta para tela de login
- Acesse `/monitor` → redireciona para `/professor`

**Step 3: Commit final se necessário**

```bash
git add -A
git commit -m "chore: final cleanup and verification"
```
