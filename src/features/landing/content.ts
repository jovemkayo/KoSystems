export type DemoKind = "pos" | "management" | "document" | null;

export type ProjectCase = {
  slug: "pdv-restaurante" | "gestao-integrada" | "leitor-pedidos" | "gestao-linhas";
  segment: string;
  title: string;
  shortTitle: string;
  summary: string;
  problem: string;
  solution: string;
  capabilities: readonly string[];
  demoKind: DemoKind;
};

export type ServiceOffering = {
  number: string;
  title: string;
  description: string;
};

export type ProcessStep = {
  number: string;
  title: string;
  description: string;
};

export const projects: readonly ProjectCase[] = [
  {
    slug: "pdv-restaurante",
    segment: "Alimentação",
    title: "PDV para restaurante",
    shortTitle: "PDV restaurante",
    summary: "Pedidos, mesas e fechamento reunidos em um fluxo rápido para a operação diária.",
    problem:
      "A equipe precisava reduzir anotações dispersas e acompanhar cada pedido sem perder o ritmo do atendimento.",
    solution:
      "Um ponto de venda pensado para salão e caixa, com visão clara do pedido até o pagamento.",
    capabilities: ["Mesas e comandas", "Andamento dos pedidos", "Fechamento de caixa"],
    demoKind: "pos",
  },
  {
    slug: "gestao-integrada",
    segment: "Produção e comércio",
    title: "Gestão integrada de operação",
    shortTitle: "Gestão integrada",
    summary: "Produção, estoque, vendas e financeiro conectados em uma única rotina.",
    problem:
      "Informações importantes estavam separadas, dificultando enxergar disponibilidade, vendas e resultado.",
    solution:
      "Uma plataforma operacional sob medida que organiza o fluxo completo e destaca o que precisa de atenção.",
    capabilities: ["Produção e estoque", "Vendas", "Visão financeira"],
    demoKind: "management",
  },
  {
    slug: "leitor-pedidos",
    segment: "Distribuição de alimentos",
    title: "Leitor inteligente de pedidos",
    shortTitle: "Leitor de pedidos",
    summary: "PDFs e textos transformados em tabelas prontas para conferência e separação.",
    problem:
      "Pedidos recebidos em formatos variados exigiam leitura e digitação manual, aumentando tempo e retrabalho.",
    solution:
      "Um fluxo determinístico que interpreta o conteúdo, organiza os itens e facilita a conferência antes da operação.",
    capabilities: ["Leitura de documentos", "Tabela organizada", "Conferência de itens"],
    demoKind: "document",
  },
  {
    slug: "gestao-linhas",
    segment: "Serviços corporativos",
    title: "Gestão de linhas e dispositivos",
    shortTitle: "Gestão de linhas",
    summary: "Controle centralizado de números, aparelhos, responsáveis e movimentações.",
    problem:
      "A empresa precisava saber com precisão quem utilizava cada linha e acompanhar trocas de aparelhos e responsáveis.",
    solution:
      "Um sistema interno com histórico e visão organizada do inventário móvel da operação.",
    capabilities: ["Linhas e responsáveis", "Inventário de aparelhos", "Histórico de movimentações"],
    demoKind: null,
  },
];

export const services: readonly ServiceOffering[] = [
  {
    number: "01",
    title: "Sistemas de gestão e operação",
    description:
      "Ferramentas que organizam rotinas, dados e decisões em um ambiente criado para o seu negócio.",
  },
  {
    number: "02",
    title: "Vendas e atendimento",
    description:
      "PDVs, lojas virtuais e experiências digitais que tornam a jornada de compra mais simples.",
  },
  {
    number: "03",
    title: "Automação de processos",
    description:
      "Fluxos que eliminam tarefas repetitivas, reduzem erros e devolvem tempo para a equipe.",
  },
  {
    number: "04",
    title: "Integrações e plataformas web",
    description:
      "Soluções conectadas aos serviços que a operação já usa, acessíveis em qualquer dispositivo.",
  },
  {
    number: "05",
    title: "Evolução de sistemas",
    description:
      "Manutenção, novas funcionalidades e acompanhamento de produtos digitais já em uso.",
  },
];

export const processSteps: readonly ProcessStep[] = [
  {
    number: "01",
    title: "Entender",
    description: "Partimos do problema ou da ideia já definida e mapeamos o que realmente importa.",
  },
  {
    number: "02",
    title: "Desenhar",
    description: "Estruturamos a experiência, as regras e o caminho mais claro para a solução.",
  },
  {
    number: "03",
    title: "Construir",
    description: "Desenvolvemos em ciclos curtos, com validações durante o processo.",
  },
  {
    number: "04",
    title: "Publicar e evoluir",
    description: "Colocamos o produto em operação e combinamos a evolução adequada ao projeto.",
  },
];

export const company = {
  name: "KO Systems",
  domain: "kosystems.com.br",
  cnpj: "69.208.733/0001-12",
  instagramHandle: "@ko.systems",
  instagramUrl: "https://www.instagram.com/ko.systems/",
} as const;
