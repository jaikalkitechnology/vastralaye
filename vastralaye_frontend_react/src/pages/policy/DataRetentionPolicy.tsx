import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const DataRetentionPolicy: React.FC = () => {
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
          Data Retention Policy for E-Commerce
        </Typography>

        <Box sx={{ lineHeight: 1.8 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
            Purpose of the Policy
          </Typography>
          <Typography paragraph>
            To define the guidelines for storing, managing, and securely disposing of customer and business-related data in compliance with Indian laws, including the Information Technology (IT) Act, 2000, and other applicable regulations.
          </Typography>

          <Typography paragraph>
            A data retention policy for an e-commerce website in India needs to align with Indian laws and regulations, including privacy and cybersecurity requirements. Below is a comprehensive guideline for drafting a data retention policy:
          </Typography>

          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4, mb: 3 }}>
            Data Retention Policy for E-Commerce Website in India
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
            Purpose of the Policy
          </Typography>
          <Typography paragraph>
            To define the guidelines for storing, managing, and securely disposing of customer and business-related data in compliance with Indian laws, including the Information Technology (IT) Act, 2000, and other applicable regulations.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
            Scope
          </Typography>
          <Typography paragraph>
            This policy applies to all data collected, processed, and stored by the e-commerce platform, including customer data, employee data, transaction records, and system logs.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
            Key Components of the Data Retention Policy
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            1. Types of Data Collected
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" paragraph>Customer Data: Name, address, phone number, email ID, payment details, purchase history, etc.</Typography>
            <Typography component="li" paragraph>Transactional Data: Order details, invoices, payment records.</Typography>
            <Typography component="li" paragraph>System Logs: User login/logout details, IP addresses, cookies, and session information.</Typography>
            <Typography component="li" paragraph>Marketing Data: Customer preferences, survey responses, and promotional data.</Typography>
          </Box>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            2. Retention Periods
          </Typography>
          <Typography paragraph>
            Retention periods are defined based on the type of data and its purpose:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" paragraph>
              Customer Data: Retained for as long as the customer account is active or as required to provide services (up to 5 years post-account closure, in line with legal requirements like the Income Tax Act and anti-money laundering laws).
            </Typography>
            <Typography component="li" paragraph>
              Transaction Records: Retained for at least 8 years, as per the Companies Act, 2013, and GST regulations.
            </Typography>
            <Typography component="li" paragraph>
              System Logs: Retained for 180 days as mandated by the Indian IT Act and associated rules.
            </Typography>
            <Typography component="li" paragraph>
              Marketing Data: Retained until the customer opts out or withdraws consent.
            </Typography>
            <Typography component="li" paragraph>
              Employee Data: Retained as per employment laws and HR policies (up to 7 years post-employment).
            </Typography>
          </Box>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            3. Data Minimization
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" paragraph>Collect only necessary data to fulfill the purpose for which it is collected.</Typography>
            <Typography component="li" paragraph>Avoid collecting sensitive personal data unless absolutely required.</Typography>
          </Box>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            4. Data Storage and Security
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" paragraph>Encrypt sensitive personal data and payment information.</Typography>
            <Typography component="li" paragraph>Store data on servers located in compliance with local data localization requirements, such as the RBI guidelines for payment data.</Typography>
            <Typography component="li" paragraph>Implement access controls to restrict unauthorized access.</Typography>
          </Box>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            5. Legal and Regulatory Compliance
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" paragraph>Comply with the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.</Typography>
            <Typography component="li" paragraph>Adhere to sector-specific regulations like those from the Reserve Bank of India (RBI) for financial transactions.</Typography>
            <Typography component="li" paragraph>Ensure compliance with the upcoming Digital Personal Data Protection Act, 2023 (DPDP Act).</Typography>
          </Box>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            6. Disposal of Data
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" paragraph>Delete or anonymize data that is no longer needed for legal, regulatory, or business purposes.</Typography>
            <Typography component="li" paragraph>Ensure secure deletion methods, such as data wiping or shredding, to prevent unauthorized recovery.</Typography>
          </Box>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            7. Customer Rights
          </Typography>
          <Typography paragraph>
            Provide customers the right to:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" paragraph>Access their data.</Typography>
            <Typography component="li" paragraph>Correct inaccuracies in their data.</Typography>
            <Typography component="li" paragraph>Request deletion of their data, subject to legal constraints.</Typography>
            <Typography component="li" paragraph>Withdraw consent for marketing communications.</Typography>
          </Box>

          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
            8. Policy Review and Updates
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" paragraph>The policy will be reviewed annually or when significant regulatory changes occur.</Typography>
            <Typography component="li" paragraph>Communicate updates to customers and employees.</Typography>
          </Box>

          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
            Penalties for Non-Compliance
          </Typography>
          <Typography paragraph>
            Failure to comply with this policy may result in legal penalties, including fines under the IT Act, DPDP Act, and other applicable laws.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
            Conclusion
          </Typography>
          <Typography paragraph>
            This data retention policy ensures compliance with Indian regulations while protecting customer privacy and maintaining trust. Regular audits and updates are essential to ensure its effectiveness.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DataRetentionPolicy;