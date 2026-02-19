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
        ? 'border-indigo-300 bg-indigo-50 shadow-sm'
        : 'border-gray-100 bg-white'
      }
      ${isRespondida ? 'opacity-50' : 'opacity-100'}
    `}>
      {isDestacada && (
        <div className="flex items-center gap-1.5 mb-2">
          <Star size={14} weight="duotone" className="text-indigo-500" />
          <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Destaque</span>
        </div>
      )}
      <p className="text-gray-900 text-base leading-relaxed">{pergunta.texto}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">{timeAgo(pergunta.created_at)}</span>
        {isRespondida && (
          <CheckCircle size={16} weight="duotone" className="text-green-500" />
        )}
      </div>
    </div>
  );
}
