import './globals.css';

export const metadata = {
  title: 'ECOSTUDIO - Scadenzario Sicurezza',
  description: 'Gestionale scadenze sicurezza sul lavoro',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
