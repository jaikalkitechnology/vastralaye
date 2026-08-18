import PolicyPage, { PolicyContent } from '@/components/policy/PolicyPage';

/**
 * Privacy Policy — applied verbatim from VastraliyaPrivacyPolicy_1.docx.
 * The source document's "[Legal Entity Name]" placeholder is filled with
 * the entity named in its own Section 10 (Vastraliya Fashion Pvt. Ltd.).
 */
const content: PolicyContent = {
  title: 'Privacy Policy',
  effective: 'August 17, 2026',
  intro: [
    `This Privacy Policy (“Policy”) describes how Vastraliya Fashion Pvt. Ltd., operating the website www.vastraliya.com under the brand name “Vastraliya” (“Vastraliya”, “we”, “us” or “our”) collects, uses, stores, discloses and protects the personal information of visitors and customers (“you”, “your”, or “User”) who access or transact on our website, mobile site, or any related platform (collectively, the “Platform”), including for the purchase of sarees, suit sets, kurtas, dupattas and other ethnic wear and accessories offered by us.`,
    `By accessing or using the Platform, or by providing your information to us, you agree to the collection, use, storage and disclosure of your information as described in this Policy. If you do not agree with this Policy, please do not use the Platform.`,
  ],
  sections: [
    {
      heading: '1. Information We Collect',
      blocks: [
        { t: 'h3', text: '1.1 Information You Provide to Us' },
        { t: 'list', items: [
          `Contact and identity details: name, email address, mobile number, and billing/shipping address(es), provided at account creation, checkout, or when you contact customer support.`,
          `Order details: products purchased (e.g., sarees, suit sets, kurtas), size and fit preferences, gift-wrap/gift-message instructions, and order history.`,
          `Payment information: billing name, card/UPI/net-banking details are collected and processed by our third-party payment gateway partners; we do not store your full card or UPI credentials on our servers.`,
          `Communications: any information you share when you contact us via email, phone, WhatsApp, chat, or social media, including complaints, reviews, and feedback.`,
          `Account credentials: username and password if you create an account on the Platform.`,
          `Optional information: date of birth, gender, style preferences, or wishlist information you choose to provide for a personalised shopping experience.`,
        ]},
        { t: 'h3', text: '1.2 Information Collected Automatically' },
        { t: 'list', items: [
          `Device and usage information: IP address, browser type, device identifiers, operating system, pages viewed, time spent, referring URLs and clickstream data.`,
          `Location information: approximate location derived from your IP address or, where permitted, precise location if you enable location services.`,
          `Cookies and similar technologies: as described in Section 5 (Cookies) below.`,
        ]},
        { t: 'h3', text: '1.3 Information from Third Parties' },
        { t: 'list', items: [
          `Information from payment gateways regarding transaction status and payment verification, and delivery-status updates recorded by our in-house delivery team.`,
          `Information from social media platforms if you choose to log in, follow, or interact with us via such platforms (subject to their own privacy policies).`,
        ]},
      ],
    },
    {
      heading: '2. How We Use Your Information',
      blocks: [
        { t: 'p', text: `We use the information we collect for the following purposes:` },
        { t: 'list', items: [
          `To process, confirm, pack, ship and deliver your orders for sarees, suit sets, kurtas and other products purchased on the Platform;`,
          `To create and manage your account, process payments, refunds, exchanges and cancellations;`,
          `To communicate with you regarding order confirmations, shipping updates, delivery notifications, and customer support queries;`,
          `To personalise your shopping experience, including product recommendations, size suggestions, and curated collections;`,
          `To send promotional communications, offers, newsletters and updates about new collections (subject to your consent/opt-out preferences);`,
          `To improve the Platform, troubleshoot issues, conduct analytics, and enhance security and fraud prevention;`,
          `To comply with applicable law, respond to lawful requests from public authorities, and enforce our Terms & Conditions; and`,
          `For any other purpose disclosed to you at the time the information was collected, with your consent where required.`,
        ]},
      ],
    },
    {
      heading: '3. Sharing and Disclosure of Information',
      blocks: [
        { t: 'p', text: `We do not sell your personal information. We may share your information with:` },
        { t: 'list', items: [
          `Our in-house logistics and delivery team, who require access to your name, address, and contact number solely to fulfil and deliver your order (Vastraliya delivers orders through its own delivery team rather than third-party couriers);`,
          `Payment gateways and financial institutions to process payments, refunds and prevent fraud;`,
          `Technology and service providers who help us operate the Platform, such as website hosting, analytics, customer support tools, email/SMS/WhatsApp communication providers, and marketing platforms;`,
          `Professional advisors such as auditors, legal counsel, and consultants, where necessary;`,
          `Government authorities or regulators where required under applicable law, court order, or to protect our rights, property or safety, or that of our users or the public; and`,
          `Business transfers – in connection with a merger, acquisition, restructuring, or sale of business assets, your information may be transferred as part of that transaction, subject to confidentiality obligations.`,
        ]},
      ],
    },
    {
      heading: '4. Data Storage, Security and Retention',
      blocks: [
        { t: 'p', text: `We implement reasonable security practices and procedures, including administrative, technical and physical safeguards (such as SSL encryption, restricted access, and secure servers), commensurate with the sensitivity of the information, to protect your personal information from unauthorised access, disclosure, alteration or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.` },
        { t: 'p', text: `We retain your personal information for as long as necessary to fulfil the purposes described in this Policy, including to comply with legal, accounting, tax, or reporting requirements (e.g., under applicable consumer protection and tax laws in India), resolve disputes, and enforce our agreements. Where information is no longer required, we take reasonable steps to delete, destroy, or anonymise it.` },
      ],
    },
    {
      heading: '5. Cookies and Tracking Technologies',
      blocks: [
        { t: 'p', text: `We use cookies, web beacons, and similar technologies on the Platform to:` },
        { t: 'list', items: [
          `Remember your login details, cart items, and preferences;`,
          `Understand how you use the Platform and improve navigation and product discovery;`,
          `Measure the effectiveness of our marketing campaigns; and`,
          `Serve relevant advertisements on our Platform and third-party websites (via advertising/analytics partners such as Google and Meta).`,
        ]},
        { t: 'p', text: `You can control or disable cookies through your browser settings; however, disabling cookies may affect the functionality of the Platform, including your ability to complete a purchase.` },
      ],
    },
    {
      heading: '6. Your Rights and Choices',
      blocks: [
        { t: 'p', text: `Subject to applicable law (including the Digital Personal Data Protection Act, 2023 and related rules), you may:` },
        { t: 'list', items: [
          `Access, review and update your personal information through your account settings or by contacting us;`,
          `Request correction or deletion of your personal information, subject to our legal and legitimate business requirements;`,
          `Withdraw consent for marketing communications at any time by using the “unsubscribe” link in our emails, replying “STOP” to SMS/WhatsApp messages, or contacting us directly;`,
          `Request a copy of the personal information we hold about you; and`,
          `Lodge a grievance with our Grievance Officer (Section 9) if you believe your information has been misused.`,
        ]},
        { t: 'p', text: `To exercise any of these rights, please write to us at the contact details in Section 10. We may need to verify your identity before actioning such requests.` },
      ],
    },
    {
      heading: `7. Children's Privacy`,
      blocks: [
        { t: 'p', text: `The Platform is intended for use by individuals who are 18 years of age or older, or who are otherwise competent to enter into a binding contract under applicable law. We do not knowingly collect personal information from children. If we become aware that we have inadvertently collected personal information from a minor without appropriate consent, we will take steps to delete such information.` },
      ],
    },
    {
      heading: '8. Third-Party Links',
      blocks: [
        { t: 'p', text: `The Platform may contain links to third-party websites, payment gateways, or social media pages that are not owned or controlled by Vastraliya. This Policy does not apply to such third-party websites, and we encourage you to review their respective privacy policies before providing any personal information.` },
      ],
    },
    {
      heading: '9. Grievance Officer',
      blocks: [
        { t: 'p', text: `In accordance with applicable Indian law, including the Information Technology Act, 2000 and rules made thereunder, the details of the Grievance Officer are provided below:` },
        { t: 'lines', lines: [
          `Name: Yash`,
          `Designation: Grievance Officer`,
          `Address: Gala No 230, Second Floor, Pride Industrial Estate, Vasai East Ie, Vasai, Thane, Maharashtra, India, 401208`,
          `Email: yash@vastraliya.com`,
          `Working Hours: Mon–Sat, 10:00 AM – 6:00 PM IST`,
        ]},
      ],
    },
    {
      heading: '10. Contact Us',
      blocks: [
        { t: 'p', text: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:` },
        { t: 'lines', lines: [
          `Vastraliya – Vastraliya Fashion Pvt. Ltd.`,
          `Registered Address: Gala No 230, Second Floor, Pride Industrial Estate, Vasai East Ie, Vasai, Thane, Maharashtra, India, 401208`,
          `Email: support@vastraliya.com`,
          `Phone: 7066181207`,
        ]},
      ],
    },
    {
      heading: '11. Changes to This Privacy Policy',
      blocks: [
        { t: 'p', text: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. The updated version will be indicated by a revised “Effective Date” at the top of this Policy and will be effective as soon as it is accessible. We encourage you to review this Policy periodically. Continued use of the Platform after any changes constitutes your acceptance of the revised Policy.` },
      ],
    },
  ],
};

const PrivacyPolicy = () => <PolicyPage content={content} />;

export default PrivacyPolicy;
