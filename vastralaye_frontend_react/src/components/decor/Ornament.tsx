/** Small gold ornament divider used under section headings (design.md §4). */
const Ornament = ({ className = '' }: { className?: string }) => (
  <svg
    className={`mx-auto mt-4 ${className}`}
    width="130"
    height="14"
    viewBox="0 0 130 14"
    aria-hidden="true"
  >
    <g fill="none" stroke="#C99A45">
      <line x1="0" y1="7" x2="50" y2="7" />
      <line x1="80" y1="7" x2="130" y2="7" />
      <rect x="60.5" y="2.5" width="9" height="9" transform="rotate(45 65 7)" />
    </g>
    <circle cx="65" cy="7" r="1.5" fill="#C99A45" />
  </svg>
);

export default Ornament;
