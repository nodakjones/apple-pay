document.addEventListener('DOMContentLoaded', () => {
    const statusElement = document.getElementById('status');
    const applePayButton = document.getElementById('apple-pay-button');
    const applePayButtonFallback = document.getElementById('apple-pay-button-fallback');
    const checkAvailabilityButton = document.getElementById('check-availability');
    const debugInfoElement = document.getElementById('debug-info');
    const debugModeCheckbox = document.getElementById('debug-mode');
    const amountInput = document.getElementById('amount');
    
    // Debug mode toggle
    debugModeCheckbox.addEventListener('change', () => {
        debugInfoElement.style.display = debugModeCheckbox.checked ? 'block' : 'none';
    });
    
    // Log to both console and debug info element
    function logDebug(message, data = null) {
        const timestamp = new Date().toISOString();
        let logMessage = `${timestamp}: ${message}`;
        
        if (data) {
            console.log(message, data);
            logMessage += '\n' + JSON.stringify(data, null, 2);
        } else {
            console.log(message);
        }
        
        debugInfoElement.textContent = logMessage + '\n\n' + debugInfoElement.textContent;
    }
    
    // Check Apple Pay availability
    checkAvailabilityButton.addEventListener('click', checkApplePayAvailability);
    
    function checkApplePayAvailability() {
        logDebug('Checking Apple Pay availability...');
        
        if (!window.ApplePaySession) {
            showStatus('Apple Pay is not available. This browser does not support Apple Pay.', 'error');
            logDebug('ApplePaySession is not defined - browser does not support Apple Pay');
            return;
        }
        
        if (!ApplePaySession.canMakePayments()) {
            showStatus('Apple Pay is not available. This device is not configured for Apple Pay.', 'error');
            logDebug('ApplePaySession.canMakePayments() returned false');
            return;
        }
        
        // Check if the device can make payments with specific networks
        ApplePaySession.canMakePaymentsWithActiveCard('merchant.your.domain.id').then((canMakePayments) => {
            if (canMakePayments) {
                showStatus('Apple Pay is available and ready to use!', 'success');
                logDebug('Device can make payments with Apple Pay');
                setupApplePayButton();
            } else {
                showStatus('Apple Pay is available, but no active cards are set up.', 'info');
                logDebug('Device supports Apple Pay but has no active cards');
                setupApplePayButton();
            }
        }).catch(error => {
            showStatus('Error checking Apple Pay capability: ' + error.message, 'error');
            logDebug('Error in canMakePaymentsWithActiveCard', error);
        });
    }
    
    function setupApplePayButton() {
        applePayButton.style.display = 'block';
        applePayButtonFallback.style.display = 'none';
        
        // Clear any existing button
        applePayButton.innerHTML = '';
        
        // Create Apple Pay button
        const applePayButtonElement = ApplePaySession.create({
            buttonType: 'buy',
            buttonColor: 'black'
        });
        applePayButton.appendChild(applePayButtonElement);
        
        // Add click event to the Apple Pay button
        applePayButton.addEventListener('click', startApplePay);
        
        logDebug('Apple Pay button created and displayed');
    }
    
    function startApplePay() {
        // Get amount from input
        const amount = amountInput.value || '1.00';
        logDebug(`Starting Apple Pay session with amount: ${amount}`);
        
        // Define the payment request
        const paymentRequest = {
            countryCode: 'US',
            currencyCode: 'USD',
            supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
            merchantCapabilities: ['supports3DS'],
            total: {
                label: 'Your Company Name',
                amount: amount
            }
        };
        
        logDebug('Payment request created', paymentRequest);
        
        // Create a new payment session
        const session = new ApplePaySession(6, paymentRequest);
        
        // Handle merchant validation
        session.onvalidatemerchant = async (event) => {
            logDebug('Merchant validation requested', { validationURL: event.validationURL });
            showStatus('Validating merchant...', 'info');
            
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
                
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                
                const merchantSession = await response.json();
                logDebug('Merchant validation successful', merchantSession);
                showStatus('Merchant validated successfully', 'info');
                session.completeMerchantValidation(merchantSession);
            } catch (error) {
                logDebug('Merchant validation failed', error);
                showStatus('Merchant validation failed: ' + error.message, 'error');
                session.abort();
            }
        };
        
        // Handle payment authorization
        session.onpaymentauthorized = async (event) => {
            logDebug('Payment authorized by user', { 
                token: event.payment.token,
                billingContact: event.payment.billingContact,
                shippingContact: event.payment.shippingContact
            });
            showStatus('Processing payment...', 'info');
            
            try {
                // Send the payment token to your server
                const response = await fetch('/process-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        token: event.payment.token
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                
                const result = await response.json();
                logDebug('Payment processing result', result);
                
                if (result.status === 'success') {
                    session.completePayment(ApplePaySession.STATUS_SUCCESS);
                    showStatus('Payment successful!', 'success');
                } else {
                    session.completePayment(ApplePaySession.STATUS_FAILURE);
                    showStatus('Payment failed: ' + result.message, 'error');
                }
            } catch (error) {
                logDebug('Payment processing failed', error);
                session.completePayment(ApplePaySession.STATUS_FAILURE);
                showStatus('Payment processing failed: ' + error.message, 'error');
            }
        };
        
        // Handle cancellation
        session.oncancel = (event) => {
            logDebug('Payment cancelled by user');
            showStatus('Payment cancelled', 'info');
        };
        
        // Begin the session
        logDebug('Beginning Apple Pay session');
        session.begin();
    }
    
    function showStatus(message, type) {
        statusElement.textContent = message;
        statusElement.className = type;
        logDebug(`Status updated: ${message} (${type})`);
    }
    
    // Initial check
    logDebug('Page loaded, checking basic Apple Pay support');
    if (window.ApplePaySession) {
        logDebug('ApplePaySession is available');
    } else {
        logDebug('ApplePaySession is not available');
        showStatus('Apple Pay is not supported in this browser. Please use Safari on macOS or iOS.', 'error');
    }
}); 