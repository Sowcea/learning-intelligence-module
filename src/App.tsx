import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TriadLearningLayout from "@/components/layout/TriadLearningLayout";

const TriadLearningOverview = lazy(() => import("@/pages/TriadLearningOverview"));
const FamilyLearning = lazy(() => import("@/pages/FamilyLearning"));
const GovernanceLearning = lazy(() => import("@/pages/GovernanceLearning"));
const RocketLearning = lazy(() => import("@/pages/RocketLearning"));
const WeeklyReports = lazy(() => import("@/pages/WeeklyReports"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Toaster />
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-[#0a0a14] text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading Learning Intelligence...</span>
          </div>
        </div>
      }>
        <Routes>
          <Route element={<TriadLearningLayout />}>
            <Route path="/" element={<TriadLearningOverview />} />
            <Route path="/family" element={<FamilyLearning />} />
            <Route path="/governance" element={<GovernanceLearning />} />
            <Route path="/rocket" element={<RocketLearning />} />
            <Route path="/reports" element={<WeeklyReports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
