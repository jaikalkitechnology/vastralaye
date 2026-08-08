/** Branded full-screen loader — ivory veil with a spinning gold ornament. */
const GlobalLoader = () => {
  return (
    <div className="fixed inset-0 z-50 bg-ivory/85 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-sand" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-spin" />
          <div className="absolute inset-[22px] rotate-45 bg-maroon" />
        </div>
        <div className="text-center">
          <span className="font-serif text-xl text-espresso">
            Vastra<span className="text-maroon">laye</span>
          </span>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mt-1">Loading…</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;
