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
  ownership: string;
  result: string;
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
    headline: "De cerca de 30 minutos para um clique no fechamento de caixa.",
    ownership: "Sistema desenvolvido pela KO Systems e de propriedade do Estalagem Restaurante.",
    result:
      "Segundo o restaurante, o fechamento passou a economizar de 20 a 30 minutos por dia, de segunda a sexta.",
    summary:
      "Criamos um PDV que reúne balança, comandas, pagamentos e relatórios. O caixa consulta o consumo registrado pelo celular e fecha o dia sem somar anotações em papel.",
    problem:
      "O fechamento em papel consumia cerca de 30 minutos por dia. Para enviar o faturamento das máquinas de cartão ao contador, o restaurante ainda separava os comprovantes impressos e dependia de um motoboy, com aproximadamente uma hora dedicada a esse envio.",
    solution:
      "Integramos balança, comandas e caixa em um PDV. O consumo registrado pelo celular fica disponível para cobrança, e os relatórios completos podem ser consultados em um clique. Segundo o restaurante, isso economiza de 20 a 30 minutos no fechamento diário e dispensa o envio dos papéis das máquinas por motoboy.",
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
    headline: "Estoque em quantidade e valor, com o histórico de compra de cada cliente.",
    ownership: "Sistema desenvolvido pela KO Systems e de propriedade da Lavandine.",
    result:
      "A Lavandine passou a visualizar produtos e matérias-primas disponíveis, quanto representam em estoque e o que cada cliente compra.",
    summary:
      "Conectamos estoque, produção e vendas para a loja saber o que já tem, planejar novos produtos e consultar as compras dos clientes sem juntar controles separados.",
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
    clientName: "OrderWorkbench",
    demoPath: "/demos/orderworkbench/index.html",
    previewLogo: "/brand/order-workbench.png",
    title: "Pedidos prontos para conferir e imprimir",
    shortTitle: "Organização de pedidos",
    headline: "De 100 minutos para cerca de 10 a 20 minutos em 10 pedidos por dia.",
    ownership:
      "Plataforma criada e de propriedade da KO Systems, utilizada por diferentes clientes.",
    result:
      "Resultado relatado por um cliente: cerca de 10 pedidos diários, antes com 10 minutos por pedido, agora organizados em aproximadamente 10 a 20 minutos no total.",
    summary:
      "Criamos o OrderWorkbench para transformar pedidos recebidos em texto ou PDF em uma tabela editável, pronta para conferir e imprimir, sem redigitar cada item no Excel.",
    problem:
      "Um dos clientes da plataforma gastava, em média, 10 minutos para passar cada pedido de texto ou PDF para o Excel. Com cerca de 10 pedidos por dia, eram aproximadamente 100 minutos dedicados a organizar e imprimir os pedidos para a preparação.",
    solution:
      "O OrderWorkbench lê o pedido, organiza produtos e quantidades em uma tabela editável e permite imprimir após a conferência. Esse cliente relata fazer os mesmos 10 pedidos em cerca de 10 a 20 minutos no total. O tempo varia conforme o tamanho e o formato dos pedidos.",
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
    title: "Definir o que precisa mudar",
    description:
      "Você mostra como trabalha hoje. Identificamos a tarefa que consome tempo e combinamos o que o sistema precisa entregar.",
  },
  {
    number: "02",
    title: "Conferir as telas antes de construir",
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
    title: "Colocar em uso e combinar o suporte",
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
