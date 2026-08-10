/**
 * Illustrated heritage panorama for the footer (new_design.md §10) — an
 * original Rajasthani skyline in zari-style gold line art: tiered palace
 * facade, arched gateway, camel, peacock, village hut and a domed fort
 * on rolling dunes. Inline SVG, so it costs no image request; drawn to
 * be background decor (low-opacity strokes on espresso).
 */
const FooterScene = () => (
  <svg
        viewBox="0 0 1440 230"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-full w-full"
      >
      <g fill="none" stroke="#C99A45" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
  
        {/* Sun */}
        <circle cx="720" cy="34" r="24" strokeOpacity=".4" fill="#C99A45" fillOpacity=".06"/>
        <circle cx="720" cy="34" r="34" strokeOpacity=".12"/>
        {/* Birds */}
        <path d="M636 30c4-5 9-5 12 0M648 30c4-5 9-5 12 0" strokeOpacity=".5"/>
        <path d="M788 22c4-5 9-5 12 0M800 22c4-5 9-5 12 0" strokeOpacity=".5"/>
        <path d="M760 52c3-4 7-4 10 0" strokeOpacity=".4"/>
  
        {/* Dune lines */}
        <path d="M0 196c120-26 260-26 380-6s260 22 400-2 300-24 430-4 180 16 230 12" strokeOpacity=".3"/>
        <path d="M0 218c160-18 320-14 470 0s330 12 480-4 330-14 490 4" strokeOpacity=".22"/>
        <path d="M120 208c60-10 130-10 190 0M840 212c70-12 150-12 220 0" strokeOpacity=".25"/>
  
        {/* LEFT: Hawa-Mahal-style tiered facade */}
        <g strokeOpacity=".75">
          <path d="M60 230V150h40v-28h44v28h40v80" fill="#7A1F2B" fillOpacity=".18"/>
          <path d="M100 150v-28M144 150v-28M60 150h164M104 122h36" />
          <path d="M112 122v-16c0-8 5-13 10-13s10 5 10 13v16" fill="#B85C38" fillOpacity=".2"/>
          <path d="M74 230v-14c0-6 4-10 8-10s8 4 8 10v14M106 230v-14c0-6 4-10 8-10s8 4 8 10v14M138 230v-14c0-6 4-10 8-10s8 4 8 10v14M170 230v-14c0-6 4-10 8-10s8 4 8 10v14"/>
          <path d="M74 196v-12c0-5 3.5-9 7-9s7 4 7 9v12M104 196v-12c0-5 3.5-9 7-9s7 4 7 9v12M134 196v-12c0-5 3.5-9 7-9s7 4 7 9v12M164 196v-12c0-5 3.5-9 7-9s7 4 7 9v12"/>
          <path d="M66 166v-8M88 166v-8M110 166v-8M132 166v-8M154 166v-8M176 166v-8M198 166v-8M60 166h164"/>
          <circle cx="122" cy="106" r="2" fill="#C99A45"/>
        </g>
  
        {/* Swing tree with figure */}
        <g strokeOpacity=".6">
          <path d="M300 230c-2-30-6-52-14-68M286 162c-14-8-22-22-20-38 14 2 24 12 28 26 6-14 18-22 32-22 0 16-10 30-26 36"/>
          <circle cx="268" cy="128" r="2.4" fill="#B85C38" stroke="none"/><circle cx="322" cy="132" r="2.4" fill="#B85C38" stroke="none"/><circle cx="296" cy="112" r="2.4" fill="#B85C38" stroke="none"/>
        </g>
  
        {/* Camel */}
        <g strokeOpacity=".8">
          <path d="M384 206c-3 2-4 6-3 10"/>
          <path d="M386 204c3-9 9-14 16-14 4 0 7 2 10 5 2-7 8-12 14-12 8 0 13 6 14 14 4 1 7 5 8 9"/>
          <path d="M390 204v24M402 206v22M434 204v24M446 202v26"/>
          <path d="M390 216h56" strokeOpacity=".45"/>
          <path d="M448 202c2-14 6-25 14-32 4-3 9-1 10 3 1 5-3 8-7 9"/>
          <path d="M470 172c3-3 7-3 10-1"/>
        </g>
  
        {/* Women with pots */}
        <g strokeOpacity=".7">
          <path d="M520 228l7-26h14l7 26z" fill="#7A1F2B" fillOpacity=".3"/>
          <path d="M527 202c0-3 2.5-5 5-5s5 2 5 5" strokeOpacity=".9"/>
          <circle cx="532" cy="193" r="5.5"/>
          <path d="M526 184h12M528 184c0-4 2-7 4-7s4 3 4 7" />
          <path d="M556 228l6-22h12l6 22z" fill="#B85C38" fillOpacity=".3"/>
          <circle cx="568" cy="199" r="5"/>
          <path d="M563 191h10M565 191c0-3.5 1.5-6 3-6s3 2.5 3 6"/>
        </g>
  
        {/* CENTER: arched gateway */}
        <g strokeOpacity=".8">
          <path d="M640 230v-96h160v96" fill="#7A1F2B" fillOpacity=".15"/>
          <path d="M640 134l14-14h132l14 14"/>
          <path d="M684 230v-56c0-20 16-34 36-34s36 14 36 34v56" fill="#2B1B12" fillOpacity=".4"/>
          <path d="M640 158h44M756 158h44" strokeOpacity=".5"/>
          <path d="M628 230v-110c0-8 6-14 12-14M812 230v-110c0-8-6-14-12-14"/>
          <path d="M622 106c0-10 8-18 18-18s18 8 18 18M782 106c0-10 8-18 18-18s18 8 18 18"/>
          <path d="M640 106h36M782 106h36M658 88v-14M800 88v-14M658 74l16 6-16 6"/>
          <circle cx="720" cy="112" r="3" fill="#C99A45"/>
        </g>
  
        {/* Peacock */}
        <g stroke="#2E7D6B" strokeOpacity=".8">
          <path d="M936 212c-8-3-13-10-13-18 0-10 8-18 18-18 9 0 16 7 17 16 1 8-4 16-12 19-3 1-7 1-10 1z" fill="#2E7D6B" fillOpacity=".14"/>
          <path d="M950 175c-3-12 1-24 11-31 4-3 9-1 10 3 1 4-2 7-6 8"/>
          <circle cx="966" cy="141" r="1.6" fill="#2E7D6B" stroke="none"/>
          <path d="M962 137l-2-7M966 136v-8M970 137l2-7"/>
          <circle cx="960" cy="130" r="1.4" fill="#B85C38" stroke="none"/><circle cx="966" cy="128" r="1.4" fill="#B85C38" stroke="none"/><circle cx="972" cy="130" r="1.4" fill="#B85C38" stroke="none"/>
          <path d="M955 210c20-8 44-8 64 4M953 204c24-13 52-13 76 2" strokeOpacity=".55"/>
          <circle cx="990" cy="204" r="1.8" fill="#B85C38" stroke="none"/><circle cx="1008" cy="206" r="1.8" fill="#B85C38" stroke="none"/><circle cx="1022" cy="211" r="1.8" fill="#B85C38" stroke="none"/>
          <path d="M934 212v10M944 212v10"/>
        </g>
  
        {/* Hut */}
        <g strokeOpacity=".7">
          <path d="M1040 230v-40h80v40" fill="#B85C38" fillOpacity=".15"/>
          <path d="M1032 190l48-34 48 34" fill="#C99A45" fillOpacity=".12"/>
          <path d="M1044 182h72M1052 176h56M1062 168h36"/>
          <path d="M1068 230v-24c0-7 5-12 12-12s12 5 12 12v24"/>
        </g>
  
        {/* RIGHT: fort with domes */}
        <g strokeOpacity=".75">
          <path d="M1200 230v-60h48v60M1352 230v-60h48v60" fill="#7A1F2B" fillOpacity=".18"/>
          <path d="M1200 170h48M1352 170h48M1206 170v-8h8v8M1220 170v-8h8v8M1234 170v-8h8v8M1358 170v-8h8v8M1372 170v-8h8v8M1386 170v-8h8v8"/>
          <path d="M1204 148c0-14 9-24 20-24s20 10 20 24z" fill="#B85C38" fillOpacity=".2"/>
          <path d="M1224 124v-10M1356 152c0-12 8-22 18-22s18 10 18 22z" />
          <path d="M1374 130v-8M1248 230v-40h104v40M1248 190h104M1262 190v-6h8v6M1282 190v-6h8v6M1302 190v-6h8v6M1322 190v-6h8v6M1342 190v-6h8v6"/>
          <path d="M1276 230v-20c0-6 5-11 11-11h26c6 0 11 5 11 11v20"/>
        </g>
  
        {/* Plants / butis */}
        <g strokeOpacity=".55">
          <path d="M480 230c0-14 0-24 6-32M486 206c-6-2-10-8-10-14M486 210c6-2 10-8 10-14"/>
          <path d="M876 230c0-12 0-20 5-27M881 210c-5-2-8-6-8-11M881 213c5-2 8-6 8-11"/>
          <path d="M1160 230c0-12 0-20 5-27M1165 210c-5-2-8-6-8-11M1165 213c5-2 8-6 8-11"/>
          <path d="M40 230c0-12 0-20 5-27M45 210c-5-2-8-6-8-11M45 213c5-2 8-6 8-11"/>
          <circle cx="486" cy="196" r="2.4" fill="#7A1F2B" stroke="none"/><circle cx="881" cy="201" r="2.2" fill="#7A1F2B" stroke="none"/><circle cx="1165" cy="201" r="2.2" fill="#7A1F2B" stroke="none"/><circle cx="45" cy="201" r="2.2" fill="#7A1F2B" stroke="none"/>
        </g>
  
        {/* Sand wash */}
        <path d="M0 230v-14c150-14 310-10 470 1 150 10 330 8 480-6 150-13 330-11 490 6v13z" fill="#C99A45" fillOpacity=".05" stroke="none"/>
        {/* Ground line */}
        <path d="M0 230h1440" strokeOpacity=".5"/>
      </g>
    </svg>
);

export default FooterScene;
