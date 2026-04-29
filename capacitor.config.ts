import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ⚠️ IMPORTANTE: troque appId pelo Bundle ID (iOS) / Application ID (Android)
  // EXATO do seu app já publicado na App Store e Google Play.
  // Se mudar, as lojas tratam como app NOVO em vez de atualização.
  appId: 'app.lovable.7376a98068a1409482641e733bfbf4dc',
  appName: 'Mapa de Vendas',
  webDir: 'dist',
  server: {
    // Hot-reload direto do sandbox Lovable durante o desenvolvimento.
    // REMOVA o bloco "server" antes de gerar a build de produção para a loja.
    url: 'https://7376a980-68a1-4094-8264-1e733bfbf4dc.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0F0F0F',
  },
  android: {
    backgroundColor: '#0F0F0F',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0F0F0F',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;