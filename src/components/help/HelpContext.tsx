import { createContext, useContext, useState, ReactNode, useCallback, useRef } from "react";

export interface HelpTopic {
  id: string;
  title: string;
  content: string;
  icon?: string;
}

// Contextual bubble messages by page - more active microcopy
export const bubbleMessages: Record<string, string[]> = {
  dashboard: [
    "Quer uma ajudinha? 😊",
    "Posso te explicar esses números!",
  ],
  produtos: [
    "Ficou em dúvida? 💡",
    "Quer que eu explique?",
    "PROVE, Pix, Cartão... tô aqui!",
  ],
  vendas: [
    "Precisa de uma mãozinha? 🛒",
    "Ficou em dúvida?",
    "Quer ajuda com a venda?",
  ],
  despesas: [
    "Isso é um gasto fixo? 🤔",
    "Posso te ajudar a entender!",
    "Ficou em dúvida?",
  ],
  clientes: [
    "Quer organizar seus clientes? 💜",
    "Posso ajudar!",
  ],
  contas: [
    "Pagar ou receber? 💸",
    "Ficou em dúvida?",
  ],
  configuracoes: [
    "Personalize sua loja! ✨",
    "Precisa de ajuda?",
  ],
  relatorios: [
    "Quer entender seus números? 📊",
    "Posso explicar!",
  ],
  geral: [
    "Quer uma ajudinha? 😊",
    "Ficou em dúvida?",
    "Tô aqui pra ajudar! 💜",
  ],
};

// Pages that have potentially confusing fields - mascot should pulse on first visit
export const complexPages = ["produtos", "vendas", "despesas"];

// Contextual help content organized by page/feature
export const helpTopics: Record<string, HelpTopic[]> = {
  dashboard: [
    {
      id: "dashboard-intro",
      title: "Painel Principal",
      content: "Aqui você vê um resumo rápido de como está sua loja: vendas do dia, lucro e estoque. Tudo num só lugar!",
    },
    {
      id: "dashboard-stats",
      title: "Números do Dia",
      content: "Os cards coloridos mostram seus resultados de hoje. Roxo é vendas, violeta é dinheiro, e rosa é estoque.",
    },
  ],
  vendas: [
    {
      id: "vendas-intro",
      title: "Registrar Vendas",
      content: "Aqui você registra cada venda da loja. Escolha os produtos, a forma de pagamento e pronto!",
    },
    {
      id: "vendas-pix",
      title: "Preço Pix",
      content: "É o valor que você cobra quando o cliente paga por Pix. Geralmente é menor porque não tem taxa.",
    },
    {
      id: "vendas-cartao",
      title: "Preço Cartão",
      content: "É o valor quando o cliente paga no cartão (crédito ou débito). Pode ser um pouco maior por causa das taxas.",
    },
    {
      id: "vendas-doacao",
      title: "Doação",
      content: "Use para registrar produtos doados. Sai do estoque, mas não entra dinheiro no caixa.",
    },
  ],
  produtos: [
    {
      id: "produtos-intro",
      title: "Seus Produtos",
      content: "Aqui ficam todos os produtos da loja. Você pode adicionar novos, editar preços e controlar o estoque.",
    },
    {
      id: "produtos-prove",
      title: "PROVE",
      content: "PROVE é o produto separado para amostra ou demonstração. Ele sai do estoque de venda, mas não entra no caixa. Ótimo para produtos de teste!",
    },
    {
      id: "produtos-cesta",
      title: "Cestas",
      content: "Cestas são combos de produtos vendidos juntos. Quando você vende uma cesta, o sistema desconta automaticamente cada item do estoque.",
    },
    {
      id: "produtos-ciclo",
      title: "Ciclo",
      content: "É o número do catálogo ou revista onde o produto aparece. Ajuda a organizar produtos por temporada.",
    },
  ],
  despesas: [
    {
      id: "despesas-intro",
      title: "Controle de Gastos",
      content: "Registre aqui tudo que você gasta para manter a loja funcionando: aluguel, luz, materiais, etc.",
    },
    {
      id: "despesas-recorrente",
      title: "Despesa Recorrente",
      content: "São gastos que se repetem todo mês, como aluguel ou internet. O sistema cria automaticamente para você!",
    },
    {
      id: "despesas-status",
      title: "Paga ou Pendente",
      content: "Marque como 'Paga' quando já pagou. 'Pendente' são as contas que ainda precisa pagar.",
    },
  ],
  clientes: [
    {
      id: "clientes-intro",
      title: "Seus Clientes",
      content: "Cadastre seus clientes para lembrar deles, ver histórico de compras e não esquecer dos aniversários!",
    },
    {
      id: "clientes-aniversario",
      title: "Aniversários",
      content: "O sistema avisa quando um cliente faz aniversário. Ótima oportunidade para mandar uma mensagem especial!",
    },
  ],
  geral: [
    {
      id: "geral-lucro",
      title: "Lucro",
      content: "É quanto você ganha de verdade: o preço de venda menos o custo do produto. O que sobra no bolso!",
    },
    {
      id: "geral-estoque",
      title: "Estoque",
      content: "Quantidade de produtos disponíveis para venda. Quando zera, o produto fica indisponível.",
    },
    {
      id: "geral-margem",
      title: "Margem",
      content: "É a porcentagem de lucro sobre a venda. Quanto maior, melhor para o seu negócio!",
    },
  ],
};

// Field-specific tooltips
export const fieldTooltips: Record<string, string> = {
  prove: "PROVE é o produto separado para amostra. Ele sai do estoque de venda, mas não entra no caixa.",
  pricePix: "Preço quando o cliente paga por Pix. Geralmente menor porque não tem taxa de máquina.",
  priceCard: "Preço no cartão (crédito/débito). Pode ser maior para cobrir a taxa da maquininha.",
  despesas: "São todos os gastos do seu negócio: aluguel, luz, materiais, etc.",
  recorrente: "Despesa que se repete todo mês automaticamente, como aluguel ou internet.",
  estoque: "Quantidade de produtos disponíveis para vender.",
  ciclo: "Número do catálogo ou revista onde o produto aparece.",
  doacao: "Produto doado sai do estoque, mas não gera receita no caixa.",
  cesta: "Combo de produtos vendidos juntos com preço especial.",
  lucro: "Quanto você ganha: preço de venda menos o custo do produto.",
  margem: "Porcentagem de lucro sobre cada venda.",
  custo: "Quanto você pagou pelo produto ao fornecedor.",
  disponivel: "Estoque menos produtos em PROVE. É o que pode ser vendido.",
};

// Contextual micro-interaction messages
export const contextualMessages = {
  emptyCart: "Escolha um produto pra começar 😊",
  validationError: "Ops, faltou um detalhe aqui 😊",
};

interface HelpContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  activeTooltip: string | null;
  setActiveTooltip: (tooltip: string | null) => void;
  shouldPulse: boolean;
  triggerPulse: () => void;
  stopPulse: () => void;
  visitedPages: Set<string>;
  markPageVisited: (page: string) => void;
  bubbleMessage: string | null;
  showBubble: (message?: string) => void;
  hideBubble: () => void;
  showContextualHelp: (key: keyof typeof contextualMessages) => void;
  contextualShownThisSession: Set<string>;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

const BUBBLE_COOLDOWN = 30000; // 30 seconds minimum between bubbles
const CONTEXTUAL_BUBBLE_DURATION = 3500; // Contextual messages show for 3.5 seconds
const BUBBLE_DURATION = 4000; // Show bubble for 4 seconds

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [shouldPulse, setShouldPulse] = useState(false);
  const [visitedPages, setVisitedPages] = useState<Set<string>>(new Set());
  const [bubbleMessage, setBubbleMessage] = useState<string | null>(null);
  const [contextualShownThisSession] = useState<Set<string>>(new Set());
  const lastBubbleTimeRef = useRef<number>(0);
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerPulse = useCallback(() => {
    setShouldPulse(true);
  }, []);

  const stopPulse = useCallback(() => {
    setShouldPulse(false);
  }, []);

  const markPageVisited = useCallback((page: string) => {
    setVisitedPages((prev) => new Set(prev).add(page));
  }, []);

  const hideBubble = useCallback(() => {
    setBubbleMessage(null);
    if (bubbleTimeoutRef.current) {
      clearTimeout(bubbleTimeoutRef.current);
      bubbleTimeoutRef.current = null;
    }
  }, []);

  const showBubble = useCallback((message?: string) => {
    const now = Date.now();
    
    // Check cooldown to avoid repetition
    if (now - lastBubbleTimeRef.current < BUBBLE_COOLDOWN) {
      return;
    }

    // Get message from page-specific or general
    const pageMessages = bubbleMessages[currentPage] || bubbleMessages.geral;
    const selectedMessage = message || pageMessages[Math.floor(Math.random() * pageMessages.length)];

    lastBubbleTimeRef.current = now;
    setBubbleMessage(selectedMessage);

    // Auto-hide after duration
    if (bubbleTimeoutRef.current) {
      clearTimeout(bubbleTimeoutRef.current);
    }
    bubbleTimeoutRef.current = setTimeout(() => {
      setBubbleMessage(null);
    }, BUBBLE_DURATION);
  }, [currentPage]);

  // Show contextual help message (e.g., empty cart, validation error)
  // Shows only once per session for "emptyCart" type, always for errors
  const showContextualHelp = useCallback((key: keyof typeof contextualMessages) => {
    // For empty cart, show only once per session
    if (key === "emptyCart" && contextualShownThisSession.has(key)) {
      return;
    }

    const message = contextualMessages[key];
    if (!message) return;

    // Mark as shown for session tracking
    contextualShownThisSession.add(key);

    setBubbleMessage(message);

    // Auto-hide after shorter duration
    if (bubbleTimeoutRef.current) {
      clearTimeout(bubbleTimeoutRef.current);
    }
    bubbleTimeoutRef.current = setTimeout(() => {
      setBubbleMessage(null);
    }, CONTEXTUAL_BUBBLE_DURATION);
  }, [contextualShownThisSession]);

  return (
    <HelpContext.Provider
      value={{
        isOpen,
        setIsOpen,
        currentPage,
        setCurrentPage,
        activeTooltip,
        setActiveTooltip,
        shouldPulse,
        triggerPulse,
        stopPulse,
        visitedPages,
        markPageVisited,
        bubbleMessage,
        showBubble,
        hideBubble,
        showContextualHelp,
        contextualShownThisSession,
      }}
    >
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (context === undefined) {
    throw new Error("useHelp must be used within a HelpProvider");
  }
  return context;
}
