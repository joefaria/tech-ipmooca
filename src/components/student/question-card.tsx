import { CheckCircle, Star } from '@phosphor-icons/react';
import { Pergunta } from '@/types/pergunta';

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
    <div className={`p-4 rounded-2xl border transition-all duration-300
      ${isDestacada
        ? 'border-[#6abf4a44] bg-[#6abf4a0d]'
        : 'border-[#1e1e1e] bg-[#141414]'
      }
      ${isRespondida ? 'opacity-40' : 'opacity-100'}
    `}>
      {isDestacada && (
        <div className="flex items-center gap-1.5 mb-2">
          <Star size={13} weight="duotone" className="text-[#6abf4a]" />
          <span className="text-xs font-medium text-[#6abf4a] uppercase tracking-wide">Destaque</span>
        </div>
      )}
      <p className="text-[#e8e8e8] text-base leading-relaxed">{pergunta.texto}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-[#444]">{timeAgo(pergunta.created_at)}</span>
        {isRespondida && (
          <CheckCircle size={15} weight="duotone" className="text-[#6abf4a]" />
        )}
      </div>
    </div>
  );
}
