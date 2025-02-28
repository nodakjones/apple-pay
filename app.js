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
    const cardPointeMerchantId = 'YOUR_MERCHANT_ID';
    const cardPointeUsername = 'YOUR_USERNAME';
    const cardPointePassword = 'YOUR_PASSWORD';
    
    // Prepare the request to CardPointe
    const paymentRequest = {
      merchid: cardPointeMerchantId,
      amount: '1.00', // Replace with actual amount
      currency: 'USD',
      orderid: `order-${Date.now()}`,
      token: token.paymentData.data, // The encrypted payment token from Apple Pay
      tokentype: 'APPLEPAY'
    };
    
    // Make the request to CardPointe
    const response = await axios.post(cardPointeApiUrl, paymentRequest, {
      auth: {
        username: cardPointeUsername,
        password: cardPointePassword
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      status: 'success',
      transaction: response.data
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 