import { Link } from 'react-router-dom';
import Ornament from '@/components/decor/Ornament';

const NotFound = () => {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
      <span className="overline-label mb-2">Page not found</span>
      <h1 className="font-serif text-7xl md:text-8xl font-medium text-maroon leading-none">404</h1>
      <Ornament />
      <h2 className="font-serif text-2xl font-medium text-espresso mt-6 mb-3">
        This thread seems to have unravelled
      </h2>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you are looking for might have been removed, renamed, or is temporarily
        unavailable. Let's get you back to the collection.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/"
          className="inline-block bg-maroon text-ivory text-xs font-semibold uppercase tracking-[0.16em] px-8 py-3.5 rounded-sm hover:bg-terracotta transition-colors"
        >
          Go Home
        </Link>
        <Link
          to="/products"
          className="inline-block border border-espresso text-espresso text-xs font-semibold uppercase tracking-[0.16em] px-8 py-3.5 rounded-sm hover:bg-espresso hover:text-ivory transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
