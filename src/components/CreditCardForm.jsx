import React from 'react';

const formatCardNumber = value => {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');

  // Limit to max 19 digits (maximum for most credit cards)
  const limited = cleaned.substring(0, 19);

  // Format as groups of 4 digits
  const match = limited.match(
    /^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,3})$/
  );

  if (!match) return value;

  // Build formatted string with spaces
  let formatted = match[1];
  if (match[2]) formatted += ' ' + match[2];
  if (match[3]) formatted += ' ' + match[3];
  if (match[4]) formatted += ' ' + match[4];
  if (match[5]) formatted += ' ' + match[5];

  return formatted;
};

const getCardType = cardNumber => {
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');

  // Define card patterns
  const cards = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$/,
    amex: /^3[47][0-9]{13}$/,
    diners: /^3[0689][0-9]{12}$/,
    discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
  };

  // Check card type
  for (let card in cards) {
    if (cards[card].test(cleaned)) {
      return card.charAt(0).toUpperCase() + card.slice(1);
    }
  }

  return null;
};

export default function CreditCardForm({
  formData,
  setFormData,
  formErrors,
  validateField,
}) {
  const handleCardholderNameChange = e => {
    let { value } = e.target;
    // Allow only letters, spaces, hyphens, and apostrophes
    value = value.replace(/[^a-zA-Z\s\-']/g, '');
    setFormData(prev => ({ ...prev, name: value }));
    // Real-time validation for cardholder name
    validateField('name', value);
  };

  const handleCardNumberChange = e => {
    const formatted = formatCardNumber(e.target.value);
    setFormData(prev => ({ ...prev, number: formatted }));
    // Real-time validation for card number
    validateField('number', formatted);
  };

  const handleExpiryChange = e => {
    let { value } = e.target;
    // Remove all non-digit characters
    value = value.replace(/\D/g, '');
    // Auto-add slash after 2 digits
    if (value.length >= 3) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setFormData(prev => ({ ...prev, expiry: value }));
    // Real-time validation for expiry date
    validateField('expiry', value);
  };

  const handleCVVChange = e => {
    let { value } = e.target;
    // Remove all non-digit characters
    value = value.replace(/\D/g, '');
    // Limit to max 4 digits
    if (value.length > 4) {
      value = value.substring(0, 4);
    }
    setFormData(prev => ({ ...prev, cvv: value }));
    // Real-time validation for CVV
    validateField('cvv', value);
  };

  const getCardTypeHelpText = cardNumber => {
    if (!cardNumber) {
      return 'Enter a valid credit card number (Visa, Mastercard, American Express, etc.)';
    }
    const cardType = getCardType(cardNumber);
    if (cardType) {
      return `Detected: ${cardType}. Enter the full card number.`;
    }
    // Check if it looks like a partial card number
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    if (cleaned.length > 0 && cleaned.length < 13) {
      return 'Credit card numbers typically have 13-19 digits';
    }
    return 'Enter a valid credit card number';
  };

  return (
    <>
      <div className="form-group">
        <label>Cardholder Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleCardholderNameChange}
          className={formErrors.name ? 'error-input' : ''}
          required
        />
        {formErrors.name && <div className="error-text">{formErrors.name}</div>}
      </div>

      <div className="form-group">
        <label>Card Number *</label>
        <input
          type="text"
          name="number"
          value={formData.number}
          onChange={handleCardNumberChange}
          className={formErrors.number ? 'error-input' : ''}
          placeholder="1234 5678 9012 3456"
          required
        />
        <div className="helper-text">
          {getCardTypeHelpText(formData.number)}
        </div>
        {formErrors.number && (
          <div className="error-text">{formErrors.number}</div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Expiry Date *</label>
          <input
            type="text"
            name="expiry"
            value={formData.expiry}
            onChange={handleExpiryChange}
            className={formErrors.expiry ? 'error-input' : ''}
            placeholder="MM/YY"
            required
          />
          <div className="helper-text">Format: MM/YY (e.g., 12/25)</div>
          {formErrors.expiry && (
            <div className="error-text">{formErrors.expiry}</div>
          )}
        </div>

        <div className="form-group">
          <label>CVV</label>
          <input
            type="text"
            name="cvv"
            value={formData.cvv}
            onChange={handleCVVChange}
            className={formErrors.cvv ? 'error-input' : ''}
            placeholder="123"
          />
          <div className="helper-text">3 or 4 digits</div>
          {formErrors.cvv && <div className="error-text">{formErrors.cvv}</div>}
        </div>
      </div>
    </>
  );
}
