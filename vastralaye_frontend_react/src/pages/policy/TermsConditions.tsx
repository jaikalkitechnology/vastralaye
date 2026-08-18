import PolicyPage, { PolicyContent } from '@/components/policy/PolicyPage';

/**
 * Terms & Conditions — applied verbatim from
 * VastraliyaTermsandConditions_1.docx.
 */
const content: PolicyContent = {
  title: 'Terms & Conditions',
  effective: 'July 17, 2026',
  intro: [
    `These Terms & Conditions (“Terms”) govern your access to and use of www.vastraliya.com and any related mobile site or application (collectively, the “Platform”), operated by Vastraliya Fashion Pvt. Ltd. (“Vastraliya”, “Company”, “we”, “us”, “our”). By accessing, browsing, registering on, or placing an order through the Platform, you (“User”, “you”, “your”) agree to be bound by these Terms, our Privacy Policy, Shipping Policy, and Refund & Cancellation Policy, each of which is incorporated herein by reference. If you do not agree to these Terms, please discontinue use of the Platform.`,
  ],
  sections: [
    {
      heading: '1. Eligibility',
      blocks: [
        { t: 'list', items: [
          `You must be at least 18 years of age and competent to contract under the Indian Contract Act, 1872, or be using the Platform under the supervision of a parent or legal guardian.`,
          `By placing an order, you represent that the information you provide (name, address, contact details, payment information) is true, accurate and complete.`,
          `Vastraliya reserves the right to refuse service, terminate accounts, or cancel orders at its sole discretion, including where fraudulent, abusive, or unlawful activity is suspected.`,
        ]},
      ],
    },
    {
      heading: '2. Account Registration',
      blocks: [
        { t: 'list', items: [
          `You may be required to create an account to access certain features, such as order tracking, wishlists, and saved addresses.`,
          `You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.`,
          `You agree to notify us immediately of any unauthorised use of your account at support@vastraliya.com.`,
        ]},
      ],
    },
    {
      heading: '3. Products, Descriptions and Pricing',
      blocks: [
        { t: 'h3', text: '3.1 Product Listings' },
        { t: 'p', text: `Vastraliya offers a curated range of ethnic wear including, without limitation, sarees, suit sets, kurtas, dupattas and related accessories. We make reasonable efforts to display product colours, fabric, embroidery as accurately as possible; however:` },
        { t: 'list', items: [
          `Actual product colour may vary slightly from what is displayed due to screen/display settings, lighting during photography, and dye lot variations.`,
          `Fabric composition, wash care, and size charts are provided on individual product pages; customers are encouraged to review these carefully before purchase.`,
        ]},
        { t: 'h3', text: '3.2 Pricing' },
        { t: 'list', items: [
          `All prices are listed in Indian Rupees (₹) unless otherwise stated, and are inclusive of applicable Goods and Services Tax (GST) unless mentioned otherwise.`,
          `In the event of a pricing error due to a technical glitch or typographical error, Vastraliya reserves the right to cancel the affected order and issue a full refund, even if payment has been processed.`,
          `Shipping charges, if applicable, will be displayed separately at checkout as per our Shipping Policy.`,
        ]},
      ],
    },
    {
      heading: '4. Orders, Order Acceptance and Cancellation',
      blocks: [
        { t: 'list', items: [
          `Placing an order constitutes an offer by you to purchase the product(s), which is accepted by Vastraliya only upon dispatch of the product (or, at our discretion, upon order confirmation email).`,
          `We reserve the right to cancel or refuse any order due to: (a) unavailability of stock; (b) inaccuracies in product or pricing information; (c) suspected fraudulent or unauthorised transactions; or (d) issues identified with the shipping address or payment.`,
          `If an order is cancelled after payment has been made, a full refund will be processed to the original mode of payment within a reasonable timeframe, as detailed in our Refund & Cancellation Policy.`,
          `You may cancel an order yourself within the timeframe specified in our Refund & Cancellation Policy, provided it has not already been packed/shipped.`,
        ]},
      ],
    },
    {
      heading: '5. Payments',
      blocks: [
        { t: 'list', items: [
          `We accept payment via credit/debit cards, UPI, net banking, digital wallets, and Cash on Delivery (COD), where available, through secure third-party payment gateways.`,
          `Vastraliya does not store your card, UPI, or net-banking credentials; these are processed directly by our PCI-DSS compliant payment partners.`,
          `In case of a failed transaction where the amount is debited from your account, any such amount will be automatically reversed by your bank/payment provider within the timeline prescribed by RBI guidelines; alternatively, please contact us with transaction details for assistance.`,
        ]},
      ],
    },
    {
      heading: '6. Shipping and Delivery',
      blocks: [
        { t: 'p', text: `All orders are subject to our Shipping Policy, which forms part of these Terms and sets out estimated delivery timelines, shipping charges, and serviceable locations.` },
      ],
    },
    {
      heading: '7. Returns, Exchanges and Refunds',
      blocks: [
        { t: 'p', text: `All returns, exchanges, and refunds are governed by our Refund & Cancellation Policy, which forms part of these Terms.` },
      ],
    },
    {
      heading: '8. Intellectual Property',
      blocks: [
        { t: 'list', items: [
          `All content on the Platform, including but not limited to the Vastraliya name, logo, trademarks, product photography, graphics, text, layout, and design, is the property of Vastraliya or its licensors and is protected under applicable Indian and international intellectual property laws.`,
          `You may not reproduce, copy, distribute, modify, or create derivative works from any content on the Platform without our prior written consent.`,
          `Any unauthorised use of Vastraliya's intellectual property may result in legal action.`,
        ]},
      ],
    },
    {
      heading: '9. User Conduct and Prohibited Activities',
      blocks: [
        { t: 'p', text: `While using the Platform, you agree that you shall not:` },
        { t: 'list', items: [
          `Use the Platform for any unlawful purpose or in violation of these Terms;`,
          `Upload or transmit any content that is defamatory, obscene, infringing, or otherwise objectionable;`,
          `Attempt to gain unauthorised access to the Platform, other users' accounts, or our systems and networks;`,
          `Use any automated means (bots, scrapers) to access or extract data from the Platform without our written permission;`,
          `Engage in any activity that interferes with or disrupts the Platform's functioning; or`,
          `Place fraudulent orders or misuse promotional offers, coupon codes, or discounts.`,
        ]},
      ],
    },
    {
      heading: '10. Reviews and User-Generated Content',
      blocks: [
        { t: 'list', items: [
          `If you submit reviews, photographs, or other content on the Platform or on our social media pages, you grant Vastraliya a non-exclusive, royalty-free, worldwide licence to use, reproduce, and display such content for marketing and promotional purposes.`,
          `You represent that any content you submit does not infringe any third-party rights and is not false, misleading, or defamatory.`,
        ]},
      ],
    },
    {
      heading: '11. Disclaimer of Warranties',
      blocks: [
        { t: 'p', text: `The Platform and all products are provided on an “as is” and “as available” basis. To the fullest extent permitted by applicable law, Vastraliya disclaims all warranties, express or implied, including but not limited to merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Platform will be uninterrupted, error-free, or free from viruses or harmful components.` },
      ],
    },
    {
      heading: '12. Limitation of Liability',
      blocks: [
        { t: 'p', text: `To the maximum extent permitted by law, Vastraliya, its directors, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, arising out of or in connection with your use of the Platform or purchase of products, whether based on warranty, contract, tort, or any other legal theory. Our aggregate liability for any claim arising from a specific order shall not exceed the total amount paid by you for that order.` },
      ],
    },
    {
      heading: '13. Indemnification',
      blocks: [
        { t: 'p', text: `You agree to indemnify and hold harmless Vastraliya, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of your breach of these Terms, your violation of any law, or your infringement of any third-party rights.` },
      ],
    },
    {
      heading: '14. Force Majeure',
      blocks: [
        { t: 'p', text: `Vastraliya shall not be liable for any delay or failure to perform its obligations resulting from causes beyond its reasonable control, including but not limited to natural disasters, strikes, transportation disruptions, government restrictions, pandemics, or disruptions affecting our in-house delivery operations.` },
      ],
    },
    {
      heading: '15. Governing Law and Dispute Resolution',
      blocks: [
        { t: 'list', items: [
          `These Terms shall be governed by and construed in accordance with the laws of India.`,
          `Any disputes arising out of or in connection with these Terms or your use of the Platform shall first be attempted to be resolved amicably through good-faith negotiation between the parties.`,
          `If unresolved, disputes shall be subject to the exclusive jurisdiction of the courts at Palghar, Maharashtra, India.`,
        ]},
      ],
    },
    {
      heading: '16. Amendments to These Terms',
      blocks: [
        { t: 'p', text: `Vastraliya reserves the right to modify or update these Terms at any time without prior notice. The revised Terms will be effective from the date of posting on the Platform, indicated by the updated “Effective Date”. Your continued use of the Platform after such changes constitutes acceptance of the revised Terms.` },
      ],
    },
    {
      heading: '17. Severability',
      blocks: [
        { t: 'p', text: `If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.` },
      ],
    },
    {
      heading: '18. Contact Information',
      blocks: [
        { t: 'p', text: `For any questions or concerns regarding these Terms, please contact us at:` },
        { t: 'lines', lines: [
          `Vastraliya – Vastraliya Fashion Pvt. Ltd.`,
          `Registered Address: Gala No 230, Second Floor, Pride Industrial Estate, Vasai East Ie, Vasai, Thane, Maharashtra, India, 401208.`,
          `Email: support@vastraliya.com`,
          `Phone: 7066181207`,
        ]},
      ],
    },
  ],
};

const TermsConditions = () => <PolicyPage content={content} />;

export default TermsConditions;
