# shadcn Redesign — Design Document

**Data:** 2026-02-20
**Status:** Aprovado

## Objetivo

Redesign completo do projeto perguntas-ebd usando shadcn/ui como foundation visual. Mapear tokens CSS do projeto para as variáveis shadcn e refatorar todos os componentes para usar primitivos shadcn (`Button`, `Card`, `Textarea`, `Select`, `Badge`, `AlertDialog`). Referência visual: Linear/Vercel — dark, denso, técnico.

## Abordagem

**Opção A — shadcn tokens como foundation**
- Mapear cores do projeto para variáveis CSS shadcn (`:root` e `.dark` idênticos — projeto é always-dark)
- Refatorar componentes para usar primitivos shadcn via tokens, sem classes inline de cor
- Lógica de negócio, Supabase, Framer Motion e Phosphor icons permanecem intactos

## Tokens CSS (globals.css)

```css
--background:          oklch(0.07 0 0)       /* #111 */
--foreground:          oklch(0.94 0 0)       /* #f0f0f0 */
--card:                oklch(0.10 0 0)       /* #191919 */
--card-foreground:     oklch(0.94 0 0)
--border:              oklch(0.18 0 0)       /* #2a2a2a */
--input:               oklch(0.13 0 0)       /* #1e1e1e */
--muted:               oklch(0.13 0 0)
--muted-foreground:    oklch(0.50 0 0)       /* #888 */
--primary:             oklch(0.70 0.18 143)  /* #6abf4a verde */
--primary-foreground:  oklch(0.07 0 0)
--ring:                oklch(0.70 0.18 143)
--destructive:         oklch(0.63 0.22 29)   /* vermelho */
```

`:root` e `.dark` idênticos.

## Arquivos modificados

| Arquivo | O que muda |
|---|---|
| `src/app/globals.css` | Substituir tokens shadcn pelos valores do tema dark acima |
| `src/components/student/sala-selector.tsx` | `<select>` nativo → `<Select>` shadcn |
| `src/components/student/question-form.tsx` | `<textarea>` + `<button>` nativos → `<Textarea>` + `<Button>` shadcn; `<Toast>` customizado → sonner `toast.success()` |
| `src/components/student/question-card.tsx` | Envolver em `<Card>` shadcn; badge "Destaque" → `<Badge>`; remover classes inline de cor |
| `src/components/monitor/monitor-header.tsx` | `<select>` nativo → `<Select>` shadcn |
| `src/components/monitor/question-item.tsx` | Envolver em `<Card>`; botões de ação → `<Button variant="ghost" size="icon">`; badge → `<Badge>`; confirmação delete → `<AlertDialog>` |
| `src/components/ui/toast.tsx` | Deletar — substituído por sonner |
| `src/app/layout.tsx` | Adicionar `<Toaster>` do sonner |

## O que NÃO muda

- Lógica de negócio (Supabase, realtime, status de perguntas)
- Framer Motion (animações de lista e entrada)
- Phosphor icons
- Estrutura de páginas (page.tsx de student e monitor)
- Types, lib, actions
