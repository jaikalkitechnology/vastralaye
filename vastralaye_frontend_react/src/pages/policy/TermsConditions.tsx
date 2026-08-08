import React from 'react';

const sectionHeading = "font-serif text-xl font-medium text-espresso mt-8 mb-3";
const subHeading = "font-serif text-lg font-medium text-espresso mt-5 mb-2";
const paragraph = "mb-4";
const list = "list-disc pl-5 mb-4 space-y-1.5 marker:text-gold";

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-ivory py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10 md:mb-12">
          <span className="overline-label mb-2">Our Policies</span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso">
            TERMS AND CONDITIONS
          </h1>
        </header>

        <div className="text-[15px] leading-relaxed text-muted-foreground">
          <p className="mb-4 italic">
            Welcome to mizorpaymart.com (the &quot;Website&quot; or &quot;Platform&quot;), operated by Mizorpay Solution (OPC) Private Limited (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms and Conditions (&quot;Terms&quot;) govern your use of our e-commerce platform and the purchase of products offered through our Website.
          </p>
          <p className="mb-6 font-semibold italic text-espresso">
            By accessing or using this Website, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree with any part of these Terms, you must not use our Website or services.
          </p>

          {/* Section 1 */}
          <h2 className={sectionHeading}>
            1. DEFINITIONS AND INTERPRETATION
          </h2>
          <p className={paragraph}>
            In these Terms, unless the context otherwise requires:
          </p>
          <ul className={list}>
            <li>&quot;Customer&quot; or &quot;User&quot; or &quot;you&quot; means any person who accesses or uses the Website for the purpose of browsing, purchasing, or availing services.</li>
            <li>&quot;Products&quot; means clothing, apparel, accessories, and other merchandise offered for sale on the Website.</li>
            <li>&quot;Order&quot; means a Customer&apos;s request to purchase Products through the Website.</li>
            <li>&quot;Account&quot; means the registered user account created by a Customer on the Website.</li>
            <li>&quot;Services&quot; means all services provided by the Company through the Website, including sale, delivery, customer support, and payment processing.</li>
          </ul>

          {/* Section 2 */}
          <h2 className={sectionHeading}>
            2. ACCEPTANCE OF TERMS
          </h2>

          <h3 className={subHeading}>
            2.1 By using this Website, you represent and warrant that:
          </h3>
          <ul className={list}>
            <li>You are at least 18 years of age or have attained the age of majority in your jurisdiction;</li>
            <li>You have the legal capacity to enter into binding contracts;</li>
            <li>All information you provide is accurate, current, and complete;</li>
            <li>You will comply with all applicable laws and regulations.</li>
          </ul>

          <h3 className={subHeading}>
            2.2
          </h3>
          <p className={paragraph}>
            We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting on the Website. Your continued use of the Website after such modifications constitutes acceptance of the modified Terms. It is your responsibility to review these Terms periodically.
          </p>

          {/* Section 3 */}
          <h2 className={sectionHeading}>
            3. USER ACCOUNT
          </h2>

          <h3 className={subHeading}>
            3.1 Account Registration
          </h3>
          <p className={paragraph}>
            To place orders and access certain features, you may be required to create an Account. When registering, you must provide accurate and complete information including your name, email address, phone number, and delivery address. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your Account.
          </p>

          <h3 className={subHeading}>
            3.2 Account Security
          </h3>
          <p className={paragraph}>
            You agree to immediately notify us of any unauthorized use of your Account or any other breach of security. We shall not be liable for any loss or damage arising from your failure to comply with this security obligation. You may not use another person&apos;s Account without permission.
          </p>

          <h3 className={subHeading}>
            3.3 Account Termination
          </h3>
          <p className={paragraph}>
            We reserve the right to suspend or terminate your Account at our sole discretion, without notice, for conduct that we believe violates these Terms, is harmful to other users, to us, or to third parties, or for any other reason. Upon termination, your right to use the Website will immediately cease.
          </p>

          {/* Section 4 */}
          <h2 className={sectionHeading}>
            4. PRODUCTS AND SERVICES
          </h2>

          <h3 className={subHeading}>
            4.1 Product Descriptions
          </h3>
          <p className={paragraph}>
            We strive to provide accurate product descriptions, images, and specifications. However, we do not warrant that product descriptions, colors, information, or other content available on the Website are accurate, complete, reliable, current, or error-free. The display of products on your device may vary due to screen settings and monitor calibration.
          </p>

          <h3 className={subHeading}>
            4.2 Product Availability
          </h3>
          <p className={paragraph}>
            All Products are subject to availability. We reserve the right to discontinue any Product at any time without notice. In the event that a Product ordered by you is out of stock, we will inform you and offer alternatives or a full refund.
          </p>

          <h3 className={subHeading}>
            4.3 Pricing
          </h3>
          <p className={paragraph}>
            All prices are listed in Indian Rupees (INR) and are inclusive of all applicable taxes unless stated otherwise. We reserve the right to modify prices at any time without prior notice. However, price changes will not affect orders already confirmed. In case of pricing errors, we reserve the right to cancel the order and provide a full refund.
          </p>

          <h3 className={subHeading}>
            4.4 Size and Fit
          </h3>
          <p className={paragraph}>
            We provide size charts and fit guides for our Products. It is your responsibility to review these guides before making a purchase. We are not responsible for any dissatisfaction arising from incorrect size selection by the Customer.
          </p>

          {/* Section 5 */}
          <h2 className={sectionHeading}>
            5. ORDERS AND PAYMENTS
          </h2>

          <h3 className={subHeading}>
            5.1 Order Placement
          </h3>
          <p className={paragraph}>
            When you place an Order through the Website, you are making an offer to purchase the Products. We reserve the right to accept or reject your Order for any reason, including Product availability, errors in pricing or product information, or suspected fraudulent activity. Order confirmation emails are acknowledgment only and do not constitute acceptance of your Order.
          </p>

          <h3 className={subHeading}>
            5.2 Payment Methods
          </h3>
          <p className={paragraph}>
            We accept the following payment methods:
          </p>
          <ul className={list}>
            <li>Credit and Debit Cards (Visa, Mastercard, RuPay, American Express)</li>
            <li>Net Banking</li>
            <li>Digital Wallets (Paytm, PhonePe, Google Pay, etc.)</li>
            <li>UPI (Unified Payments Interface)</li>
            <li>Cash on Delivery (subject to availability in your location)</li>
          </ul>

          <h3 className={subHeading}>
            5.3 Payment Processing
          </h3>
          <p className={paragraph}>
            Payment processing is handled through secure third-party payment gateways. We do not store your complete credit/debit card information. By providing payment information, you represent that you are authorized to use the payment method. You authorize us to charge the full amount of your Order to your chosen payment method.
          </p>

          <h3 className={subHeading}>
            5.4 Order Cancellation by Company
          </h3>
          <p className={paragraph}>
            We reserve the right to cancel any Order, before or after acceptance, for reasons including but not limited to: Product unavailability, pricing errors, suspected fraudulent transactions, or failure to meet our credit or anti-fraud screening criteria. If your Order is cancelled after payment, a full refund will be processed within 7-10 business days.
          </p>

          <h3 className={subHeading}>
            5.5 Order Cancellation by Customer
          </h3>
          <p className={paragraph}>
            You may cancel your Order before it is shipped by contacting our customer support at info@mizorpaymart.com. Once the Order has been shipped, cancellation will not be possible, but you may initiate a return in accordance with our Return Policy (Section 7).
          </p>

          {/* Section 6 */}
          <h2 className={sectionHeading}>
            6. SHIPPING AND DELIVERY
          </h2>

          <h3 className={subHeading}>
            6.1 Delivery Areas
          </h3>
          <p className={paragraph}>
            We currently deliver throughout India. Delivery to certain remote or restricted areas may not be available. Delivery availability will be confirmed at checkout.
          </p>

          <h3 className={subHeading}>
            6.2 Shipping Charges
          </h3>
          <p className={paragraph}>
            Shipping charges, if applicable, will be displayed at checkout before you complete your Order. We may offer free shipping promotions from time to time, subject to terms and conditions specified for such promotions.
          </p>

          <h3 className={subHeading}>
            6.3 Delivery Timeline
          </h3>
          <p className={paragraph}>
            Orders are typically processed and shipped within 2-3 business days. Estimated delivery time is 5-7 business days from the date of shipment, depending on your location. These timelines are estimates only and may vary due to circumstances beyond our control, including but not limited to natural disasters, strikes, customs delays, or courier service issues.
          </p>

          <h3 className={subHeading}>
            6.4 Delivery Process
          </h3>
          <p className={paragraph}>
            Products will be delivered to the address provided by you during Order placement. You must provide a valid and complete delivery address. We are not responsible for delays or non-delivery resulting from incorrect or incomplete address information. At the time of delivery, signature or OTP verification may be required. If you are not available at the delivery address, the courier partner may attempt re-delivery or contact you for alternate arrangements.
          </p>

          <h3 className={subHeading}>
            6.5 Risk of Loss
          </h3>
          <p className={paragraph}>
            All Products purchased from the Website are made pursuant to a shipment contract. The risk of loss and title for such Products pass to you upon delivery to the carrier. We are not responsible for lost or stolen packages after delivery confirmation.
          </p>

          <h3 className={subHeading}>
            6.6 Inspection at Delivery
          </h3>
          <p className={paragraph}>
            You are advised to inspect the package upon delivery for any visible damage. If the package appears damaged, you may refuse delivery or note the damage with the delivery personnel. Please contact our customer support immediately in case of damaged or incorrect deliveries.
          </p>

          {/* Section 7 */}
          <h2 className={sectionHeading}>
            7. RETURNS, REFUNDS AND EXCHANGES
          </h2>

          <h3 className={subHeading}>
            7.1 Return Eligibility
          </h3>
          <p className={paragraph}>
            We accept returns within 7 days from the date of delivery for the following reasons:
          </p>
          <ul className={list}>
            <li>Defective or damaged products</li>
            <li>Wrong product delivered</li>
            <li>Product does not match the description on the Website</li>
          </ul>
          <p className={paragraph}>
            To be eligible for return, Products must be unused, unwashed, unaltered, and in their original condition with all tags attached. Items must be returned in their original packaging.
          </p>

          <h3 className={subHeading}>
            7.2 Non-Returnable Items
          </h3>
          <p className={paragraph}>
            The following items are not eligible for return:
          </p>
          <ul className={list}>
            <li>Innerwear, lingerie, and undergarments for hygiene reasons</li>
            <li>Products marked as &apos;Final Sale&apos; or &apos;Non-Returnable&apos;</li>
            <li>Customized or personalized products</li>
            <li>Products purchased during clearance sales (unless defective)</li>
          </ul>

          <h3 className={subHeading}>
            7.3 Return Process
          </h3>
          <p className={paragraph}>
            To initiate a return, please contact our customer support at info@mizorpaymart.com within 7 days of delivery with:
          </p>
          <ul className={list}>
            <li>Order number</li>
            <li>Product details and reason for return</li>
            <li>Photographs of the product (if damaged or incorrect)</li>
          </ul>
          <p className={paragraph}>
            Upon approval of your return request, we will provide instructions for returning the product. You may be required to ship the product back to us at your own cost, or we may arrange for pickup depending on the reason for return.
          </p>

          <h3 className={subHeading}>
            7.4 Refund Process
          </h3>
          <p className={paragraph}>
            Once we receive and inspect the returned product, we will process your refund within 7-10 business days. Refunds will be credited to the original payment method used for the purchase. For Cash on Delivery orders, refunds will be processed via bank transfer to your provided bank account details.
          </p>

          <h3 className={subHeading}>
            7.5 Exchanges
          </h3>
          <p className={paragraph}>
            We offer exchanges for size and color variations subject to product availability. To request an exchange, please follow the return process outlined above and specify your exchange preference. Exchange requests are subject to our approval and product availability.
          </p>

          <h3 className={subHeading}>
            7.6 Damaged or Defective Products
          </h3>
          <p className={paragraph}>
            If you receive a damaged or defective product, please notify us immediately upon delivery. We will arrange for a replacement or full refund, including return shipping costs, at no additional charge to you. Please provide photographs of the damaged/defective product to support your claim.
          </p>

          {/* Section 8 */}
          <h2 className={sectionHeading}>
            8. INTELLECTUAL PROPERTY RIGHTS
          </h2>

          <h3 className={subHeading}>
            8.1
          </h3>
          <p className={paragraph}>
            All content on this Website, including but not limited to text, graphics, logos, images, videos, audio clips, digital downloads, data compilations, software, designs, and the compilation thereof (collectively, &quot;Content&quot;), is the property of Mizorpay Solution (OPC) Private Limited or its content suppliers and is protected by Indian and international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>

          <h3 className={subHeading}>
            8.2
          </h3>
          <p className={paragraph}>
            The trademarks, logos, and service marks displayed on the Website (&quot;Marks&quot;) are the property of the Company or third parties. You are not permitted to use these Marks without prior written consent from the Company or the third-party owner.
          </p>

          <h3 className={subHeading}>
            8.3
          </h3>
          <p className={paragraph}>
            You may not modify, copy, reproduce, republish, upload, post, transmit, or distribute any Content from this Website without our prior written permission. You may print or download portions of material from the Website solely for your personal, non-commercial use, provided you keep intact all copyright and other proprietary notices.
          </p>

          <h3 className={subHeading}>
            8.4
          </h3>
          <p className={paragraph}>
            Unauthorized use of any Content or Marks may violate copyright, trademark, and other laws and could result in criminal or civil penalties.
          </p>

          {/* Section 9 */}
          <h2 className={sectionHeading}>
            9. USER CONDUCT AND PROHIBITED ACTIVITIES
          </h2>

          <h3 className={subHeading}>
            9.1
          </h3>
          <p className={paragraph}>
            You agree not to engage in any of the following prohibited activities:
          </p>
          <ul className={list}>
            <li>Using the Website for any unlawful purpose or in violation of these Terms;</li>
            <li>Impersonating any person or entity or falsely stating or misrepresenting your affiliation with any person or entity;</li>
            <li>Interfering with or disrupting the Website or servers or networks connected to the Website;</li>
            <li>Attempting to gain unauthorized access to any portion of the Website or any other systems or networks;</li>
            <li>Using any automated means (including bots, scrapers, or data mining tools) to access the Website;</li>
            <li>Uploading or transmitting viruses or any other type of malicious code;</li>
            <li>Engaging in any activity that could damage, disable, overburden, or impair the Website;</li>
            <li>Making fraudulent purchases or providing false payment information;</li>
            <li>Violating any applicable local, state, national, or international law or regulation.</li>
          </ul>

          <h3 className={subHeading}>
            9.2
          </h3>
          <p className={paragraph}>
            We reserve the right to investigate and take appropriate legal action against anyone who, in our sole discretion, violates this provision, including removing offending content, suspending or terminating the Account of such violators, and reporting the violation to law enforcement authorities.
          </p>

          {/* Section 10 */}
          <h2 className={sectionHeading}>
            10. PRIVACY AND DATA PROTECTION
          </h2>

          <h3 className={subHeading}>
            10.1
          </h3>
          <p className={paragraph}>
            Your use of the Website is also governed by our Privacy Policy, which can be accessed on the Website. The Privacy Policy explains how we collect, use, disclose, and protect your personal information. By using the Website, you consent to the collection and use of your information as described in the Privacy Policy.
          </p>

          <h3 className={subHeading}>
            10.2
          </h3>
          <p className={paragraph}>
            We implement reasonable security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h3 className={subHeading}>
            10.3
          </h3>
          <p className={paragraph}>
            You are responsible for maintaining the confidentiality of any personal information you provide through the Website. You agree to notify us immediately of any unauthorized use of your information or any other breach of security.
          </p>

          {/* Section 11 */}
          <h2 className={sectionHeading}>
            11. DISCLAIMERS AND WARRANTIES
          </h2>

          <h3 className={subHeading}>
            11.1
          </h3>
          <p className="mb-4 italic">
            THE WEBSITE AND ALL PRODUCTS, CONTENT, AND SERVICES PROVIDED THROUGH THE WEBSITE ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
          </p>

          <h3 className={subHeading}>
            11.2
          </h3>
          <p className="mb-4 italic">
            We do not warrant that the Website will be uninterrupted, secure, or error-free, that defects will be corrected, or that the Website or the servers that make it available are free of viruses or other harmful components.
          </p>

          <h3 className={subHeading}>
            11.3
          </h3>
          <p className="mb-4 italic">
            We do not warrant or make any representations regarding the use or the results of the use of the Products or Content in terms of their correctness, accuracy, reliability, or otherwise.
          </p>

          <h3 className={subHeading}>
            11.4
          </h3>
          <p className="mb-4 italic">
            While we strive to provide accurate product information, we do not warrant that product descriptions, images, pricing, or other content on the Website are accurate, complete, reliable, current, or error-free.
          </p>

          <h3 className={subHeading}>
            11.5
          </h3>
          <p className="mb-4 italic">
            Some jurisdictions do not allow the exclusion of implied warranties, so some of the above exclusions may not apply to you. You may have other rights which vary from jurisdiction to jurisdiction.
          </p>

          {/* Section 12 */}
          <h2 className={sectionHeading}>
            12. LIMITATION OF LIABILITY
          </h2>

          <h3 className={subHeading}>
            12.1
          </h3>
          <p className="mb-4 italic">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL MIZORPAY SOLUTION (OPC) PRIVATE LIMITED, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AFFILIATES, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </p>
          <ul className={`${list} italic`}>
            <li>Your access to or use of or inability to access or use the Website;</li>
            <li>Any conduct or content of any third party on the Website;</li>
            <li>Any content obtained from the Website;</li>
            <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
          </ul>

          <h3 className={subHeading}>
            12.2
          </h3>
          <p className="mb-4 italic">
            OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE WEBSITE OR PRODUCTS SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE PRODUCT(S) GIVING RISE TO THE CLAIM, OR INR 1,000 (ONE THOUSAND RUPEES), WHICHEVER IS GREATER.
          </p>

          <h3 className={subHeading}>
            12.3
          </h3>
          <p className="mb-4 italic">
            We shall not be liable for any failure or delay in performance resulting from causes beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, strikes, or shortages of transportation facilities, fuel, energy, labor, or materials.
          </p>

          <h3 className={subHeading}>
            12.4
          </h3>
          <p className="mb-4 italic">
            Some jurisdictions do not allow the exclusion or limitation of liability for consequential or incidental damages, so the above limitations may not apply to you.
          </p>

          {/* Section 13 */}
          <h2 className={sectionHeading}>
            13. INDEMNIFICATION
          </h2>
          <p className={paragraph}>
            You agree to defend, indemnify, and hold harmless Mizorpay Solution (OPC) Private Limited, its officers, directors, employees, agents, affiliates, and suppliers from and against any claims, actions, demands, liabilities, judgments, damages, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or in connection with: (a) your use of the Website; (b) your violation of these Terms; (c) your violation of any third-party rights, including intellectual property, privacy, or other proprietary rights; or (d) any claim that your use of the Website caused damage to a third party.
          </p>

          {/* Section 14 */}
          <h2 className={sectionHeading}>
            14. THIRD-PARTY LINKS AND SERVICES
          </h2>

          <h3 className={subHeading}>
            14.1
          </h3>
          <p className={paragraph}>
            The Website may contain links to third-party websites, advertisers, or services that are not owned or controlled by us. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.
          </p>

          <h3 className={subHeading}>
            14.2
          </h3>
          <p className={paragraph}>
            We are not liable for any damage or loss caused by or in connection with your use of or reliance on any third-party content, goods, or services available through such websites or services. You acknowledge and agree that we shall not be responsible or liable for any damage or loss caused by your use of any third-party website or service.
          </p>

          {/* Section 15 */}
          <h2 className={sectionHeading}>
            15. DISPUTE RESOLUTION AND ARBITRATION
          </h2>

          <h3 className={subHeading}>
            15.1 Informal Resolution
          </h3>
          <p className={paragraph}>
            In the event of any dispute, claim, or controversy arising out of or relating to these Terms or the Website (&quot;Dispute&quot;), you agree to first contact us at info@mizorpaymart.com and attempt to resolve the Dispute informally. We will work with you in good faith to resolve any Dispute.
          </p>

          <h3 className={subHeading}>
            15.2 Arbitration
          </h3>
          <p className={paragraph}>
            If the Dispute cannot be resolved informally within 30 days, you agree that the Dispute shall be resolved by binding arbitration in accordance with the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted by a sole arbitrator mutually agreed upon by both parties. If the parties cannot agree on an arbitrator within 15 days, the arbitrator shall be appointed in accordance with the Arbitration and Conciliation Act, 1996.
          </p>
          <p className={paragraph}>
            The seat of arbitration shall be Patna, Bihar, India. The language of arbitration shall be English. The arbitrator&apos;s award shall be final and binding on both parties.
          </p>

          <h3 className={subHeading}>
            15.3 Exceptions
          </h3>
          <p className={paragraph}>
            Notwithstanding the above, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of a party&apos;s intellectual property rights.
          </p>

          {/* Section 16 */}
          <h2 className={sectionHeading}>
            16. GOVERNING LAW AND JURISDICTION
          </h2>

          <h3 className={subHeading}>
            16.1
          </h3>
          <p className={paragraph}>
            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
          </p>

          <h3 className={subHeading}>
            16.2
          </h3>
          <p className={paragraph}>
            Subject to the arbitration clause in Section 15, the courts of Patna, Bihar, India shall have exclusive jurisdiction over any disputes arising out of or related to these Terms or the Website.
          </p>

          {/* Section 17 */}
          <h2 className={sectionHeading}>
            17. FORCE MAJEURE
          </h2>
          <p className={paragraph}>
            We shall not be liable for any failure or delay in performing our obligations under these Terms if such failure or delay is due to circumstances beyond our reasonable control, including but not limited to acts of God, natural disasters, war, civil unrest, strikes, lockouts, government actions, pandemics, epidemics, telecommunications failures, power failures, or any other force majeure event. In such cases, our performance obligations shall be suspended for the duration of the force majeure event.
          </p>

          {/* Section 18 */}
          <h2 className={sectionHeading}>
            18. SEVERABILITY
          </h2>
          <p className={paragraph}>
            If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be deemed modified to the minimum extent necessary to make it valid and enforceable. If such modification is not possible, the provision shall be severed from these Terms. The invalidity or unenforceability of any provision shall not affect the validity or enforceability of the remaining provisions.
          </p>

          {/* Section 19 */}
          <h2 className={sectionHeading}>
            19. WAIVER
          </h2>
          <p className={paragraph}>
            No waiver of any term or condition of these Terms shall be deemed a further or continuing waiver of such term or condition or any other term or condition. Our failure to assert any right or provision under these Terms shall not constitute a waiver of such right or provision.
          </p>

          {/* Section 20 */}
          <h2 className={sectionHeading}>
            20. ENTIRE AGREEMENT
          </h2>
          <p className={paragraph}>
            These Terms, together with our Privacy Policy and any other legal notices or policies published on the Website, constitute the entire agreement between you and Mizorpay Solution (OPC) Private Limited concerning your use of the Website and supersede all prior or contemporaneous agreements, understandings, warranties, and representations, whether written or oral.
          </p>

          {/* Section 21 */}
          <h2 className={sectionHeading}>
            21. ASSIGNMENT
          </h2>
          <p className={paragraph}>
            You may not assign or transfer these Terms or your rights and obligations hereunder, by operation of law or otherwise, without our prior written consent. We may assign or transfer these Terms or our rights and obligations hereunder, in whole or in part, without your consent. Subject to the foregoing, these Terms will bind and inure to the benefit of the parties and their respective successors and permitted assigns.
          </p>

          {/* Section 22 */}
          <h2 className={sectionHeading}>
            22. CUSTOMER SUPPORT AND CONTACT INFORMATION
          </h2>
          <p className={paragraph}>
            For any questions, concerns, or complaints regarding these Terms or the Website, please contact us at:
          </p>
          <p className="mb-4 font-semibold text-espresso">
            Mizorpay Solution (OPC) Private Limited
          </p>
          <ul className={list}>
            <li>Email: info@mizorpaymart.com</li>
            <li>Website: www.mizorpaymart.com</li>
          </ul>
          <p className={paragraph}>
            We aim to respond to all customer inquiries within 24-48 business hours.
          </p>

          {/* Section 23 */}
          <h2 className={sectionHeading}>
            23. CONSUMER RIGHTS AND GRIEVANCE REDRESSAL
          </h2>

          <h3 className={subHeading}>
            23.1
          </h3>
          <p className={paragraph}>
            As a consumer, you have certain rights under the Consumer Protection Act, 2019 and other applicable Indian consumer protection laws. Nothing in these Terms shall limit or waive any rights you may have under such laws.
          </p>

          <h3 className={subHeading}>
            23.2
          </h3>
          <p className={paragraph}>
            If you have any grievances or complaints that are not resolved through our customer support, you may escalate the matter to our Grievance Officer:
          </p>
          <p className="mb-4 font-semibold text-espresso">
            Grievance Officer Contact:
          </p>
          <p className={paragraph}>
            Email: grievance@mizorpaymart.com
          </p>
          <p className={paragraph}>
            The Grievance Officer shall address your complaint within 15 days from the date of receipt.
          </p>

          {/* Acknowledgment Section */}
          <h2 className={`${sectionHeading} pt-6 border-t border-border`}>
            ACKNOWLEDGMENT OF TERMS
          </h2>
          <p className="font-semibold italic text-espresso bg-blush p-6 rounded-lg">
            BY USING THIS WEBSITE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS AND CONDITIONS, UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT USE THIS WEBSITE OR PURCHASE ANY PRODUCTS FROM US.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
