import { CheckCircle, Star } from '@phosphor-icons/react';
import { Pergunta } from '@/types/pergunta';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, timeAgo } from '@/lib/utils';

interface QuestionCardProps {
  pergunta: Pergunta;
}

export function QuestionCard({ pergunta }: QuestionCardProps) {
  const isDestacada = pergunta.status === 'destacada';
  const isRespondida = pergunta.status === 'respondida';

  return (
    <Card className={cn(
      'transition-all duration-300',
      isDestacada && 'border-primary/30 bg-primary/5',
      isRespondida && 'opacity-40'
    )}>
      <CardContent className="pt-4">
        {isDestacada && (
          <Badge variant="outline" className="mb-2 gap-1 border-primary/40 text-primary">
            <Star size={11} weight="duotone" />
            Destaque
          </Badge>
        )}
        <p className="text-sm leading-relaxed">{pergunta.texto}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">{timeAgo(pergunta.created_at)}</span>
          {isRespondida && (
            <CheckCircle size={14} weight="duotone" className="text-primary" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
