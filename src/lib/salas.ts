export const SALAS = [
  { id: 'verdade-absoluta',  label: 'Verdade Absoluta' },
  { id: 'amando-deus',       label: 'Amando Deus no Mundo' },
  { id: 'familia-crista',    label: 'Família Cristã' },
  { id: 'doutrina',          label: 'Doutrina e Discipulado' },
  { id: 'primeira-pedro',    label: '1 Pedro' },
] as const;

export type SalaId = typeof SALAS[number]['id'];
