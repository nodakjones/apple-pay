# Apple Pay with CardPointe Integration

This is a Node.js application that demonstrates how to integrate Apple Pay with the CardPointe payment gateway.

## Prerequisites

- Node.js and npm installed
- Apple Developer Account
- Apple Pay Merchant ID
- CardPointe merchant account and API credentials
- macOS with Safari for testing (Apple Pay requires Safari on macOS or iOS devices)

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
   - Replace `Your Store Name` with your actual store name
   - Replace CardPointe API credentials with your actual credentials (if not using test credentials)

5. Start the server:
   ```
   npm start
   ```

## Apple Pay Merchant Validation Setup

### 1. Register for an Apple Developer Account
- Sign up at [developer.apple.com](https://developer.apple.com)
- Enroll in the Apple Developer Program

### 2. Register Your Domain with Apple
- Log in to your Apple Developer account
- Go to Certificates, Identifiers & Profiles
- Select Merchant IDs from the Identifiers section
- Create a new Merchant ID or select an existing one
- Add your domain to the list of domains in the Apple Pay Processing section

### 3. Create a Merchant Identity Certificate
- In your Merchant ID settings, click "Create Certificate" under Apple Pay Processing
- Follow the instructions to create a Certificate Signing Request (CSR) using Keychain Access on macOS
- Upload the CSR to Apple
- Download the generated certificate

### 4. Convert the Certificate for Use with Node.js
- Convert the downloaded certificate to PEM format:
  ```
  openssl x509 -inform der -in merchant_id.cer -out merchant_id.pem
  ```
- Export your private key from Keychain Access in p12 format
- Convert the private key to PEM format:
  ```
  openssl pkcs12 -in merchant_id.p12 -nocerts -out merchant_id.key
  ```

### 5. Domain Verification with ngrok
- Download the domain verification file from your Apple Developer account
  - In your Merchant ID settings, click on "Download" next to your domain
  - This downloads a file named `apple-developer-merchantid-domain-association` (no file extension)

- Create the required directory structure in your project:
  ```
  mkdir -p public/.well-known
  ```

- Place the verification file in the correct location:
  ```
  cp /path/to/downloaded/apple-developer-merchantid-domain-association public/.well-known/
  ```

- Start your server and ngrok:
  ```
  npm start
  # In a separate terminal
  ngrok http 3000
  ```

- Copy the HTTPS URL provided by ngrok (e.g., `https://a1b2c3d4.ngrok.io`)

- Register this ngrok URL in your Apple Developer account:
  - Go to your Merchant ID settings
  - Add the ngrok URL as a new domain (or update an existing one)
  - Click "Verify Domain"

- Apple will attempt to access `https://your-ngrok-domain/.well-known/apple-developer-merchantid-domain-association`
- If everything is set up correctly, the domain should verify successfully

- **Note**: Each time you restart ngrok, you'll get a new URL and will need to update it in your Apple Developer account

## Testing Requirements

- **Browser/OS Requirements**: Apple Pay can only be tested on Safari (macOS) or iOS devices
- **HTTPS Required**: Apple Pay requires a secure connection
  - For local testing, use tools like [ngrok](https://ngrok.com/) to create a secure tunnel:
    ```
    ngrok http 3000
    ```
  - Update your domain in the Apple Developer portal with the ngrok URL
- **Test Cards**: In the Apple Pay sandbox, you can use test cards provided by Apple
- **CardPointe Test Environment**: The application is configured to use CardPointe's test environment (UAT)

## Implementation Details

- The frontend uses the Apple Pay JS API to create a payment session
- The backend handles merchant validation and processes payments through CardPointe
- The merchant validation process:
  1. When a user initiates Apple Pay, Apple sends a validation URL to your frontend
  2. Your frontend sends this URL to your backend
  3. Your backend makes a request to this URL with your merchant credentials
  4. Apple validates your merchant identity and returns a session object
  5. You send this session object back to the frontend to complete the validation
- The CardPointe gateway is used to process the Apple Pay token

## Files

- `app.js` - Main server file
- `public/index.html` - Frontend HTML
- `public/js/app.js` - Frontend JavaScript
- `certs/` - Directory for Apple Pay merchant certificates
- `public/.well-known/` - Directory for Apple Pay domain verification 