import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import { siteConfig } from "@/config/site";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import RestaurantManagement from "./pages/RestaurantManagement";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import AdminGuard from "./components/AdminGuard";

const queryClient = new QueryClient();

// Get the basename from the current pathname or config
const getBasename = () => {
  const pathname = window.location.pathname;
  const configBasePath = siteConfig.urls.basePath;
  if (pathname.startsWith(configBasePath)) {
    return configBasePath;
  }
  return '/';
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RestaurantProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={getBasename()}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
              <Route path="/restaurants" element={<AdminGuard><RestaurantManagement /></AdminGuard>} />
              <Route path="/users" element={<AdminGuard><UserManagement /></AdminGuard>} />
              <Route path="/auth" element={<Auth />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RestaurantProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
