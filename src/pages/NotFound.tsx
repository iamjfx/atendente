import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-success/10 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-black text-foreground mb-2">404</h1>
        <p className="text-muted-foreground mb-8">Página não encontrada</p>
        <Link to="/">
          <Button variant="outline" className="rounded-full">
            <Home className="w-4 h-4 mr-1" />
            Ir para o início
          </Button>
        </Link>
      </div>
    </div>
  );
}
