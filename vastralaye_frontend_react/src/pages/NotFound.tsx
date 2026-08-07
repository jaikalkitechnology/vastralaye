
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="container px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <h1 className="text-6xl font-bold text-navy mb-4">404</h1>
      <h2 className="text-2xl font-medium mb-6">Page Not Found</h2>
      <p className="text-gray-600 text-center max-w-md mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <div className="flex space-x-4">
        <Button asChild size="lg">
          <Link to="/">Go Home</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
