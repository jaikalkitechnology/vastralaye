import Reveal from '@/components/motion/Reveal';

/**
 * Shared renderer for the legal pages (Privacy, Terms, Refund, Shipping).
 * Content is data: the four pages pass their document through as structured
 * sections, so every policy reads in the same editorial voice — narrow
 * column, serif headings, gold diamond bullets, zari ornament.
 *
 * The text itself is applied verbatim from the company's policy documents;
 * wording changes belong in those documents first.
 */

export type PolicyBlock =
  | { t: 'p'; text: string }
  | { t: 'h3'; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'lines'; lines: string[] };   // address / contact blocks — no bullets

export interface PolicySection {
  heading: string;
  blocks: PolicyBlock[];
}

export interface PolicyContent {
  title: string;
  effective: string;
  intro: string[];
  sections: PolicySection[];
}

const Zari = () => (
  <span className="inline-flex items-center gap-3" aria-hidden="true">
    <span className="h-px w-10 bg-gold/50" />
    <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
    <span className="h-2 w-2 rotate-45 border border-gold" />
    <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
    <span className="h-px w-10 bg-gold/50" />
  </span>
);

const Body = ({ block }: { block: PolicyBlock }) => {
  if (block.t === 'p') {
    return <p className="text-[14.5px] leading-relaxed text-muted-foreground mb-3">{block.text}</p>;
  }
  if (block.t === 'h3') {
    return <h3 className="font-medium text-espresso text-[15px] mt-6 mb-2.5">{block.text}</h3>;
  }
  if (block.t === 'lines') {
    return (
      <div className="bg-blush/60 border border-sand rounded-sm px-5 py-4 my-4">
        {block.lines.map((l) => (
          <p key={l} className="text-[14.5px] leading-relaxed text-espresso/85">{l}</p>
        ))}
      </div>
    );
  }
  return (
    <ul className="space-y-2.5 mb-4">
      {block.items.map((item) => (
        <li key={item} className="flex gap-3 text-[14.5px] leading-relaxed text-muted-foreground">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

const PolicyPage = ({ content }: { content: PolicyContent }) => (
  <div className="min-h-screen bg-ivory">
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <Reveal className="text-center mb-10">
          <span className="overline-label mb-3">Vastraliya · Legal</span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso leading-tight mb-3">
            {content.title}
          </h1>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
            Effective Date: {content.effective}
          </p>
          <Zari />
        </Reveal>

        {/* No reveal animation on the document body: a block this tall never
            reaches an in-view threshold, which left the whole text invisible. */}
        <div>
          {content.intro.map((p) => (
            <p key={p.slice(0, 40)} className="text-[14.5px] leading-relaxed text-muted-foreground mb-4">
              {p}
            </p>
          ))}

          {content.sections.map((s) => (
            <section key={s.heading} className="mt-9">
              <h2 className="font-serif text-xl md:text-[22px] font-medium text-espresso border-b border-sand pb-2.5 mb-4">
                {s.heading}
              </h2>
              {s.blocks.map((b, i) => (
                <Body key={i} block={b} />
              ))}
            </section>
          ))}

          <div className="mt-14 text-center">
            <Zari />
            <p className="mt-5 text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground/80">
              Vastraliya Fashion Pvt. Ltd. · www.vastraliya.com
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PolicyPage;
