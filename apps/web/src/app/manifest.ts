import type { MetadataRoute } from 'next';
import { APP_NAME } from '@gestor/shared';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — Oficina`,
    short_name: 'Oficina',
    description: 'Abra a OS, orce e receba direto do celular.',
    start_url: '/m/hoje',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f6f7fb',
    theme_color: '#2f80ed',
    lang: 'pt-BR',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
