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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find quick answers to common questions about our services and policies
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-200 capitalize ${
                activeCategory === category
                  ? 'bg-blue-600 text-white shadow-lg transform -translate-y-0.5'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                    <span className="text-blue-600 font-semibold text-sm">Q</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                </div>
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center transition-transform duration-300">
                  <svg 
                    className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
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
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-1">
                      <span className="text-green-600 font-semibold text-sm">A</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed pt-1">{faq.answer}</p>
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