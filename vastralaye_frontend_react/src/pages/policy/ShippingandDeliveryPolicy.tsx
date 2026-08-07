import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const ShippingandDeliveryPolicy: React.FC = () => {
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
          Shipping and Delivery Policy
        </Typography>

        <Box sx={{ lineHeight: 1.8 }}>
          <Typography paragraph>
            A Shipping and Delivery Policy in e-commerce outlines the terms and conditions related to how products are shipped and delivered to customers. It is an essential part of an e-commerce business as it helps build trust, sets clear expectations, and reduces potential disputes. Below is a general structure and key components of such a policy:
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
            1. Shipping Locations
          </Typography>
          <Typography paragraph>
            All over the Country
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
            2. When would my Item be Delivered to me?
          </Typography>
          <Typography paragraph>
            Following your selection of items and checkout, you will be asked to choose a delivery time period for your order. Item are delivered on after 3-5 days and time specified by the customer . It is possible that we will not be able to deliver your purchase in time (maybe due to some unpredicted issues)
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
            3. What are the shipping charges?
          </Typography>
          <Typography paragraph>
            Besed on Delivery Location.
          </Typography>
          <Typography paragraph>
            Distinguish between domestic and international shipping.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
            4. I need to return an order; how would I organize a get it collect by yours side?
          </Typography>
          <Typography paragraph>
            Returns are not accepted for anything purchased from the mizorpaymart.com online store. We provide complete product replacement for items that may be harmed during shipping. As soon as our customer service team confirms the damage through phone or email correspondence, replacement orders are made.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
            5. Does mizorpaymart.com delivers internationally?
          </Typography>
          <Typography paragraph>
            No
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ShippingandDeliveryPolicy;