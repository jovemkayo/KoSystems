export type DemoKind = "pos" | "management" | "document" | "lines";

export type ProjectCase = {
  slug: "pdv-restaurante" | "gestao-integrada" | "leitor-pedidos" | "gestao-linhas";
  segment: string;
  clientName: string;
  demoPath: string;
  previewLogo: string | null;
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
    clientName: "Estalagem Restaurante",
    demoPath: "/demos/estalagem/index.html",
    previewLogo: "/demos/estalagem/assets/img/logo-estalagem.png",
    title: "PDV para restaurante",
    shortTitle: "PDV restaurante",
    summary: "Balança, comandas e pagamentos reunidos em um fluxo rápido para a operação diária.",
    problem:
      "Substituir o controle em papel por uma rotina digital mais prática, reunindo consumo, pagamentos pendentes e fechamento de caixa, com relatórios para acompanhar os resultados e facilitar o envio à contabilidade.",
    solution:
      "Um ponto de venda que integra balança, comandas e caixa. O consumo é registrado pelo celular e vinculado à comanda do cliente, permitindo ao caixa consultar o valor, registrar o pagamento e acompanhar os valores ainda em aberto.",
    capabilities: ["Pesagem e comandas", "Divisão de pagamentos", "Fechamento de caixa"],
    demoKind: "pos",
  },
  {
    slug: "gestao-integrada",
    segment: "Produção e comércio",
    clientName: "Lavandine",
    demoPath: "/demos/lavandine/index.html",
    previewLogo: "/demos/lavandine/assets/logo-lavandine.png",
    title: "Gestão integrada de operação",
    shortTitle: "Gestão integrada",
    summary: "Produção, estoque, vendas e financeiro conectados em uma única rotina.",
    problem:
      "Reunir informações de produção, estoque, vendas e financeiro que estavam separadas, tornando mais simples acompanhar a disponibilidade dos produtos e os resultados da operação.",
    solution:
      "Uma plataforma de gestão que conecta essas rotinas em um único ambiente, facilita os registros do dia a dia e oferece uma visão organizada do estoque, das vendas e do financeiro.",
    capabilities: ["Produção e estoque", "Vendas", "Visão financeira"],
    demoKind: "management",
  },
  {
    slug: "leitor-pedidos",
    segment: "Distribuição de alimentos",
    clientName: "Macaúba Hortifruti",
    demoPath: "/demos/macauba/index.html",
    previewLogo: "/brand/macauba-hortifruti-transparent.png",
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
    clientName: "Reference RH",
    demoPath: "/demos/reference/index.html",
    previewLogo: "/demos/reference/reference-symbol.png",
    title: "Gestão de linhas e dispositivos",
    shortTitle: "Gestão de linhas",
    summary: "Controle centralizado de números, aparelhos, responsáveis e movimentações.",
    problem:
      "Identificar os responsáveis por cada linha e aparelho, acompanhar as trocas e controlar quais números estavam disponíveis, ativos, suspensos, banidos ou com restrições no WhatsApp, incluindo as previsões de liberação.",
    solution:
      "Um sistema interno que centraliza linhas, aparelhos, responsáveis e status, mantendo o histórico das movimentações e uma visão organizada da disponibilidade dos números na operação.",
    capabilities: [
      "Linhas e responsáveis",
      "Inventário de aparelhos",
      "Histórico de movimentações",
    ],
    demoKind: "lines",
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
    description: "Colocamos em operação e combinamos a evolução adequada ao projeto.",
  },
];

export const company = {
  name: "KO Systems",
  domain: "kosystems.com.br",
  cnpj: "69.208.733/0001-12",
  instagramHandle: "@ko.systems",
  instagramUrl: "https://www.instagram.com/ko.systems/",
  linkedinUrl: "https://www.linkedin.com/in/kayo-de-oliveira-marques-2a2b21325/",
  githubUrl: "https://github.com/jovemkayo",
} as const;
