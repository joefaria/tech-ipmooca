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
