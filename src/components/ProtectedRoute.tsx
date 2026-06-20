import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccount } from "@/contexts/AccountContext";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  product?: string;
}

export default function ProtectedRoute({ children, product }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { hasProduct, loading: accountLoading } = useAccount();
  const location = useLocation();

  if (authLoading || accountLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (product && !hasProduct(product)) {
    return <Navigate to="/upgrade" replace />;
  }

  return <>{children}</>;
}
