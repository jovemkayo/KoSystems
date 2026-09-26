# Slideshow interativo de serviços

## Objetivo
Substituir a grade atual da seção “Serviços” por uma apresentação interativa inspirada no componente enviado, preservando a identidade azul-marinho da KO Systems.

## O que será alterado
- Criar o componente reutilizável `animated-slideshow.tsx` na pasta de componentes visuais.
- Restaurar o JSX ausente no trecho fornecido e adaptar a animação para mouse, teclado e toque.
- Manter quatro serviços alinhados ao negócio:
  - Software sob medida
  - Sistemas empresariais
  - Aplicações web e mobile
  - Integrações e dados
- Exibir uma imagem específica para cada serviço, com troca animada ao selecionar o nome.
- Substituir somente a apresentação atual da seção de serviços; as demais áreas permanecem iguais.
- Em telas pequenas, organizar nomes e imagem verticalmente, sem depender de passar o mouse.
- Respeitar a preferência do sistema por movimento reduzido.

## Detalhes técnicos
- Usar `motion`, que já está instalado no projeto.
- Manter os componentes exportados pedidos: `HoverSlider`, `TextStaggerHover`, `HoverSliderImageWrap` e `HoverSliderImage`.
- Usar imagens locais do projeto, sem links externos.
- Garantir foco visível, seleção por teclado e textos alternativos nas imagens.
- Validar a seção em desktop e celular, além de conferir erros no navegador.
