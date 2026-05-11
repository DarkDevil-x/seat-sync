import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="max-w-md text-center animate-fadeIn">
        <p className="text-8xl font-bold text-primary mb-4 tabular-nums">404</p>
        <h1 className="text-2xl font-semibold text-foreground mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="rounded-lg px-6">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
