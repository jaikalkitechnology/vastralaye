import React from 'react';

const sectionHeading = "font-serif text-xl font-medium text-espresso mt-8 mb-3";
const subHeading = "font-serif text-lg font-medium text-espresso mt-5 mb-2";
const stepHeading = "font-medium text-espresso mt-5 mb-2";
const paragraph = "mb-4";
const list = "list-disc pl-5 mb-4 space-y-1.5 marker:text-gold";

const ReturnPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-ivory py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10 md:mb-12">
          <span className="overline-label mb-2">Our Policies</span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso">
            REFUND &amp; RETURN POLICY
          </h1>
        </header>

        <div className="text-[15px] leading-relaxed text-muted-foreground">
          <p className="mb-6 italic">
            At mizorpaymart.com, we are committed to ensuring customer satisfaction with every purchase. We understand that sometimes products may not meet your expectations, and we have designed this Refund &amp; Return Policy to make the process as simple and hassle-free as possible. This policy outlines the conditions, procedures, and timelines for returns, exchanges, and refunds.
          </p>

          {/* Section 1 */}
          <h2 className={sectionHeading}>
            1. RETURN ELIGIBILITY
          </h2>

          <h3 className={subHeading}>
            1.1 Return Window
          </h3>
          <p className={paragraph}>
            We accept returns within 7 days from the date of delivery. The return period begins on the day you receive your order. To be eligible for a return, you must initiate the return request within this 7-day window.
          </p>

          <h3 className={subHeading}>
            1.2 Conditions for Return
          </h3>
          <p className={paragraph}>
            Products must meet the following conditions to be eligible for return:
          </p>
          <ul className={list}>
            <li>The product must be unused, unworn, and unwashed</li>
            <li>All original tags, labels, and packaging must be intact and attached</li>
            <li>The product must be in its original condition without any damage, stains, or alterations</li>
            <li>All accessories, freebies, or complementary items (if any) must be returned along with the product</li>
            <li>The product must be returned in its original packaging</li>
          </ul>
          <p className="mb-4 italic">
            Note: Products that do not meet these conditions may not be accepted for return, or may be subject to a reduced refund based on the condition assessment.
          </p>

          {/* Section 2 */}
          <h2 className={sectionHeading}>
            2. VALID REASONS FOR RETURN
          </h2>
          <p className={paragraph}>
            We accept returns for the following reasons:
          </p>

          <h3 className={subHeading}>
            2.1 Defective or Damaged Products
          </h3>
          <p className={paragraph}>
            If you receive a product that is defective, damaged, or has manufacturing flaws, we will accept the return and provide a full refund or replacement. Please report such issues immediately upon delivery with photographs of the defect or damage.
          </p>

          <h3 className={subHeading}>
            2.2 Wrong Product Delivered
          </h3>
          <p className={paragraph}>
            If you receive a product that is different from what you ordered (wrong size, color, style, or item), we will accept the return and arrange for the correct product to be sent to you at no additional cost, or provide a full refund.
          </p>

          <h3 className={subHeading}>
            2.3 Product Not as Described
          </h3>
          <p className={paragraph}>
            If the product significantly differs from the description, specifications, or images shown on our website, you may return the product for a refund or exchange. Minor variations in color due to screen settings or photography are not considered valid grounds for return.
          </p>

          <h3 className={subHeading}>
            2.4 Size or Fit Issues
          </h3>
          <p className={paragraph}>
            If the product does not fit as expected, you may return it within the 7-day window, provided it meets all the return conditions mentioned in Section 1.2. We recommend referring to our detailed size charts before placing an order to minimize sizing issues.
          </p>

          {/* Section 3 */}
          <h2 className={sectionHeading}>
            3. NON-RETURNABLE ITEMS
          </h2>
          <p className={paragraph}>
            For hygiene, safety, and quality reasons, the following items are not eligible for return:
          </p>
          <ul className={list}>
            <li>Innerwear, Lingerie &amp; Undergarments: All intimate apparel including bras, panties, boxers, briefs, undershirts, thermal wear, and shapewear</li>
            <li>Socks &amp; Hosiery: All types of socks, stockings, and hosiery products</li>
            <li>Customized or Personalized Products: Items that have been specially made, altered, or personalized as per customer specifications</li>
            <li>Products Marked as 'Final Sale' or 'Non-Returnable': Items clearly marked on the product page as final sale, non-returnable, or no exchange</li>
            <li>Clearance Sale Items: Products purchased during clearance or end-of-season sales (unless defective or damaged)</li>
            <li>Used, Washed, or Altered Products: Any item that has been worn, washed, altered, or shows signs of use</li>
            <li>Products with Removed Tags: Items with tags, labels, or security seals removed or damaged</li>
            <li>Freebies or Promotional Items: Complimentary products or gifts received with purchase cannot be returned separately</li>
          </ul>

          {/* Section 4 */}
          <h2 className={sectionHeading}>
            4. HOW TO INITIATE A RETURN
          </h2>

          <h3 className={subHeading}>
            4.1 Step-by-Step Return Process
          </h3>

          <h4 className={stepHeading}>
            Step 1: Contact Customer Support
          </h4>
          <p className={paragraph}>
            Send an email to info@mizorpaymart.com within 7 days of receiving your order. Include the following information:
          </p>
          <ul className={list}>
            <li>Order Number (found in your order confirmation email)</li>
            <li>Product Name and SKU/Item Code</li>
            <li>Reason for return (defective, wrong item, size issue, etc.)</li>
            <li>Clear photographs of the product (especially if damaged or defective)</li>
            <li>Your registered contact number and email address</li>
          </ul>

          <h4 className={stepHeading}>
            Step 2: Return Request Review
          </h4>
          <p className={paragraph}>
            Our customer support team will review your return request within 24-48 hours. We may request additional information or photographs if needed. Once approved, we will provide you with return instructions and a Return Authorization Number (RAN).
          </p>

          <h4 className={stepHeading}>
            Step 3: Pack the Product
          </h4>
          <p className={paragraph}>
            Pack the product securely in its original packaging along with all tags, labels, invoices, and accessories. Include a note with your Order Number and Return Authorization Number inside the package.
          </p>

          <h4 className={stepHeading}>
            Step 4: Shipping the Return
          </h4>
          <p className={paragraph}>
            Two options are available:
          </p>
          <ul className={list}>
            <li>Pickup Arranged by Us: For defective, damaged, or wrong items, we will arrange a free pickup from your address. Our logistics partner will contact you to schedule a convenient pickup time.</li>
            <li>Self-Ship: For other returns (size/fit issues, change of mind), you may ship the product to our return address at your own cost. Use a reliable courier service with tracking and retain the tracking number.</li>
          </ul>
          <p className="mb-2 font-semibold text-espresso">
            Return Address:
          </p>
          <p className="mb-4 italic">
            Mizorpay Solution (OPC) Private Limited<br />
            Returns Department<br />
            PLOT NO 69-71, BP, FARIDABAD,<br />Factory Area Faridabad Faridabad,<br />Faridabad-121001,Haryana
          </p>

          <h4 className={stepHeading}>
            Step 5: Quality Check
          </h4>
          <p className={paragraph}>
            Once we receive the returned product, our quality assurance team will inspect it within 3-5 business days to verify that it meets the return conditions. We will notify you via email about the approval or rejection of your return request.
          </p>

          {/* Section 5 */}
          <h2 className={sectionHeading}>
            5. REFUND POLICY
          </h2>

          <h3 className={subHeading}>
            5.1 Refund Eligibility
          </h3>
          <p className={paragraph}>
            Refunds will be processed only after the returned product has been received and inspected by our quality assurance team. If the product meets all return conditions, a full refund will be initiated.
          </p>

          <h3 className={subHeading}>
            5.2 Refund Amount
          </h3>
          <p className={paragraph}>
            The refund amount will include:
          </p>
          <ul className={list}>
            <li>Product price paid by you</li>
            <li>Applicable taxes (GST) paid on the product</li>
          </ul>
          <p className={paragraph}>
            The refund amount will NOT include:
          </p>
          <ul className={list}>
            <li>Shipping charges (unless the return is due to our error, defective product, or wrong item delivery)</li>
            <li>Return shipping costs (if you chose to self-ship the product)</li>
          </ul>

          <h3 className={subHeading}>
            5.3 Refund Methods
          </h3>
          <p className={paragraph}>
            Refunds will be processed based on your original payment method:
          </p>

          <div className="overflow-x-auto mt-4 mb-6 rounded-lg border border-border bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-sand">
                  <th className="px-4 py-3 font-semibold text-espresso">Payment Method</th>
                  <th className="px-4 py-3 font-semibold text-espresso">Refund Method &amp; Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 align-top text-espresso">Credit/Debit Card</td>
                  <td className="px-4 py-3 align-top">Refunded to the original card within 7-10 business days. The actual credit may take an additional 2-3 days depending on your bank.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top text-espresso">Net Banking</td>
                  <td className="px-4 py-3 align-top">Refunded to the original bank account within 7-10 business days.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top text-espresso">UPI / Digital Wallets</td>
                  <td className="px-4 py-3 align-top">Refunded to the original payment source (UPI ID or wallet) within 7-10 business days.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top text-espresso">Cash on Delivery</td>
                  <td className="px-4 py-3 align-top">Refunded via NEFT/IMPS bank transfer within 7-10 business days after receiving your bank account details (Account Number, IFSC Code, Account Holder Name).</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mb-4 italic">
            Note: The refund processing timeline starts only after we receive and approve the returned product.
          </p>

          <h3 className={subHeading}>
            5.4 Partial Refunds
          </h3>
          <p className={paragraph}>
            In certain situations, partial refunds may be granted:
          </p>
          <ul className={list}>
            <li>Products returned with missing tags or labels</li>
            <li>Products showing signs of use, minor damage, or wear</li>
            <li>Products returned after 7 days (at our discretion)</li>
            <li>Products returned without original packaging or accessories</li>
          </ul>
          <p className={paragraph}>
            The partial refund amount will be determined based on the product's condition after inspection. We reserve the right to deduct up to 30% from the product value for products that do not meet our return standards.
          </p>

          <h3 className={subHeading}>
            5.5 Refund Tracking
          </h3>
          <p className={paragraph}>
            Once your refund is initiated, we will send you a confirmation email with refund details including the amount and expected credit date. You can track the refund status by logging into your account or contacting our customer support.
          </p>

          {/* Section 6 */}
          <h2 className={sectionHeading}>
            6. EXCHANGE POLICY
          </h2>

          <h3 className={subHeading}>
            6.1 Exchange Availability
          </h3>
          <p className={paragraph}>
            We offer exchanges for size and color variations, subject to product availability. Exchanges are available only within the 7-day return window and must meet all return conditions specified in Section 1.2.
          </p>

          <h3 className={subHeading}>
            6.2 How to Request an Exchange
          </h3>
          <p className={paragraph}>
            To request an exchange, follow the same process as returns (Section 4) but clearly mention your exchange preference (desired size or color) in your email. We will check product availability and confirm whether the exchange can be processed.
          </p>

          <h3 className={subHeading}>
            6.3 Exchange Process
          </h3>
          <p className="mb-2 font-semibold text-espresso">
            If the desired product is available:
          </p>
          <ul className={list}>
            <li>We will arrange pickup of the original product</li>
            <li>Once received and inspected, we will ship the replacement product within 3-5 business days</li>
            <li>No additional charges will be applied for exchanges due to defects or our errors</li>
          </ul>

          <p className="mb-2 font-semibold text-espresso">
            If the desired product is not available:
          </p>
          <ul className={list}>
            <li>We will offer similar alternative products</li>
            <li>If no suitable alternative is found, we will process a full refund</li>
          </ul>

          <h3 className={subHeading}>
            6.4 Exchange Shipping Charges
          </h3>
          <p className={paragraph}>
            Shipping charges for exchanges:
          </p>
          <ul className={list}>
            <li>Free for defective, damaged, or wrong items</li>
            <li>May apply for size/fit exchanges at our discretion, with prior notification</li>
          </ul>

          <h3 className={subHeading}>
            6.5 Exchange Limitations
          </h3>
          <p className={paragraph}>
            Only one exchange is allowed per order. If the exchanged product also needs to be returned, it will be processed as a return with refund as per our standard policy.
          </p>

          {/* Section 7 */}
          <h2 className={sectionHeading}>
            7. SPECIAL CASES
          </h2>

          <h3 className={subHeading}>
            7.1 Damaged or Defective Products
          </h3>
          <p className={paragraph}>
            If you receive a damaged or defective product, please notify us immediately (preferably within 24 hours) with photographs. We will provide priority processing for such cases, including:
          </p>
          <ul className={list}>
            <li>Free pickup arrangement</li>
            <li>Priority inspection and approval</li>
            <li>Immediate replacement shipment (if product is available)</li>
            <li>Full refund including shipping charges</li>
          </ul>

          <h3 className={subHeading}>
            7.2 Missing Items or Incomplete Orders
          </h3>
          <p className={paragraph}>
            If you receive an incomplete order or items are missing from your package, please contact us within 48 hours of delivery with your order details. We will investigate and send the missing items at no additional cost.
          </p>

          <h3 className={subHeading}>
            7.3 Orders Lost in Transit
          </h3>
          <p className={paragraph}>
            If your order is marked as delivered but you have not received it, please contact us within 48 hours. We will initiate an investigation with our logistics partner. Based on the investigation outcome, we will either reship the order or provide a full refund.
          </p>

          <h3 className={subHeading}>
            7.4 Bulk or Corporate Orders
          </h3>
          <p className={paragraph}>
            Return and refund policies for bulk orders (10+ items) or corporate orders may differ from standard policy. Please contact our customer support for specific terms applicable to your bulk order.
          </p>

          {/* Section 8 */}
          <h2 className={sectionHeading}>
            8. ORDER CANCELLATION POLICY
          </h2>

          <h3 className={subHeading}>
            8.1 Cancellation by Customer
          </h3>
          <p className={paragraph}>
            You may cancel your order before it is shipped. To cancel an order, contact our customer support immediately at info@mizorpaymart.com with your order number. If the order has already been shipped, you cannot cancel it but may return it after delivery as per this policy.
          </p>

          <h3 className={subHeading}>
            8.2 Cancellation Refund
          </h3>
          <p className={paragraph}>
            For successfully cancelled orders (before shipment), a full refund will be processed within 7-10 business days to your original payment method. No cancellation charges will be applied.
          </p>

          <h3 className={subHeading}>
            8.3 Cancellation by Company
          </h3>
          <p className={paragraph}>
            We reserve the right to cancel orders due to product unavailability, pricing errors, payment issues, or suspected fraudulent activity. In such cases, you will be notified immediately via email, and a full refund will be processed within 7-10 business days.
          </p>

          {/* Section 9 */}
          <h2 className={sectionHeading}>
            9. CUSTOMER SUPPORT
          </h2>
          <p className={paragraph}>
            For any queries, concerns, or assistance regarding returns, refunds, or exchanges, please contact us:
          </p>
          <p className="mb-4 font-semibold text-espresso">
            Mizorpay Solution (OPC) Private Limited
          </p>
          <ul className={list}>
            <li>📧 Email: info@mizorpaymart.com</li>
            <li>🌐 Website: www.mizorpaymart.com</li>
            <li>📞 Customer Support Hours: Monday to Saturday, 10:00 AM to 6:30 PM IST</li>
          </ul>
          <p className={paragraph}>
            We aim to respond to all return and refund queries within 24-48 hours during business hours.
          </p>

          {/* Section 10 */}
          <h2 className={sectionHeading}>
            10. IMPORTANT NOTES
          </h2>
          <p className={paragraph}>
            Please read the following important information:
          </p>
          <ul className={list}>
            <li>Product Inspection: Always inspect products upon delivery and report any issues immediately for faster resolution.</li>
            <li>Retain Proof: Keep order confirmations, invoices, and return shipping receipts until your refund is processed.</li>
            <li>Size Charts: Refer to our detailed size charts before ordering to minimize size-related returns.</li>
            <li>Policy Updates: This policy may be updated periodically. The latest version will always be available on our website.</li>
            <li>Consumer Rights: Your statutory rights under the Consumer Protection Act, 2019 are not affected by this policy.</li>
            <li>Quality Commitment: We are committed to providing quality products and excellent customer service. Your satisfaction is our priority.</li>
          </ul>

          {/* Commitment Section */}
          <h2 className={sectionHeading}>
            OUR COMMITMENT TO YOU
          </h2>
          <p className="mb-4 italic">
            At mizorpaymart.com, we stand behind the quality of our products and are committed to ensuring your complete satisfaction. Our return and refund policy is designed to be fair, transparent, and customer-friendly. We continuously work to improve our processes to provide you with a seamless shopping experience.
          </p>
          <p className="mb-4 font-semibold italic text-espresso">
            Thank you for choosing mizorpaymart.com. We value your trust and look forward to serving you!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;
