## Problemas identificados

**1. Imagens dentro do conteúdo (foto 1)** — No `ContentViewerModal`, imagens são renderizadas com `pointer-events-none`, então o usuário não consegue tocar para ampliar. Não há reaproveitamento do `ImageZoomModal` que já existe e é usado no banner.

**2. PDF demora e não rola (foto 2)** — Hoje o PDF é exibido com `<object>`. No Safari iOS, `<object>` mostra apenas a primeira página estática, sem scroll, e não dispara feedback de carregamento. Resultado: tela cinza por vários segundos e depois fica travada na primeira página.

## Mudanças (somente em `src/components/ContentViewerModal.tsx`)

### A) Zoom em imagens do conteúdo
- Importar `ImageZoomModal` (já existente, com pinch/double-tap, botão X fixo respeitando safe-area).
- Adicionar estado `zoomImage` (string | null).
- Tornar a `<img>` clicável (`cursor-zoom-in`, remover `pointer-events-none`).
- Adicionar botão flutuante "lupa" (ZoomIn) no canto superior direito da área da imagem como affordance visual.
- Renderizar `<ImageZoomModal>` quando `zoomImage` estiver setado, com `onClose={() => setZoomImage(null)}`.

### B) PDF com loading e scroll funcionando no iOS
- Substituir `<object>` por `<iframe>` (rola corretamente em todos os navegadores).
- Detectar iOS via `navigator.userAgent` e, no iOS, usar o Google Docs Viewer (`https://docs.google.com/gview?embedded=true&url=...`) como fonte do iframe — esse viewer rola suave em Safari mobile.
- Em desktop/Android continuar com o iframe nativo do PDF (`#toolbar=0&view=FitH`).
- Adicionar overlay de loading (spinner `Loader2` + texto "Carregando PDF…") que some no `onLoad` do iframe.
- Resetar `pdfLoaded=false` toda vez que o modal abre ou a URL muda.
- Aplicar `style={{ WebkitOverflowScrolling: "touch" }}` no iframe iOS para inércia do scroll.

### C) Manter intocado
- Header, botões de imprimir/baixar, marca d'água do download, lógica de vídeo, lógica de domínios bloqueados.
- Banner da home, `ImageZoomModal` em si — sem mudanças.

## Detalhes técnicos
- Detecção iOS: `/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream`.
- `useEffect` resetando o loading quando `open`, `url` ou `type` mudam.
- Nenhuma migração de banco, nenhuma nova dependência (pdf-lib já está instalado, `ImageZoomModal` já existe).

## Arquivos alterados
- `src/components/ContentViewerModal.tsx` (único arquivo)
