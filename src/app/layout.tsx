import type { Metadata } from 'next';
// Correctly import GeistSans from the geist package
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Utensils } from 'lucide-react';

// GeistSans from 'geist/font/sans' is used directly as a variable, no need to call it.
// Assign the imported font object directly.
const geistSans = GeistSans;

export const metadata: Metadata = {
  title: 'Fridge Chef',
  description: 'Generate recipes from ingredients you have!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      {/* Apply the font variable's className */}
      <body
        className={cn(
          'h-full antialiased',
          geistSans.className // Use the className property from the font object
        )}
      >
        <div className="flex flex-col min-h-screen">
          <header className="bg-primary text-primary-foreground shadow-md">
            <div className="container mx-auto px-4 py-4 flex items-center gap-2">
               <Utensils className="h-6 w-6" />
              <h1 className="text-2xl font-semibold tracking-tight">
                Fridge Chef
              </h1>
            </div>
          </header>
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
           <footer className="py-4 text-center text-sm text-muted-foreground">
             Built with Firebase & Genkit
           </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
