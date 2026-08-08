import { useState } from "react";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How can I place an order?",
      answer: "Browse our products, add them to your cart, and proceed to checkout. Complete the payment to confirm your order.",
      category: "ordering"
    },
    {
      question: "How long does delivery take?",
      answer: "Delivery usually takes 3–7 business days depending on your location. Remote areas may take slightly longer. Express delivery options are available for major cities.",
      category: "shipping"
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept UPI, Net Banking, Debit/Credit Cards, and Cash on Delivery (if available in your location). All payments are secured with SSL encryption.",
      category: "payments"
    },
    {
      question: "How can I track my order?",
      answer: "Go to the Track Order page and enter your Order ID to check the live status of your order. You'll receive SMS and email updates throughout the delivery process.",
      category: "tracking"
    },
    {
      question: "What is your return policy?",
      answer: "You can request a return within 7 days of delivery. Items must be unused, in original packaging with tags attached. Some items like personalized products are non-returnable.",
      category: "returns"
    },
    {
      question: "Do you offer international shipping?",
      answer: "Currently, we ship within India only. We're working on expanding our international shipping options in the near future.",
      category: "shipping"
    },
    {
      question: "How do I contact customer support?",
      answer: "You can reach our support team via email at support@yourstore.com, call us at +91 98765 43210, or use the live chat feature on our website.",
      category: "support"
    },
    {
      question: "Are there any hidden charges?",
      answer: "No hidden charges. The price you see is what you pay. Shipping costs are calculated at checkout based on your location and order value.",
      category: "payments"
    }
  ];

  const categories = ["all", "ordering", "shipping", "payments", "tracking", "returns", "support"];
  const [activeCategory, setActiveCategory] = useState("all");

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFaqs = activeCategory === "all"
    ? faqs
    : faqs.filter(faq => faq.category === activeCategory);

  return (
    <div className="min-h-screen bg-ivory py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <span className="overline-label mb-2">Support</span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            Find quick answers to common questions about our services and policies
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 capitalize ${
                activeCategory === category
                  ? 'bg-maroon text-ivory'
                  : 'bg-white text-muted-foreground border border-border hover:border-gold hover:text-espresso'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-border transition-colors duration-300 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center p-6 text-left hover:bg-ivory transition-colors duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blush rounded-lg flex items-center justify-center mt-1">
                    <span className="text-maroon font-serif font-semibold text-sm">Q</span>
                  </div>
                  <h3 className="text-espresso font-medium pr-4">{faq.question}</h3>
                </div>
                <div className="flex-shrink-0 w-8 h-8 bg-sand rounded-full flex items-center justify-center transition-transform duration-300">
                  <svg
                    className={`w-5 h-5 text-espresso transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                } overflow-hidden`}
              >
                <div className="px-6 pb-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-sand rounded-lg flex items-center justify-center mt-1">
                      <span className="text-maroon font-serif font-semibold text-sm">A</span>
                    </div>
                    <p className="text-[15px] leading-relaxed text-muted-foreground pt-1">{faq.answer}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
};

export default FAQ;
