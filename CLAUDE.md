# Perguntas EBD — CLAUDE.md

App de perguntas anônimas para a Escola Bíblica Dominical da Igreja Presbiteriana da Mooca.

## Rodando localmente

```bash
cd /Users/jonatasfaria/astra/projetos/perguntas-ebd
npm run dev        # http://localhost:3000
npm run build      # build de produção
npx tsc --noEmit   # check de tipos
```

## Deploy

O Vercel está conectado ao repo **`joefaria/tech-ipmooca`**, não ao `joefaria/astra`.

**Nunca usar `git push` direto** — o push vai para o monorepo (`astra`) mas não chega no Vercel.

Comando correto de deploy (rodar da raiz do monorepo):

```bash
cd /Users/jonatasfaria/astra
git subtree push --prefix=projetos/perguntas-ebd tech-ipmooca main
```

O Vercel faz o deploy automaticamente após o push para `tech-ipmooca`.

## Variáveis de ambiente

Copiar `.env.example` para `.env.local` e preencher com as chaves do Supabase.

| Variável | Onde encontrar | Usado em |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | cliente e servidor |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | cliente (sujeito a RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | server actions (bypassa RLS) |

As três variáveis também precisam estar configuradas no painel do Vercel (Settings → Environment Variables).

## Stack

- **Next.js 16** App Router
- **Tailwind v4** + shadcn/ui
- **Supabase** — banco de dados + Realtime
- **Framer Motion** — animações
- **Phosphor Icons** (`@phosphor-icons/react`)
- **next-themes** — modo claro/escuro
- **Sonner** — toasts

## Estrutura de arquivos

```
src/
  app/
    page.tsx              # Página do aluno (pública)
    professor/page.tsx    # Monitor do professor (com login)
    actions.ts            # Server actions: updatePerguntaStatus, deletePergunta
    layout.tsx            # ThemeProvider + Toaster
  components/
    student/
      question-form.tsx   # Formulário de envio de pergunta
      question-card.tsx   # Card de pergunta (visão aluno)
      sala-selector.tsx   # Seletor de sala
    monitor/
      monitor-header.tsx  # Header do professor (sala + tema + logout)
      question-item.tsx   # Item de pergunta com ações (status + delete)
    shared/
      theme-provider.tsx  # Wrapper next-themes
    ui/                   # Componentes shadcn
  lib/
    supabase.ts           # Cliente anon (RLS ativo)
    supabase-server.ts    # Cliente service role (bypassa RLS)
    salas.ts              # Lista e tipo das salas
    professores.ts        # Lista de professores e função autenticar()
    utils.ts              # cn() + timeAgo()
  types/
    pergunta.ts           # Interface Pergunta e PerguntaStatus
```

## Supabase — tabela `perguntas`

| Coluna | Tipo | Default |
|---|---|---|
| `id` | uuid | gen_random_uuid() |
| `sala` | text | — |
| `texto` | text | — |
| `status` | text | 'pendente' |
| `created_at` | timestamptz | now() |

**RLS:** INSERT aberto para anon. SELECT aberto para anon (necessário para carregar perguntas). UPDATE e DELETE apenas via service role (server actions).

**Realtime:** Publicação habilitada na tabela `perguntas` para que mudanças de status e novos inserts apareçam em tempo real no monitor do professor.

> **Atenção:** Nunca usar `.select()` encadeado ao `.insert()` no cliente anon. O PostgREST aplica a política RLS de SELECT ao `RETURNING` da transação — se a política bloquear, o INSERT inteiro falha com 401.

## Salas

Definidas em `src/lib/salas.ts`. Para adicionar ou remover uma sala, editar o array `SALAS`. O `SalaId` é inferido automaticamente do array.

## Professores e autenticação

Definidos em `src/lib/professores.ts`. A senha de cada professor é a **chave do objeto** em `PROFESSORES` (ex: `jonatasfaria`). A autenticação é feita no cliente via `autenticar(senha)` — sem banco de dados, sem JWT.

Professores com `isAdmin: true` podem trocar de sala no monitor. Professores normais ficam fixos na sala configurada.

Para adicionar professor: inserir entrada no objeto `PROFESSORES` com nome, sala e isAdmin. O deploy atualiza automaticamente.

## Arquitetura de atualizações em tempo real

- **Aluno envia pergunta:** INSERT no Supabase → optimistic update local imediato (`temp-{timestamp}`) → Realtime substitui pelo registro real quando chega
- **Professor muda status:** optimistic update local → server action → Realtime propaga para outros monitores abertos
- **Professor deleta:** optimistic update local → server action → Realtime propaga DELETE para outros monitores
- **Realtime desconectado:** botão "Tentar reconectar" aparece no monitor quando `connected === false`

## Theme toggle

Sempre usar `resolvedTheme` (não `theme`) do `useTheme()` para comparar o tema atual. O `theme` retorna `'system'` por padrão, quebrando a lógica de toggle.

```ts
const { resolvedTheme, setTheme } = useTheme();
onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
```
