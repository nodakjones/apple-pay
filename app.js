const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Apple Pay merchant validation endpoint
app.post('/validate-merchant', async (req, res) => {
  try {
    const { validationURL, domainName } = req.body;
    
    // You'll need to replace these with your actual merchant credentials
    const merchantId = 'merchant.your.domain.id';
    const merchantCertPath = path.join(__dirname, 'certs', 'merchant_id.pem');
    const merchantKeyPath = path.join(__dirname, 'certs', 'merchant_id.key');
    
    // TODO: Implement merchant validation with Apple
    // This typically involves sending the validationURL to Apple's servers
    // along with your merchant certificate
    
    // For now, we'll return a placeholder response
    res.json({ status: 'success', message: 'Merchant validated' });
  } catch (error) {
    console.error('Merchant validation error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Process Apple Pay payment
app.post('/process-payment', async (req, res) => {
  try {
    const { token } = req.body;
    
    // CardPointe API credentials
    const cardPointeApiUrl = 'https://fts-uat.cardconnect.com/cardconnect/rest/auth';
    const cardPointeMerchantId = '000000927997';
    const cardPointeUsername = 'testing';
    const cardPointePassword = 'testing123';
    
    // Extract the payment data from the Apple Pay token
    // The structure of the token follows Apple's documentation
    const paymentData = token.paymentData;
    
    // Format the request for CardPointe according to their Apple Pay documentation
    // https://developer.fiserv.com/product/CardPointe/docs/?path=docs/documentation/ApplePayDeveloperGuide.md
    const paymentRequest = {
      merchid: cardPointeMerchantId,
      amount: '1.00', // Replace with actual amount
      currency: 'USD',
      orderid: `order-${Date.now()}`,
      
      // The Apple Pay token needs to be properly formatted for CardPointe
      // According to CardPointe docs, we need to include the entire payment data
      token: JSON.stringify(paymentData),
      tokentype: 'APPLEPAY',
      
      // Additional fields required by CardPointe
      name: token.billingContact ? `${token.billingContact.givenName} ${token.billingContact.familyName}` : 'Apple Pay Customer',
      capture: 'Y', // Set to 'Y' to capture the payment immediately, or 'N' for authorization only
      
      // Optional fields
      ecomind: 'E', // E-commerce indicator
      cvv2: '',     // Not applicable for Apple Pay
      expiry: ''    // Not needed as it's included in the token
    };
    
    console.log('Sending payment request to CardPointe:', JSON.stringify(paymentRequest, null, 2));
    
    // Make the request to CardPointe
    const response = await axios.post(cardPointeApiUrl, paymentRequest, {
      auth: {
        username: cardPointeUsername,
        password: cardPointePassword
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('CardPointe response:', response.data);
    
    // Check the response from CardPointe
    if (response.data.respstat === 'A') {
      // Approved
      res.json({
        status: 'success',
        message: 'Payment approved',
        transaction: response.data
      });
    } else {
      // Declined or error
      res.json({
        status: 'error',
        message: `Payment declined: ${response.data.resptext || 'Unknown error'}`,
        transaction: response.data
      });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      details: error.response ? error.response.data : null
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 