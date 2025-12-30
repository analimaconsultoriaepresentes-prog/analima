import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface GettingStartedStep {
  key: string;
  title: string;
  description: string;
  completed: boolean;
}

const STEPS: Omit<GettingStartedStep, 'completed'>[] = [
  {
    key: 'settings',
    title: 'Configurações iniciais',
    description: 'Configure o nome da sua loja, logo e preferências de alertas.',
  },
  {
    key: 'products',
    title: 'Cadastro de produtos',
    description: 'Adicione os produtos que você vende no seu estoque.',
  },
  {
    key: 'packaging',
    title: 'Cadastro de embalagens e extras',
    description: 'Cadastre embalagens, laços e itens extras para composição.',
  },
  {
    key: 'baskets',
    title: 'Criação de presentes/cestas',
    description: 'Monte cestas e kits combinando produtos e embalagens.',
  },
  {
    key: 'customers',
    title: 'Cadastro de clientes',
    description: 'Registre seus clientes para acompanhar vendas e aniversários.',
  },
  {
    key: 'sales',
    title: 'Registro de vendas',
    description: 'Registre sua primeira venda e acompanhe o faturamento.',
  },
];

export const useGettingStarted = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: progress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['getting-started-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('getting_started_progress')
        .select('step_key')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map((d) => d.step_key);
    },
    enabled: !!user?.id,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['getting-started-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('getting_started_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const completeStepMutation = useMutation({
    mutationFn: async (stepKey: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('getting_started_progress')
        .insert({ user_id: user.id, step_key: stepKey });
      if (error && error.code !== '23505') throw error; // Ignore duplicate key
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getting-started-progress'] });
    },
  });

  const uncompleteStepMutation = useMutation({
    mutationFn: async (stepKey: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('getting_started_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('step_key', stepKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getting-started-progress'] });
    },
  });

  const hideGuideMutation = useMutation({
    mutationFn: async (hidden: boolean) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data: existing } = await supabase
        .from('getting_started_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('getting_started_settings')
          .update({ hidden })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('getting_started_settings')
          .insert({ user_id: user.id, hidden });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getting-started-settings'] });
    },
  });

  const steps: GettingStartedStep[] = STEPS.map((step) => ({
    ...step,
    completed: progress.includes(step.key),
  }));

  const completedCount = steps.filter((s) => s.completed).length;
  const allCompleted = completedCount === steps.length;
  const isHidden = settings?.hidden ?? false;

  return {
    steps,
    completedCount,
    totalSteps: steps.length,
    allCompleted,
    isHidden,
    isLoading: progressLoading || settingsLoading,
    completeStep: completeStepMutation.mutate,
    uncompleteStep: uncompleteStepMutation.mutate,
    toggleStep: (stepKey: string, completed: boolean) => {
      if (completed) {
        uncompleteStepMutation.mutate(stepKey);
      } else {
        completeStepMutation.mutate(stepKey);
      }
    },
    hideGuide: () => hideGuideMutation.mutate(true),
    showGuide: () => hideGuideMutation.mutate(false),
  };
};
