# Apple Pay with CardPointe Integration

This is a Node.js application that demonstrates how to integrate Apple Pay with the CardPointe payment gateway.

## Prerequisites

- Node.js and npm installed
- Apple Developer Account
- Apple Pay Merchant ID
- CardPointe merchant account and API credentials

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `certs` directory in the project root:
   ```
   mkdir certs
   ```

3. Place your Apple Pay merchant certificates in the `certs` directory:
   - `merchant_id.pem` - Your merchant certificate
   - `merchant_id.key` - Your merchant private key

4. Update the configuration in `app.js`:
   - Replace `merchant.your.domain.id` with your actual Apple Pay merchant ID
   - Replace CardPointe API credentials with your actual credentials

5. Start the server:
   ```
   npm start
   ```

## Apple Pay Requirements

- The website must be served over HTTPS
- The domain must be registered with Apple for Apple Pay
- For testing locally, you can use tools like ngrok to create a secure tunnel

## Implementation Details

- The frontend uses the Apple Pay JS API to create a payment session
- The backend handles merchant validation and processes payments through CardPointe
- The CardPointe gateway is used to process the Apple Pay token

## Files

- `app.js` - Main server file
- `public/index.html` - Frontend HTML
- `public/js/app.js` - Frontend JavaScript
- `certs/` - Directory for Apple Pay merchant certificates 