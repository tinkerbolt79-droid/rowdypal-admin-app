import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth'; // Use simple auth hook
import CreditCardForm from './CreditCardForm';
import BankAccountForm from './BankAccountForm';
import PaymentMethodCard from './PaymentMethodCard';
import '../global.css';

export default function PaymentMethods() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  
  // State for payment methods
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  
  // State for forms
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentType, setPaymentType] = useState('credit');
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
    bankName: '',
    accountType: 'checking',
    routingNumber: '',
    accountNumber: ''
  });
  // Validation states
  const [formErrors, setFormErrors] = useState({});

  // Fetch payment methods from Firestore
  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchPaymentMethods = async () => {
      try {
        setLoadingData(true);
        const q = query(
          collection(db, 'paymentMethods'),
          where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const methodsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPaymentMethods(methodsData);
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        setError('Failed to fetch payment methods. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchPaymentMethods();
  }, [currentUser, loading, navigate]);

  const validateField = (fieldName, value) => {
    let errorMessage = '';
    
    switch(fieldName) {
    case 'name':
      if (value && value.trim().length < 3) {
        errorMessage = 'Cardholder name must be at least 3 characters long';
      }
      break;
        
    case 'number':
      if (value) {
        const cleanCardNumber = value.replace(/\s+/g, '');
        if (cleanCardNumber.length > 0 && cleanCardNumber.length < 13) {
          errorMessage = 'Credit card numbers must be at least 13 digits';
        } else if (cleanCardNumber.length >= 13 && !isValidCreditCard(cleanCardNumber)) {
          errorMessage = 'Please enter a valid credit card number';
        }
      }
      break;

    case 'expiry':
      if (value && !isValidExpiryDate(value)) {
        errorMessage = 'Please enter a valid expiry date in MM/YY format';
      }
      break;
        
    case 'cvv':
      if (value && !isValidCVV(value)) {
        errorMessage = 'CVV must be 3 or 4 digits';
      }
      break;
        
    default:
      break;
    }
    
    // Only update error if there's a new error or clearing an existing one
    if (errorMessage || formErrors[fieldName]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        if (errorMessage) {
          newErrors[fieldName] = errorMessage;
        } else {
          delete newErrors[fieldName];
        }
        return newErrors;
      });
    }
  };
  
  const validateBankField = (fieldName, value) => {
    let errorMessage = '';
    
    switch(fieldName) {
    case 'bankName':
      if (value && value.trim().length < 2) {
        errorMessage = 'Bank name must be at least 2 characters long';
      }
      break;
        
    case 'routingNumber':
      if (value && value.length > 0 && value.length < 9) {
        errorMessage = 'Routing number must be 9 digits';
      } else if (value && value.length === 9 && !/^\d{9}$/.test(value)) {
        errorMessage = 'Routing number must contain only digits';
      }
      break;
        
    case 'accountNumber':
      if (value && value.length > 0 && (value.length < 6 || value.length > 17)) {
        errorMessage = 'Account number must be between 6 and 17 digits';
      } else if (value && !/^\d+$/.test(value)) {
        errorMessage = 'Account number must contain only digits';
      }
      break;
        
    default:
      break;
    }
    
    // Only update error if there's a new error or clearing an existing one
    if (errorMessage || formErrors[fieldName]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        if (errorMessage) {
          newErrors[fieldName] = errorMessage;
        } else {
          delete newErrors[fieldName];
        }
        return newErrors;
      });
    }
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setFormData({
      name: '',
      number: '',
      expiry: '',
      cvv: '',
      bankName: '',
      accountType: 'checking',
      routingNumber: '',
      accountNumber: ''
    });
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Reset form errors
    setFormErrors({});
    const errors = {};
    try {
      // Validate form data based on payment type
      if (paymentType === 'credit') {
        // Validate credit card fields
        if (!formData.name) {
          errors.name = 'Cardholder name is required';
        } else if (formData.name.trim().length < 3) {
          errors.name = 'Cardholder name must be at least 3 characters long';
        }
        
        if (!formData.number) {
          errors.number = 'Card number is required';
        } else {
          const cleanCardNumber = formData.number.replace(/\s+/g, '');
          if (!isValidCreditCard(cleanCardNumber)) {
            errors.number = 'Please enter a valid credit card number';
          }
        }
        
        if (!formData.expiry) {
          errors.expiry = 'Expiry date is required';
        } else if (!isValidExpiryDate(formData.expiry)) {
          errors.expiry = 'Please enter a valid expiry date in MM/YY format';
        }
        
        // Validate CVV if provided
        if (formData.cvv && !isValidCVV(formData.cvv)) {
          errors.cvv = 'CVV must be 3 or 4 digits';
        }
      } else {
        // Validate bank account fields
        if (!formData.bankName) {
          errors.bankName = 'Bank name is required';
        }
        
        if (!formData.routingNumber) {
          errors.routingNumber = 'Routing number is required';
        } else if (!/^\d{9}$/.test(formData.routingNumber)) {
          errors.routingNumber = 'Routing number must be 9 digits';
        }
        
        if (!formData.accountNumber) {
          errors.accountNumber = 'Account number is required';
        } else if (!/^\d{6,17}$/.test(formData.accountNumber)) {
          errors.accountNumber = 'Account number must be between 6 and 17 digits';
        }
      }
      
      // If there are validation errors, set them and return
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setError('Please fix the errors below');
        return;
      }
      
      // Add new payment method
      const paymentData = {
        userId: currentUser.uid,
        type: paymentType,
        isPrimary: paymentMethods.length === 0, // First payment method is primary by default
        ...formData,
        createdAt: new Date()
      };
      
      // Remove unused fields based on payment type
      if (paymentType === 'credit') {
        delete paymentData.bankName;
        delete paymentData.accountType;
        delete paymentData.routingNumber;
        delete paymentData.accountNumber;
      } else {
        delete paymentData.name;
        delete paymentData.number;
        delete paymentData.expiry;
        delete paymentData.cvv;
      }
      
      const docRef = await addDoc(collection(db, 'paymentMethods'), paymentData);
      
      setPaymentMethods(prev => [
        ...prev,
        { 
          id: docRef.id, ...paymentData
        }
      ]);
      
      // Reset form
      setShowAddForm(false);
      setFormData({
        name: '',
        number: '',
        expiry: '',
        cvv: '',
        bankName: '',
        accountType: 'checking',
        routingNumber: '',
        accountNumber: ''
      });
    } catch (err) {
      console.error('Error saving payment method:', err);
      setError('Failed to save payment method. Please try again.');
    }
  };

  const handleDelete = async (paymentMethodId) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        await deleteDoc(doc(db, 'paymentMethods', paymentMethodId));
        setPaymentMethods(prev => prev.filter(method => method.id !== paymentMethodId));
      } catch (err) {
        console.error('Error deleting payment method:', err);
        setError('Failed to delete payment method. Please try again.');
      }
    }
  };

  // Set a payment method as primary
  const setAsPrimary = async (paymentMethodId) => {
    try {
      // First, unset all other payment methods as primary
      const updatedMethods = paymentMethods.map(method => {
        if (method.id !== paymentMethodId && method.isPrimary) {
          // Update in Firestore
          const paymentMethodRef = doc(db, 'paymentMethods', method.id);
          updateDoc(paymentMethodRef, { isPrimary: false });
          return { ...method, isPrimary: false };
        }
        return method;
      });
      
      // Then set the selected payment method as primary
      const paymentMethodRef = doc(db, 'paymentMethods', paymentMethodId);
      await updateDoc(paymentMethodRef, { isPrimary: true });
      
      // Update local state
      setPaymentMethods(
        updatedMethods.map(method => 
          method.id === paymentMethodId 
            ? { ...method, isPrimary: true } 
            : method
        )
      );
    } catch (err) {
      console.error('Error setting primary payment method:', err);
      setError('Failed to set primary payment method. Please try again.');
    }
  };

  // Mask sensitive data for display
  const maskCardNumber = (number) => {
    if (!number) return '';
    return `**** **** **** ${number.slice(-4)}`;
  };

  const maskAccountNumber = (number) => {
    if (!number) return '';
    return `****${number.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="payments-container">
        <div className="payments-header">
          <h2>Payment Types</h2>
        </div>
        <p>Loading payment methods...</p>
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="payments-container">
      <div className="payments-header">
        <h2>Payment Types</h2>
        <button className="btn-primary" onClick={handleAddNew}>
          Add Payment
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showAddForm && (
        <div className="payment-form-container">
          <h3>Add New Payment Method</h3>
          <div className="form-group">
            <label>Payment Type</label>
            <div className="payment-type-selector">
              <button
                type="button"
                className={`payment-type-btn ${paymentType === 'credit' ? 'selected' : ''}`}
                onClick={() => setPaymentType('credit')}
              >
                Credit/Debit Card
              </button>
              <button
                type="button"
                className={`payment-type-btn ${paymentType === 'bank' ? 'selected' : ''}`}
                onClick={() => setPaymentType('bank')}
              >
                Bank Account
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {paymentType === 'credit' ? (
              <CreditCardForm 
                formData={formData} 
                setFormData={setFormData} 
                formErrors={formErrors} 
                validateField={validateField}
              />
            ) : (
              <BankAccountForm 
                formData={formData} 
                setFormData={setFormData} 
                formErrors={formErrors} 
                validateBankField={validateBankField}
              />
            )}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={cancelForm}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
              >
                Add Payment Method
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="payment-methods-list">
        {paymentMethods.length === 0 ? (
          <p className="no-payments">No payment methods found. Add your first payment method!</p>
        ) : (
          <>
            <h3>Saved Payment Types</h3>
            <div className="payment-methods-grid">
              {paymentMethods.map(method => (
                <PaymentMethodCard 
                  key={method.id}
                  method={method}
                  maskCardNumber={maskCardNumber}
                  maskAccountNumber={maskAccountNumber}
                  setAsPrimary={setAsPrimary}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Credit card validation functions
const isValidCreditCard = (cardNumber) => {
  // Remove all non-digit characters
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // Check if it's a valid length
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }
  
  // Luhn algorithm implementation
  let sum = 0;
  let isEven = false;
  
  // Loop through values starting from the rightmost side
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i));
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

const isValidExpiryDate = (expiry) => {
  // Check format (MM/YY)
  const regex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
  const match = expiry.match(regex);
  
  if (!match) {
    return false;
  }
  
  const month = parseInt(match[1]);
  const year = parseInt(match[2]);
  
  // Get current date
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  
  // Check if the card is expired
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }
  
  // Check if the expiration date is too far in the future (more than 10 years)
  if (year > currentYear + 10) {
    return false;
  }
  
  return true;
};

const isValidCVV = (cvv) => {
  // CVV should be 3 or 4 digits
  return /^\d{3,4}$/.test(cvv);
};