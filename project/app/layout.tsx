import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dashboard Comptage Piétons',
  description: 'Tableau de bord pour le comptage de piétons',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="flex h-screen">
          <div className="hidden md:flex w-64 flex-col fixed inset-y-0">
            <Sidebar />
          </div>
          <div className="md:pl-64 flex flex-col flex-1">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}