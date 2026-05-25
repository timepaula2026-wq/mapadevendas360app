import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.mapadevendas.app3094775',
  appName: 'Mapa de Vendas',
  webDir: 'dist',
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
