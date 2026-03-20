import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LearningLayout from "@/components/layout/LearningLayout";

const LearningIntelligence = lazy(() => import("@/pages/LearningIntelligence"));
const ExternalIntelligence = lazy(() => import("@/pages/ExternalIntelligence"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Toaster />
      <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>}>
        <Routes>
          <Route element={<LearningLayout />}>
            <Route path="/" element={<LearningIntelligence />} />
            <Route path="/external" element={<ExternalIntelligence />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
