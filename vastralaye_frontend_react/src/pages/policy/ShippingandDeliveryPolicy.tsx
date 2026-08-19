import PolicyPage, { PolicyContent } from '@/components/policy/PolicyPage';

/**
 * Shipping & Delivery Policy — applied verbatim from
 * VastraliyaShippingPolicy_1.docx, including the source document's own
 * section numbering.
 */
const content: PolicyContent = {
  title: 'Shipping & Delivery Policy',
  effective: 'July 17, 2026',
  intro: [
    `This Shipping & Delivery Policy explains how Vastraliya processes, ships, and delivers orders for sarees, suit sets, kurtas, and other ethnic wear and accessories purchased on www.vastraliya.com. This Policy forms part of, and should be read together with, our Terms & Conditions.`,
  ],
  sections: [
    {
      heading: '1. Order Processing Time',
      blocks: [
        { t: 'list', items: [
          `Orders are processed, packed, and handed over to our in-house delivery team within 1–2 business days of order confirmation and successful payment, Monday to Saturday, excluding public holidays.`,
          `Made-to-measure, customised, or pre-order items may require an extended processing time of 7–14 business days, as specified on the relevant product page.`,
          `You will receive an order confirmation email immediately after checkout, and a dispatch notification once your order is out for delivery with our team.`,
        ]},
      ],
    },
    {
      heading: '2. Order Fulfilment and Delivery',
      blocks: [
        { t: 'p', text: `Unlike many online retailers, Vastraliya does not rely on third-party courier companies for delivery. All orders are packed, dispatched, and delivered by Vastraliya's own in-house logistics and delivery team, giving us direct control over packaging quality, handling, and the overall delivery experience from our facility to your doorstep.` },
        { t: 'list', items: [
          `Our in-house delivery team currently services across India.`,
          `If your location is temporarily outside our direct delivery network, this will be indicated at checkout, and you will not be able to place an order for delivery to that address until it is added to our serviceable areas.`,
        ]},
      ],
    },
    {
      heading: '3. Delivery Timelines',
      blocks: [
        { t: 'h3', text: '3.1 Domestic Delivery' },
        { t: 'list', items: [
          `Cities/areas serviced directly by our in-house team: approximately 1–3 business days from the date of dispatch.`,
          `Other domestic locations within our wider delivery network: approximately 3–6 business days from the date of dispatch.`,
        ]},
        { t: 'p', text: `As deliveries are handled entirely by our own team rather than a nationwide courier network, our delivery area may be more limited than some other online retailers; please check serviceability by PIN code at checkout before placing your order.` },
      ],
    },
    {
      heading: '4. Shipping Charges',
      blocks: [
        { t: 'list', items: [
          `Free shipping is offered on all prepaid domestic orders above ₹999.`,
          `A flat shipping fee of ₹99–149 applies to domestic orders below the free-shipping threshold.`,
          `An additional Cash on Delivery (COD) handling fee of ₹49–99 may apply to COD orders, where available.`,
          `Applicable shipping charges, discounts, or free-shipping thresholds may be updated from time to time and will be reflected at checkout.`,
        ]},
      ],
    },
    {
      heading: '5. Cash on Delivery (COD)',
      blocks: [
        { t: 'list', items: [
          `COD is available for select pin codes within India, subject to a maximum order value of ₹9,999 and courier serviceability.`,
          `COD availability for your pin code will be displayed at checkout.`,
          `We reserve the right to restrict or cancel COD availability for specific customers or orders in cases of repeated non-delivery, refusal, or suspected misuse.`,
        ]},
      ],
    },
    {
      heading: '6. Order Tracking',
      blocks: [
        { t: 'p', text: `Once your order is dispatched, you will receive status updates (e.g., “Out for Delivery”) via email, and, where available, a tracking link to follow your order through our in-house delivery system. You can also track your order status by logging into your Vastraliya account under “My Orders”, or by contacting our customer support team with your order number.` },
      ],
    },
    {
      heading: '8. Delivery Attempts and Undelivered Packages',
      blocks: [
        { t: 'list', items: [
          `Our delivery team typically makes 2–3 delivery attempts for orders, and may contact you by phone beforehand to confirm availability at the shipping address. Please ensure someone is available at the address to receive the package, and that your contact number and address are accurate and complete.`,
          `If delivery is unsuccessful after multiple attempts, or the shipping address is found to be incorrect/incomplete, the package will be returned to our facility. In such cases, we will contact you to arrange re-delivery (additional delivery charges may apply) or process a refund as per our Refund & Cancellation Policy, minus original delivery costs where applicable.`,
          `Please inspect your package at the time of delivery. In case of visibly tampered or damaged packaging, we recommend refusing delivery or noting the damage in the presence of our delivery executive before accepting, and informing us immediately at support@vastraliya.com.`,
        ]},
      ],
    },
    {
      heading: '9. Address Accuracy',
      blocks: [
        { t: 'p', text: `Please ensure that the shipping address, PIN code, and contact number provided at checkout are complete and accurate. Vastraliya is not responsible for delayed or failed deliveries resulting from incorrect or incomplete address information provided by the customer. Address changes after an order has been dispatched may not be possible.` },
      ],
    },
    {
      heading: '10. Split Shipments',
      blocks: [
        { t: 'p', text: `If your order contains multiple items, they may be shipped separately (in one or more packages) depending on courier logistics, at no additional cost to you. You will be notified via separate tracking numbers where applicable.` },
      ],
    },
    {
      heading: '11. Force Majeure',
      blocks: [
        { t: 'p', text: `Vastraliya shall not be liable for delays in shipping or delivery caused by circumstances beyond our reasonable control, including natural disasters, strikes, government restrictions, road/transport disruptions, pandemics, or other force majeure events.` },
      ],
    },
    {
      heading: '12. Contact Us',
      blocks: [
        { t: 'p', text: `For any questions regarding shipping, delivery, or order tracking, please contact us at:` },
        { t: 'lines', lines: [
          `Vastraliya – Vastraliya Fashion Pvt. Ltd.`,
          `Email: support@vastraliya.com`,
          `Phone: 7066181207`,
          `Support Hours: Mon–Sat, 10:00 AM – 6:00 PM IST`,
        ]},
      ],
    },
    {
      heading: '13. Changes to This Policy',
      blocks: [
        { t: 'p', text: `Vastraliya reserves the right to update or modify this Shipping & Delivery Policy at any time. Changes will be effective immediately upon posting on the Platform with a revised “Effective Date”.` },
      ],
    },
  ],
};

const ShippingandDeliveryPolicy = () => <PolicyPage content={content} />;

export default ShippingandDeliveryPolicy;
