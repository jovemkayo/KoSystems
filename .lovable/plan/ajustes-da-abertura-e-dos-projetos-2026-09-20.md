# Ajustes da abertura e dos projetos

## O que será alterado
- Remover a logo e o nome “KO Systems” do canto superior esquerdo, preservando a navegação à direita e reorganizando seu alinhamento.
- Centralizar o símbolo acima de “SYSTEMS” e aumentar o espaço vertical entre os dois.
- Limitar o tamanho visual da abertura em navegadores maiores para evitar a escala exagerada, sem prejudicar a prévia e telas menores.
- Reconstruir a interação de Projetos com o modelo `animated-slideshow`, corrigindo troca por foco, toque e passagem do mouse.
- Manter os cinco projetos reais, suas imagens em alta qualidade e a identidade azul-marinho.

## Detalhes técnicos
- Ajustar o cálculo responsivo de escala e posicionamento do símbolo no `GlyphPortal`, com limites por largura e altura reais da janela.
- Simplificar o cabeçalho para uma navegação alinhada ao lado direito e manter o menu móvel.
- Corrigir o componente compartilhado de slideshow, mantendo acessibilidade e animação com `motion/react`.
- Validar abertura e Projetos em desktop amplo, na prévia atual e em celular, além de verificar erros no navegador.
