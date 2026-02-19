export type PerguntaStatus = 'pendente' | 'respondida' | 'destacada';

export interface Pergunta {
  id: string;
  sala: string;
  texto: string;
  status: PerguntaStatus;
  created_at: string;
}
