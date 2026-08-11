/**
 * Illustrated artisan-courtyard scene for the home hero (new_design.md §25).
 *
 * Where the footer carries a pan-India skyline of landmarks, the hero tells
 * the making-of story instead: a marigold toran strung across the top, and
 * along the bottom a courtyard of craft — a pit handloom with a weaver at
 * the shuttle, a charkha, thread spools, a rangoli, a row of diyas, tulsi
 * pots and a freshly dyed saree drying on a line. Jharokha arches hold the
 * far edges on wide screens.
 *
 * Drawn in warm line art (terracotta/gold on the ivory canvas). The scene is
 * built as separately anchored bands rather than one full-bleed drawing, so
 * nothing is cropped as the hero grows taller and the headline's zone in the
 * middle stays clear. Inline SVG — no image request.
 */

const GOLD = '#C99A45';
const TERRA = '#B85C38';
const MAROON = '#7A1F2B';

const strokeProps = {
  fill: 'none',
  stroke: TERRA,
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/* ── Toran (festive garland) ─────────────────────────────────────────── */

const PEGS = [0, 288, 576, 864, 1152, 1440];
const SAG = 30;

/** Point on the quadratic swag between two pegs. */
const swagPoint = (x0: number, x1: number, t: number) => {
  const mt = 1 - t;
  return {
    x: mt * mt * x0 + 2 * mt * t * ((x0 + x1) / 2) + t * t * x1,
    y: mt * mt * 6 + 2 * mt * t * (6 + SAG * 2) + t * t * 6,
  };
};

const Marigold = ({ x, y, r = 6.5 }: { x: number; y: number; r?: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill={TERRA} fillOpacity=".16" strokeOpacity=".55" />
    <circle r={r * 0.45} strokeOpacity=".4" />
  </g>
);

/** Mango leaf — the strands that hang from every peg of a toran. */
const Leaf = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path
    d={`M${x} ${y}c${5 * s} ${4 * s} ${5 * s} ${13 * s} 0 ${18 * s}c${-5 * s} ${-5 * s} ${-5 * s} ${-14 * s} 0 ${-18 * s}z`}
    fill={GOLD}
    fillOpacity=".1"
    strokeOpacity=".5"
  />
);

const Toran = () => (
  <svg
    viewBox="0 0 1440 100"
    preserveAspectRatio="xMidYMin slice"
    aria-hidden="true"
    className="w-full h-[70px] md:h-auto"
  >
    <g {...strokeProps} strokeOpacity=".55">
      {PEGS.slice(0, -1).map((x0, i) => {
        const x1 = PEGS[i + 1];
        return (
          <g key={x0}>
            <path d={`M${x0} 6Q${(x0 + x1) / 2} ${6 + SAG * 2} ${x1} 6`} strokeOpacity=".45" />
            {[0.2, 0.35, 0.5, 0.65, 0.8].map((t) => {
              const p = swagPoint(x0, x1, t);
              return <Marigold key={t} x={p.x} y={p.y} r={t === 0.5 ? 7.5 : 6} />;
            })}
          </g>
        );
      })}
      {PEGS.map((x) => (
        <g key={`strand-${x}`}>
          <path d={`M${x} 4v46`} strokeOpacity=".3" />
          <Leaf x={x} y={18} s={0.85} />
          <Leaf x={x} y={36} s={0.7} />
          <Marigold x={x} y={9} r={5} />
        </g>
      ))}
      {/* Birds off the garland */}
      <g strokeOpacity=".24">
        <path d="M330 86c5-6 11-6 15 0M348 80c5-6 11-6 15 0" />
        <path d="M1140 78c5-6 11-6 15 0M1158 86c5-6 11-6 15 0" />
      </g>
    </g>
  </svg>
);

/* ── Courtyard of craft ──────────────────────────────────────────────── */

const Courtyard = () => (
  <svg
    viewBox="0 0 1440 212"
    preserveAspectRatio="xMinYMax slice"
    aria-hidden="true"
    className="w-full h-auto"
  >
    <g {...strokeProps} transform="translate(0 -466)">
      {/* Ground */}
      <g strokeOpacity=".3">
        <path d="M0 646h1440" strokeOpacity=".22" />
        <path d="M0 664c150-8 300-8 450 0s300 8 450 0 390-8 540 0" strokeOpacity=".16" />
      </g>

      {/* Pit handloom with weaver */}
      <g strokeOpacity=".5">
        <path d="M96 646V486M310 646V486M84 486h238" />
        <path d="M96 512h214" strokeOpacity=".35" />
        <g strokeOpacity=".26" strokeWidth="1">
          {Array.from({ length: 11 }, (_, i) => 546 + i * 8).map((y) => (
            <path key={y} d={`M104 ${y}h198`} />
          ))}
        </g>
        <path d="M186 518v122M178 518h16M178 640h16" strokeOpacity=".5" />
        <path d="M104 646c0-16 10-28 24-28h34c14 0 24 12 24 28z" fill={MAROON} fillOpacity=".1" />
        <path d="M112 630h84" strokeOpacity=".3" />
        <path d="M150 512v34M170 512v34M206 512v34M226 512v34" strokeOpacity=".22" />

        {/* Weaver — seated at the shuttle, drawn as a draped figure */}
        <g strokeOpacity=".55">
          <path
            d="M340 646c-2-28 4-52 18-66 9-9 22-10 31-1 11 11 17 33 17 67z"
            fill={MAROON}
            fillOpacity=".13"
          />
          <path d="M350 596c14-9 30-11 44-4" strokeOpacity=".38" />
          <path d="M344 622c20-7 40-7 58 2" strokeOpacity=".28" />
          <circle cx="376" cy="562" r="14" fill={TERRA} fillOpacity=".14" />
          <path d="M362 560c0-9 6-15 14-15s14 6 14 15" strokeOpacity=".45" />
          <circle cx="393" cy="556" r="6" fill={TERRA} fillOpacity=".14" strokeOpacity=".4" />
          <path d="M352 600c-15 3-28 11-36 22" strokeOpacity=".5" />
          <path d="M332 646h74" strokeOpacity=".28" />
        </g>
      </g>

      {/* Charkha */}
      <g strokeOpacity=".45" transform="translate(474 0)">
        <circle cx="52" cy="596" r="44" strokeOpacity=".5" />
        <circle cx="52" cy="596" r="7" fill={GOLD} fillOpacity=".16" />
        <g strokeOpacity=".22">
          {Array.from({ length: 12 }, (_, i) => (i * 180) / 12).map((a) => (
            <path
              key={a}
              d={`M${52 + 43 * Math.cos((a * Math.PI) / 180)} ${596 + 43 * Math.sin((a * Math.PI) / 180)}L${52 - 43 * Math.cos((a * Math.PI) / 180)} ${596 - 43 * Math.sin((a * Math.PI) / 180)}`}
            />
          ))}
        </g>
        <path d="M0 646h150M14 646l14-40M92 646l-14-40" />
        <path d="M96 588h54M96 604h54" strokeOpacity=".3" />
        <path d="M150 580v32M162 596h-18" strokeOpacity=".4" />
        <circle cx="168" cy="596" r="5" fill={GOLD} fillOpacity=".2" strokeOpacity=".4" />
      </g>

      {/* Thread spools */}
      <g strokeOpacity=".45" transform="translate(690 0)">
        {[0, 44, 88].map((dx, i) => (
          <g key={dx} transform={`translate(${dx} ${i === 1 ? -34 : 0})`}>
            <path d="M6 646v-40h26v40z" fill={TERRA} fillOpacity=".12" />
            <path d="M2 606h34M2 646h34" strokeOpacity=".5" />
            <path d="M8 616h22M8 626h22M8 636h22" strokeOpacity=".25" />
          </g>
        ))}
        <path d="M132 646c26-6 40-20 40-40s-14-26-26-20" strokeOpacity=".28" />
      </g>

      {/* Rangoli chalked on the courtyard floor */}
      <g strokeOpacity=".35" transform="translate(930 636)">
        {Array.from({ length: 8 }, (_, i) => (i * 360) / 8).map((a) => (
          <ellipse
            key={a}
            rx="12"
            ry="44"
            transform={`scale(1 0.4) rotate(${a})`}
            fill={GOLD}
            fillOpacity=".1"
            strokeOpacity=".3"
          />
        ))}
        <ellipse rx="13" ry="13" transform="scale(1 0.4)" fill={TERRA} fillOpacity=".18" />
        <ellipse rx="62" ry="62" transform="scale(1 0.4)" strokeOpacity=".2" />
        {Array.from({ length: 16 }, (_, i) => (i * 360) / 16).map((a) => (
          <circle
            key={a}
            cx={76 * Math.cos((a * Math.PI) / 180)}
            cy={76 * 0.4 * Math.sin((a * Math.PI) / 180)}
            r="2.4"
            fill={GOLD}
            fillOpacity=".32"
            strokeOpacity="0"
          />
        ))}
      </g>

      {/* Diyas lit along a step */}
      <g strokeOpacity=".45" transform="translate(1030 0)">
        <path d="M-10 624h140M-10 624v22" strokeOpacity=".26" />
        {[0, 46, 92].map((dx) => (
          <g key={dx} transform={`translate(${dx} 0)`}>
            <path d="M0 606c0 11 7 18 16 18s16-7 16-18z" fill={TERRA} fillOpacity=".22" />
            <path d="M-4 606h40" strokeOpacity=".45" />
            <path
              d="M16 602c0-11 5-16 5-23 0 7 5 12 5 23z"
              transform="translate(-5 0)"
              fill={GOLD}
              fillOpacity=".28"
              strokeOpacity=".42"
            />
          </g>
        ))}
      </g>

      {/* Tulsi in a clay pot */}
      <g strokeOpacity=".45" transform="translate(1168 0)">
        <path d="M6 646l6-36h40l6 36z" fill={MAROON} fillOpacity=".12" />
        <path d="M8 624h48M4 610h56" strokeOpacity=".35" />
        <path d="M32 610v-30" />
        <g fill={GOLD} fillOpacity=".14" strokeOpacity=".42">
          <path d="M32 602c-14-1-22-9-22-19 13 1 22 9 22 19z" />
          <path d="M32 602c14-1 22-9 22-19-13 1-22 9-22 19z" />
          <path d="M32 584c-10-4-14-13-11-21 9 3 14 13 11 21z" />
        </g>
      </g>

      {/* Folded weaves stacked at the end of the courtyard */}
      <g strokeOpacity=".42" transform="translate(1258 0)">
        <path d="M-8 646h158" strokeOpacity=".28" />
        {[0, 1, 2, 3].map((i) => {
          const y = 626 - i * 19;
          const w = 130 - i * 12;
          const x = 6 + i * 6;
          return (
            <g key={i}>
              <path
                d={`M${x} ${y}h${w}a7 7 0 0 1 0 14H${x}a7 7 0 0 1 0-14z`}
                fill={TERRA}
                fillOpacity={0.07 + i * 0.03}
              />
              <path d={`M${x + 10} ${y + 7}h${w - 20}`} strokeOpacity=".2" />
            </g>
          );
        })}
      </g>
    </g>
  </svg>
);

/* ── Jharokha arches at the far edges ────────────────────────────────── */

const ArchLeft = () => (
  <svg
    viewBox="0 0 180 460"
    preserveAspectRatio="xMinYMax meet"
    aria-hidden="true"
    className="h-full w-auto"
  >
    <g {...strokeProps} strokeOpacity=".2">
      <path d="M-10 460V128a82 82 0 0 1 164 0v332" fill={MAROON} fillOpacity=".04" />
      <path d="M8 460V136a64 64 0 0 1 128 0v324" />
      <path d="M-10 46h164" />
      <path d="M18 46V28M50 46V28M82 46V28M114 46V28M146 46V28" strokeOpacity=".16" />
      <path d="M-4 400h152" strokeOpacity=".12" />
    </g>
  </svg>
);

const ArchRight = () => (
  <svg
    viewBox="0 0 180 460"
    preserveAspectRatio="xMaxYMax meet"
    aria-hidden="true"
    className="h-full w-auto"
  >
    <g {...strokeProps} strokeOpacity=".2">
      <path d="M26 460V128a82 82 0 0 1 164 0v332" fill={MAROON} fillOpacity=".04" />
      <path d="M44 460V136a64 64 0 0 1 128 0v324" />
      <path d="M26 46h164" />
      <path d="M54 46V28M86 46V28M118 46V28M150 46V28" strokeOpacity=".16" />
      <path d="M32 400h152" strokeOpacity=".12" />
    </g>
  </svg>
);

/* ── Buti (block-print motif) scattered through the mid-field ────────── */

const Buti = ({ className }: { className: string }) => (
  <svg viewBox="0 0 42 46" aria-hidden="true" className={className}>
    <g {...strokeProps} strokeOpacity=".34" fill={GOLD} fillOpacity=".05">
      <path d="M15 2c15 7 23 20 21 34-2 12-11 21-22 24-8 2-14-3-14-9s4-11 10-11 8 4 8 8" />
      <path d="M15 14c8 5 12 13 11 22" fill="none" strokeOpacity=".24" />
    </g>
  </svg>
);

/* Kept clear of the headline block (left 4–46%, top 24–72%). */
const BUTIS = [
  'left-[17%] top-[11%] w-7 rotate-[14deg]',
  'left-[47%] top-[19%] w-9 -rotate-[8deg]',
  'left-[63%] top-[10%] w-6 rotate-[26deg]',
  'left-[91%] top-[31%] w-8 -rotate-[16deg]',
  'left-[9%] top-[80%] w-6 rotate-[8deg]',
  'left-[53%] top-[63%] w-7 -rotate-[22deg]',
];

/* ── Composed scene ──────────────────────────────────────────────────── */

const HeroScene = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <div className="absolute inset-x-0 top-0">
      <Toran />
    </div>
    <div className="absolute inset-y-0 left-0 hidden lg:block w-[10%] py-16">
      <ArchLeft />
    </div>
    <div className="absolute inset-y-0 right-0 hidden lg:block w-[10%] py-16">
      <ArchRight />
    </div>
    {BUTIS.map((cls) => (
      <Buti key={cls} className={`absolute hidden sm:block ${cls}`} />
    ))}
    {/* Below md the copy fills the hero, so the courtyard would sit under the
        buttons — the toran alone carries the scene there. */}
    <div className="absolute inset-x-0 bottom-0 hidden md:block">
      <Courtyard />
    </div>
  </div>
);

export default HeroScene;
