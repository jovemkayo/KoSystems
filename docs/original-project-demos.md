# Demonstrações dos projetos originais

Os nomes e as marcas de Estalagem Restaurante e Lavandine foram autorizados pelo proprietário para a vitrine. São sistemas desenvolvidos pela KO Systems e de propriedade dos respectivos clientes. O OrderWorkbench é uma plataforma criada e de propriedade da KO Systems, utilizada por diferentes clientes. A autorização não inclui cadastros de pessoas, telefones, credenciais, documentos ou informações de operação reais.

As demonstrações usam snapshots dos componentes e estilos originais, compilados como aplicações de navegador independentes. Os sistemas dos clientes permanecem privados. Não copiar arquivos de ambiente, credenciais, backups, bancos de dados, fotos de pessoas nem configurações de produção para este projeto.

Cada visitante opera sobre dados fictícios locais. Reabrir ou reiniciar a demonstração recria o cenário. Operações financeiras, autenticação, envio de mensagens e conexões com hardware não são executadas contra serviços reais.

Somente Estalagem, Lavandine e OrderWorkbench são exibidos. Reference RH foi retirado do portfólio e a demonstração Macaúba foi substituída pelo OrderWorkbench. Os snapshots antigos permanecem no histórico, mas não são gerados para a publicação atual.

O OrderWorkbench usa as telas, estilos, parser e exportação de PDF do produto original. A fronteira de API da demonstração é inteiramente local: interpreta texto, autoriza impressão fictícia e gera o PDF no navegador, sem autenticação, assinatura ou chamadas ao servidor real. O catálogo público contém apenas produtos genéricos e o pedido inicial é fictício. Arquivos enviados pelo visitante são processados no navegador; não envie dados reais para experimentar.

As métricas da vitrine são relatos fornecidos pelo proprietário, não medições instrumentadas nem promessas de resultado: Estalagem economiza cerca de 20 a 30 minutos por dia no fechamento; um cliente do OrderWorkbench reduziu cerca de 100 minutos em dez pedidos diários para aproximadamente 10 a 20 minutos no total. Lavandine tem resultado qualitativo, sem economia de tempo quantificada.

Os snapshots ficam em `demos/*/original`. Adaptações de ambiente ficam separadas das telas originais. O build cria os artefatos estáticos em `public/demos`, antes do build institucional. O site só carrega a aplicação escolhida quando o visitante abre o projeto.
