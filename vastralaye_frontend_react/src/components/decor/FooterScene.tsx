/**
 * Illustrated pan-India panorama for the footer (new_design.md §10) — an
 * original skyline of landmarks from across the country in zari-style
 * gold line art: Hawa Mahal (Jaipur), Qutub Minar (Delhi), Himalayan
 * peaks, a desert camel and women with pots, the Taj Mahal (Agra), the
 * Golden Temple on water (Amritsar), the national-bird peacock, a
 * temple gopuram (Tamil Nadu), the Konark sun-temple wheel (Odisha), a
 * Kerala palm and houseboat, and a Rajput fort. Inline SVG — no image
 * request; drawn as low-opacity background decor on espresso.
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
        <circle cx="720" cy="30" r="22" strokeOpacity=".4" fill="#C99A45" fillOpacity=".06"/>
        <circle cx="720" cy="30" r="31" strokeOpacity=".12"/>
        {/* Birds */}
        <path d="M642 26c4-5 9-5 12 0M654 26c4-5 9-5 12 0" strokeOpacity=".5"/>
        <path d="M786 18c4-5 9-5 12 0M798 18c4-5 9-5 12 0" strokeOpacity=".5"/>
        <path d="M762 46c3-4 7-4 10 0" strokeOpacity=".4"/>
  
        {/* Himalayan peaks (north) */}
        <path d="M462 154l36-48 24 32 22-28 30 42" strokeOpacity=".16"/>
        <path d="M492 114l6-8 7 9" strokeOpacity=".2"/>
        <path d="M534 124l5-7 6 8" strokeOpacity=".2"/>
  
        {/* Dune / ground lines */}
        <path d="M0 196c120-26 260-26 380-6s260 22 400-2 300-24 430-4 180 16 230 12" strokeOpacity=".3"/>
        <path d="M0 218c160-18 320-14 470 0s330 12 480-4 330-14 490 4" strokeOpacity=".22"/>
        <path d="M120 208c60-10 130-10 190 0M840 212c70-12 150-12 220 0" strokeOpacity=".25"/>
  
        {/* JAIPUR: Hawa-Mahal-style tiered facade */}
        <g strokeOpacity=".75">
          <path d="M60 230V150h40v-28h44v28h40v80" fill="#7A1F2B" fillOpacity=".18"/>
          <path d="M100 150v-28M144 150v-28M60 150h164M104 122h36" />
          <path d="M112 122v-16c0-8 5-13 10-13s10 5 10 13v16" fill="#B85C38" fillOpacity=".2"/>
          <path d="M74 230v-14c0-6 4-10 8-10s8 4 8 10v14M106 230v-14c0-6 4-10 8-10s8 4 8 10v14M138 230v-14c0-6 4-10 8-10s8 4 8 10v14M170 230v-14c0-6 4-10 8-10s8 4 8 10v14"/>
          <path d="M74 196v-12c0-5 3.5-9 7-9s7 4 7 9v12M104 196v-12c0-5 3.5-9 7-9s7 4 7 9v12M134 196v-12c0-5 3.5-9 7-9s7 4 7 9v12M164 196v-12c0-5 3.5-9 7-9s7 4 7 9v12"/>
          <path d="M66 166v-8M88 166v-8M110 166v-8M132 166v-8M154 166v-8M176 166v-8M198 166v-8M60 166h164"/>
          <circle cx="122" cy="106" r="2" fill="#C99A45"/>
        </g>
  
        {/* DELHI: Qutub Minar */}
        <g strokeOpacity=".75">
          <path d="M266 230l9-110h16l9 110z" fill="#7A1F2B" fillOpacity=".15"/>
          <path d="M272 200h22M275 172h17M277 144h13"/>
          <path d="M275 120h16M277 120c0-6 3-10 6-10s6 4 6 10"/>
          <path d="M283 110v-7"/>
        </g>
  
        {/* Desert camel */}
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
  
        {/* AGRA: Taj Mahal */}
        <g strokeOpacity=".8">
          <path d="M600 230v-6h240v6z" fill="#C99A45" fillOpacity=".06"/>
          <path d="M660 224v-72h120v72" fill="#7A1F2B" fillOpacity=".12"/>
          <path d="M704 224v-38c0-12 7-20 16-20s16 8 16 20v38" fill="#2B1B12" fillOpacity=".45"/>
          <path d="M672 224v-18c0-7 5-12 10-12s10 5 10 12v18M748 224v-18c0-7 5-12 10-12s10 5 10 12v18" strokeOpacity=".55"/>
          <path d="M692 152h56"/>
          <path d="M694 152c-4-24 9-42 26-50 17 8 30 26 26 50z" fill="#C99A45" fillOpacity=".1"/>
          <path d="M720 102v-13"/><circle cx="720" cy="86" r="1.5" fill="#C99A45" stroke="none"/>
          <path d="M664 152c0-8 5-13 9-13s9 5 9 13M758 152c0-8 5-13 9-13s9 5 9 13" strokeOpacity=".6"/>
          <path d="M612 224l4-90M628 224l-4-90M613 196h13M616 166h9"/>
          <path d="M616 134h8M616 134c0-5 3-9 4-9s4 4 4 9"/>
          <path d="M828 224l-4-90M812 224l4-90M814 196h13M815 166h9"/>
          <path d="M816 134h8M816 134c0-5 3-9 4-9s4 4 4 9"/>
        </g>
  
        {/* AMRITSAR: Golden Temple on water */}
        <g strokeOpacity=".75">
          <path d="M848 218v-32h64v32" fill="#C99A45" fillOpacity=".08"/>
          <path d="M848 186h64"/>
          <path d="M852 186c0-6 4-10 7-10s7 4 7 10M894 186c0-6 4-10 7-10s7 4 7 10" strokeOpacity=".6"/>
          <path d="M868 176h24"/>
          <path d="M870 176c-2-14 7-24 10-26 3 2 12 12 10 26z" fill="#C99A45" fillOpacity=".14"/>
          <path d="M880 150v-8"/>
          <path d="M874 218v-13c0-5 3-9 6-9s6 4 6 9v13"/>
          <path d="M836 226c11 3 22 3 33 0s22-3 33 0 21 3 29 0" strokeOpacity=".3"/>
        </g>
  
        {/* National bird: peacock */}
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
  
        {/* TAMIL NADU: temple gopuram */}
        <g strokeOpacity=".75">
          <path d="M1044 230l12-100h32l12 100z" fill="#B85C38" fillOpacity=".15"/>
          <path d="M1050 218h44M1053 200h38M1056 184h32M1059 166h26M1061 148h22"/>
          <path d="M1056 130h32"/>
          <path d="M1064 130v-8M1072 130v-11M1080 130v-8"/>
          <path d="M1066 218v-12c0-4 3-7 6-7s6 3 6 7v12" strokeOpacity=".6"/>
        </g>
  
        {/* ODISHA: Konark sun-temple wheel */}
        <g strokeOpacity=".65">
          <circle cx="1140" cy="202" r="24"/>
          <circle cx="1140" cy="202" r="10"/>
          <circle cx="1140" cy="202" r="2.5" fill="#C99A45" stroke="none"/>
          <path d="M1140 192v-14M1140 212v14M1130 202h-14M1150 202h14"/>
          <path d="M1133 195l-10-10M1147 195l10-10M1133 209l-10 10M1147 209l10 10"/>
        </g>
  
        {/* KERALA: palm & houseboat */}
        <g strokeOpacity=".7">
          <path d="M1196 230c2-20 0-38-6-52"/>
          <path d="M1190 178c-10-6-21-6-29 2M1190 178c-3-12-10-19-20-21M1190 178c8-10 19-13 29-9M1190 178c11-2 21 4 25 12M1190 178c1-13 6-23 14-28"/>
          <circle cx="1187" cy="182" r="1.8" fill="#B85C38" stroke="none"/><circle cx="1193" cy="184" r="1.8" fill="#B85C38" stroke="none"/>
          <path d="M1224 220c1 6 7 10 14 10h16c7 0 13-4 14-10z" fill="#7A1F2B" fillOpacity=".2"/>
          <path d="M1230 220c0-12 8-19 17-19s17 7 17 19"/>
          <path d="M1240 220v-16M1254 220v-16"/>
          <path d="M1216 226h-8M1276 226h8" strokeOpacity=".4"/>
        </g>
  
        {/* RAJASTHAN: fort with domes */}
        <g strokeOpacity=".75">
          <path d="M1288 230v-58h46v58M1394 230v-58h46v58" fill="#7A1F2B" fillOpacity=".18"/>
          <path d="M1288 172h46M1394 172h46M1294 172v-8h8v8M1308 172v-8h8v8M1322 172v-8h8v8M1400 172v-8h8v8M1414 172v-8h8v8M1428 172v-8h8v8"/>
          <path d="M1291 150c0-13 9-23 20-23s20 10 20 23z" fill="#B85C38" fillOpacity=".2"/>
          <path d="M1311 127v-9"/>
          <path d="M1398 154c0-12 8-21 17-21s17 9 17 21z"/>
          <path d="M1415 133v-8"/>
          <path d="M1334 230v-38h60v38M1334 192h60M1342 192v-6h8v6M1358 192v-6h8v6M1374 192v-6h8v6"/>
          <path d="M1350 230v-19c0-6 5-11 11-11h4c6 0 11 5 11 11v19"/>
        </g>
  
        {/* Plants / butis */}
        <g strokeOpacity=".55">
          <path d="M480 230c0-14 0-24 6-32M486 206c-6-2-10-8-10-14M486 210c6-2 10-8 10-14"/>
          <path d="M40 230c0-12 0-20 5-27M45 210c-5-2-8-6-8-11M45 213c5-2 8-6 8-11"/>
          <path d="M340 230c0-10 0-17 4-23M344 213c-4-2-7-5-7-9M344 216c4-2 7-5 7-9"/>
          <path d="M1024 230c0-10 0-17 4-23M1028 213c-4-2-7-5-7-9M1028 216c4-2 7-5 7-9" strokeOpacity=".45"/>
          <circle cx="486" cy="196" r="2.4" fill="#7A1F2B" stroke="none"/><circle cx="45" cy="201" r="2.2" fill="#7A1F2B" stroke="none"/><circle cx="344" cy="205" r="2" fill="#7A1F2B" stroke="none"/>
        </g>
  
        {/* Sand wash */}
        <path d="M0 230v-14c150-14 310-10 470 1 150 10 330 8 480-6 150-13 330-11 490 6v13z" fill="#C99A45" fillOpacity=".05" stroke="none"/>
        {/* Ground line */}
        <path d="M0 230h1440" strokeOpacity=".5"/>
      </g>
    </svg>
);

export default FooterScene;
