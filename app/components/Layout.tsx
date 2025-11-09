import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div 
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: 'url(/images/galaxy.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="w-full py-6 px-4 border-b border-slate-800/50">
          <h1 className="text-3xl font-bold text-center text-slate-100">
            FocusHub: Study With Me
          </h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center py-8 px-4">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full py-4 px-4 border-t border-slate-800/50">
          <p className="text-center text-slate-500 text-sm">
            ©{new Date().getFullYear()} FocusHub
          </p>
        </footer>
      </div>
    </div>
  );
}

