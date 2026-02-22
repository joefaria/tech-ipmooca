'use client';

import { useState } from 'react';
import { Star, CheckCircle, Trash, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Pergunta, PerguntaStatus } from '@/types/pergunta';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn, timeAgo } from '@/lib/utils';

interface QuestionItemProps {
  pergunta: Pergunta;
  onStatusChange: (id: string, status: PerguntaStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function QuestionItem({ pergunta, onStatusChange, onDelete }: QuestionItemProps) {
  const [loading, setLoading] = useState(false);

  const isDestacada = pergunta.status === 'destacada';
  const isRespondida = pergunta.status === 'respondida';

  async function handle(action: () => Promise<void>) {
    setLoading(true);
    try { await action(); } finally { setLoading(false); }
  }

  return (
    <Card className={cn(
      'transition-all duration-200',
      isDestacada && 'border-primary/30 bg-primary/5',
      isRespondida && 'opacity-30'
    )}>
      <CardContent className="pt-4">
        {isDestacada && (
          <Badge variant="outline" className="mb-2 gap-1 border-primary/40 text-primary">
            <Star size={11} weight="duotone" />
            Destaque
          </Badge>
        )}

        <p className="text-sm leading-relaxed mb-3">{pergunta.texto}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{timeAgo(pergunta.created_at)}</span>

          <div className="flex items-center gap-0.5">
            {!isRespondida && (
              <Button
                variant="ghost"
                size="icon"
                disabled={loading}
                onClick={() => handle(() => onStatusChange(pergunta.id, 'respondida'))}
                title="Marcar como respondida"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <CheckCircle size={16} weight="duotone" />
              </Button>
            )}

            {isRespondida && (
              <Button
                variant="ghost"
                size="icon"
                disabled={loading}
                onClick={() => handle(() => onStatusChange(pergunta.id, 'pendente'))}
                title="Reabrir pergunta"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <ArrowCounterClockwise size={16} weight="duotone" />
              </Button>
            )}

            {!isRespondida && (
              <Button
                variant="ghost"
                size="icon"
                disabled={loading}
                onClick={() => handle(() => onStatusChange(
                  pergunta.id,
                  isDestacada ? 'pendente' : 'destacada'
                ))}
                title={isDestacada ? 'Remover destaque' : 'Destacar'}
                className={cn(
                  'h-8 w-8',
                  isDestacada
                    ? 'text-primary hover:text-primary'
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                <Star size={16} weight="duotone" />
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Deletar"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash size={16} weight="duotone" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deletar pergunta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handle(() => onDelete(pergunta.id))}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
