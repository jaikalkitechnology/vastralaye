import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageBanner from "@/components/PageBanner";

const BestSellers = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/fronted/products/products`)
      .then((res) => {
        const products = Array.isArray(res.data) ? res.data : [];
        setAllProducts(products);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading best sellers", err);
        setError("Failed to load best sellers");
        setLoading(false);
      });
  }, []);

  // Update pagination when products or settings change
  useEffect(() => {
    if (allProducts.length > 0) {
      // Calculate total pages
      const total = Math.ceil(allProducts.length / productsPerPage);
      setTotalPages(total);

      // Reset to page 1 if current page exceeds new total
      if (currentPage > total) {
        setCurrentPage(1);
      }

      // Get products for current page
      const startIndex = (currentPage - 1) * productsPerPage;
      const endIndex = startIndex + productsPerPage;
      const paginatedProducts = allProducts.slice(startIndex, endIndex);

      setDisplayProducts(paginatedProducts);
    }
  }, [allProducts, currentPage, productsPerPage]);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePerPageChange = (value: string) => {
    setProductsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing limit
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-maroon border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading bestsellers…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <h2 className="font-serif text-2xl font-medium text-espresso mb-2">
          Unable to load bestsellers
        </h2>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-sm bg-maroon px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ivory transition-colors hover:bg-terracotta"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin-driven banner (Admin → Banner Control) */}
      <PageBanner
        title="Bestsellers"
        subtitle={`Most-loved styles, chosen by our shoppers · ${allProducts.length} products`}
        crumb="Bestsellers"
        page="best_sellers"
      />

      <div className="container mx-auto px-4 pt-8 pb-16 lg:pb-20">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-y border-border py-3 mb-8">
          <div className="text-sm text-muted-foreground">
            Showing {displayProducts.length > 0 ? (currentPage - 1) * productsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * productsPerPage, allProducts.length)} of{" "}
            {allProducts.length} products
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[12px] uppercase tracking-[0.1em] text-muted-foreground">Per page</span>
            <Select
              value={productsPerPage.toString()}
              onValueChange={handlePerPageChange}
            >
              <SelectTrigger className="w-[90px] rounded-sm border-input bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Cards Grid */}
        {displayProducts.length === 0 && allProducts.length === 0 ? (
          <div className="text-center py-16">
            <span aria-hidden className="mb-5 flex items-center justify-center gap-2.5">
              <span className="h-px w-11 bg-gold/60" />
              <span className="h-[7px] w-[7px] rotate-45 border border-gold" />
              <span className="h-px w-11 bg-gold/60" />
            </span>
            <h3 className="font-serif text-xl font-medium text-espresso">No bestsellers yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Our most-loved pieces will appear here soon.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="h-auto w-full rounded-sm px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] sm:w-auto"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1.5" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {/* First Page */}
                  {currentPage > 3 && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handlePageClick(1)}
                        className="w-9 h-9 p-0 rounded-sm text-[13px]"
                      >
                        1
                      </Button>
                      {currentPage > 4 && (
                        <span className="text-muted-foreground">…</span>
                      )}
                    </>
                  )}

                  {/* Page Numbers Around Current */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === currentPage ||
                        page === currentPage - 1 ||
                        page === currentPage + 1 ||
                        page === currentPage - 2 ||
                        page === currentPage + 2
                    )
                    .map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => handlePageClick(page)}
                        className={`w-9 h-9 p-0 rounded-sm text-[13px] ${
                          currentPage === page
                            ? "bg-espresso text-ivory hover:bg-espresso"
                            : ""
                        }`}
                      >
                        {page}
                      </Button>
                    ))}

                  {/* Last Page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <span className="text-muted-foreground">…</span>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handlePageClick(totalPages)}
                        className="w-9 h-9 p-0 rounded-sm text-[13px]"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="h-auto w-full rounded-sm px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] sm:w-auto"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            )}

            {/* Page Info */}
            <div className="text-center mt-4 text-[12px] uppercase tracking-[0.12em] text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BestSellers;