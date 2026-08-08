/**
 * Floating WhatsApp chat button (design.md §5.14).
 * Update WHATSAPP_NUMBER to the store's support number.
 */
const WHATSAPP_NUMBER = '918527596413';

const WhatsAppFloat = () => (
  <a
    href={`https://wa.me/${WHATSAPP_NUMBER}`}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat with us on WhatsApp"
    className="fixed bottom-6 right-6 z-40 w-[52px] h-[52px] rounded-full bg-espresso border border-gold flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
  >
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-ivory" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4zm-3 4.2c-.2 0-.5 0-.7.3-.2.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.9 4.5 3.9 2.2.9 2.7.7 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.1-.2 0-.4.1-.5l.6-.7c.2-.2.2-.4.1-.6L10 8.7c-.1-.3-.3-.4-.5-.4z" />
    </svg>
  </a>
);

export default WhatsAppFloat;
