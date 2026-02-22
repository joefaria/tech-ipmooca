# Design — Auth Professor + Dark Mode + Fixes
**Data:** 2026-02-22
**Projeto:** perguntas-ebd

---

## 1. Autenticação `/professor`

### Fluxo de login
- Página `/professor` com campo de senha único e botão "Entrar"
- Cabeçalho visual: título "Perguntas EBD" + subtítulo "acesso do professor"
- Nenhum dropdown de nome — o sistema identifica o professor pela senha
- Ao autenticar, salva em `localStorage`: `{ nome, sala }` do professor logado
- Se não autenticado e acessar `/professor`, permanece na tela de login
- Botão de logout no header do monitor

### Mapeamento senha → professor → sala

| Senha | Nome | Sala |
|---|---|---|
| `jonatasfaria` | Jonatas Faria | Verdade Absoluta |
| `danielmedeiros` | Daniel Medeiros | Verdade Absoluta |
| `guilhermeparize` | Guilherme Parize | Verdade Absoluta |
| `agnaldofaria` | Agnaldo Faria | 1 Pedro |
| `joaomarcoscazula` | João Marcos Cazula | 1 Pedro |
| `elievaristo` | Eli Evaristo | Doutrina e Discipulado |
| `eliezermendes` | Eliezer Mendes | Doutrina e Discipulado |
| `itamarcarvalho` | Itamar Carvalho | Doutrina e Discipulado |
| `enzomatsumoto` | Enzo Matsumoto | Amando Deus no Mundo |
| `joaopedrofaria` | João Pedro Faria | Amando Deus no Mundo |
| `lucascazula` | Lucas Cazula | Amando Deus no Mundo |
| `flavioamerico` | Flávio Américo | Família Cristã |
| `mauriciopitorri` | Maurício Pitorri | Família Cristã |

### Admins (acesso multi-sala)
- `jonatasfaria` e `agnaldofaria` têm dropdown para trocar entre todas as salas
- Demais professores: sala fixada automaticamente, sem opção de troca

### Proteção de rota
- `src/middleware.ts` (renomear `proxy.ts`) protege `/professor`
- Verificação via cookie ou query param simples (manter mecanismo atual do proxy.ts adaptado)
- Rota `/monitor` antiga pode ser removida ou redirecionada para `/professor`

---

## 2. Bug fixes

### Toast de erro no formulário do aluno
- Arquivo: `src/components/student/question-form.tsx`
- Adicionar `toast.error('Erro ao enviar pergunta. Tente novamente.')` no bloco `if (error)`

### Rollback otimista no monitor
- Arquivo: `src/app/monitor/page.tsx` (após migrar para `/professor`)
- Em `handleStatusChange` e `handleDelete`: guardar estado anterior, reverter se Server Action falhar, exibir `toast.error()`

---

## 3. Dark / Light mode toggle

- Botão sol/lua com `@phosphor-icons/react` (Sun / Moon)
- Posicionado no header da página do aluno E no header do monitor
- Usa `useTheme()` do `next-themes` (já instalado e configurado)
- Corrigir cores hardcoded em `page.tsx` e `monitor/page.tsx`:
  - `bg-[#0a0a0a]` → `bg-background`
  - `#888`, `#f0f0f0`, etc. → tokens do design system (`text-muted-foreground`, `text-foreground`, etc.)

---

## 4. Limpeza de código

- Remover pacotes não usados: `lucide-react`, `react-hook-form`, `@hookform/resolvers`, `zod`
- Remover `src/components/ui/form.tsx` (depende de react-hook-form)
- Extrair `timeAgo()` duplicada para `src/lib/utils.ts`
- Remover `src/proxy.ts` após criar `src/middleware.ts`
- Rota `/monitor` pode ser mantida como redirect para `/professor` ou removida

---

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| `src/app/professor/page.tsx` | Criar — página de login |
| `src/app/professor/monitor/page.tsx` | Criar — painel do monitor autenticado |
| `src/lib/professores.ts` | Criar — mapeamento senha→professor→sala + lista de salas |
| `src/middleware.ts` | Criar (baseado em proxy.ts) — proteger `/professor/monitor` |
| `src/proxy.ts` | Remover |
| `src/app/monitor/` | Remover ou redirecionar |
| `src/components/monitor/monitor-header.tsx` | Atualizar — logout + dark mode toggle |
| `src/components/student/question-form.tsx` | Fix — toast de erro |
| `src/app/page.tsx` | Fix — cores + dark mode toggle |
| `src/lib/utils.ts` | Adicionar `timeAgo()` |
| `src/components/student/question-card.tsx` | Usar `timeAgo` de utils |
| `src/components/monitor/question-item.tsx` | Usar `timeAgo` de utils |
| `package.json` | Remover dependências não usadas |
