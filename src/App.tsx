
import './App.css';
import { Main } from './components/main';
import { Header } from './components/header';
import { AuthButtonServer } from './components/auth-button-server';
import { Providers } from './components/providers';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from "@/components/ui/toaster";

import { useEffect } from 'react';
import { setupDatabase, initializeDatabase } from './lib/setupDatabase';
import { useToast } from '@/components/ui/use-toast';

function App() {
  const { toast } = useToast();
  
  useEffect(() => {
    const runDatabaseSetup = async () => {
      try {
        const initialized = await initializeDatabase();
        if (initialized) {
          await setupDatabase();
        } else {
          toast({
            title: "Aviso",
            description: "A configuração automática do banco de dados falhou. Algumas funcionalidades podem não estar disponíveis.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error('Database setup error:', err);
      }
    };
    
    // Run database setup when the app initializes
    runDatabaseSetup();
  }, [toast]);
  
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Providers>
        <header className="h-16 flex justify-between items-center p-4 border-b">
          <Header />
          <AuthButtonServer />
        </header>
        <main className="p-4">
          <Main />
        </main>
        <Toaster />
      </Providers>
    </ThemeProvider>
  )
}

export default App;
