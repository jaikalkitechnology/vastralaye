import { useEffect, useMemo, useState } from 'react';
import { Instagram } from 'lucide-react';
import { listProducts } from '@/api/apihelper';
import { BASE_IMG, BASE_URL } from '@/config';
import { useSiteSettings } from '@/hooks/use-site-settings';
import Reveal from '@/components/motion/Reveal';

const FALLBACK_INSTAGRAM_URL = 'https://instagram.com';

const normalize = (img: any): string => {
  if (!img) return '';
  let s = typeof img === 'object' && img.url ? String(img.url) : String(img);
  s = s.trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (!s.startsWith('/')) s = `/${s}`;
  if (!s.startsWith('/static/')) s = `/static${s}`;
  return `${(BASE_IMG || BASE_URL || '').replace(/\/$/, '')}${s}`;
};

/**
 * "As Worn By You" UGC-style grid (design.md §5.7) — until a real
 * Instagram feed is wired, tiles reuse store product imagery and link
 * to the brand profile. Hidden when no imagery is available.
 */
const InstagramGrid = () => {
  const [products, setProducts] = useState<any[]>([]);
  const settings = useSiteSettings();
  const instagramUrl = settings.instagram_url || FALLBACK_INSTAGRAM_URL;

  useEffect(() => {
    let cancelled = false;
    listProducts()
      .then((res: any) => {
        if (!cancelled && Array.isArray(res)) setProducts(res);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const tiles = useMemo(() => {
    const urls: string[] = [];
    for (const p of products) {
      const imgs = Array.isArray(p?.images) ? p.images : [];
      const u = normalize(imgs[0]);
      if (u && !urls.includes(u)) urls.push(u);
      if (urls.length >= 6) break;
    }
    return urls;
  }, [products]);

  if (tiles.length < 3) return null;

  return (
    <section className="py-14 md:py-20 pt-4 md:pt-8">
      <div className="container mx-auto px-4">
        <Reveal className="text-center mb-10">
          <span className="overline-label mb-2">@vastralaye</span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-espresso">As Worn By You</h2>
        </Reveal>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 md:gap-3.5">
          {tiles.map((src, i) => (
            <Reveal key={src} delay={i * 0.05} y={14}>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-sm bg-sand"
            >
              <img
                src={src}
                alt="Vastraliya customer style"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/50 transition-colors flex items-center justify-center">
                <Instagram className="h-6 w-6 text-ivory opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
              </span>
            </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramGrid;
