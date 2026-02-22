# shadcn Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refatorar todos os componentes do perguntas-ebd para usar primitivos shadcn/ui com tokens CSS mapeados para o tema dark do projeto (verde #6abf4a como primary).

**Architecture:** Substituir os tokens shadcn gerados pelo init com valores do tema dark do projeto. Refatorar cada componente para usar Card, Button, Textarea, Select, Badge e AlertDialog do shadcn no lugar de elementos nativos estilizados. Lógica de negócio, Framer Motion, Phosphor icons e Supabase não são tocados.

**Tech Stack:** Next.js 16, Tailwind CSS v4, shadcn/ui, sonner, TypeScript

---

### Task 1: Atualizar tokens CSS no globals.css

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Ler o arquivo atual**

```bash
cat src/app/globals.css
```

**Step 2: Substituir os blocos `:root` e `.dark`**

Localizar os blocos `:root { ... }` e `.dark { ... }` gerados pelo shadcn e substituir por:

```css
:root {
  --radius: 0.5rem;
  --background: oklch(0.07 0 0);
  --foreground: oklch(0.94 0 0);
  --card: oklch(0.10 0 0);
  --card-foreground: oklch(0.94 0 0);
  --popover: oklch(0.10 0 0);
  --popover-foreground: oklch(0.94 0 0);
  --primary: oklch(0.70 0.18 143);
  --primary-foreground: oklch(0.07 0 0);
  --secondary: oklch(0.13 0 0);
  --secondary-foreground: oklch(0.94 0 0);
  --muted: oklch(0.13 0 0);
  --muted-foreground: oklch(0.50 0 0);
  --accent: oklch(0.13 0 0);
  --accent-foreground: oklch(0.94 0 0);
  --destructive: oklch(0.63 0.22 29);
  --border: oklch(0.18 0 0);
  --input: oklch(0.13 0 0);
  --ring: oklch(0.70 0.18 143);
}

.dark {
  --background: oklch(0.07 0 0);
  --foreground: oklch(0.94 0 0);
  --card: oklch(0.10 0 0);
  --card-foreground: oklch(0.94 0 0);
  --popover: oklch(0.10 0 0);
  --popover-foreground: oklch(0.94 0 0);
  --primary: oklch(0.70 0.18 143);
  --primary-foreground: oklch(0.07 0 0);
  --secondary: oklch(0.13 0 0);
  --secondary-foreground: oklch(0.94 0 0);
  --muted: oklch(0.13 0 0);
  --muted-foreground: oklch(0.50 0 0);
  --accent: oklch(0.13 0 0);
  --accent-foreground: oklch(0.94 0 0);
  --destructive: oklch(0.63 0.22 29);
  --border: oklch(0.18 0 0);
  --input: oklch(0.13 0 0);
  --ring: oklch(0.70 0.18 143);
}
```

**Step 3: Verificar no browser**

```bash
npm run dev
```

Abrir http://localhost:3000 — o fundo deve ser escuro (#111) e não branco.

**Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: map shadcn tokens to project dark theme"
```

---

### Task 2: Adicionar Toaster do sonner no layout

**Files:**
- Modify: `src/app/layout.tsx`

**Context:** O sonner já está instalado. Precisamos do `<Toaster>` no layout raiz para que `toast.success()` funcione globalmente. O `<Toaster>` do shadcn usa o componente `sonner` por baixo.

**Step 1: Ler o layout atual**

```bash
cat src/app/layout.tsx
```

**Step 2: Adicionar import e componente Toaster**

Adicionar import no topo:
```tsx
import { Toaster } from '@/components/ui/sonner'
```

Adicionar `<Toaster />` dentro do `<ThemeProvider>`, após `{children}`:
```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
  {children}
  <Toaster />
</ThemeProvider>
```

**Step 3: Verificar que não há erro de compilação**

```bash
npm run dev
```

Expected: compilação sem erros no terminal.

**Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add sonner Toaster to root layout"
```

---

### Task 3: Refatorar sala-selector.tsx

**Files:**
- Modify: `src/components/student/sala-selector.tsx`

**Context:** Atualmente usa `<select>` nativo com ícone Phosphor sobreposto. Vamos substituir pelo `<Select>` do shadcn que é acessível e estilizado via tokens.

**Step 1: Ler o arquivo atual**

```bash
cat src/components/student/sala-selector.tsx
```

**Step 2: Reescrever o componente**

```tsx
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SALAS, SalaId } from '@/lib/salas';

interface SalaSelectorProps {
  value: SalaId | '';
  onChange: (sala: SalaId) => void;
}

export function SalaSelector({ value, onChange }: SalaSelectorProps) {
  return (
    <Select value={value || undefined} onValueChange={(v) => onChange(v as SalaId)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione sua sala..." />
      </SelectTrigger>
      <SelectContent>
        {SALAS.map((sala) => (
          <SelectItem key={sala.id} value={sala.id}>
            {sala.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Step 3: Verificar no browser**

Abrir http://localhost:3000 — o select deve aparecer estilizado com o tema dark. Clicar deve abrir o dropdown com as salas.

**Step 4: Commit**

```bash
git add src/components/student/sala-selector.tsx
git commit -m "feat: replace native select with shadcn Select in sala-selector"
```

---

### Task 4: Refatorar question-form.tsx

**Files:**
- Modify: `src/components/student/question-form.tsx`
- Delete: `src/components/ui/toast.tsx` (substituído por sonner)

**Context:** Trocar textarea e button nativos por shadcn. Trocar Toast customizado por `toast.success()` do sonner.

**Step 1: Ler o arquivo atual**

```bash
cat src/components/student/question-form.tsx
```

**Step 2: Reescrever o componente**

```tsx
'use client';

import { useState } from 'react';
import { PaperPlaneTilt } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { SalaId } from '@/lib/salas';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface QuestionFormProps {
  sala: SalaId | '';
}

export function QuestionForm({ sala }: QuestionFormProps) {
  const [texto, setTexto] = useState('');
  const [sending, setSending] = useState(false);

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
      toast.success('Pergunta enviada!');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="relative">
        <Textarea
          placeholder="Escreva sua pergunta..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={MAX}
          disabled={!sala}
          className="min-h-[120px] resize-none pb-8"
        />
        <span className={`absolute bottom-3 right-4 text-xs tabular-nums transition-colors
          ${nearLimit ? 'text-amber-400' : 'text-muted-foreground'}`}>
          {MAX - texto.length}
        </span>
      </div>

      <Button
        type="submit"
        disabled={!sala || !texto.trim() || sending}
        className="w-full gap-2"
      >
        <PaperPlaneTilt size={16} weight="duotone" />
        {sending ? 'Enviando...' : 'Enviar'}
      </Button>
    </form>
  );
}
```

**Step 3: Deletar toast.tsx customizado**

```bash
rm src/components/ui/toast.tsx
```

**Step 4: Verificar no browser**

Selecionar uma sala, digitar uma pergunta e enviar. Deve aparecer um toast do sonner no canto inferior.

**Step 5: Commit**

```bash
git add src/components/student/question-form.tsx
git rm src/components/ui/toast.tsx
git commit -m "feat: replace native form elements with shadcn, switch to sonner toast"
```

---

### Task 5: Refatorar question-card.tsx

**Files:**
- Modify: `src/components/student/question-card.tsx`

**Context:** Envolver em `<Card>` shadcn, usar `<Badge>` para "Destaque", remover classes inline de cor.

**Step 1: Ler o arquivo atual**

```bash
cat src/components/student/question-card.tsx
```

**Step 2: Reescrever o componente**

```tsx
import { CheckCircle, Star } from '@phosphor-icons/react';
import { Pergunta } from '@/types/pergunta';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    <Card className={cn(
      'transition-all duration-300',
      isDestacada && 'border-primary/30 bg-primary/5',
      isRespondida && 'opacity-40'
    )}>
      <CardContent className="pt-4">
        {isDestacada && (
          <Badge variant="outline" className="mb-2 gap-1 border-primary/40 text-primary">
            <Star size={11} weight="duotone" />
            Destaque
          </Badge>
        )}
        <p className="text-sm leading-relaxed">{pergunta.texto}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">{timeAgo(pergunta.created_at)}</span>
          {isRespondida && (
            <CheckCircle size={14} weight="duotone" className="text-primary" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Verificar no browser**

Selecionar uma sala com perguntas — cards devem aparecer com o visual shadcn e tema dark.

**Step 4: Commit**

```bash
git add src/components/student/question-card.tsx
git commit -m "feat: refactor question-card to use shadcn Card and Badge"
```

---

### Task 6: Refatorar monitor-header.tsx

**Files:**
- Modify: `src/components/monitor/monitor-header.tsx`

**Context:** Trocar `<select>` nativo pelo `<Select>` shadcn. Manter estrutura e ícone WiFi.

**Step 1: Ler o arquivo atual**

```bash
cat src/components/monitor/monitor-header.tsx
```

**Step 2: Reescrever o componente**

```tsx
'use client';

import { WifiHigh } from '@phosphor-icons/react';
import { SALAS, SalaId } from '@/lib/salas';
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
  onSalaChange: (sala: SalaId) => void;
}

export function MonitorHeader({ sala, connected, onSalaChange }: MonitorHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 px-5 border-b bg-background sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <span className="font-semibold text-sm">Monitor EBD</span>
        <WifiHigh
          size={14}
          weight="duotone"
          className={`transition-colors duration-500 ${connected ? 'text-primary' : 'text-muted-foreground/30'}`}
        />
      </div>
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
    </div>
  );
}
```

**Step 3: Verificar no browser**

Abrir http://localhost:3000/monitor — header deve aparecer com select shadcn e indicador WiFi.

**Step 4: Commit**

```bash
git add src/components/monitor/monitor-header.tsx
git commit -m "feat: replace native select with shadcn Select in monitor-header"
```

---

### Task 7: Refatorar question-item.tsx

**Files:**
- Modify: `src/components/monitor/question-item.tsx`

**Context:** Componente mais complexo. Trocar card nativo por `<Card>`, botões por `<Button variant="ghost" size="icon">`, badge por `<Badge>`, confirmação de delete por `<AlertDialog>` shadcn.

**Step 1: Ler o arquivo atual**

```bash
cat src/components/monitor/question-item.tsx
```

**Step 2: Reescrever o componente**

```tsx
'use client';

import { useState } from 'react';
import { Star, CheckCircle, Trash, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Pergunta, PerguntaStatus } from '@/types/pergunta';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

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
  onStatusChange: (id: string, status: PerguntaStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function QuestionItem({ pergunta, onStatusChange, onDelete }: QuestionItemProps) {
  const [loading, setLoading] = useState(false);

  const isDestacada = pergunta.status === 'destacada';
  const isRespondida = pergunta.status === 'respondida';

  async function handle(action: () => Promise<void>) {
    setLoading(true);
    try { await action(); } finally { setLoading(false); }
  }

  return (
    <Card className={cn(
      'transition-all duration-200',
      isDestacada && 'border-primary/30 bg-primary/5',
      isRespondida && 'opacity-30'
    )}>
      <CardContent className="pt-4">
        {isDestacada && (
          <Badge variant="outline" className="mb-2 gap-1 border-primary/40 text-primary">
            <Star size={11} weight="duotone" />
            Destaque
          </Badge>
        )}

        <p className="text-sm leading-relaxed mb-3">{pergunta.texto}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{timeAgo(pergunta.created_at)}</span>

          <div className="flex items-center gap-0.5">
            {!isRespondida && (
              <Button
                variant="ghost"
                size="icon"
                disabled={loading}
                onClick={() => handle(() => onStatusChange(pergunta.id, 'respondida'))}
                title="Marcar como respondida"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <CheckCircle size={16} weight="duotone" />
              </Button>
            )}

            {isRespondida && (
              <Button
                variant="ghost"
                size="icon"
                disabled={loading}
                onClick={() => handle(() => onStatusChange(pergunta.id, 'pendente'))}
                title="Reabrir pergunta"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <ArrowCounterClockwise size={16} weight="duotone" />
              </Button>
            )}

            {!isRespondida && (
              <Button
                variant="ghost"
                size="icon"
                disabled={loading}
                onClick={() => handle(() => onStatusChange(
                  pergunta.id,
                  isDestacada ? 'pendente' : 'destacada'
                ))}
                title={isDestacada ? 'Remover destaque' : 'Destacar'}
                className={cn(
                  'h-8 w-8',
                  isDestacada
                    ? 'text-primary hover:text-primary'
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                <Star size={16} weight="duotone" />
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Deletar"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash size={16} weight="duotone" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deletar pergunta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handle(() => onDelete(pergunta.id))}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Verificar no browser**

Abrir http://localhost:3000/monitor:
- Cards de perguntas aparecem com visual shadcn
- Botões de ação funcionam (marcar respondida, destacar)
- Clicar no lixo abre AlertDialog de confirmação
- Confirmar deleta a pergunta

**Step 4: Commit**

```bash
git add src/components/monitor/question-item.tsx
git commit -m "feat: refactor question-item with shadcn Card, Button, Badge, AlertDialog"
```

---

### Task 8: Verificação final

**Step 1: Rodar o build de produção**

```bash
npm run build
```

Expected: build sem erros de TypeScript ou compilação.

**Step 2: Checar as duas páginas**

- http://localhost:3000 — página do aluno: select de sala, form de pergunta, feed de cards
- http://localhost:3000/monitor — página do monitor: header com select, lista de perguntas com botões de ação

**Step 3: Testar fluxo completo**

1. Selecionar sala na página do aluno
2. Digitar e enviar uma pergunta — toast sonner aparece
3. No monitor, a pergunta aparece em tempo real
4. Marcar como destacada — badge aparece
5. Marcar como respondida — card fica opaco
6. Deletar — AlertDialog aparece, confirmar deleta

**Step 4: Commit final**

```bash
git add -A
git commit -m "chore: verify shadcn redesign complete"
```
