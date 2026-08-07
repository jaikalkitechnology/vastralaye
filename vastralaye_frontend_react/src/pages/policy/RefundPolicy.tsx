import React from 'react';
import { Container, Typography, Box, Paper, List, ListItem, ListItemIcon, ListItemText, Table, TableBody, TableCell, TableContainer, TableRow, TableHead } from '@mui/material';
import { FiberManualRecord, Circle } from '@mui/icons-material';

const ReturnPolicy: React.FC = () => {
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
            mb: 4,
            color: 'primary.main'
          }}
        >
          REFUND & RETURN POLICY
        </Typography>


 

        <Typography paragraph sx={{ mb: 3, fontStyle: 'italic' }}>
          At mizorpaymart.com, we are committed to ensuring customer satisfaction with every purchase. We understand that sometimes products may not meet your expectations, and we have designed this Refund & Return Policy to make the process as simple and hassle-free as possible. This policy outlines the conditions, procedures, and timelines for returns, exchanges, and refunds.
        </Typography>

        <Box sx={{ lineHeight: 1.8 }}>
          {/* Section 1 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            1. RETURN ELIGIBILITY
          </Typography>
          
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            1.1 Return Window
          </Typography>
          <Typography paragraph>
            We accept returns within 7 days from the date of delivery. The return period begins on the day you receive your order. To be eligible for a return, you must initiate the return request within this 7-day window.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            1.2 Conditions for Return
          </Typography>
          <Typography paragraph>
            Products must meet the following conditions to be eligible for return:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="The product must be unused, unworn, and unwashed" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="All original tags, labels, and packaging must be intact and attached" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="The product must be in its original condition without any damage, stains, or alterations" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="All accessories, freebies, or complementary items (if any) must be returned along with the product" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="The product must be returned in its original packaging" />
            </ListItem>
          </List>
          <Typography paragraph sx={{ fontStyle: 'italic' }}>
            Note: Products that do not meet these conditions may not be accepted for return, or may be subject to a reduced refund based on the condition assessment.
          </Typography>

          {/* Section 2 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            2. VALID REASONS FOR RETURN
          </Typography>
          <Typography paragraph>
            We accept returns for the following reasons:
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            2.1 Defective or Damaged Products
          </Typography>
          <Typography paragraph>
            If you receive a product that is defective, damaged, or has manufacturing flaws, we will accept the return and provide a full refund or replacement. Please report such issues immediately upon delivery with photographs of the defect or damage.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            2.2 Wrong Product Delivered
          </Typography>
          <Typography paragraph>
            If you receive a product that is different from what you ordered (wrong size, color, style, or item), we will accept the return and arrange for the correct product to be sent to you at no additional cost, or provide a full refund.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            2.3 Product Not as Described
          </Typography>
          <Typography paragraph>
            If the product significantly differs from the description, specifications, or images shown on our website, you may return the product for a refund or exchange. Minor variations in color due to screen settings or photography are not considered valid grounds for return.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            2.4 Size or Fit Issues
          </Typography>
          <Typography paragraph>
            If the product does not fit as expected, you may return it within the 7-day window, provided it meets all the return conditions mentioned in Section 1.2. We recommend referring to our detailed size charts before placing an order to minimize sizing issues.
          </Typography>

          {/* Section 3 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            3. NON-RETURNABLE ITEMS
          </Typography>
          <Typography paragraph>
            For hygiene, safety, and quality reasons, the following items are not eligible for return:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <FiberManualRecord sx={{ fontSize: 10 }} />
              </ListItemIcon>
              <ListItemText primary="Innerwear, Lingerie & Undergarments: All intimate apparel including bras, panties, boxers, briefs, undershirts, thermal wear, and shapewear" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <FiberManualRecord sx={{ fontSize: 10 }} />
              </ListItemIcon>
              <ListItemText primary="Socks & Hosiery: All types of socks, stockings, and hosiery products" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <FiberManualRecord sx={{ fontSize: 10 }} />
              </ListItemIcon>
              <ListItemText primary="Customized or Personalized Products: Items that have been specially made, altered, or personalized as per customer specifications" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <FiberManualRecord sx={{ fontSize: 10 }} />
              </ListItemIcon>
              <ListItemText primary="Products Marked as 'Final Sale' or 'Non-Returnable': Items clearly marked on the product page as final sale, non-returnable, or no exchange" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <FiberManualRecord sx={{ fontSize: 10 }} />
              </ListItemIcon>
              <ListItemText primary="Clearance Sale Items: Products purchased during clearance or end-of-season sales (unless defective or damaged)" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <FiberManualRecord sx={{ fontSize: 10 }} />
              </ListItemIcon>
              <ListItemText primary="Used, Washed, or Altered Products: Any item that has been worn, washed, altered, or shows signs of use" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <FiberManualRecord sx={{ fontSize: 10 }} />
              </ListItemIcon>
              <ListItemText primary="Products with Removed Tags: Items with tags, labels, or security seals removed or damaged" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <FiberManualRecord sx={{ fontSize: 10 }} />
              </ListItemIcon>
              <ListItemText primary="Freebies or Promotional Items: Complimentary products or gifts received with purchase cannot be returned separately" />
            </ListItem>
          </List>

          {/* Section 4 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            4. HOW TO INITIATE A RETURN
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            4.1 Step-by-Step Return Process
          </Typography>

          <Typography variant="subtitle1" component="h4" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            Step 1: Contact Customer Support
          </Typography>
          <Typography paragraph>
            Send an email to info@mizorpaymart.com within 7 days of receiving your order. Include the following information:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Order Number (found in your order confirmation email)" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Product Name and SKU/Item Code" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Reason for return (defective, wrong item, size issue, etc.)" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Clear photographs of the product (especially if damaged or defective)" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Your registered contact number and email address" />
            </ListItem>
          </List>

          <Typography variant="subtitle1" component="h4" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            Step 2: Return Request Review
          </Typography>
          <Typography paragraph>
            Our customer support team will review your return request within 24-48 hours. We may request additional information or photographs if needed. Once approved, we will provide you with return instructions and a Return Authorization Number (RAN).
          </Typography>

          <Typography variant="subtitle1" component="h4" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            Step 3: Pack the Product
          </Typography>
          <Typography paragraph>
            Pack the product securely in its original packaging along with all tags, labels, invoices, and accessories. Include a note with your Order Number and Return Authorization Number inside the package.
          </Typography>

          <Typography variant="subtitle1" component="h4" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            Step 4: Shipping the Return
          </Typography>
          <Typography paragraph>
            Two options are available:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Pickup Arranged by Us: For defective, damaged, or wrong items, we will arrange a free pickup from your address. Our logistics partner will contact you to schedule a convenient pickup time."
              />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Self-Ship: For other returns (size/fit issues, change of mind), you may ship the product to our return address at your own cost. Use a reliable courier service with tracking and retain the tracking number."
              />
            </ListItem>
          </List>
          <Typography paragraph sx={{ fontWeight: 'bold', mt: 2 }}>
            Return Address:
          </Typography>
          <Typography paragraph sx={{ fontStyle: 'italic' }}>
            Mizorpay Solution (OPC) Private Limited<br />
            Returns Department<br />
          PLOT NO 69-71, BP, FARIDABAD,<br/>Factory Area Faridabad Faridabad,<br/>Faridabad-121001,Haryana
          </Typography>

          <Typography variant="subtitle1" component="h4" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            Step 5: Quality Check
          </Typography>
          <Typography paragraph>
            Once we receive the returned product, our quality assurance team will inspect it within 3-5 business days to verify that it meets the return conditions. We will notify you via email about the approval or rejection of your return request.
          </Typography>

          {/* Section 5 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            5. REFUND POLICY
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            5.1 Refund Eligibility
          </Typography>
          <Typography paragraph>
            Refunds will be processed only after the returned product has been received and inspected by our quality assurance team. If the product meets all return conditions, a full refund will be initiated.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            5.2 Refund Amount
          </Typography>
          <Typography paragraph>
            The refund amount will include:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Product price paid by you" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Applicable taxes (GST) paid on the product" />
            </ListItem>
          </List>
          <Typography paragraph>
            The refund amount will NOT include:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Shipping charges (unless the return is due to our error, defective product, or wrong item delivery)" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Return shipping costs (if you chose to self-ship the product)" />
            </ListItem>
          </List>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            5.3 Refund Methods
          </Typography>
          <Typography paragraph>
            Refunds will be processed based on your original payment method:
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2, mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.light' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Payment Method</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Refund Method & Timeline</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Credit/Debit Card</TableCell>
                  <TableCell>Refunded to the original card within 7-10 business days. The actual credit may take an additional 2-3 days depending on your bank.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Net Banking</TableCell>
                  <TableCell>Refunded to the original bank account within 7-10 business days.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>UPI / Digital Wallets</TableCell>
                  <TableCell>Refunded to the original payment source (UPI ID or wallet) within 7-10 business days.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Cash on Delivery</TableCell>
                  <TableCell>Refunded via NEFT/IMPS bank transfer within 7-10 business days after receiving your bank account details (Account Number, IFSC Code, Account Holder Name).</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          <Typography paragraph sx={{ fontStyle: 'italic' }}>
            Note: The refund processing timeline starts only after we receive and approve the returned product.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            5.4 Partial Refunds
          </Typography>
          <Typography paragraph>
            In certain situations, partial refunds may be granted:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Products returned with missing tags or labels" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Products showing signs of use, minor damage, or wear" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Products returned after 7 days (at our discretion)" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Products returned without original packaging or accessories" />
            </ListItem>
          </List>
          <Typography paragraph>
            The partial refund amount will be determined based on the product's condition after inspection. We reserve the right to deduct up to 30% from the product value for products that do not meet our return standards.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            5.5 Refund Tracking
          </Typography>
          <Typography paragraph>
            Once your refund is initiated, we will send you a confirmation email with refund details including the amount and expected credit date. You can track the refund status by logging into your account or contacting our customer support.
          </Typography>

          {/* Section 6 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            6. EXCHANGE POLICY
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            6.1 Exchange Availability
          </Typography>
          <Typography paragraph>
            We offer exchanges for size and color variations, subject to product availability. Exchanges are available only within the 7-day return window and must meet all return conditions specified in Section 1.2.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            6.2 How to Request an Exchange
          </Typography>
          <Typography paragraph>
            To request an exchange, follow the same process as returns (Section 4) but clearly mention your exchange preference (desired size or color) in your email. We will check product availability and confirm whether the exchange can be processed.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            6.3 Exchange Process
          </Typography>
          <Typography paragraph sx={{ fontWeight: 'bold' }}>
            If the desired product is available:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="We will arrange pickup of the original product" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Once received and inspected, we will ship the replacement product within 3-5 business days" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="No additional charges will be applied for exchanges due to defects or our errors" />
            </ListItem>
          </List>
          
          <Typography paragraph sx={{ fontWeight: 'bold', mt: 2 }}>
            If the desired product is not available:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="We will offer similar alternative products" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="If no suitable alternative is found, we will process a full refund" />
            </ListItem>
          </List>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            6.4 Exchange Shipping Charges
          </Typography>
          <Typography paragraph>
            Shipping charges for exchanges:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Free for defective, damaged, or wrong items" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="May apply for size/fit exchanges at our discretion, with prior notification" />
            </ListItem>
          </List>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            6.5 Exchange Limitations
          </Typography>
          <Typography paragraph>
            Only one exchange is allowed per order. If the exchanged product also needs to be returned, it will be processed as a return with refund as per our standard policy.
          </Typography>

          {/* Section 7 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            7. SPECIAL CASES
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            7.1 Damaged or Defective Products
          </Typography>
          <Typography paragraph>
            If you receive a damaged or defective product, please notify us immediately (preferably within 24 hours) with photographs. We will provide priority processing for such cases, including:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Free pickup arrangement" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Priority inspection and approval" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Immediate replacement shipment (if product is available)" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Full refund including shipping charges" />
            </ListItem>
          </List>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            7.2 Missing Items or Incomplete Orders
          </Typography>
          <Typography paragraph>
            If you receive an incomplete order or items are missing from your package, please contact us within 48 hours of delivery with your order details. We will investigate and send the missing items at no additional cost.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            7.3 Orders Lost in Transit
          </Typography>
          <Typography paragraph>
            If your order is marked as delivered but you have not received it, please contact us within 48 hours. We will initiate an investigation with our logistics partner. Based on the investigation outcome, we will either reship the order or provide a full refund.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            7.4 Bulk or Corporate Orders
          </Typography>
          <Typography paragraph>
            Return and refund policies for bulk orders (10+ items) or corporate orders may differ from standard policy. Please contact our customer support for specific terms applicable to your bulk order.
          </Typography>

          {/* Section 8 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            8. ORDER CANCELLATION POLICY
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            8.1 Cancellation by Customer
          </Typography>
          <Typography paragraph>
            You may cancel your order before it is shipped. To cancel an order, contact our customer support immediately at info@mizorpaymart.com with your order number. If the order has already been shipped, you cannot cancel it but may return it after delivery as per this policy.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            8.2 Cancellation Refund
          </Typography>
          <Typography paragraph>
            For successfully cancelled orders (before shipment), a full refund will be processed within 7-10 business days to your original payment method. No cancellation charges will be applied.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            8.3 Cancellation by Company
          </Typography>
          <Typography paragraph>
            We reserve the right to cancel orders due to product unavailability, pricing errors, payment issues, or suspected fraudulent activity. In such cases, you will be notified immediately via email, and a full refund will be processed within 7-10 business days.
          </Typography>

          {/* Section 9 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            9. CUSTOMER SUPPORT
          </Typography>
          <Typography paragraph>
            For any queries, concerns, or assistance regarding returns, refunds, or exchanges, please contact us:
          </Typography>
          <Typography paragraph sx={{ fontWeight: 'bold' }}>
            Mizorpay Solution (OPC) Private Limited
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="📧 Email: info@mizorpaymart.com" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="🌐 Website: www.mizorpaymart.com" />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="📞 Customer Support Hours: Monday to Saturday, 10:00 AM to 6:30 PM IST" />
            </ListItem>
          </List>
          <Typography paragraph>
            We aim to respond to all return and refund queries within 24-48 hours during business hours.
          </Typography>

          {/* Section 10 */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            10. IMPORTANT NOTES
          </Typography>
          <Typography paragraph>
            Please read the following important information:
          </Typography>
          <List dense>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Product Inspection: Always inspect products upon delivery and report any issues immediately for faster resolution." />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Retain Proof: Keep order confirmations, invoices, and return shipping receipts until your refund is processed." />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Size Charts: Refer to our detailed size charts before ordering to minimize size-related returns." />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Policy Updates: This policy may be updated periodically. The latest version will always be available on our website." />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Consumer Rights: Your statutory rights under the Consumer Protection Act, 2019 are not affected by this policy." />
            </ListItem>
            <ListItem sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <Circle sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText primary="Quality Commitment: We are committed to providing quality products and excellent customer service. Your satisfaction is our priority." />
            </ListItem>
          </List>

          {/* Commitment Section */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, color: 'primary.dark' }}>
            OUR COMMITMENT TO YOU
          </Typography>
          <Typography paragraph sx={{ fontStyle: 'italic' }}>
            At mizorpaymart.com, we stand behind the quality of our products and are committed to ensuring your complete satisfaction. Our return and refund policy is designed to be fair, transparent, and customer-friendly. We continuously work to improve our processes to provide you with a seamless shopping experience.
          </Typography>
          <Typography paragraph sx={{ fontWeight: 'bold', mt: 2, fontStyle: 'italic' }}>
            Thank you for choosing mizorpaymart.com. We value your trust and look forward to serving you!
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ReturnPolicy;