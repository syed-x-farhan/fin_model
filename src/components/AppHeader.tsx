import { BarChart3 } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="h-16 w-full border-b border-sidebar-border flex items-center justify-center bg-white">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-sm">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-sidebar-foreground">Planetive</h2>
          <p className="text-xs text-sidebar-foreground/60 font-medium">Pro Dashboard</p>
        </div>
      </div>
    </header>
  );
}