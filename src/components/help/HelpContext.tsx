import { createContext, useContext, useState, ReactNode } from "react";

export interface HelpTopic {
  id: string;
  title: string;
  content: string;
  icon?: string;
}

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

interface HelpContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  activeTooltip: string | null;
  setActiveTooltip: (tooltip: string | null) => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <HelpContext.Provider
      value={{
        isOpen,
        setIsOpen,
        currentPage,
        setCurrentPage,
        activeTooltip,
        setActiveTooltip,
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
