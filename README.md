# KO Systems

Site institucional e portfólio desenvolvido por Kayo de Oliveira Marques, fundador e único desenvolvedor da KO Systems. Apresenta soluções web com demonstrações interativas e dados fictícios.

## Tecnologias

TypeScript, React, TanStack Start e Router, Vite, Tailwind CSS e Vitest.

## Executar localmente

Requer Node.js 24 e npm.

```sh
npm ci
npm run dev
```

## Verificar qualidade

```sh
npm test -- --maxWorkers=1
npm run check:independence
npm run typecheck
npm run lint
npm run build
```

## Organização do código

| Diretório | Responsabilidade |
| --- | --- |
| `src/features/landing` | Conteúdo, serviços, projetos, contato e composição da página |
| `src/components` | Componentes compartilhados, interface e marca |
| `src/routes` | Entradas e rotas da aplicação |
| `demos` | Demonstrações isoladas com dados fictícios |
| `scripts` | Preparação das demonstrações e verificações do projeto |
| `public/brand` | Arquivos da marca |

Os scripts `predev` e `prebuild` geram as demonstrações antes de iniciar o site ou compilar. A separação por funcionalidades permite revisar a página institucional sem misturar suas regras com os fluxos das demonstrações.

## Demonstrações e dados

O portfólio apresenta Estalagem Restaurante, Lavandine e OrderWorkbench. Estalagem e Lavandine são sistemas desenvolvidos pela KO Systems e pertencem aos respectivos clientes; OrderWorkbench é um produto próprio da KO Systems. As demonstrações de PDV, estoque e pedidos usam dados fictícios e não fornecem acesso aos sistemas de produção. Não adicione dados reais de clientes, credenciais ou endereços de repositórios privados. O site público é https://kosystems.com.br.

## Publicação

`npm run build` gera a aplicação para publicação. Hospedagem e DNS são configurações do ambiente; use a configuração apropriada da plataforma escolhida. Nenhuma configuração de produção é necessária para executar os testes.
