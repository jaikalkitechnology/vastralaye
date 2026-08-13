/**
 * The one loading state for the whole admin dashboard.
 *
 * Every page used to roll its own — grey skeleton rows on Users and Orders, a
 * bordered spinner on Categories, a spinning refresh icon on Products, a bare
 * "Loading banners…" line on Banners — so the dashboard looked like four
 * different products depending on which tab you opened. This is that one
 * state: same ornament, same copy, same rhythm everywhere, including the
 * fallback the shell shows while a page's code is still downloading.
 *
 * It deliberately does *not* cover the screen. The sidebar and topbar stay put
 * and only the panel that's actually waiting shows this.
 */
interface AdminLoadingProps {
  /** What's being fetched, e.g. "products" → "Loading products…". */
  label?: string;
  /** Tighter, quieter version for table cells and small panels. */
  compact?: boolean;
  className?: string;
}

const AdminLoading = ({ label, compact = false, className = '' }: AdminLoadingProps) => (
  <div
    role="status"
    aria-live="polite"
    className={`flex flex-col items-center justify-center text-center ${
      compact ? 'py-10' : 'py-20'
    } ${className}`}
  >
    {/* Gold ring + maroon diamond — the site's loading mark, at panel scale. */}
    <span aria-hidden="true" className={`relative block ${compact ? 'h-8 w-8' : 'h-11 w-11'}`}>
      <span className="absolute inset-0 rounded-full border-2 border-sand" />
      <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-maroon animate-spin" />
      <span
        className={`absolute rotate-45 bg-gold ${compact ? 'inset-[11px]' : 'inset-[15px]'}`}
      />
    </span>

    <p className={`font-medium text-espresso ${compact ? 'mt-3 text-xs' : 'mt-4 text-[13px]'}`}>
      {label ? `Loading ${label}…` : 'Loading…'}
    </p>
    {!compact && <p className="mt-1 text-xs text-muted-foreground">Please wait a moment</p>}
  </div>
);

export default AdminLoading;
