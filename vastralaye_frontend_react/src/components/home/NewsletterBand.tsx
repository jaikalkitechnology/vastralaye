import { useState } from 'react';
import { api } from '@/api/api';
import { toast } from '@/components/ui/use-toast';

/** Maroon newsletter band (design.md §5.7) — posts to the newsletter API. */
const NewsletterBand = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast({ title: 'Please enter a valid email address' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/fronted/newsletter/subscribe', { email: value });
      toast({ title: 'Shukriya! You’re on the list.' });
      setEmail('');
    } catch (err: any) {
      toast({ title: err?.response?.data?.detail || 'Subscription failed — please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-maroon text-ivory">
      <div className="container mx-auto px-4 py-14 md:py-16 text-center">
        <span className="block text-[11px] md:text-xs font-semibold uppercase tracking-[0.3em] text-gold mb-2">
          Stay in the loop
        </span>
        <h2 className="font-serif text-3xl md:text-4xl font-medium mb-2">Letters from the Loom</h2>
        <p className="text-ivory/75 mb-7 text-sm md:text-base">
          New drops, artisan stories and members-only offers. No spam, only silk.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row justify-center gap-2.5 sm:gap-0 max-w-lg mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            aria-label="Email address"
            className="flex-1 px-4 py-3.5 bg-ivory/10 border border-ivory/40 text-ivory placeholder:text-ivory/55 text-sm rounded-sm sm:rounded-r-none focus:outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-gold text-espresso text-xs font-semibold uppercase tracking-[0.16em] px-8 py-3.5 rounded-sm sm:rounded-l-none hover:bg-terracotta hover:text-ivory transition-colors disabled:opacity-60"
          >
            {submitting ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default NewsletterBand;
