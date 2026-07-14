import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.mapadevendas.app3094775',
  appName: 'Mapa de Vendas',
  webDir: 'dist',
  version: '0.0.1',
  server: {
    url: 'https://mapadevendas.app',
    cleartext: false,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
