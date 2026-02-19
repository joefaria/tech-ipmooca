# Design: Perguntas EBD

**Data:** 2026-02-19
**Status:** Aprovado

---

## Contexto

Aplicação web para permitir que alunos da Escola Bíblica Dominical (EBD) façam perguntas anônimas durante a aula. Há 5 salas simultâneas. O professor precisa de uma tela separada para gerenciar as perguntas em tempo real.

**Problema:** Alunos têm vergonha de perguntar em público. Uma interface anônima aumenta o engajamento e a qualidade da aula.

**Sucesso:** Professor consegue ver e gerenciar perguntas em tempo real durante a aula, sem depender de papel ou plataformas genéricas.

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Estilo | Tailwind CSS 4 |
| Ícones | Phosphor Icons (duotone) |
| Banco | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime (WebSocket) |
| Deploy | Vercel + domínio próprio |

Segue o mesmo padrão do projeto `agregador-links` já existente no monorepo.

---

## Salas

```ts
export const SALAS = [
  { id: 'verdade-absoluta',    label: 'Verdade Absoluta' },
  { id: 'amando-deus',         label: 'Amando Deus no Mundo' },
  { id: 'familia-crista',      label: 'Família Cristã' },
  { id: 'doutrina',            label: 'Doutrina e Discipulado' },
  { id: 'primeira-pedro',      label: '1 Pedro' },
] as const;
```

---

## Banco de Dados (Supabase)

```sql
CREATE TABLE perguntas (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  sala       text        NOT NULL,
  texto      text        NOT NULL CHECK (char_length(texto) <= 500),
  status     text        DEFAULT 'pendente'
             CHECK (status IN ('pendente', 'respondida', 'destacada')),
  created_at timestamptz DEFAULT now()
);

-- Índice para queries por sala
CREATE INDEX perguntas_sala_idx ON perguntas (sala);

-- RLS: qualquer um pode inserir (anônimo), mas não pode ler/atualizar/deletar
ALTER TABLE perguntas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_anonimo" ON perguntas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "select_publico" ON perguntas
  FOR SELECT USING (true);
-- UPDATE e DELETE só via service_role key (server-side)
```

---

## Rotas

| Rota | Quem acessa | Descrição |
|------|-------------|-----------|
| `/` | Alunos | Enviar pergunta + ver feed da sala |
| `/monitor` | Professores | Gerenciar perguntas em tempo real |

### Proteção `/monitor`
Query param `?key=MONITOR_PASSWORD` (verificado em middleware).
A senha fica em variável de ambiente `MONITOR_PASSWORD`.
Uma senha única para todos os professores — eles escolhem a sala no dropdown.

---

## Tela do Aluno (`/`)

### Layout (mobile-first)

```
┌────────────────────────────┐
│  ○ EBD — Perguntas         │  ← header minimalista
├────────────────────────────┤
│                            │
│  [Selecione sua sala  ▾]   │  ← dropdown, persiste no localStorage
│                            │
│  ┌──────────────────────┐  │
│  │ Escreva sua pergunta │  │  ← textarea, max 500 chars
│  │                 247  │  │  ← contador regressivo
│  └──────────────────────┘  │
│                            │
│      [  Enviar  →  ]       │  ← botão, desabilitado sem sala selecionada
│                            │
├────────────────────────────┤
│  Perguntas desta sala (12) │
│                            │
│  ★ Card destacado          │  ← borda colorida, topo do feed
│  "Como..."                 │
│  há 2 min                  │
│                            │
│  Card normal               │
│  "Qual..."      ✓          │  ← check = respondida, opacity 50%
│  há 5 min                  │
└────────────────────────────┘
```

### Comportamento
- Sala selecionada persiste em `localStorage`
- Após enviar: campo limpa, toast de sucesso (2s), feed atualiza via Realtime
- Feed filtrado pela sala selecionada
- Perguntas `destacada` ficam no topo (ordenadas por `status = 'destacada' DESC, created_at DESC`)
- Perguntas `respondida`: opacity 50%, ícone check, aparecem abaixo das pendentes
- Anonimato total — sem cookies, sem IP, sem identificação

---

## Tela do Monitor (`/monitor`)

### Layout

```
┌─────────────────────────────────────────┐
│  Monitor EBD   [Verdade Absoluta  ▾] 🟢 │  ← status realtime
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ ★ DESTAQUE                        │  │  ← card destacado
│  │ "Como posso saber se estou salvo?"│  │
│  │ há 3 min                          │  │
│  │ [✓ Respondida] [☆ Remover dest.] │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ "O que significa o novo nascimt." │  │  ← card pendente
│  │ há 7 min                          │  │
│  │ [✓ Respondida] [★ Destacar] [✕]  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ── Respondidas ──────────────────────  │  ← seção colapsável
│  (3 perguntas respondidas)              │
└─────────────────────────────────────────┘
```

### Ações do professor
- **Destacar:** status → `destacada`, move ao topo do feed do aluno
- **Respondida:** status → `respondida`, vai para seção colapsada
- **Deletar:** confirmação inline (sem modal), remove do banco
- Novas perguntas entram no topo com animação suave (via Realtime)

### Segurança
- Ações de UPDATE/DELETE via Next.js Server Actions (service key no servidor)
- Alunos não têm acesso à service key
- Sem autenticação pesada — a senha via query param é suficiente para EBD

---

## Componentes

```
src/
├── app/
│   ├── page.tsx                    # Tela do aluno
│   ├── monitor/
│   │   └── page.tsx                # Tela do monitor
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── badge.tsx
│   ├── student/
│   │   ├── sala-selector.tsx       # Dropdown de seleção de sala
│   │   ├── question-form.tsx       # Formulário de envio
│   │   └── question-card.tsx       # Card no feed do aluno
│   └── monitor/
│       ├── monitor-header.tsx      # Header com dropdown + status
│       └── question-item.tsx       # Item com ações do professor
├── lib/
│   ├── supabase.ts                 # Supabase client (anon key)
│   ├── supabase-server.ts          # Supabase client (service key, server-only)
│   └── salas.ts                    # Constante SALAS
├── types/
│   └── pergunta.ts                 # Tipo Pergunta
└── middleware.ts                   # Protege /monitor com query key
```

---

## Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # Nunca exposta ao cliente
MONITOR_PASSWORD=senhaSecretaAqui
```

---

## Design System

- **Tipografia:** Inter (next/font)
- **Cores:** Preto/branco puros + um accent color suave (azul índigo ou slate)
- **Ícones:** Phosphor Icons duotone
- **Estilo:** Apple-like — margens generosas, bordas suaves, sombras sutis
- **Animações:** Framer Motion para entrada de cards no feed
- **Tema:** Light mode only (contexto de sala de aula, projetor)

---

## Verificação / Teste

1. `npm run dev` — abre `localhost:3000`
2. Seleciona uma sala, digita pergunta, envia → confirma toast e card aparece no feed
3. Abre `/monitor?key=senhaSecreta` em outra aba → confirma que a pergunta aparece
4. Clica "Destacar" no monitor → confirma que aparece com borda no feed do aluno
5. Clica "Respondida" → confirma que vai para seção colapsada no monitor e fica com opacity 50% no aluno
6. Clica "Deletar" → confirma que some do feed do aluno em tempo real
7. Build: `npm run build` — sem erros TypeScript
