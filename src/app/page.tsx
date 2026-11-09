import { AppRoot } from './AppRoot';

export const metadata = {
  title: 'mptreco • Nostalgic YouTube & Offline Music Player',
  description: 'Toque do YouTube ou baixe MP3 para ouvir offline e com a tela desligada.',
  manifest: '/manifest.json',
};

export default function Home() {
  return <AppRoot />;
}
