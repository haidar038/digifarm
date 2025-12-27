import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center p-8">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
          <span className="text-4xl font-bold text-primary">404</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button onClick={() => navigate("/")}>
          <Home className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
