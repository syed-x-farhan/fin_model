import React from 'react';
import { BarChart3 } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full h-16 bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-center h-full px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Planetive</h1>
        </div>
      </div>
    </header>
  );
}
