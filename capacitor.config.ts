import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.app.gpu3094775.gpu05ac06cd3fbdc01af91f2f233804c71d',
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
