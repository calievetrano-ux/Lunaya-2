import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lunaya.app',
  appName: 'LUNAYA',
  webDir: 'dist',
  server: {
    url: 'https://5b58bc98-5580-42cc-85ea-5f6050bce44f.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
