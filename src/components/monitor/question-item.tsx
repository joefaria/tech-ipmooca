'use client';

import { useState } from 'react';
import { Star, CheckCircle, Trash, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Pergunta, PerguntaStatus } from '@/types/pergunta';

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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDestacada = pergunta.status === 'destacada';
  const isRespondida = pergunta.status === 'respondida';

  async function handle(action: () => Promise<void>) {
    setLoading(true);
    try { await action(); } finally { setLoading(false); }
  }

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-200
      ${isDestacada
        ? 'border-[#6abf4a44] bg-[#6abf4a0d]'
        : 'border-[#2a2a2a] bg-[#141414]'
      }
      ${isRespondida ? 'opacity-30' : 'opacity-100'}
    `}>
      {isDestacada && (
        <div className="flex items-center gap-1.5 mb-2">
          <Star size={13} weight="duotone" className="text-[#6abf4a]" />
          <span className="text-xs font-semibold text-[#6abf4a] uppercase tracking-wider">Destaque</span>
        </div>
      )}

      <p className="text-[#e8e8e8] text-base leading-relaxed mb-3">{pergunta.texto}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[#555]">{timeAgo(pergunta.created_at)}</span>

        <div className="flex items-center gap-0.5">

          {/* Marcar respondida */}
          {!isRespondida && (
            <button
              disabled={loading}
              onClick={() => handle(() => onStatusChange(pergunta.id, 'respondida'))}
              title="Marcar como respondida"
              className="p-2 rounded-xl text-[#555] hover:text-[#6abf4a] hover:bg-[#6abf4a11] transition-all duration-150 disabled:opacity-40"
            >
              <CheckCircle size={17} weight="duotone" />
            </button>
          )}

          {/* Reabrir */}
          {isRespondida && (
            <button
              disabled={loading}
              onClick={() => handle(() => onStatusChange(pergunta.id, 'pendente'))}
              title="Reabrir pergunta"
              className="p-2 rounded-xl text-[#555] hover:text-[#e8e8e8] hover:bg-[#2a2a2a] transition-all duration-150 disabled:opacity-40"
            >
              <ArrowCounterClockwise size={17} weight="duotone" />
            </button>
          )}

          {/* Destacar / remover destaque */}
          {!isRespondida && (
            <button
              disabled={loading}
              onClick={() => handle(() => onStatusChange(
                pergunta.id,
                isDestacada ? 'pendente' : 'destacada'
              ))}
              title={isDestacada ? 'Remover destaque' : 'Destacar'}
              className={`p-2 rounded-xl transition-all duration-150 disabled:opacity-40
                ${isDestacada
                  ? 'text-[#6abf4a] hover:bg-[#6abf4a22]'
                  : 'text-[#555] hover:text-[#6abf4a] hover:bg-[#6abf4a11]'
                }`}
            >
              <Star size={17} weight="duotone" />
            </button>
          )}

          {/* Deletar */}
          {confirmDelete ? (
            <div className="flex items-center gap-1 ml-1">
              <button
                disabled={loading}
                onClick={() => handle(() => onDelete(pergunta.id))}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-[#555] hover:text-[#888] hover:bg-[#2a2a2a] transition-all"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Deletar"
              className="p-2 rounded-xl text-[#555] hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
            >
              <Trash size={17} weight="duotone" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
