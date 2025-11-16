import React from 'react';

export default function PaymentMethodCard({ method, maskCardNumber, maskAccountNumber, setAsPrimary, handleDelete }) {
  return (
    <div key={method.id} className={`payment-method-card ${method.isPrimary ? 'primary' : ''}`}>
      {method.type === 'credit' ? (
        <>
          <div className="card-header">
            <div>
              <h4>Credit/Debit Card</h4>
              {method.isPrimary && <span className="primary-badge">Primary</span>}
            </div>
            <div className="card-actions">
              <button 
                className="btn-primary-small"
                onClick={() => setAsPrimary(method.id)}
                disabled={method.isPrimary}
              >
                {method.isPrimary ? 'Primary' : 'Set Primary'}
              </button>
              {!method.isPrimary && (
                <button 
                  className="btn-delete-small"
                  onClick={() => handleDelete(method.id)}
                  title="Delete payment method"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="card-details">
            <p><strong>Cardholder:</strong> {method.name}</p>
            <p><strong>Card Number:</strong> {maskCardNumber(method.number)}</p>
            <p><strong>Expiry:</strong> {method.expiry}</p>
          </div>
        </>
      ) : (
        <>
          <div className="card-header">
            <div>
              <h4>Bank Account</h4>
              {method.isPrimary && <span className="primary-badge">Primary</span>}
            </div>
            <div className="card-actions">
              <button
                className="btn-primary-small"
                onClick={() => setAsPrimary(method.id)}
                disabled={method.isPrimary}
              >
                {method.isPrimary ? 'Primary' : 'Set Primary'}
              </button>
              {!method.isPrimary && (
                <button 
                  className="btn-delete-small"
                  onClick={() => handleDelete(method.id)}
                  title="Delete payment method"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="card-details">
            <p><strong>Bank:</strong> {method.bankName}</p>
            <p><strong>Account Type:</strong> {method.accountType}</p>
            <p><strong>Routing Number:</strong> {maskCardNumber(method.routingNumber)}</p>
            <p><strong>Account Number:</strong> {maskAccountNumber(method.accountNumber)}</p>
          </div>
        </>
      )}
    </div>
  );
}