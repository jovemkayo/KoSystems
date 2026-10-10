const unidades = ["quilo", "gramas", "unidade", "maço", "caixa", "pacote", "bandeja", "pé"];
const catalogoProdutos = Array.isArray(window.CATALOGO_PRODUTOS) ? window.CATALOGO_PRODUTOS : [];

const precosBase = {
  abacaxi: 8.5,
  alface: 4.8,
  banana: 6.9,
  batata: 5.4,
  cebola: 4.7,
  cenoura: 5.2,
  couve: 4.3,
  limao: 6.2,
  mandioca: 6.8,
  morango: 18.9,
  ovos: 22.0,
  oregano: 5.5,
  pimenta: 12.0,
  salsinha: 4.2,
  tomate: 7.6,
};

const state = {
  pedido: null,
  retorno: null,
};

const $ = (id) => document.getElementById(id);

function gerarId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clonar(valor) {
  if (window.structuredClone) return window.structuredClone(valor);
  return JSON.parse(JSON.stringify(valor));
}

function ultimo(lista) {
  return lista.length ? lista[lista.length - 1] : undefined;
}

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9,. ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectarCliente(texto) {
  const linhas = String(texto || "").split(/\r?\n/).map((linha) => linha.trim()).filter(Boolean);
  const padroes = [/cliente\s*[:\-]\s*(.+)$/i, /nome\s*[:\-]\s*(.+)$/i, /pedido\s+de\s+(.+)$/i, /para\s*[:\-]\s*(.+)$/i];

  for (const linha of linhas) {
    for (const padrao of padroes) {
      const match = linha.match(padrao);
      if (match?.[1]) return match[1].trim();
    }
  }

  return "";
}

function unidadePorExtenso(unidade) {
  const valor = normalizar(unidade);

  if (["kg", "kgs", "kl", "k", "quilo", "quilos", "kilo", "kilos"].includes(valor)) return "quilo";
  if (["g", "gs", "gr", "grs", "grama", "gramas"].includes(valor)) return "gramas";
  if (["un", "und", "ud", "unid", "unidade", "unidades"].includes(valor)) return "unidade";
  if (["masso", "massos", "maço", "maços", "maco", "macos", "mc", "mcs"].includes(valor)) return "maço";
  if (["cx", "caixa", "caxa", "caxas", "caixas"].includes(valor)) return "caixa";
  if (["pct", "pcts", "pc", "pt", "pacote", "pacotes"].includes(valor)) return "pacote";
  if (["b", "bj", "bdj", "bdnj", "bndj", "bdjs", "bds", "bandeja", "bandeijas", "bandejas"].includes(valor)) return "bandeja";
  if (["p", "pe", "pes", "pé", "pés", "ps"].includes(valor)) return "pé";

  return "";
}

const unidadeRegex =
  "(bdnj|bndj|bdjs|bdj|bds|bj|bandejas|bandeja|kgs|kg|kj|quilos|quilo|kilos|kilo|grs|gr|gs|g|gramas|grama|unidades|unidade|unid|und|un|ud|macos|maco|mcs|mc|caixas|caixa|cx|pacotes|pacote|pcts|pct|pc|pt|pes|ps|pe|p|b|k)";
const quantidadeRegex =
  "([0-9]+(?:[,.][0-9]+)?|um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem)";

function quantidadePorExtenso(valor) {
  const texto = normalizar(valor);
  const mapa = {
    um: "1",
    uma: "1",
    dois: "2",
    duas: "2",
    tres: "3",
    quatro: "4",
    cinco: "5",
    seis: "6",
    sete: "7",
    oito: "8",
    nove: "9",
    dez: "10",
    onze: "11",
    doze: "12",
    treze: "13",
    quatorze: "14",
    catorze: "14",
    quinze: "15",
    dezesseis: "16",
    dezessete: "17",
    dezoito: "18",
    dezenove: "19",
    vinte: "20",
    trinta: "30",
    quarenta: "40",
    cinquenta: "50",
    sessenta: "60",
    setenta: "70",
    oitenta: "80",
    noventa: "90",
    cem: "100",
  };
  return (mapa[texto] || String(valor || "")).replace(".", ",");
}

function parecePedido(linha) {
  const texto = normalizar(linha);
  if (!texto || texto.length < 3) return false;
  if (/^(cliente|nome|endereco|telefone|razao social|cnpj|horario|produto|categ|med|qnt|quantidade|preco)\b/.test(texto)) return false;
  if (/\b(cnpj|endereco|horario|devolucao|rua|avenida)\b/.test(texto)) return false;
  const temQuantidade = new RegExp(`\\b${quantidadeRegex}\\s*${unidadeRegex}\\b`).test(texto) || new RegExp(`^${quantidadeRegex}\\b`).test(texto);
  const temUnidadeSemQuantidade = new RegExp(`\\b${unidadeRegex}\\b`).test(texto) && texto.split(" ").length >= 2;
  const temProdutoProvavel = catalogoProdutos.some((produto) => {
    const nome = normalizar(produto.nome || produto.descricao || "");
    return nome && (texto.includes(nome) || nome.includes(texto));
  });
  return temQuantidade || temUnidadeSemQuantidade || temProdutoProvavel;
}

function extrairQuantidade(linha) {
  const texto = normalizar(linha);
  const todos = Array.from(texto.matchAll(new RegExp(`\\b${quantidadeRegex}\\s*${unidadeRegex}\\b`, "g")));
  const unidadeAntes = Array.from(texto.matchAll(new RegExp(`\\b${unidadeRegex}\\s*${quantidadeRegex}\\b`, "g")));
  const inicio = texto.match(new RegExp(`^${quantidadeRegex}\\s*${unidadeRegex}\\b`));
  const unidadeSozinha = ultimo(Array.from(texto.matchAll(new RegExp(`\\b${unidadeRegex}\\b`, "g"))));
  const somenteNumero = texto.match(new RegExp(`^${quantidadeRegex}\\b`));
  const match = inicio || ultimo(todos);

  if (match) {
    return {
      quantidade: quantidadePorExtenso(match[1]),
      unidade: unidadePorExtenso(match[2]),
    };
  }

  const invertido = ultimo(unidadeAntes);
  if (invertido) {
    return {
      quantidade: quantidadePorExtenso(invertido[2]),
      unidade: unidadePorExtenso(invertido[1]),
    };
  }

  if (somenteNumero) return { quantidade: quantidadePorExtenso(somenteNumero[1]), unidade: "unidade" };
  if (unidadeSozinha) return { quantidade: "", unidade: unidadePorExtenso(unidadeSozinha[1]) };
  return { quantidade: "", unidade: "" };
}

function limparProduto(linha) {
  const unidadesTodas = unidadeRegex;
  return String(linha || "")
    .replace(/\bR\$\s*[0-9]+(?:[,.][0-9]+)?\b/gi, "")
    .replace(new RegExp(`\\b(saco|sacos|cx|caixa|caixas|pacote|pacotes|pct|pcts)\\s*\\/?\\s*${quantidadeRegex}\\s*${unidadesTodas}\\b`, "gi"), "")
    .replace(new RegExp(`\\b${quantidadeRegex}\\s*(saco|sacos|cx|caixa|caixas|pacote|pacotes|pct|pcts)\\b`, "gi"), "")
    .replace(new RegExp(`^\\s*${quantidadeRegex}\\s*(?:${unidadesTodas}\\b)?\\s*`, "i"), "")
    .replace(new RegExp(`\\b${unidadesTodas}\\s*${quantidadeRegex}\\b`, "gi"), "")
    .replace(new RegExp(`\\s+${quantidadeRegex}\\s*${unidadesTodas}\\s*$`, "i"), "")
    .replace(new RegExp(`\\s+${quantidadeRegex}\\s*$`, "i"), "")
    .replace(new RegExp(`\\b${unidadesTodas}\\b`, "gi"), " ")
    .replace(/\b(hortifruti|frutas|fruta|legumes|legume|verduras|verdura|proteinas|proteina|categ|produto|qnt|solicitada|med)\b/gi, " ")
    .replace(/\b(saco|sacos|caixa|caixas|pacote|pacotes)\b/gi, " ")
    .replace(/\b(de|da|do|das|dos|d|a|o)\b/gi, " ")
    .replace(/\s+(bem\s+maduro|maduro|fresco)\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[,.;:\-\s]+|[,.;:\-\s]+$/g, "")
    .trim();
}

function extrairObservacao(linha) {
  const observacoes = [];
  const texto = String(linha || "");
  if (/\bbem\s+madur[oa]s?\b/i.test(texto)) observacoes.push("BEM MADURO");
  const regras = [/\bfresc[oa]s?\b/gi];
  if (!/\bbem\s+madur[oa]s?\b/i.test(texto)) regras.push(/\bmadur[oa]s?\b/gi);
  for (const regra of regras) {
    const encontrados = texto.match(regra) || [];
    observacoes.push(...encontrados.map((item) => item.toUpperCase()));
  }
  return Array.from(new Set(observacoes)).join(", ");
}

function precoProduto(produto) {
  const texto = normalizar(produto);
  const catalogo = encontrarProdutoCatalogo(texto);
  if (catalogo) return numero(catalogo.preco);
  const chave = Object.keys(precosBase).find((nome) => texto.includes(nome));
  return chave ? precosBase[chave] : 0;
}

function encontrarProdutoCatalogo(produto) {
  const texto = normalizar(produto);
  if (!texto || !catalogoProdutos.length) return null;

  const tokensProduto = texto.split(" ").filter((token) => token.length > 2);
  let melhor = null;
  let melhorScore = 0;

  for (const item of catalogoProdutos) {
    const nome = normalizar(item.nome || item.descricao || item.busca || "");
    const busca = normalizar(item.busca || `${item.nome || ""} ${item.descricao || ""} ${item.categoria || ""}`);
    const alvo = `${nome} ${busca}`.trim();
    if (!alvo) continue;

    let score = 0;
    if (nome === texto) score += 1000;
    if (nome.startsWith(texto)) score += 120;
    if (texto.startsWith(nome)) score += 100;
    if (alvo.includes(texto)) score += 90;

    const tokensCatalogo = new Set(alvo.split(" ").filter((token) => token.length > 2));
    for (const token of tokensProduto) {
      if (tokensCatalogo.has(token)) score += token.length * 8;
      else if (alvo.includes(token)) score += token.length * 3;
    }

    if (nome.length > texto.length + 18) score -= 10;
    if (score > melhorScore) {
      melhor = item;
      melhorScore = score;
    }
  }

  return melhorScore >= 18 ? melhor : null;
}

function montarItens(texto) {
  return String(texto || "")
    .replace(/\s+-\s+/g, "\n")
    .split(/\r?\n|;|,(?=\s*(?:[0-9]+(?:[,.][0-9]+)?\s*)?(?:kg|kgs|kj|k|quilo|quilos|kilo|kilos|g|gs|gr|grs|grama|gramas|un|und|ud|unid|unidade|unidades|maco|macos|maço|maços|mc|mcs|cx|caixa|caixas|pct|pcts|pc|pt|pacote|pacotes|b|bj|bdj|bdnj|bndj|bdjs|bds|bandeja|bandejas|p|pe|pé|pés|pes|ps)?\s*[A-Za-zÀ-ÿ])/)
    .map((linha) => linha.trim())
    .filter(parecePedido)
    .map((linha) => {
      const { quantidade, unidade } = extrairQuantidade(linha);
      const produto = limparProduto(linha);
      return {
        id: gerarId(),
        produto,
        quantidade,
        unidade,
        pesoReal: "",
        observacao: extrairObservacao(linha),
        preco: precoProduto(produto),
        origem: linha,
      };
    })
    .filter((item) => item.produto)
    .sort(ordenarPorProduto);
}

function ordenarPorProduto(a, b) {
  return normalizar(a.produto).localeCompare(normalizar(b.produto), "pt-BR", { sensitivity: "base" });
}

function moeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function numero(valor) {
  return Number(String(valor || "0").replace(",", ".")) || 0;
}

function renderAdmin() {
  const pedido = state.pedido;
  $("adminCliente").textContent = pedido?.cliente || "Cliente não informado";
  $("adminQtd").textContent = `${pedido?.itens.length || 0} item(ns)`;
  $("adminTabela").innerHTML = renderLinhas(itensOrdenados(pedido?.itens || []), "admin");
  $("statusResumo").textContent = pedido ? `Pedido ${pedido.status}` : "Nenhum pedido enviado";
}


function itensOrdenados(itens) {
  return [...itens].sort(ordenarPorProduto);
}

function textoImpressao(valor) {
  return String(valor || "").trim().toLocaleUpperCase("pt-BR");
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function prepararImpressao() {
  const pedido = state.pedido;
  const printArea = $("printArea");
  if (!pedido || !pedido.itens.length) {
    $("adminStatus").textContent = "Interprete um pedido antes de imprimir.";
    return false;
  }

  const agora = new Date();
  const data = agora.toLocaleDateString("pt-BR");
  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const cliente = textoImpressao(pedido.cliente || "Cliente não informado");
  const itens = itensOrdenados(pedido.itens);

  printArea.innerHTML = `
    <div class="print-sheet">
      <header class="print-header">
        <div>
          <p>MACAÚBA HORTIFRUTI</p>
          <h1>PEDIDO PARA SEPARAÇÃO</h1>
          <strong>CLIENTE: ${escaparHtml(cliente)}</strong>
        </div>
        <div class="print-meta">
          <span>${escaparHtml(data)}</span>
          <span>${escaparHtml(hora)}</span>
          <span>${itens.length} ITEM(NS)</span>
        </div>
      </header>
      <table class="print-table">
        <thead>
          <tr>
            <th>PRODUTO</th>
            <th>QUANT.</th>
            <th>UNIDADE</th>
            <th>PESO REAL</th>
            <th>OBSERVAÇÃO</th>
          </tr>
        </thead>
        <tbody>
          ${itens
            .map(
              (item) => `
                <tr>
                  <td>${escaparHtml(textoImpressao(item.produto))}</td>
                  <td>${escaparHtml(textoImpressao(item.quantidade))}</td>
                  <td>${escaparHtml(textoImpressao(item.unidade))}</td>
                  <td>${escaparHtml(textoImpressao(item.pesoReal))}</td>
                  <td>${escaparHtml(textoImpressao(item.observacao))}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  return true;
}

function imprimirPedido() {
  if (!prepararImpressao()) return;
  window.print();
}

function renderLinhas(itens, contexto) {
  if (!itens.length) {
    return `<tr><td colspan="5" style="text-align:center;padding:30px;color:#667163">Nenhum item encontrado.</td></tr>`;
  }

  return itens
    .map((item) => `
      <tr>
        <td><input class="table-input product-input" value="${item.produto.toUpperCase()}" data-id="${item.id}" data-field="produto" data-context="${contexto}" /></td>
        <td><input class="table-input" value="${item.quantidade}" data-id="${item.id}" data-field="quantidade" data-context="${contexto}" /></td>
        <td>
          <select class="table-input unidade-select" data-id="${item.id}" data-field="unidade" data-context="${contexto}">
            <option value="">-</option>
            ${unidades.map((unidade) => `<option value="${unidade}" ${item.unidade === unidade ? "selected" : ""}>${unidade.toUpperCase()}</option>`).join("")}
          </select>
        </td>
        <td><input class="table-input real-weight" value="${item.pesoReal}" data-id="${item.id}" data-field="pesoReal" data-context="${contexto}" placeholder="0,000" /></td>
        <td><input class="table-input" value="${item.observacao || ""}" data-id="${item.id}" data-field="observacao" data-context="${contexto}" /></td>
      </tr>
    `)
    .join("");
}

function renderTudo() {
  renderAdmin();
}

function atualizarItem(input) {
  const pedido = input.dataset.context === "sep" ? state.pedido : state.pedido;
  if (!pedido) return;
  const item = pedido.itens.find((atual) => atual.id === input.dataset.id);
  if (!item) return;
  item[input.dataset.field] = input.value;
  if (input.dataset.field === "produto") item.preco = precoProduto(input.value);
}

function scriptOnce(id, src) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Não foi possível carregar ${src}`));
    document.head.appendChild(script);
  });
}

async function carregarPdfJs() {
  await scriptOnce("pdfjs-lib", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
  if (!window.pdfjsLib) throw new Error("O leitor de PDF não carregou corretamente.");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  return window.pdfjsLib;
}

function agruparTextoPdf(items) {
  const partes = items
    .map((item) => ({
      texto: (item.str || "").trim(),
      x: item.transform?.[4] || 0,
      y: item.transform?.[5] || 0,
    }))
    .filter((item) => item.texto);

  const linhas = [];
  for (const parte of partes) {
    let linha = linhas.find((atual) => Math.abs(atual.y - parte.y) < 4);
    if (!linha) {
      linha = { y: parte.y, partes: [] };
      linhas.push(linha);
    }
    linha.partes.push({ texto: parte.texto, x: parte.x });
  }

  return linhas
    .sort((a, b) => b.y - a.y)
    .map((linha) =>
      linha.partes
        .sort((a, b) => a.x - b.x)
        .map((parte) => parte.texto)
        .join(" "),
    )
    .join("\n")
    .trim();
}

async function extrairPdf(file) {
  const pdfjs = await carregarPdfJs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise;
  const trechos = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const conteudo = await page.getTextContent();
    const texto = agruparTextoPdf(conteudo.items);
    if (texto) trechos.push(texto);
  }

  return trechos.join("\n");
}


document.addEventListener("input", (event) => {
  if (event.target.matches("[data-id][data-field]")) atualizarItem(event.target);
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-id][data-field]")) atualizarItem(event.target);
});

$("interpretarBtn").addEventListener("click", () => {
  try {
    const texto = $("pedidoInput").value;
    const cliente = $("clienteInput").value.trim() || detectarCliente(texto);
    state.pedido = {
      id: gerarId(),
      cliente,
      status: "interpretado no administrativo",
      itens: montarItens(texto),
    };
    $("adminStatus").textContent = `${state.pedido.itens.length} item(ns) interpretado(s).`;
    renderTudo();
  } catch (error) {
    $("adminStatus").textContent = error instanceof Error ? error.message : "Não consegui interpretar esse pedido.";
  }
});


$("imprimirPedidoBtn").addEventListener("click", imprimirPedido);


$("pdfInput").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  $("adminStatus").textContent = `Lendo ${file.name}...`;
  try {
    const texto = await extrairPdf(file);
    $("pedidoInput").value = texto;
    const cliente = $("clienteInput").value.trim() || detectarCliente(texto);
    if (cliente) $("clienteInput").value = cliente;
    state.pedido = {
      id: gerarId(),
      cliente,
      status: "interpretado no administrativo",
      itens: montarItens(texto),
    };
    $("adminStatus").textContent = `${state.pedido.itens.length} item(ns) interpretado(s) a partir do PDF.`;
    renderTudo();
  } catch (error) {
    $("adminStatus").textContent = error instanceof Error ? error.message : "Não consegui ler esse PDF.";
  } finally {
    event.target.value = "";
  }
});

renderTudo();
