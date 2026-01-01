import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';
import { Package, Users, Gift, ShoppingCart, Settings, PackageOpen, LucideIcon } from 'lucide-react';

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
    key: 'settings',
    title: 'Configurações iniciais',
    description: 'Confira se o nome da loja, as mensagens e os alertas estão do jeito que você deseja.',
    route: '/configuracoes',
    action: 'navigate',
    buttonLabel: 'Ir para Configurações',
    icon: Settings,
  },
  {
    key: 'products',
    title: 'Cadastrar produtos',
    description: 'Cadastre seus perfumes, cosméticos e lembrancinhas com preço, custo e estoque.',
    route: '/produtos',
    action: 'navigate',
    buttonLabel: 'Ir para Produtos',
    icon: Package,
  },
  {
    key: 'packaging',
    title: 'Cadastrar embalagens e extras',
    description: 'Cadastre sacolas, caixas, laços e outros itens usados para montar presentes. Esses itens não aparecem nas vendas.',
    route: '/produtos',
    action: 'navigate',
    buttonLabel: 'Ir para Produtos',
    icon: PackageOpen,
  },
  {
    key: 'gift',
    title: 'Criar presentes / cestas',
    description: 'Monte seus kits, cestas e presentes juntando produtos, embalagens e extras, e defina o preço para o cliente.',
    action: 'openGiftModal',
    buttonLabel: 'Criar Presente',
    icon: Gift,
  },
  {
    key: 'customers',
    title: 'Cadastrar clientes',
    description: 'Cadastre seus clientes para facilitar as vendas e receber lembretes de aniversário.',
    route: '/clientes',
    action: 'navigate',
    buttonLabel: 'Ir para Clientes',
    icon: Users,
  },
  {
    key: 'sales',
    title: 'Registrar vendas',
    description: 'Registre suas vendas do dia, escolhendo o cliente, o produto e a forma de pagamento.',
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

  // Check if user has store settings configured
  const { data: hasSettings = false } = useQuery({
    queryKey: ['has-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from('stores')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) return false;
      // Consider configured if store exists and has a name
      return !!data?.name;
    },
    enabled: !!user?.id,
  });

  // Check if user has products (items only)
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

  // Check if user has packaging/extras
  const { data: hasPackaging = false } = useQuery({
    queryKey: ['has-packaging', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { count, error } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('product_type', ['packaging', 'extra'])
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
      case 'settings':
        return hasSettings;
      case 'products':
        return hasProducts;
      case 'packaging':
        return hasPackaging;
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
