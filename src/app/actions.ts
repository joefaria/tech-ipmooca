'use server';

import { createServerClient } from '@/lib/supabase-server';
import { PerguntaStatus } from '@/types/pergunta';

export async function updatePerguntaStatus(id: string, status: PerguntaStatus) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('perguntas')
    .update({ status })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deletePergunta(id: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('perguntas')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
