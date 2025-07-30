import React, { createContext, useContext, useState } from 'react';
import { CalculationResult } from '@/services/api';

interface CalculationResultContextType {
  calculationResult: CalculationResult | null;
  setCalculationResult: (result: CalculationResult | null) => void;
}

const CalculationResultContext = createContext<CalculationResultContextType | undefined>(undefined);

export const CalculationResultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  return (
    <CalculationResultContext.Provider value={{ calculationResult, setCalculationResult }}>
      {children}
    </CalculationResultContext.Provider>
  );
};

export const useCalculationResult = () => {
  const context = useContext(CalculationResultContext);
  if (!context) {
    throw new Error('useCalculationResult must be used within a CalculationResultProvider');
  }
  return context;
}; 