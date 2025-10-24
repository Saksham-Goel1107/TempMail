'use client';

import { Moon, Sun, ArrowLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter : bg-background/ 60 shadow-sm">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 group cursor-pointer transition-transform duration-200 hover:scale-105">
              <div className="relative">

                <div className="absolute inset-0 rounded-lg bg-linear-to-br from-blue-500/20 to-green-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-blue-600 via-blue-500 to-green-500 bg-clip-text text-transparent tracking-tight">
                TempMail Pro
              </span>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = 'https://pro-tempmail.onrender.com'}
              className="flex items-center space-x-2 transition-all duration-200 hover:scale-105 hover:shadow-md border-border/50 hover:border-border group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline cursor-pointer">Back to TempMail</span>
              <span className="sm:hidden">Back</span>
            </Button>

            <div className="h-6 w-px bg-border/50" />

            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-lg border-border/50 hover:border-border"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
              <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-green-500/10 opacity-0 transition-opacity duration-300 hover:opacity-100" />
            </Button>
          </div>
        </div>
      </div>

      {/* Subtle gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-border/50 to-transparent" />
    </nav>
  );
}