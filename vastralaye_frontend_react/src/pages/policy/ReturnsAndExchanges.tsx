const ReturnsAndExchanges = () => {
  return (
    <div className="min-h-screen bg-ivory py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <span className="overline-label mb-2">Our Policies</span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso mb-4">Returns &amp; Exchanges</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Simple and straightforward return policy for your peace of mind
          </p>
        </div>

        <div className="bg-white rounded-lg border border-border p-8">
          <div className="space-y-8 text-[15px] leading-relaxed text-muted-foreground">
            {/* Introduction */}
            <div className="text-center pb-6 border-b border-border">
              <p>
                At <strong className="text-espresso font-semibold">Your Store Name</strong>, we want you to love your purchase.
                If you're not fully satisfied, we offer easy returns and exchanges within 7 days of delivery.
              </p>
            </div>

            {/* Policy Sections */}
            <div className="space-y-6">
              <section>
                <h2 className="font-serif text-xl font-medium text-espresso mb-3">Return Window</h2>
                <p>
                  You have <strong className="text-espresso font-semibold">7 days</strong> from the delivery date to initiate a return or exchange.
                </p>
              </section>

              <section>
                <h2 className="font-serif text-xl font-medium text-espresso mb-3">Condition Requirements</h2>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <span className="text-gold">✓</span>
                    <span>Items must be unused and unwashed</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-gold">✓</span>
                    <span>Original packaging and tags must be included</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-gold">✓</span>
                    <span>No signs of wear or damage</span>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-xl font-medium text-espresso mb-3">Non-Returnable Items</h2>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <span className="text-maroon">✗</span>
                    <span>Used or damaged items</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-maroon">✗</span>
                    <span>Personal hygiene products</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-maroon">✗</span>
                    <span>Custom-made items</span>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-serif text-xl font-medium text-espresso mb-3">The Process</h2>
                <div className="space-y-3">
                  <p>1. Contact our support team with your order number</p>
                  <p>2. We'll approve your return and provide instructions</p>
                  <p>3. Ship the item back to us</p>
                  <p>4. Receive refund or exchange within 5-10 business days</p>
                </div>
              </section>

              <section>
                <h2 className="font-serif text-xl font-medium text-espresso mb-3">Shipping Costs</h2>
                <p>
                  Return shipping is free for damaged or incorrect items. For other returns,
                  shipping charges are the responsibility of the customer.
                </p>
              </section>
            </div>

            {/* Contact */}
            <div className="pt-6 border-t border-border">
              <h2 className="font-serif text-xl font-medium text-espresso mb-4">Get Help</h2>
              <div className="space-y-2">
                <p><strong className="text-espresso font-semibold">Email:</strong> support@yourstore.com</p>
                <p><strong className="text-espresso font-semibold">Phone:</strong> +91 98765 43210</p>
                <p><strong className="text-espresso font-semibold">Hours:</strong> 10 AM to 7 PM (Monday - Saturday)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnsAndExchanges;
