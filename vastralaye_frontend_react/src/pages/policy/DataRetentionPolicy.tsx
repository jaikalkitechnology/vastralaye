import React from 'react';

const sectionHeading = "font-serif text-xl font-medium text-espresso mt-8 mb-3";
const subHeading = "font-serif text-lg font-medium text-espresso mt-5 mb-2";
const paragraph = "mb-4";
const list = "list-disc pl-5 mb-4 space-y-1.5 marker:text-gold";

const DataRetentionPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-ivory py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10 md:mb-12">
          <span className="overline-label mb-2">Our Policies</span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso">
            Data Retention Policy for E-Commerce
          </h1>
        </header>

        <div className="text-[15px] leading-relaxed text-muted-foreground">
          <h2 className={sectionHeading}>
            Purpose of the Policy
          </h2>
          <p className={paragraph}>
            To define the guidelines for storing, managing, and securely disposing of customer and business-related data in compliance with Indian laws, including the Information Technology (IT) Act, 2000, and other applicable regulations.
          </p>

          <p className={paragraph}>
            A data retention policy for an e-commerce website in India needs to align with Indian laws and regulations, including privacy and cybersecurity requirements. Below is a comprehensive guideline for drafting a data retention policy:
          </p>

          <h2 className="font-serif text-2xl font-medium text-espresso mt-10 mb-4">
            Data Retention Policy for E-Commerce Website in India
          </h2>

          <h2 className={sectionHeading}>
            Purpose of the Policy
          </h2>
          <p className={paragraph}>
            To define the guidelines for storing, managing, and securely disposing of customer and business-related data in compliance with Indian laws, including the Information Technology (IT) Act, 2000, and other applicable regulations.
          </p>

          <h2 className={sectionHeading}>
            Scope
          </h2>
          <p className={paragraph}>
            This policy applies to all data collected, processed, and stored by the e-commerce platform, including customer data, employee data, transaction records, and system logs.
          </p>

          <h2 className={sectionHeading}>
            Key Components of the Data Retention Policy
          </h2>

          <h3 className={subHeading}>
            1. Types of Data Collected
          </h3>
          <ul className={list}>
            <li>Customer Data: Name, address, phone number, email ID, payment details, purchase history, etc.</li>
            <li>Transactional Data: Order details, invoices, payment records.</li>
            <li>System Logs: User login/logout details, IP addresses, cookies, and session information.</li>
            <li>Marketing Data: Customer preferences, survey responses, and promotional data.</li>
          </ul>

          <h3 className={subHeading}>
            2. Retention Periods
          </h3>
          <p className={paragraph}>
            Retention periods are defined based on the type of data and its purpose:
          </p>
          <ul className={list}>
            <li>
              Customer Data: Retained for as long as the customer account is active or as required to provide services (up to 5 years post-account closure, in line with legal requirements like the Income Tax Act and anti-money laundering laws).
            </li>
            <li>
              Transaction Records: Retained for at least 8 years, as per the Companies Act, 2013, and GST regulations.
            </li>
            <li>
              System Logs: Retained for 180 days as mandated by the Indian IT Act and associated rules.
            </li>
            <li>
              Marketing Data: Retained until the customer opts out or withdraws consent.
            </li>
            <li>
              Employee Data: Retained as per employment laws and HR policies (up to 7 years post-employment).
            </li>
          </ul>

          <h3 className={subHeading}>
            3. Data Minimization
          </h3>
          <ul className={list}>
            <li>Collect only necessary data to fulfill the purpose for which it is collected.</li>
            <li>Avoid collecting sensitive personal data unless absolutely required.</li>
          </ul>

          <h3 className={subHeading}>
            4. Data Storage and Security
          </h3>
          <ul className={list}>
            <li>Encrypt sensitive personal data and payment information.</li>
            <li>Store data on servers located in compliance with local data localization requirements, such as the RBI guidelines for payment data.</li>
            <li>Implement access controls to restrict unauthorized access.</li>
          </ul>

          <h3 className={subHeading}>
            5. Legal and Regulatory Compliance
          </h3>
          <ul className={list}>
            <li>Comply with the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.</li>
            <li>Adhere to sector-specific regulations like those from the Reserve Bank of India (RBI) for financial transactions.</li>
            <li>Ensure compliance with the upcoming Digital Personal Data Protection Act, 2023 (DPDP Act).</li>
          </ul>

          <h3 className={subHeading}>
            6. Disposal of Data
          </h3>
          <ul className={list}>
            <li>Delete or anonymize data that is no longer needed for legal, regulatory, or business purposes.</li>
            <li>Ensure secure deletion methods, such as data wiping or shredding, to prevent unauthorized recovery.</li>
          </ul>

          <h3 className={subHeading}>
            7. Customer Rights
          </h3>
          <p className={paragraph}>
            Provide customers the right to:
          </p>
          <ul className={list}>
            <li>Access their data.</li>
            <li>Correct inaccuracies in their data.</li>
            <li>Request deletion of their data, subject to legal constraints.</li>
            <li>Withdraw consent for marketing communications.</li>
          </ul>

          <h3 className={subHeading}>
            8. Policy Review and Updates
          </h3>
          <ul className={list}>
            <li>The policy will be reviewed annually or when significant regulatory changes occur.</li>
            <li>Communicate updates to customers and employees.</li>
          </ul>

          <h2 className={sectionHeading}>
            Penalties for Non-Compliance
          </h2>
          <p className={paragraph}>
            Failure to comply with this policy may result in legal penalties, including fines under the IT Act, DPDP Act, and other applicable laws.
          </p>

          <h2 className={sectionHeading}>
            Conclusion
          </h2>
          <p className={paragraph}>
            This data retention policy ensures compliance with Indian regulations while protecting customer privacy and maintaining trust. Regular audits and updates are essential to ensure its effectiveness.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataRetentionPolicy;
