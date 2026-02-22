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
