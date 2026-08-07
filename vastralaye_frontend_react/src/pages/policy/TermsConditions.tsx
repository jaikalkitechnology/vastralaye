import React from 'react';
import { Container, Typography, Box, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Circle } from '@mui/icons-material';

const TermsAndConditions: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 } }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          align="center"
          sx={{ 
            fontWeight: 'bold',
            mb: 2,
            color: 'primary.main'
          }}
        >
          TERMS AND CONDITIONS
        </Typography>
        
     

        <Typography paragraph sx={{ mb: 3, fontStyle: 'italic' }}>
          Welcome to mizorpaymart.com (the &quot;Website&quot; or &quot;Platform&quot;), operated by Mizorpay Solution (OPC) Private Limited (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms and Conditions (&quot;Terms&quot;) govern your use of our e-commerce platform and the purchase of products offered through our Website.
        </Typography>
        <Typography paragraph sx={{ mb: 4, fontWeight: 'bold', fontStyle: 'italic' }}>
          By accessing or using this Website, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree with any part of these Terms, you must not use our Website or services.
        </Typography>

        <Box sx={{ lineHeight: 1.8 }}>
          {/* Section 1 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            1. DEFINITIONS AND INTERPRETATION
          </Typography>
          <Typography paragraph>
            In these Terms, unless the context otherwise requires:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography component="span">
                    &quot;Customer&quot; or &quot;User&quot; or &quot;you&quot; means any person who accesses or uses the Website for the purpose of browsing, purchasing, or availing services.
                  </Typography>
                } 
              />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography component="span">
                    &quot;Products&quot; means clothing, apparel, accessories, and other merchandise offered for sale on the Website.
                  </Typography>
                } 
              />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography component="span">
                    &quot;Order&quot; means a Customer&apos;s request to purchase Products through the Website.
                  </Typography>
                } 
              />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography component="span">
                    &quot;Account&quot; means the registered user account created by a Customer on the Website.
                  </Typography>
                } 
              />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography component="span">
                    &quot;Services&quot; means all services provided by the Company through the Website, including sale, delivery, customer support, and payment processing.
                  </Typography>
                } 
              />
            </ListItem>
          </List>

          {/* Section 2 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            2. ACCEPTANCE OF TERMS
          </Typography>
          
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            2.1 By using this Website, you represent and warrant that:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="You are at least 18 years of age or have attained the age of majority in your jurisdiction;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="You have the legal capacity to enter into binding contracts;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="All information you provide is accurate, current, and complete;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="You will comply with all applicable laws and regulations." />
            </ListItem>
          </List>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            2.2
          </Typography>
          <Typography paragraph>
            We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting on the Website. Your continued use of the Website after such modifications constitutes acceptance of the modified Terms. It is your responsibility to review these Terms periodically.
          </Typography>

          {/* Section 3 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            3. USER ACCOUNT
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            3.1 Account Registration
          </Typography>
          <Typography paragraph>
            To place orders and access certain features, you may be required to create an Account. When registering, you must provide accurate and complete information including your name, email address, phone number, and delivery address. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your Account.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            3.2 Account Security
          </Typography>
          <Typography paragraph>
            You agree to immediately notify us of any unauthorized use of your Account or any other breach of security. We shall not be liable for any loss or damage arising from your failure to comply with this security obligation. You may not use another person&apos;s Account without permission.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            3.3 Account Termination
          </Typography>
          <Typography paragraph>
            We reserve the right to suspend or terminate your Account at our sole discretion, without notice, for conduct that we believe violates these Terms, is harmful to other users, to us, or to third parties, or for any other reason. Upon termination, your right to use the Website will immediately cease.
          </Typography>

          {/* Section 4 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            4. PRODUCTS AND SERVICES
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            4.1 Product Descriptions
          </Typography>
          <Typography paragraph>
            We strive to provide accurate product descriptions, images, and specifications. However, we do not warrant that product descriptions, colors, information, or other content available on the Website are accurate, complete, reliable, current, or error-free. The display of products on your device may vary due to screen settings and monitor calibration.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            4.2 Product Availability
          </Typography>
          <Typography paragraph>
            All Products are subject to availability. We reserve the right to discontinue any Product at any time without notice. In the event that a Product ordered by you is out of stock, we will inform you and offer alternatives or a full refund.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            4.3 Pricing
          </Typography>
          <Typography paragraph>
            All prices are listed in Indian Rupees (INR) and are inclusive of all applicable taxes unless stated otherwise. We reserve the right to modify prices at any time without prior notice. However, price changes will not affect orders already confirmed. In case of pricing errors, we reserve the right to cancel the order and provide a full refund.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            4.4 Size and Fit
          </Typography>
          <Typography paragraph>
            We provide size charts and fit guides for our Products. It is your responsibility to review these guides before making a purchase. We are not responsible for any dissatisfaction arising from incorrect size selection by the Customer.
          </Typography>

          {/* Section 5 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            5. ORDERS AND PAYMENTS
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            5.1 Order Placement
          </Typography>
          <Typography paragraph>
            When you place an Order through the Website, you are making an offer to purchase the Products. We reserve the right to accept or reject your Order for any reason, including Product availability, errors in pricing or product information, or suspected fraudulent activity. Order confirmation emails are acknowledgment only and do not constitute acceptance of your Order.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            5.2 Payment Methods
          </Typography>
          <Typography paragraph>
            We accept the following payment methods:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Credit and Debit Cards (Visa, Mastercard, RuPay, American Express)" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Net Banking" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Digital Wallets (Paytm, PhonePe, Google Pay, etc.)" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="UPI (Unified Payments Interface)" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Cash on Delivery (subject to availability in your location)" />
            </ListItem>
          </List>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            5.3 Payment Processing
          </Typography>
          <Typography paragraph>
            Payment processing is handled through secure third-party payment gateways. We do not store your complete credit/debit card information. By providing payment information, you represent that you are authorized to use the payment method. You authorize us to charge the full amount of your Order to your chosen payment method.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            5.4 Order Cancellation by Company
          </Typography>
          <Typography paragraph>
            We reserve the right to cancel any Order, before or after acceptance, for reasons including but not limited to: Product unavailability, pricing errors, suspected fraudulent transactions, or failure to meet our credit or anti-fraud screening criteria. If your Order is cancelled after payment, a full refund will be processed within 7-10 business days.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            5.5 Order Cancellation by Customer
          </Typography>
          <Typography paragraph>
            You may cancel your Order before it is shipped by contacting our customer support at info@mizorpaymart.com. Once the Order has been shipped, cancellation will not be possible, but you may initiate a return in accordance with our Return Policy (Section 7).
          </Typography>

          {/* Section 6 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            6. SHIPPING AND DELIVERY
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            6.1 Delivery Areas
          </Typography>
          <Typography paragraph>
            We currently deliver throughout India. Delivery to certain remote or restricted areas may not be available. Delivery availability will be confirmed at checkout.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            6.2 Shipping Charges
          </Typography>
          <Typography paragraph>
            Shipping charges, if applicable, will be displayed at checkout before you complete your Order. We may offer free shipping promotions from time to time, subject to terms and conditions specified for such promotions.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            6.3 Delivery Timeline
          </Typography>
          <Typography paragraph>
            Orders are typically processed and shipped within 2-3 business days. Estimated delivery time is 5-7 business days from the date of shipment, depending on your location. These timelines are estimates only and may vary due to circumstances beyond our control, including but not limited to natural disasters, strikes, customs delays, or courier service issues.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            6.4 Delivery Process
          </Typography>
          <Typography paragraph>
            Products will be delivered to the address provided by you during Order placement. You must provide a valid and complete delivery address. We are not responsible for delays or non-delivery resulting from incorrect or incomplete address information. At the time of delivery, signature or OTP verification may be required. If you are not available at the delivery address, the courier partner may attempt re-delivery or contact you for alternate arrangements.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            6.5 Risk of Loss
          </Typography>
          <Typography paragraph>
            All Products purchased from the Website are made pursuant to a shipment contract. The risk of loss and title for such Products pass to you upon delivery to the carrier. We are not responsible for lost or stolen packages after delivery confirmation.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            6.6 Inspection at Delivery
          </Typography>
          <Typography paragraph>
            You are advised to inspect the package upon delivery for any visible damage. If the package appears damaged, you may refuse delivery or note the damage with the delivery personnel. Please contact our customer support immediately in case of damaged or incorrect deliveries.
          </Typography>

          {/* Section 7 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            7. RETURNS, REFUNDS AND EXCHANGES
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            7.1 Return Eligibility
          </Typography>
          <Typography paragraph>
            We accept returns within 7 days from the date of delivery for the following reasons:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Defective or damaged products" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Wrong product delivered" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Product does not match the description on the Website" />
            </ListItem>
          </List>
          <Typography paragraph>
            To be eligible for return, Products must be unused, unwashed, unaltered, and in their original condition with all tags attached. Items must be returned in their original packaging.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            7.2 Non-Returnable Items
          </Typography>
          <Typography paragraph>
            The following items are not eligible for return:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Innerwear, lingerie, and undergarments for hygiene reasons" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Products marked as &apos;Final Sale&apos; or &apos;Non-Returnable&apos;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Customized or personalized products" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Products purchased during clearance sales (unless defective)" />
            </ListItem>
          </List>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            7.3 Return Process
          </Typography>
          <Typography paragraph>
            To initiate a return, please contact our customer support at info@mizorpaymart.com within 7 days of delivery with:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Order number" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Product details and reason for return" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Photographs of the product (if damaged or incorrect)" />
            </ListItem>
          </List>
          <Typography paragraph>
            Upon approval of your return request, we will provide instructions for returning the product. You may be required to ship the product back to us at your own cost, or we may arrange for pickup depending on the reason for return.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            7.4 Refund Process
          </Typography>
          <Typography paragraph>
            Once we receive and inspect the returned product, we will process your refund within 7-10 business days. Refunds will be credited to the original payment method used for the purchase. For Cash on Delivery orders, refunds will be processed via bank transfer to your provided bank account details.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            7.5 Exchanges
          </Typography>
          <Typography paragraph>
            We offer exchanges for size and color variations subject to product availability. To request an exchange, please follow the return process outlined above and specify your exchange preference. Exchange requests are subject to our approval and product availability.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            7.6 Damaged or Defective Products
          </Typography>
          <Typography paragraph>
            If you receive a damaged or defective product, please notify us immediately upon delivery. We will arrange for a replacement or full refund, including return shipping costs, at no additional charge to you. Please provide photographs of the damaged/defective product to support your claim.
          </Typography>

          {/* Section 8 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            8. INTELLECTUAL PROPERTY RIGHTS
          </Typography>
          
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            8.1
          </Typography>
          <Typography paragraph>
            All content on this Website, including but not limited to text, graphics, logos, images, videos, audio clips, digital downloads, data compilations, software, designs, and the compilation thereof (collectively, &quot;Content&quot;), is the property of Mizorpay Solution (OPC) Private Limited or its content suppliers and is protected by Indian and international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            8.2
          </Typography>
          <Typography paragraph>
            The trademarks, logos, and service marks displayed on the Website (&quot;Marks&quot;) are the property of the Company or third parties. You are not permitted to use these Marks without prior written consent from the Company or the third-party owner.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            8.3
          </Typography>
          <Typography paragraph>
            You may not modify, copy, reproduce, republish, upload, post, transmit, or distribute any Content from this Website without our prior written permission. You may print or download portions of material from the Website solely for your personal, non-commercial use, provided you keep intact all copyright and other proprietary notices.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            8.4
          </Typography>
          <Typography paragraph>
            Unauthorized use of any Content or Marks may violate copyright, trademark, and other laws and could result in criminal or civil penalties.
          </Typography>

          {/* Section 9 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            9. USER CONDUCT AND PROHIBITED ACTIVITIES
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            9.1
          </Typography>
          <Typography paragraph>
            You agree not to engage in any of the following prohibited activities:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Using the Website for any unlawful purpose or in violation of these Terms;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Impersonating any person or entity or falsely stating or misrepresenting your affiliation with any person or entity;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Interfering with or disrupting the Website or servers or networks connected to the Website;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Attempting to gain unauthorized access to any portion of the Website or any other systems or networks;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Using any automated means (including bots, scrapers, or data mining tools) to access the Website;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Uploading or transmitting viruses or any other type of malicious code;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Engaging in any activity that could damage, disable, overburden, or impair the Website;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Making fraudulent purchases or providing false payment information;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Violating any applicable local, state, national, or international law or regulation." />
            </ListItem>
          </List>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            9.2
          </Typography>
          <Typography paragraph>
            We reserve the right to investigate and take appropriate legal action against anyone who, in our sole discretion, violates this provision, including removing offending content, suspending or terminating the Account of such violators, and reporting the violation to law enforcement authorities.
          </Typography>

          {/* Section 10 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            10. PRIVACY AND DATA PROTECTION
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            10.1
          </Typography>
          <Typography paragraph>
            Your use of the Website is also governed by our Privacy Policy, which can be accessed on the Website. The Privacy Policy explains how we collect, use, disclose, and protect your personal information. By using the Website, you consent to the collection and use of your information as described in the Privacy Policy.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            10.2
          </Typography>
          <Typography paragraph>
            We implement reasonable security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            10.3
          </Typography>
          <Typography paragraph>
            You are responsible for maintaining the confidentiality of any personal information you provide through the Website. You agree to notify us immediately of any unauthorized use of your information or any other breach of security.
          </Typography>

          {/* Section 11 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            11. DISCLAIMERS AND WARRANTIES
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            11.1
          </Typography>
          <Typography paragraph sx={{ fontStyle: 'italic' }}>
            THE WEBSITE AND ALL PRODUCTS, CONTENT, AND SERVICES PROVIDED THROUGH THE WEBSITE ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            11.2
          </Typography>
          <Typography paragraph sx={{ fontStyle: 'italic' }}>
            We do not warrant that the Website will be uninterrupted, secure, or error-free, that defects will be corrected, or that the Website or the servers that make it available are free of viruses or other harmful components.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            11.3
          </Typography>
          <Typography paragraph sx={{ fontStyle: 'italic' }}>
            We do not warrant or make any representations regarding the use or the results of the use of the Products or Content in terms of their correctness, accuracy, reliability, or otherwise.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            11.4
          </Typography>
          <Typography paragraph sx={{ fontStyle: 'italic' }}>
            While we strive to provide accurate product information, we do not warrant that product descriptions, images, pricing, or other content on the Website are accurate, complete, reliable, current, or error-free.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            11.5
          </Typography>
          <Typography paragraph sx={{ fontStyle: 'italic' }}>
            Some jurisdictions do not allow the exclusion of implied warranties, so some of the above exclusions may not apply to you. You may have other rights which vary from jurisdiction to jurisdiction.
          </Typography>

          {/* Section 12 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            12. LIMITATION OF LIABILITY
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            12.1
          </Typography>
          <Typography paragraph sx={{ fontStyle: 'italic' }}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL MIZORPAY SOLUTION (OPC) PRIVATE LIMITED, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AFFILIATES, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </Typography>
          <List dense sx={{ fontStyle: 'italic' }}>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Your access to or use of or inability to access or use the Website;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Any conduct or content of any third party on the Website;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Any content obtained from the Website;" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Unauthorized access, use, or alteration of your transmissions or content." />
            </ListItem>
          </List>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            12.2
          </Typography>
          <Typography paragraph sx={{ fontStyle: 'italic' }}>
            OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE WEBSITE OR PRODUCTS SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE PRODUCT(S) GIVING RISE TO THE CLAIM, OR INR 1,000 (ONE THOUSAND RUPEES), WHICHEVER IS GREATER.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            12.3
          </Typography>
          <Typography paragraph sx={{ fontStyle: 'italic' }}>
            We shall not be liable for any failure or delay in performance resulting from causes beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, strikes, or shortages of transportation facilities, fuel, energy, labor, or materials.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            12.4
          </Typography>
          <Typography paragraph sx={{ fontStyle: 'italic' }}>
            Some jurisdictions do not allow the exclusion or limitation of liability for consequential or incidental damages, so the above limitations may not apply to you.
          </Typography>

          {/* Section 13 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            13. INDEMNIFICATION
          </Typography>
          <Typography paragraph>
            You agree to defend, indemnify, and hold harmless Mizorpay Solution (OPC) Private Limited, its officers, directors, employees, agents, affiliates, and suppliers from and against any claims, actions, demands, liabilities, judgments, damages, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or in connection with: (a) your use of the Website; (b) your violation of these Terms; (c) your violation of any third-party rights, including intellectual property, privacy, or other proprietary rights; or (d) any claim that your use of the Website caused damage to a third party.
          </Typography>

          {/* Section 14 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            14. THIRD-PARTY LINKS AND SERVICES
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            14.1
          </Typography>
          <Typography paragraph>
            The Website may contain links to third-party websites, advertisers, or services that are not owned or controlled by us. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            14.2
          </Typography>
          <Typography paragraph>
            We are not liable for any damage or loss caused by or in connection with your use of or reliance on any third-party content, goods, or services available through such websites or services. You acknowledge and agree that we shall not be responsible or liable for any damage or loss caused by your use of any third-party website or service.
          </Typography>

          {/* Section 15 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            15. DISPUTE RESOLUTION AND ARBITRATION
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            15.1 Informal Resolution
          </Typography>
          <Typography paragraph>
            In the event of any dispute, claim, or controversy arising out of or relating to these Terms or the Website (&quot;Dispute&quot;), you agree to first contact us at info@mizorpaymart.com and attempt to resolve the Dispute informally. We will work with you in good faith to resolve any Dispute.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            15.2 Arbitration
          </Typography>
          <Typography paragraph>
            If the Dispute cannot be resolved informally within 30 days, you agree that the Dispute shall be resolved by binding arbitration in accordance with the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted by a sole arbitrator mutually agreed upon by both parties. If the parties cannot agree on an arbitrator within 15 days, the arbitrator shall be appointed in accordance with the Arbitration and Conciliation Act, 1996.
          </Typography>
          <Typography paragraph>
            The seat of arbitration shall be Patna, Bihar, India. The language of arbitration shall be English. The arbitrator&apos;s award shall be final and binding on both parties.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            15.3 Exceptions
          </Typography>
          <Typography paragraph>
            Notwithstanding the above, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of a party&apos;s intellectual property rights.
          </Typography>

          {/* Section 16 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            16. GOVERNING LAW AND JURISDICTION
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            16.1
          </Typography>
          <Typography paragraph>
            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            16.2
          </Typography>
          <Typography paragraph>
            Subject to the arbitration clause in Section 15, the courts of Patna, Bihar, India shall have exclusive jurisdiction over any disputes arising out of or related to these Terms or the Website.
          </Typography>

          {/* Section 17 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            17. FORCE MAJEURE
          </Typography>
          <Typography paragraph>
            We shall not be liable for any failure or delay in performing our obligations under these Terms if such failure or delay is due to circumstances beyond our reasonable control, including but not limited to acts of God, natural disasters, war, civil unrest, strikes, lockouts, government actions, pandemics, epidemics, telecommunications failures, power failures, or any other force majeure event. In such cases, our performance obligations shall be suspended for the duration of the force majeure event.
          </Typography>

          {/* Section 18 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            18. SEVERABILITY
          </Typography>
          <Typography paragraph>
            If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be deemed modified to the minimum extent necessary to make it valid and enforceable. If such modification is not possible, the provision shall be severed from these Terms. The invalidity or unenforceability of any provision shall not affect the validity or enforceability of the remaining provisions.
          </Typography>

          {/* Section 19 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            19. WAIVER
          </Typography>
          <Typography paragraph>
            No waiver of any term or condition of these Terms shall be deemed a further or continuing waiver of such term or condition or any other term or condition. Our failure to assert any right or provision under these Terms shall not constitute a waiver of such right or provision.
          </Typography>

          {/* Section 20 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            20. ENTIRE AGREEMENT
          </Typography>
          <Typography paragraph>
            These Terms, together with our Privacy Policy and any other legal notices or policies published on the Website, constitute the entire agreement between you and Mizorpay Solution (OPC) Private Limited concerning your use of the Website and supersede all prior or contemporaneous agreements, understandings, warranties, and representations, whether written or oral.
          </Typography>

          {/* Section 21 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            21. ASSIGNMENT
          </Typography>
          <Typography paragraph>
            You may not assign or transfer these Terms or your rights and obligations hereunder, by operation of law or otherwise, without our prior written consent. We may assign or transfer these Terms or our rights and obligations hereunder, in whole or in part, without your consent. Subject to the foregoing, these Terms will bind and inure to the benefit of the parties and their respective successors and permitted assigns.
          </Typography>

          {/* Section 22 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            22. CUSTOMER SUPPORT AND CONTACT INFORMATION
          </Typography>
          <Typography paragraph>
            For any questions, concerns, or complaints regarding these Terms or the Website, please contact us at:
          </Typography>
          <Typography paragraph sx={{ fontWeight: 'bold' }}>
            Mizorpay Solution (OPC) Private Limited
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Email: info@mizorpaymart.com" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Website: www.mizorpaymart.com" />
            </ListItem>
          </List>
          <Typography paragraph>
            We aim to respond to all customer inquiries within 24-48 business hours.
          </Typography>

          {/* Section 23 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            23. CONSUMER RIGHTS AND GRIEVANCE REDRESSAL
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            23.1
          </Typography>
          <Typography paragraph>
            As a consumer, you have certain rights under the Consumer Protection Act, 2019 and other applicable Indian consumer protection laws. Nothing in these Terms shall limit or waive any rights you may have under such laws.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            23.2
          </Typography>
          <Typography paragraph>
            If you have any grievances or complaints that are not resolved through our customer support, you may escalate the matter to our Grievance Officer:
          </Typography>
          <Typography paragraph sx={{ fontWeight: 'bold' }}>
            Grievance Officer Contact:
          </Typography>
          <Typography paragraph>
            Email: grievance@mizorpaymart.com
          </Typography>
          <Typography paragraph>
            The Grievance Officer shall address your complaint within 15 days from the date of receipt.
          </Typography>

          {/* Acknowledgment Section */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark', pt: 3, borderTop: '2px solid', borderColor: 'divider' }}>
            ACKNOWLEDGMENT OF TERMS
          </Typography>
          <Typography paragraph sx={{ fontWeight: 'bold', fontStyle: 'italic', bgcolor: 'primary.light', p: 3, borderRadius: 1 }}>
            BY USING THIS WEBSITE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS AND CONDITIONS, UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT USE THIS WEBSITE OR PURCHASE ANY PRODUCTS FROM US.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsAndConditions;