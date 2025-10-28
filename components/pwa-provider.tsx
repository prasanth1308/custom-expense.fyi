'use client';

import { usePWA } from 'hooks/usePWA';
import PWAInstallPrompt from 'components/pwa-install-prompt';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  // Initialize PWA functionality
  usePWA();

  return (
    <>
      {children}
      <PWAInstallPrompt />
    </>
  );
}
