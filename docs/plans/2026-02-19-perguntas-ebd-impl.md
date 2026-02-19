# Perguntas EBD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first web app for anonymous Q&A during Sunday school classes, with realtime updates via Supabase and a teacher monitor screen.

**Architecture:** Next.js 15 App Router with Supabase Realtime for live question feed. Students post anonymously (anon key), teacher actions (update/delete) go through Server Actions using service role key. `/monitor` is protected by a query param password checked in middleware.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL + Realtime), Phosphor Icons (duotone), Framer Motion, Vercel deploy.

---

## Pre-requisites

Before starting, you need:
1. A [Supabase](https://supabase.com) account and a new project created
2. Copy the project URL, anon key, and service role key from Supabase dashboard → Settings → API

---

### Task 1: Scaffold Next.js project

**Files:**
- Create: `projetos/perguntas-ebd/` (new project)

**Step 1: Create the Next.js app**

```bash
cd /Users/jonatasfaria/astra/projetos
npx create-next-app@latest perguntas-ebd \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-eslint \
  --import-alias "@/*"
cd perguntas-ebd
```

**Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @phosphor-icons/react framer-motion
```

**Step 3: Create `.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon_key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role_key...
MONITOR_PASSWORD=ebdmonitor2026
```

**Step 4: Verify dev server starts**

```bash
npm run dev
```
Expected: `localhost:3000` opens, default Next.js page.

**Step 5: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js app for perguntas-ebd"
```

---

### Task 2: Supabase database setup

**Step 1: Run this SQL in Supabase Dashboard → SQL Editor**

```sql
CREATE TABLE perguntas (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  sala       text        NOT NULL,
  texto      text        NOT NULL CHECK (char_length(texto) <= 500),
  status     text        DEFAULT 'pendente'
             CHECK (status IN ('pendente', 'respondida', 'destacada')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX perguntas_sala_idx ON perguntas (sala);

ALTER TABLE perguntas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_anonimo" ON perguntas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "select_publico" ON perguntas
  FOR SELECT USING (true);
```

Note: UPDATE and DELETE are intentionally blocked at RLS level — they go through service role key server-side.

**Step 2: Enable Realtime in Supabase**

Go to: Supabase Dashboard → Database → Replication → Enable `perguntas` table for Realtime.

**Step 3: Test insert manually**

In Supabase SQL Editor:
```sql
INSERT INTO perguntas (sala, texto) VALUES ('verdade-absoluta', 'Teste de pergunta');
SELECT * FROM perguntas;
```
Expected: Row returned with `status = 'pendente'`.

---

### Task 3: Core types and constants

**Files:**
- Create: `src/types/pergunta.ts`
- Create: `src/lib/salas.ts`

**Step 1: Create the Pergunta type**

```typescript
// src/types/pergunta.ts
export type PerguntaStatus = 'pendente' | 'respondida' | 'destacada';

export interface Pergunta {
  id: string;
  sala: string;
  texto: string;
  status: PerguntaStatus;
  created_at: string;
}
```

**Step 2: Create the salas constant**

```typescript
// src/lib/salas.ts
export const SALAS = [
  { id: 'verdade-absoluta',  label: 'Verdade Absoluta' },
  { id: 'amando-deus',       label: 'Amando Deus no Mundo' },
  { id: 'familia-crista',    label: 'Família Cristã' },
  { id: 'doutrina',          label: 'Doutrina e Discipulado' },
  { id: 'primeira-pedro',    label: '1 Pedro' },
] as const;

export type SalaId = typeof SALAS[number]['id'];
```

**Step 3: Commit**

```bash
git add src/types/pergunta.ts src/lib/salas.ts
git commit -m "feat: add Pergunta type and SALAS constant"
```

---

### Task 4: Supabase clients

**Files:**
- Create: `src/lib/supabase.ts` (browser client, uses anon key)
- Create: `src/lib/supabase-server.ts` (server-only, uses service role key)

**Step 1: Browser client (safe to expose)**

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**Step 2: Server client (never sent to browser)**

```typescript
// src/lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

**Step 3: Commit**

```bash
git add src/lib/supabase.ts src/lib/supabase-server.ts
git commit -m "feat: add Supabase browser and server clients"
```

---

### Task 5: Middleware to protect /monitor

**Files:**
- Create: `src/middleware.ts`

**Step 1: Create middleware**

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname.startsWith('/monitor')) {
    const key = searchParams.get('key');
    if (key !== process.env.MONITOR_PASSWORD) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/monitor/:path*'],
};
```

**Step 2: Verify redirect works**

Start dev server, open `localhost:3000/monitor` → should redirect to `/`.
Open `localhost:3000/monitor?key=ebdmonitor2026` → should reach (empty) monitor page.

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add middleware to protect /monitor with password"
```

---

### Task 6: Server Actions for teacher operations

**Files:**
- Create: `src/app/actions.ts`

**Step 1: Create server actions**

```typescript
// src/app/actions.ts
'use server';

import { createServerClient } from '@/lib/supabase-server';
import { PerguntaStatus } from '@/types/pergunta';

export async function updatePerguntaStatus(id: string, status: PerguntaStatus) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('perguntas')
    .update({ status })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deletePergunta(id: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('perguntas')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
```

**Step 2: Commit**

```bash
git add src/app/actions.ts
git commit -m "feat: add server actions for teacher operations"
```

---

### Task 7: Global styles and layout

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Step 1: Update globals.css**

Replace content with:

```css
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', system-ui, sans-serif;
  --color-accent: #4f46e5;
  --color-accent-light: #e0e7ff;
  --color-surface: #ffffff;
  --color-border: #e5e7eb;
  --color-text: #111827;
  --color-muted: #6b7280;
}

* {
  -webkit-tap-highlight-color: transparent;
}

body {
  background: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-sans);
}
```

**Step 2: Update layout.tsx**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EBD — Perguntas',
  description: 'Faça perguntas anônimas durante a aula',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: set up global styles and root layout"
```

---

### Task 8: UI primitives

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/toast.tsx`

**Step 1: Button component**

```tsx
// src/components/ui/button.tsx
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 active:scale-[0.98]',
    danger: 'bg-transparent text-red-500 hover:bg-red-50 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-3 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
```

**Step 2: Textarea component**

```tsx
// src/components/ui/textarea.tsx
import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  charCount?: number;
  maxChars?: number;
}

export function Textarea({ charCount, maxChars = 500, className = '', ...props }: TextareaProps) {
  const nearLimit = charCount !== undefined && charCount > maxChars * 0.8;

  return (
    <div className="relative">
      <textarea
        className={`w-full min-h-[120px] px-4 py-3 rounded-2xl border border-gray-200
          bg-gray-50 text-gray-900 text-base resize-none outline-none
          focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100
          placeholder:text-gray-400 transition-all duration-150 ${className}`}
        maxLength={maxChars}
        {...props}
      />
      {charCount !== undefined && (
        <span className={`absolute bottom-3 right-4 text-xs tabular-nums transition-colors
          ${nearLimit ? 'text-amber-500' : 'text-gray-400'}`}>
          {maxChars - charCount}
        </span>
      )}
    </div>
  );
}
```

**Step 3: Toast component**

```tsx
// src/components/ui/toast.tsx
'use client';

import { useEffect, useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react';

interface ToastProps {
  message: string;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50
      flex items-center gap-2 px-5 py-3 rounded-2xl bg-gray-900 text-white text-sm
      shadow-lg transition-all duration-300
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <CheckCircle size={18} weight="duotone" className="text-green-400" />
      {message}
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/
git commit -m "feat: add Button, Textarea, and Toast UI primitives"
```

---

### Task 9: Student components

**Files:**
- Create: `src/components/student/sala-selector.tsx`
- Create: `src/components/student/question-form.tsx`
- Create: `src/components/student/question-card.tsx`

**Step 1: Sala selector**

```tsx
// src/components/student/sala-selector.tsx
'use client';

import { CaretDown } from '@phosphor-icons/react';
import { SALAS, SalaId } from '@/lib/salas';

interface SalaSelectorProps {
  value: SalaId | '';
  onChange: (sala: SalaId) => void;
}

export function SalaSelector({ value, onChange }: SalaSelectorProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SalaId)}
        className="w-full appearance-none px-4 py-3 pr-10 rounded-2xl border border-gray-200
          bg-white text-gray-900 text-base outline-none cursor-pointer
          focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
          transition-all duration-150"
      >
        <option value="" disabled>Selecione sua sala...</option>
        {SALAS.map((sala) => (
          <option key={sala.id} value={sala.id}>{sala.label}</option>
        ))}
      </select>
      <CaretDown
        size={18}
        weight="duotone"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  );
}
```

**Step 2: Question form**

```tsx
// src/components/student/question-form.tsx
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
```

**Step 3: Question card**

```tsx
// src/components/student/question-card.tsx
import { CheckCircle, Star } from '@phosphor-icons/react';
import { Pergunta } from '@/types/pergunta';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins === 1) return 'há 1 min';
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? 'há 1h' : `há ${hrs}h`;
}

interface QuestionCardProps {
  pergunta: Pergunta;
}

export function QuestionCard({ pergunta }: QuestionCardProps) {
  const isDestacada = pergunta.status === 'destacada';
  const isRespondida = pergunta.status === 'respondida';

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300
      ${isDestacada
        ? 'border-indigo-300 bg-indigo-50 shadow-sm'
        : 'border-gray-100 bg-white'
      }
      ${isRespondida ? 'opacity-50' : 'opacity-100'}
    `}>
      {isDestacada && (
        <div className="flex items-center gap-1.5 mb-2">
          <Star size={14} weight="duotone" className="text-indigo-500" />
          <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Destaque</span>
        </div>
      )}
      <p className="text-gray-900 text-base leading-relaxed">{pergunta.texto}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">{timeAgo(pergunta.created_at)}</span>
        {isRespondida && (
          <CheckCircle size={16} weight="duotone" className="text-green-500" />
        )}
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/student/
git commit -m "feat: add student components (sala selector, question form, question card)"
```

---

### Task 10: Monitor components

**Files:**
- Create: `src/components/monitor/question-item.tsx`
- Create: `src/components/monitor/monitor-header.tsx`

**Step 1: Question item with teacher actions**

```tsx
// src/components/monitor/question-item.tsx
'use client';

import { useState } from 'react';
import { Star, CheckCircle, Trash, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Pergunta } from '@/types/pergunta';
import { updatePerguntaStatus, deletePergunta } from '@/app/actions';
import { Button } from '@/components/ui/button';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins === 1) return 'há 1 min';
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? 'há 1h' : `há ${hrs}h`;
}

interface QuestionItemProps {
  pergunta: Pergunta;
}

export function QuestionItem({ pergunta }: QuestionItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDestacada = pergunta.status === 'destacada';
  const isRespondida = pergunta.status === 'respondida';

  async function handle(action: () => Promise<void>) {
    setLoading(true);
    try { await action(); } finally { setLoading(false); }
  }

  return (
    <div className={`p-4 rounded-2xl border transition-all
      ${isDestacada ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 bg-white'}
      ${isRespondida ? 'opacity-60' : ''}
    `}>
      {isDestacada && (
        <div className="flex items-center gap-1.5 mb-2">
          <Star size={14} weight="duotone" className="text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Destaque</span>
        </div>
      )}

      <p className="text-gray-900 text-base leading-relaxed mb-3">{pergunta.texto}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{timeAgo(pergunta.created_at)}</span>

        <div className="flex items-center gap-1">
          {!isRespondida && (
            <Button
              size="sm"
              variant="ghost"
              disabled={loading}
              onClick={() => handle(() => updatePerguntaStatus(pergunta.id, 'respondida'))}
              title="Marcar como respondida"
            >
              <CheckCircle size={16} weight="duotone" className="text-green-500" />
            </Button>
          )}

          {isRespondida && (
            <Button
              size="sm"
              variant="ghost"
              disabled={loading}
              onClick={() => handle(() => updatePerguntaStatus(pergunta.id, 'pendente'))}
              title="Reabrir"
            >
              <ArrowCounterClockwise size={16} weight="duotone" />
            </Button>
          )}

          {!isRespondida && (
            <Button
              size="sm"
              variant="ghost"
              disabled={loading}
              onClick={() => handle(() => updatePerguntaStatus(
                pergunta.id,
                isDestacada ? 'pendente' : 'destacada'
              ))}
              title={isDestacada ? 'Remover destaque' : 'Destacar'}
            >
              <Star
                size={16}
                weight="duotone"
                className={isDestacada ? 'text-indigo-500' : 'text-gray-400'}
              />
            </Button>
          )}

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="danger"
                disabled={loading}
                onClick={() => handle(() => deletePergunta(pergunta.id))}
              >
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
              title="Deletar"
            >
              <Trash size={16} weight="duotone" className="text-red-400" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Monitor header**

```tsx
// src/components/monitor/monitor-header.tsx
'use client';

import { CaretDown, WifiHigh } from '@phosphor-icons/react';
import { SALAS, SalaId } from '@/lib/salas';

interface MonitorHeaderProps {
  sala: SalaId;
  connected: boolean;
  onSalaChange: (sala: SalaId) => void;
}

export function MonitorHeader({ sala, connected, onSalaChange }: MonitorHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 px-5 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-900">Monitor EBD</span>
        <WifiHigh
          size={16}
          weight="duotone"
          className={connected ? 'text-green-500' : 'text-gray-300'}
        />
      </div>
      <div className="relative">
        <select
          value={sala}
          onChange={(e) => onSalaChange(e.target.value as SalaId)}
          className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200
            bg-white text-sm text-gray-900 outline-none cursor-pointer
            focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          {SALAS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <CaretDown
          size={14}
          weight="duotone"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/monitor/
git commit -m "feat: add monitor components (question item with actions, monitor header)"
```

---

### Task 11: Student page (main app)

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Replace page.tsx with student app**

```tsx
// src/app/page.tsx
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

  // Restore sala from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SALA_STORAGE_KEY) as SalaId | null;
    if (saved && SALAS.some((s) => s.id === saved)) {
      setSala(saved);
    }
  }, []);

  // Save sala to localStorage on change
  function handleSalaChange(newSala: SalaId) {
    setSala(newSala);
    localStorage.setItem(SALA_STORAGE_KEY, newSala);
  }

  // Fetch + realtime subscription when sala changes
  useEffect(() => {
    if (!sala) return;

    // Initial fetch
    supabase
      .from('perguntas')
      .select('*')
      .eq('sala', sala)
      .order('status', { ascending: false }) // 'destacada' first
      .order('created_at', { ascending: false })
      .then(({ data }) => setPerguntas((data as Pergunta[]) ?? []));

    // Realtime subscription
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
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">EBD</p>
          <h1 className="text-2xl font-semibold text-gray-900">Perguntas</h1>
          <p className="text-sm text-gray-500 mt-1">Anônimo · Sem identificação</p>
        </div>

        {/* Form section */}
        <div className="flex flex-col gap-4 mb-10">
          <SalaSelector value={sala} onChange={handleSalaChange} />
          <QuestionForm sala={sala} />
        </div>

        {/* Feed */}
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
```

**Step 2: Test in browser**

- Open `localhost:3000`
- Select a sala, type a question, submit → toast appears, card shows in feed
- Reload page → sala persists, question still in feed

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: build student page with realtime feed"
```

---

### Task 12: Monitor page

**Files:**
- Create: `src/app/monitor/page.tsx`

**Step 1: Create monitor page**

```tsx
// src/app/monitor/page.tsx
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

  useEffect(() => {
    // Initial fetch
    supabase
      .from('perguntas')
      .select('*')
      .eq('sala', sala)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPerguntas((data as Pergunta[]) ?? []));

    // Realtime
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

  const [showRespondidas, setShowRespondidas] = useState(false);

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
```

**Step 2: Test monitor**

- Open `localhost:3000/monitor?key=ebdmonitor2026`
- Should show monitor with sala selector
- Submit a question from student page → should appear on monitor in real time
- Click "Destacar" → confirm card moves to top with indigo style on student page
- Click "Respondida" → moves to collapsed section
- Click "Deletar" → confirm inline, then disappears from student feed

**Step 3: Commit**

```bash
git add src/app/monitor/
git commit -m "feat: build monitor page with realtime teacher controls"
```

---

### Task 13: Production build + deploy

**Step 1: Run build locally**

```bash
npm run build
```
Expected: No TypeScript errors, no build failures.

**Step 2: Push to GitHub**

```bash
git remote add origin https://github.com/SEU_USUARIO/perguntas-ebd.git
git push -u origin main
```

**Step 3: Deploy to Vercel**

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select `perguntas-ebd` repository
3. Add environment variables (same as `.env.local`)
4. Deploy

**Step 4: Add custom domain**

In Vercel: Settings → Domains → add your domain → follow DNS instructions (CNAME to `cname.vercel-dns.com`).

**Step 5: Final end-to-end test in production**

- Open production URL on mobile
- Select sala, send question, confirm realtime feed
- Open `/monitor?key=ebdmonitor2026` → confirm teacher controls work

---

## Summary

| Task | What it does |
|------|-------------|
| 1 | Scaffold Next.js project |
| 2 | Supabase DB setup (SQL + RLS) |
| 3 | Types + constants |
| 4 | Supabase clients (browser + server) |
| 5 | Middleware to protect /monitor |
| 6 | Server Actions for teacher ops |
| 7 | Global styles + layout |
| 8 | UI primitives (Button, Textarea, Toast) |
| 9 | Student components |
| 10 | Monitor components |
| 11 | Student page with realtime |
| 12 | Monitor page with teacher controls |
| 13 | Build + deploy |
