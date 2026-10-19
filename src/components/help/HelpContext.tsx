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
  etiquetas: [
    "Dúvida sobre etiquetas? 🏷️",
    "Posso te ajudar a imprimir!",
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
// Each page has 3-5 short questions with actionable answers
export const helpTopics: Record<string, HelpTopic[]> = {
  dashboard: [
    {
      id: "dashboard-resumo",
      title: "O que vejo aqui?",
      content: "Um resumo do seu dia: vendas, faturamento e alertas importantes. Tudo em um lugar só!",
    },
    {
      id: "dashboard-cards",
      title: "O que são esses cards?",
      content: "Mostram seus números: faturamento de hoje, do mês, ticket médio e itens por venda.",
    },
    {
      id: "dashboard-alertas",
      title: "O que são os alertas?",
      content: "Avisos de estoque baixo, produtos vencendo e aniversários de clientes. Fique de olho!",
    },
    {
      id: "dashboard-grafico",
      title: "Como ler os gráficos?",
      content: "Mostram a evolução das vendas ao longo do tempo. Quanto mais alto, mais vendeu!",
    },
  ],
  vendas: [
    {
      id: "vendas-como",
      title: "Como registrar uma venda?",
      content: "Clique nos produtos, escolha a quantidade, selecione a forma de pagamento e confirme!",
    },
    {
      id: "vendas-meta",
      title: "O que é a meta?",
      content: "É seu objetivo de vendas do dia. A barra mostra o progresso e fica verde quando bate! 🎉",
    },
    {
      id: "vendas-pix-cartao",
      title: "Pix ou Cartão?",
      content: "Pix geralmente tem preço menor (sem taxas). Cartão pode ter valor maior para cobrir taxas.",
    },
    {
      id: "vendas-doacao",
      title: "O que é doação?",
      content: "Produto dado de presente. Sai do estoque, mas não entra dinheiro no caixa.",
    },
    {
      id: "vendas-cancelar",
      title: "Posso cancelar uma venda?",
      content: "Sim! Clique nos três pontos da venda no histórico e escolha cancelar. O estoque volta.",
    },
  ],
  produtos: [
    {
      id: "produtos-cadastrar",
      title: "Como cadastrar produto?",
      content: "Clique em 'Novo Produto', preencha nome, preço e estoque. Pronto!",
    },
    {
      id: "produtos-prove",
      title: "O que é PROVE?",
      content: "Produtos separados para demonstração. Saem do estoque, mas não entram no caixa.",
    },
    {
      id: "produtos-cesta",
      title: "O que é uma cesta?",
      content: "Um combo de produtos vendidos juntos. Ao vender, desconta todos os itens automaticamente.",
    },
    {
      id: "produtos-estoque",
      title: "Como controlar estoque?",
      content: "O estoque baixa automaticamente nas vendas. Use 'Entrada de Estoque' para repor.",
    },
  ],
  despesas: [
    {
      id: "despesas-cadastrar",
      title: "Como cadastrar despesa?",
      content: "Clique em 'Nova Despesa', preencha descrição, valor e vencimento. Simples!",
    },
    {
      id: "despesas-recorrente",
      title: "O que é despesa recorrente?",
      content: "Gastos que se repetem todo mês (aluguel, luz). O sistema cria automaticamente!",
    },
    {
      id: "despesas-status",
      title: "Paga ou Pendente?",
      content: "Pendente = ainda vai pagar. Paga = já quitou. Marque para manter controle.",
    },
    {
      id: "despesas-categorias",
      title: "Para que servem as categorias?",
      content: "Ajudam a organizar e ver onde você mais gasta. Escolha a que faz sentido!",
    },
  ],
  clientes: [
    {
      id: "clientes-cadastrar",
      title: "Como cadastrar cliente?",
      content: "Clique em 'Novo Cliente' e preencha nome e telefone. O resto é opcional!",
    },
    {
      id: "clientes-aniversario",
      title: "Para que serve o aniversário?",
      content: "O sistema avisa quando um cliente faz aniversário. Ótimo para mandar mensagem!",
    },
    {
      id: "clientes-historico",
      title: "Posso ver compras do cliente?",
      content: "Sim! Clique no cliente para ver todas as compras que ele já fez na sua loja.",
    },
  ],
  contas: [
    {
      id: "contas-pagar",
      title: "O que é conta a pagar?",
      content: "Valores que você deve para alguém: fornecedores, parcelas, empréstimos.",
    },
    {
      id: "contas-receber",
      title: "O que é conta a receber?",
      content: "Valores que vão entrar: vendas a prazo, depósitos pendentes, reembolsos.",
    },
    {
      id: "contas-vencimento",
      title: "Como funciona o vencimento?",
      content: "Contas vencidas ficam destacadas. Organize para não atrasar pagamentos!",
    },
    {
      id: "contas-quitar",
      title: "Como marcar como pago?",
      content: "Clique no botão 'Pagar' ou 'Receber' quando a conta for quitada.",
    },
  ],
  relatorios: [
    {
      id: "relatorios-periodo",
      title: "Como mudar o período?",
      content: "Use o seletor no topo para ver dados dos últimos 3, 6 ou 12 meses.",
    },
    {
      id: "relatorios-comparacao",
      title: "O que significam as setas?",
      content: "Seta verde = melhor que antes. Seta vermelha = pior. Mostra a evolução!",
    },
    {
      id: "relatorios-categorias",
      title: "O que é desempenho por categoria?",
      content: "Mostra quais tipos de produto vendem mais e dão mais lucro.",
    },
    {
      id: "relatorios-exportar",
      title: "Posso exportar os dados?",
      content: "Sim! Clique em 'Exportar' para baixar um arquivo com todos os números.",
    },
  ],
  configuracoes: [
    {
      id: "config-loja",
      title: "Como personalizar minha loja?",
      content: "Na aba 'Loja' você muda nome, logo e cor do sistema.",
    },
    {
      id: "config-metas",
      title: "Como definir minhas metas?",
      content: "Configure meta diária e mensal na aba 'Loja'. O sistema acompanha seu progresso!",
    },
    {
      id: "config-alertas",
      title: "O que são os alertas?",
      content: "Avisos de estoque baixo, vencimentos e aniversários. Configure na aba 'Alertas'.",
    },
    {
      id: "config-som",
      title: "Posso desligar os sons?",
      content: "Sim! Na aba 'Conta' você liga ou desliga os sons do sistema.",
    },
  ],
  etiquetas: [
    {
      id: "etiquetas-selecionar",
      title: "Como selecionar produtos?",
      content: "Marque os produtos na lista. Use + e - para ajustar a quantidade de cada um.",
    },
    {
      id: "etiquetas-folha",
      title: "Quantas etiquetas por folha?",
      content: "48 etiquetas por folha A4 (4 colunas x 12 linhas).",
    },
    {
      id: "etiquetas-tamanho",
      title: "Qual o tamanho da etiqueta?",
      content: "47mm x 23mm. Ideal para produtos pequenos e médios.",
    },
    {
      id: "etiquetas-imprimir",
      title: "Como imprimir corretamente?",
      content: "Baixe o PDF e imprima em escala 100%, sem ajuste de página.",
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
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

const BUBBLE_COOLDOWN = 30000; // 30 seconds minimum between bubbles
const BUBBLE_DURATION = 4000; // Show bubble for 4 seconds

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [shouldPulse, setShouldPulse] = useState(false);
  const [visitedPages, setVisitedPages] = useState<Set<string>>(new Set());
  const [bubbleMessage, setBubbleMessage] = useState<string | null>(null);
  const lastBubbleTimeRef = useRef<number>(0);
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
