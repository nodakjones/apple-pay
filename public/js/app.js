// document.addEventListener('DOMContentLoaded', () => {
// const statusElement = document.getElementById('status');
// const applePayButton = document.getElementById('apple-pay-button');
// const applePayButtonFallback = document.getElementById('apple-pay-button-fallback');
//
// // Check if Apple Pay is available
// if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
//     applePayButton.style.display = 'block';
//     applePayButtonFallback.style.display = 'none';
//
//     // Create Apple Pay button
//     const applePayButtonElement = ApplePaySession.create({
//         buttonType: 'buy',
//         buttonColor: 'black'
//     });
//     applePayButton.appendChild(applePayButtonElement);
//
//     // Add click event to the Apple Pay button
//     applePayButton.addEventListener('click', startApplePay);
// } else {
//     // Show a message if Apple Pay is not available
//     applePayButtonFallback.textContent = 'Apple Pay is not available';
//     statusElement.textContent = 'Apple Pay is not available on this device or browser.';
//     statusElement.className = 'error';
// }
//
//
//
// function showStatus(message, type) {
//     statusElement.textContent = message;
//     statusElement.className = type;
// }
// });

function startApplePay() {
    console.log('testing => ' + window.ApplePaySession);
    // Define the payment request
    const paymentRequest = {
        countryCode: 'US',
        currencyCode: 'USD',
        supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
        merchantCapabilities: ['supports3DS'],
        total: {
            label: 'Your Company Name',
            amount: '1.00' // Replace with actual amount
        }
    };

    // Create a new payment session
    const session = new ApplePaySession(6, paymentRequest);

    // Handle merchant validation
    session.onvalidatemerchant = async (event) => {
        try {
            const response = await fetch('/validate-merchant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    validationURL: event.validationURL,
                    domainName: window.location.hostname
                })
            });

            const merchantSession = await response.json();
            console.log('Merchant session data:', merchantSession);

            session.completeMerchantValidation(merchantSession);
        } catch (error) {
            console.error('Merchant validation failed:', error);
            session.abort();
            showStatus('Merchant validation failed: ' + error.message, 'error');
        }
    };

    // Handle payment authorization
    session.onpaymentauthorized = async (event) => {
        const paymentData = event.payment.token.paymentData;
        const paymentTokenize = {
                "encryptionhandler": "EC_APPLE_PAY",
                "devicedata": paymentData.data + "&ectype=apple&ecsig=" + paymentData.signature + "&eckey=" + paymentData.header.ephemeralPublicKey + "&ectid=" + paymentData.header.transactionId + "&echash=&ecpublickeyhash=" + paymentData.header.publicKeyHash,
        };

        console.log('paymentTokenize => ' + JSON.stringify(paymentTokenize))
        try {
            // Send the payment token to your server
            const response = await fetch('/tokenize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                   tokenizeRequest: paymentTokenize
                })
            });

            // console.log('tokenize => ' + response)

            const result = await response.json();
            console.log('result => ' + result)
            // if (result.status === 'success') {
            //     session.completePayment(ApplePaySession.STATUS_SUCCESS);
            //     showStatus('Payment successful!', 'success');
            // } else {
            //     session.completePayment(ApplePaySession.STATUS_FAILURE);
            //     showStatus('Payment failed: ' + result.message, 'error');
            // }
        } catch (error) {
            console.error('Payment processing failed:', error);
            session.completePayment(ApplePaySession.STATUS_FAILURE);
            showStatus('Payment processing failed: ' + error.message, 'error');
        }
    };

    // Begin the session
    session.begin();
}