export type DemoKind = "pos" | "management" | "document" | "lines";

export type ProjectCase = {
  slug: "pdv-restaurante" | "gestao-integrada" | "orderworkbench";
  segment: string;
  clientName: string;
  demoPath: string;
  previewLogo: string | null;
  title: string;
  shortTitle: string;
  summary: string;
  headline: string;
  testimonial: { quote: string; name: string; role: string; avatarSrc?: string };
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
    headline: "De cerca de 30 minutos para fechar o caixa em um clique.",
    testimonial: {
      quote:
        "Passei a economizar cerca de 30 minutos por dia com o PDV. Com poucos cliques, consulto o fechamento de caixa.\nTambém ficou mais fácil acompanhar as vendas, comparar os resultados e organizar o financeiro.",
      name: "Edina Alves",
      role: "Proprietária do Estalagem Restaurante",
    },
    summary:
      "Reunimos balança, comandas e pagamentos em um PDV que também organiza o financeiro. O restaurante acompanha quanto vende e identifica os períodos de melhor resultado, sem juntar anotações em papel.",
    problem:
      "O fechamento em papel consumia cerca de 30 minutos por dia e dificultava reunir os números de vendas e acompanhar o financeiro.",
    solution:
      "Integramos balança, comandas, pagamentos e relatórios. O restaurante fecha o caixa em um clique, consulta as vendas por período e acompanha os resultados com mais organização.",
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
    headline: "Uma visão organizada da empresa para decidir os próximos passos.",
    testimonial: {
      quote:
        "Hoje consigo enxergar minha empresa de forma mais organizada. Sei o que tenho em estoque, para quem vendo e onde posso melhorar. Isso me ajuda a planejar a produção e os próximos passos do negócio.",
      name: "Thais Ignácio",
      role: "Proprietária da Lavandine Aromas",
    },
    summary:
      "Organizamos estoque, produção, vendas e financeiro em um só sistema. A loja consegue entender sua operação, aproveitar os materiais disponíveis e acompanhar os clientes com informações reunidas para decidir com mais clareza.",
    problem:
      "A loja não tinha uma visão clara da quantidade e do valor dos produtos e das matérias-primas disponíveis. Isso dificultava aproveitar o estoque existente, planejar novos produtos e acompanhar o que cada cliente comprava.",
    solution:
      "Reunimos estoque, produção, vendas e financeiro em um sistema. A equipe consegue consultar quantidades e valores, localizar materiais já disponíveis para novas criações e acompanhar o histórico de compras de cada cliente.",
    capabilities: ["Produção e estoque", "Vendas", "Visão financeira"],
    demoKind: "management",
  },
  {
    slug: "orderworkbench",
    segment: "Pedidos",
    clientName: "OrderWB",
    demoPath: "/demos/orderworkbench/index.html",
    previewLogo: "/brand/order-workbench.png",
    title: "Pedidos prontos para conferir e imprimir",
    shortTitle: "Organização de pedidos",
    headline: "Cerca de 75 minutos por dia a menos redigitando pedidos.",
    testimonial: {
      quote:
        "Eu levava cerca de 1h30min por dia redigitando pedidos. Com o OrderWB, passei a fazer esse trabalho em aproximadamente 15 minutos, com mais tempo disponível para o restante da operação.",
      name: "Rogério Oliveira",
      role: "Cliente da OrderWB",
    },
    summary:
      "O OrderWB é um produto da KO Systems, feito para transformar pedidos recebidos em texto ou PDF em uma tabela editável, pronta para conferir e imprimir, sem redigitar cada item no Excel.",
    problem:
      "Um dos clientes da plataforma dedicava cerca de uma hora e meia por dia a redigitar os pedidos recebidos em texto ou PDF no Excel, antes de imprimir para a preparação.",
    solution:
      "O OrderWB organiza produtos e quantidades em uma tabela editável e permite imprimir após a conferência. Um cliente relata concluir esse trabalho em aproximadamente 15 minutos, em vez de uma hora e meia. O tempo varia conforme o tamanho e o formato dos pedidos.",
    capabilities: ["Leitura de documentos", "Tabela organizada", "Conferência de itens"],
    demoKind: "document",
  },
];

export const services: readonly ServiceOffering[] = [
  {
    number: "01",
    title: "Estoque e financeiro no mesmo lugar",
    description:
      "Veja entradas, saídas e saldos sem conferir planilhas separadas. Montamos os controles de acordo com os registros que sua equipe precisa fazer.",
  },
  {
    number: "02",
    title: "Vendas registradas sem perder o histórico",
    description:
      "Criamos PDVs e lojas virtuais que ligam o pedido ao pagamento e guardam o histórico de compra para a equipe consultar.",
  },
  {
    number: "03",
    title: "Menos digitação repetida",
    description:
      "Transformamos tarefas como copiar pedidos e montar relatórios em etapas que o sistema executa, com conferência antes de concluir.",
  },
  {
    number: "04",
    title: "Informações conectadas entre sistemas",
    description:
      "Conectamos ferramentas para evitar o mesmo cadastro em mais de um lugar. Avaliamos as integrações disponíveis antes de definir o projeto.",
  },
  {
    number: "05",
    title: "Seu sistema acompanha as mudanças da empresa",
    description:
      "Corrigimos falhas e desenvolvemos novas funções conforme a necessidade. Escopo, manutenção e próximos passos são combinados com você.",
  },
];

export const processSteps: readonly ProcessStep[] = [
  {
    number: "01",
    title: "Definir o que vai mudar",
    description:
      "Você mostra como trabalha hoje. Identificamos a tarefa que consome tempo e combinamos o que o sistema precisa entregar.",
  },
  {
    number: "02",
    title: "Conferir antes de construir",
    description:
      "Organizamos as telas e as regras para você avaliar o caminho de uso antes do desenvolvimento.",
  },
  {
    number: "03",
    title: "Testar com sua rotina",
    description:
      "Desenvolvemos por etapas. Você acompanha as entregas e valida se os registros e as consultas atendem ao trabalho real.",
  },
  {
    number: "04",
    title: "Colocar em uso",
    description:
      "Publicamos o sistema e combinamos manutenção e futuras melhorias de acordo com o projeto, sem deixar essas condições para depois.",
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
