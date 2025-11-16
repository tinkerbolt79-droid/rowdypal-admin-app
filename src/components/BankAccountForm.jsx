import React from 'react';

export default function BankAccountForm({ formData, setFormData, formErrors, validateBankField }) {
  const handleBankNameChange = (e) => {
    let { value } = e.target;
    setFormData(prev => ({ ...prev, bankName: value }));
    // Real-time validation for bank name
    validateBankField('bankName', value);
  };

  const handleRoutingNumberChange = (e) => {
    let { value } = e.target;
    // Remove all non-digit characters
    value = value.replace(/\D/g, '');
    // Limit to max 9 digits
    if (value.length > 9) {
      value = value.substring(0, 9);
    }
    setFormData(prev => ({ ...prev, routingNumber: value }));
    // Real-time validation for routing number
    validateBankField('routingNumber', value);
  };

  const handleAccountNumberChange = (e) => {
    let { value } = e.target;
    // Remove all non-digit characters
    value = value.replace(/\D/g, '');
    // Limit to max 17 digits
    if (value.length > 17) {
      value = value.substring(0, 17);
    }
    setFormData(prev => ({ ...prev, accountNumber: value }));
    // Real-time validation for account number
    validateBankField('accountNumber', value);
  };

  return (
    <>
      <div className="form-group">
        <label>Bank Name *</label>
        <input
          type="text"
          name="bankName"
          value={formData.bankName}
          onChange={handleBankNameChange}
          className={formErrors.bankName ? 'error-input' : ''}
          required
        />
        {formErrors.bankName && <div className="error-text">{formErrors.bankName}</div>}
      </div>

      <div className="form-group">
        <label>Account Type</label>
        <div className="account-type-selector">
          <button
            type="button"
            className={`account-type-btn ${formData.accountType === 'checking' ? 'selected' : ''}`}
            onClick={() => setFormData({ ...formData, accountType: 'checking' })}
          >
            Checking
          </button>
          <button
            type="button"
            className={`account-type-btn ${formData.accountType === 'savings' ? 'selected' : ''}`}
            onClick={() => setFormData({ ...formData, accountType: 'savings' })}
          >
            Savings
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Routing Number *</label>
        <input
          type="text"
          name="routingNumber"
          value={formData.routingNumber}
          onChange={handleRoutingNumberChange}
          className={formErrors.routingNumber ? 'error-input' : ''}
          required
        />
        <div className="helper-text">9 digits</div>
        {formErrors.routingNumber && <div className="error-text">{formErrors.routingNumber}</div>}
      </div>

      <div className="form-group">
        <label>Account Number *</label>
        <input
          type="text"
          name="accountNumber"
          value={formData.accountNumber}
          onChange={handleAccountNumberChange}
          className={formErrors.accountNumber ? 'error-input' : ''}
          required
        />
        <div className="helper-text">6-17 digits</div>
        {formErrors.accountNumber && <div className="error-text">{formErrors.accountNumber}</div>}
      </div>
    </>
  );
}