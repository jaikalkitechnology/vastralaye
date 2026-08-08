import { Truck, Banknote, RefreshCcw, Sparkles } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';

/** Thin trust band under the hero (design.md §5.3). */
const items = [
  { icon: Truck, label: 'Free Shipping ₹999+' },
  { icon: Banknote, label: 'Cash on Delivery' },
  { icon: RefreshCcw, label: '7-Day Easy Returns' },
  { icon: Sparkles, label: 'Handcrafted in India' },
];

const UspStrip = () => (
  <section className="bg-blush border-y border-border">
    <div className="container mx-auto px-4">
      <Reveal y={12}>
      <div className="grid grid-cols-2 md:grid-cols-4">
        {items.map(({ icon: Icon, label }, i) => (
          <div
            key={label}
            className={`flex items-center justify-center gap-3 py-4 px-2 text-[12px] md:text-[13px] font-medium uppercase tracking-[0.06em] text-espresso ${
              i > 0 ? 'md:border-l md:border-border' : ''
            }`}
          >
            <Icon className="h-5 w-5 text-terracotta shrink-0" strokeWidth={1.5} />
            <span>{label}</span>
          </div>
        ))}
      </div>
      </Reveal>
    </div>
  </section>
);

export default UspStrip;
