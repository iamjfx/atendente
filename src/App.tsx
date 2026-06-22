import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AccountProvider } from "@/contexts/AccountContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/dashboard/Dashboard";
import Agenda from "@/pages/dashboard/Agenda";
import Conversas from "@/pages/dashboard/Conversas";
import Configuracoes from "@/pages/dashboard/Configuracoes";
import Suporte from "@/pages/dashboard/Suporte";
import { Toaster } from "sonner";

export default function App() {
  return (
    <AuthProvider>
      <AccountProvider>
        <Toaster richColors position="top-right" />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute product="atendente">
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agenda"
            element={
              <ProtectedRoute product="atendente">
                <AppLayout><Agenda /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/conversas"
            element={
              <ProtectedRoute product="atendente">
                <AppLayout><Conversas /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute product="atendente">
                <AppLayout><Configuracoes /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/suporte"
            element={
              <ProtectedRoute product="atendente">
                <AppLayout><Suporte /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AccountProvider>
    </AuthProvider>
  );
}
