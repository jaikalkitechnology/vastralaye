import PolicyPage, { PolicyContent } from '@/components/policy/PolicyPage';

/**
 * Refund & Cancellation Policy — applied verbatim from
 * VastraliyaRefundCancellationPolicy_1.docx, including the source
 * document's own section numbering.
 */
const content: PolicyContent = {
  title: 'Refund & Cancellation Policy',
  effective: 'July 17, 2026',
  intro: [
    `At Vastraliya, we take pride in the quality of every saree, suit set, kurta and accessory we offer. This Refund & Cancellation Policy explains the terms under which orders may be cancelled, returned, exchanged, or refunded. This Policy forms part of, and should be read together with, our Terms & Conditions.`,
  ],
  sections: [
    {
      heading: '1. Order Cancellation',
      blocks: [
        { t: 'list', items: [
          `You may cancel an order free of charge at any time before it has been packed or shipped, by visiting “My Orders” on the Platform or by contacting us at support@vastraliya.com with your order number.`,
          `Once an order has been packed/shipped, it cannot be cancelled; however, you may initiate a return once the product is delivered, subject to the eligibility conditions in Section 3 below.`,
          `Vastraliya reserves the right to cancel any order due to stock unavailability, pricing errors, suspected fraud, or inability to deliver to the given address; in such cases, a full refund will be issued.`,
        ]},
      ],
    },
    {
      heading: '2. Return Window',
      blocks: [
        { t: 'p', text: `You may request a return or exchange within 7 (seven) days of the date of delivery, as recorded by our in-house delivery team. Requests raised after this window will not be accepted, except where the product is found to be defective, damaged, or materially different from what was ordered (see Section 6).` },
      ],
    },
    {
      heading: '3. Return Eligibility Conditions',
      blocks: [
        { t: 'p', text: `To be eligible for a return or exchange, the product must:` },
        { t: 'list', items: [
          `Be unused, unwashed, and unaltered, with all original tags, labels, and brand packaging intact;`,
          `Be free of stains, odours (including perfume/deodorant), makeup marks, or signs of wear;`,
          `Include all accessories originally shipped with the product (e.g., dupatta, blouse piece, petticoat/lining, saree pins, or tassels, where applicable); and`,
          `Be accompanied by the original invoice or order confirmation.`,
        ]},
        { t: 'p', text: `Products that do not meet the above conditions may be sent back to the customer without a refund, or may be subject to a deduction from the refund amount, at Vastraliya's discretion.` },
      ],
    },
    {
      heading: '4. Non-Returnable / Non-Refundable Items',
      blocks: [
        { t: 'p', text: `The following categories of products are not eligible for return, exchange, or refund, except where defective or damaged on arrival:` },
        { t: 'list', items: [
          `Stitched or made-to-measure/customised products (e.g., kurtas or suit sets stitched to your specific measurements);`,
          `Blouses, innerwear, or other products of an intimate/hygiene-sensitive nature, once the seal or packaging has been opened;`,
          `Products purchased during clearance sales, marked as “Final Sale”, or bought using deep-discount clearance codes, where explicitly indicated on the product page at the time of purchase;`,
          `Products with tags removed, or with visible signs of use, alteration, or washing;`,
          `Gift cards or vouchers, if offered by Vastraliya.`,
        ]},
        { t: 'p', text: `Any exceptions to the above will be clearly communicated on the relevant product page at the time of purchase.` },
      ],
    },
    {
      heading: '5. Damaged, Defective, or Incorrect Items',
      blocks: [
        { t: 'p', text: `If you receive a product that is damaged, defective, or different from what you ordered (wrong size, colour, or item), please:` },
        { t: 'list', items: [
          `Contact us within 48 hours of delivery at support@vastraliya.com with your order number and clear photographs/video of the product, packaging, and shipping label;`,
          `Our team will review your claim within 2–3 business days and, upon verification, arrange for a free reverse pickup (where serviceable) or provide return-shipping instructions;`,
          `Once the returned product passes quality inspection, you may choose a free replacement, exchange, or a full refund, at your preference.`,
        ]},
        { t: 'p', text: `We recommend recording an unboxing video for high-value orders to help expedite claims for transit damage.` },
      ],
    },
    {
      heading: '7. How to Initiate a Return',
      blocks: [
        { t: 'list', items: [
          `Log in to your Vastraliya account and go to “My Orders”, select the relevant order, and click “Return/Exchange”; or email support@vastraliya.com with your order number and reason for return;`,
          `Pack the item securely in its original packaging along with all tags and accessories;`,
          `If reverse pickup is available at your location, our in-house delivery team will collect the item from your registered address on the scheduled date; if not serviceable, you will be asked to self-ship the product to our facility, and reasonable return shipping costs may be reimbursed for defective/incorrect items;`,
          `You will receive updates on your return status via email/SMS/WhatsApp.`,
        ]},
      ],
    },
    {
      heading: '8. Refunds',
      blocks: [
        { t: 'h3', text: '8.1 Refund Method' },
        { t: 'list', items: [
          `Refunds for prepaid orders will be credited to the original mode of payment (card, UPI, net banking, or wallet).`,
          `Refunds for Cash on Delivery (COD) orders will be processed via bank transfer/UPI to the customer's provided bank account, or as store credit, at the customer's choice, subject to submission of correct bank details.`,
          `Alternatively, customers may opt for Vastraliya store credit/gift voucher in lieu of a refund, which may be processed faster.`,
        ]},
        { t: 'h3', text: '8.2 Refund Timeline' },
        { t: 'p', text: `Once the returned product is received and passes quality inspection at our warehouse (typically within 3–5 business days of receipt), refunds will be initiated within 5–7 business days. Depending on your bank or payment provider, it may take an additional 5–10 business days for the refunded amount to reflect in your account/statement.` },
      ],
    },
    {
      heading: '9. Exchanges',
      blocks: [
        { t: 'list', items: [
          `Size or colour exchanges (where stock is available) can be requested through the same process as returns, within the 7-day return window.`,
          `If the desired size/colour/variant is unavailable, a full refund or store credit will be offered instead.`,
          `Only one exchange is permitted per item, per order.`,
        ]},
      ],
    },
    {
      heading: '10. Late or Missing Refunds',
      blocks: [
        { t: 'p', text: `If you haven't received a refund within the timeline mentioned above, please first check your bank account or payment app again, then contact your card issuer or bank, as processing times can vary. If you've done this and still have not received your refund, please contact us at support@vastraliya.com with your order number and we will investigate.` },
      ],
    },
    {
      heading: '11. Contact Us',
      blocks: [
        { t: 'p', text: `For any return, exchange, cancellation, or refund-related queries, please reach out to us at:` },
        { t: 'lines', lines: [
          `Vastraliya – Vastraliya Fashion Pvt. Ltd.`,
          `Email: support@vastraliya.com`,
          `Phone: 7066181207`,
          `Support Hours: Mon–Sat, 10:00 AM – 6:00 PM IST`,
        ]},
      ],
    },
    {
      heading: '12. Changes to This Policy',
      blocks: [
        { t: 'p', text: `Vastraliya reserves the right to amend this Refund & Cancellation Policy at any time. Changes will be effective immediately upon posting on the Platform with a revised “Effective Date”. Orders placed prior to any change will be governed by the policy in effect at the time of purchase, unless otherwise required by law.` },
      ],
    },
  ],
};

const RefundPolicy = () => <PolicyPage content={content} />;

export default RefundPolicy;
