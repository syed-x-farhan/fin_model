
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FinancialDashboard from "./pages/FinancialDashboard";
import NotFound from "./pages/NotFound";
import ThreeStatementStatements from "./components/dashboards/ThreeStatementStatements";
import { CalculationResultProvider } from "@/contexts/CalculationResultContext";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CalculationResultProvider>
      <BrowserRouter>
        <Routes>
          {/* Home page - Model selection and configuration */}
          <Route path="/" element={<FinancialDashboard />} />
          
          {/* Model-specific routes */}
          <Route path="/model/:modelId" element={<FinancialDashboard />} />
          <Route path="/model/:modelId/dashboard" element={<Dashboard />} />
          <Route path="/model/:modelId/statements" element={<ThreeStatementStatements />} />
          
          {/* Legacy routes for backward compatibility */}
          <Route path="/dashboard/:modelId" element={<Dashboard />} />
          <Route path="/statements" element={<ThreeStatementStatements />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </CalculationResultProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
