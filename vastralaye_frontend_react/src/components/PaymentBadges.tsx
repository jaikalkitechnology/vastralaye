/**
 * Payment method badges — white chips with inline-SVG brand marks
 * (no external images). Used in the footer; reusable anywhere
 * (cart summary, checkout) via <PaymentBadges />.
 */

const Chip = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <span
    title={label}
    aria-label={label}
    className="h-7 px-2 bg-white border border-espresso/10 rounded-[3px] inline-flex items-center justify-center shadow-sm"
  >
    {children}
  </span>
);

const PaymentBadges = () => (
  <div className="flex flex-wrap items-center gap-2">
    {/* UPI — orange/green chevrons + wordmark */}
    <Chip label="UPI">
      <svg viewBox="0 0 44 18" className="h-[15px] w-auto" aria-hidden="true">
        <path d="M4 2 l7 7 -7 7 z" fill="#F46F20" />
        <path d="M10 2 l7 7 -7 7 z" fill="#35B24A" />
        <text x="21" y="13.6" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700" fill="#26375F">
          UPI
        </text>
      </svg>
    </Chip>

    {/* Visa — blue italic wordmark */}
    <Chip label="Visa">
      <svg viewBox="0 0 40 16" className="h-[13px] w-auto" aria-hidden="true">
        <text
          x="20"
          y="12.8"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="13.5"
          fontWeight="700"
          fontStyle="italic"
          fill="#1A1F71"
        >
          VISA
        </text>
      </svg>
    </Chip>

    {/* Mastercard — interlocking circles */}
    <Chip label="Mastercard">
      <svg viewBox="0 0 36 22" className="h-[17px] w-auto" aria-hidden="true">
        <circle cx="13.5" cy="11" r="8.5" fill="#EB001B" />
        <circle cx="22.5" cy="11" r="8.5" fill="#F79E1B" />
        <ellipse cx="18" cy="11" rx="4.2" ry="7.6" fill="#FF5F00" />
      </svg>
    </Chip>

    {/* RuPay — wordmark + orange/green chevrons */}
    <Chip label="RuPay">
      <svg viewBox="0 0 58 18" className="h-[14px] w-auto" aria-hidden="true">
        <text x="1" y="13.6" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700" fill="#26375F">
          RuPay
        </text>
        <path d="M44 3 l6 6 -6 6 z" fill="#F46F20" />
        <path d="M50 3 l6 6 -6 6 z" fill="#35B24A" />
      </svg>
    </Chip>

    {/* Cash on Delivery — banknote + wordmark */}
    <Chip label="Cash on Delivery">
      <svg viewBox="0 0 46 18" className="h-[14px] w-auto" aria-hidden="true">
        <rect x="1.5" y="4" width="14" height="10" rx="1.5" fill="none" stroke="#3E6B4F" strokeWidth="1.6" />
        <circle cx="8.5" cy="9" r="2.3" fill="#3E6B4F" />
        <text x="19" y="13.6" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700" fill="#2B1B12">
          COD
        </text>
      </svg>
    </Chip>
  </div>
);

export default PaymentBadges;
