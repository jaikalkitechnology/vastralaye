import React from 'react';

const sectionHeading = "font-serif text-xl font-medium text-espresso mt-8 mb-3";
const paragraph = "mb-4";

const ShippingandDeliveryPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-ivory py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10 md:mb-12">
          <span className="overline-label mb-2">Our Policies</span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso">
            Shipping and Delivery Policy
          </h1>
        </header>

        <div className="text-[15px] leading-relaxed text-muted-foreground">
          <p className={paragraph}>
            A Shipping and Delivery Policy in e-commerce outlines the terms and conditions related to how products are shipped and delivered to customers. It is an essential part of an e-commerce business as it helps build trust, sets clear expectations, and reduces potential disputes. Below is a general structure and key components of such a policy:
          </p>

          <h2 className={sectionHeading}>
            1. Shipping Locations
          </h2>
          <p className={paragraph}>
            All over the Country
          </p>

          <h2 className={sectionHeading}>
            2. When would my Item be Delivered to me?
          </h2>
          <p className={paragraph}>
            Following your selection of items and checkout, you will be asked to choose a delivery time period for your order. Item are delivered on after 3-5 days and time specified by the customer . It is possible that we will not be able to deliver your purchase in time (maybe due to some unpredicted issues)
          </p>

          <h2 className={sectionHeading}>
            3. What are the shipping charges?
          </h2>
          <p className={paragraph}>
            Besed on Delivery Location.
          </p>
          <p className={paragraph}>
            Distinguish between domestic and international shipping.
          </p>

          <h2 className={sectionHeading}>
            4. I need to return an order; how would I organize a get it collect by yours side?
          </h2>
          <p className={paragraph}>
            Returns are not accepted for anything purchased from the mizorpaymart.com online store. We provide complete product replacement for items that may be harmed during shipping. As soon as our customer service team confirms the damage through phone or email correspondence, replacement orders are made.
          </p>

          <h2 className={sectionHeading}>
            5. Does mizorpaymart.com delivers internationally?
          </h2>
          <p className={paragraph}>
            No
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingandDeliveryPolicy;
