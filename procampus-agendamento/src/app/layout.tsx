import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProCampus Agendamento',
  description: 'Sistema de agendamento de reuniões pedagógicas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
