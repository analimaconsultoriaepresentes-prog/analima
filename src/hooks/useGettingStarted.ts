import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';
import { Package, Users, Gift, ShoppingCart, LucideIcon } from 'lucide-react';

export interface GettingStartedStep {
  key: string;
  title: string;
  description: string;
  completed: boolean;
  route?: string;
  action?: 'navigate' | 'openGiftModal';
  buttonLabel: string;
  icon: LucideIcon;
}

interface StepDefinition {
  key: string;
  title: string;
  description: string;
  route?: string;
  action: 'navigate' | 'openGiftModal';
  buttonLabel: string;
  icon: LucideIcon;
}

const STEPS: StepDefinition[] = [
  {
    key: 'products',
    title: 'Cadastrar produtos',
    description: 'Adicione os produtos que você vende.',
    route: '/produtos',
    action: 'navigate',
    buttonLabel: 'Ir para Produtos',
    icon: Package,
  },
  {
    key: 'customers',
    title: 'Cadastrar clientes',
    description: 'Registre seus clientes para acompanhar vendas.',
    route: '/clientes',
    action: 'navigate',
    buttonLabel: 'Ir para Clientes',
    icon: Users,
  },
  {
    key: 'gift',
    title: 'Criar um presente',
    description: 'Monte uma cesta ou kit combinando produtos.',
    action: 'openGiftModal',
    buttonLabel: 'Criar Presente',
    icon: Gift,
  },
  {
    key: 'sales',
    title: 'Registrar uma venda',
    description: 'Registre sua primeira venda.',
    route: '/vendas',
    action: 'navigate',
    buttonLabel: 'Ir para Vendas',
    icon: ShoppingCart,
  },
];

export const useGettingStarted = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check if user has products
  const { data: hasProducts = false } = useQuery({
    queryKey: ['has-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { count, error } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('product_type', 'item')
        .is('deleted_at', null);
      if (error) return false;
      return (count || 0) > 0;
    },
    enabled: !!user?.id,
  });

  // Check if user has customers
  const { data: hasCustomers = false } = useQuery({
    queryKey: ['has-customers', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { count, error } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (error) return false;
      return (count || 0) > 0;
    },
    enabled: !!user?.id,
  });

  // Check if user has gifts/baskets
  const { data: hasGifts = false } = useQuery({
    queryKey: ['has-gifts', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { count, error } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('product_type', 'gift')
        .is('deleted_at', null);
      if (error) return false;
      return (count || 0) > 0;
    },
    enabled: !!user?.id,
  });

  // Check if user has sales
  const { data: hasSales = false } = useQuery({
    queryKey: ['has-sales', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { count, error } = await supabase
        .from('sales')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (error) return false;
      return (count || 0) > 0;
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

  // Build steps with auto-detected completion
  const getStepCompletion = (key: string): boolean => {
    switch (key) {
      case 'products':
        return hasProducts;
      case 'customers':
        return hasCustomers;
      case 'gift':
        return hasGifts;
      case 'sales':
        return hasSales;
      default:
        return false;
    }
  };

  const steps: GettingStartedStep[] = STEPS.map((step) => ({
    ...step,
    completed: getStepCompletion(step.key),
  }));

  const completedCount = steps.filter((s) => s.completed).length;
  const allCompleted = completedCount === steps.length;
  const isHidden = settings?.hidden ?? false;

  // Navigation handler
  const handleStepAction = (step: GettingStartedStep, openGiftModal?: () => void) => {
    if (step.action === 'navigate' && step.route) {
      navigate(step.route);
    } else if (step.action === 'openGiftModal' && openGiftModal) {
      openGiftModal();
    }
  };

  return {
    steps,
    completedCount,
    totalSteps: steps.length,
    allCompleted,
    isHidden,
    isLoading: settingsLoading,
    handleStepAction,
    hideGuide: () => hideGuideMutation.mutate(true),
    showGuide: () => hideGuideMutation.mutate(false),
  };
};
