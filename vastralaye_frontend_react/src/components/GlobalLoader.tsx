import { Loader2 } from "lucide-react";

const GlobalLoader = () => {
  return (
    <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center gap-6">
          {/* Simple slow spinner */}
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-gray-100"></div>
            <Loader2 className="h-20 w-20 animate-spin-slow text-blue-600 absolute top-0 left-0" />
          </div>
          
          {/* Simple text */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Loading
            </h3>
            <p className="text-gray-500">
              Please wait...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;