import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';

// Initialize Stripe
const stripePromise = loadStripe('your_publishable_key_here');

// Card element styles
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#aab7c4'
      },
      padding: '10px 12px',
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#9e2146'
    }
  },
  hidePostalCode: true
};

// Payment Form Content Component
const PaymentFormContent = ({ bookingDetails, onClose, onPaymentComplete }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    
    if (!billingDetails.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!billingDetails.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(billingDetails.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingDetails(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Create payment intent on your server
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: bookingDetails.price,
          currency: 'usd',
          booking_id: bookingDetails.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm card payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: billingDetails.name,
            email: billingDetails.email,
          },
        },
      });

      if (error) {
        setPaymentError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        setPaymentSuccess(true);
        onPaymentComplete({
          status: 'success',
          transactionId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          paymentMethod: paymentIntent.payment_method,
        });
        setTimeout(() => onClose(), 2000);
      }
    } catch (err) {
      setPaymentError('Payment processing failed. Please try again.');
      console.error('Payment Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Booking Summary Card */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Booking Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {bookingDetails?.accommodationName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check-in: {new Date(bookingDetails?.checkInDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check-out: {new Date(bookingDetails?.checkOutDate).toLocaleDateString()}
              </Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Total: ${bookingDetails?.price.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>

          {/* Billing Details Form */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={billingDetails.name}
                onChange={handleInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={billingDetails.email}
                onChange={handleInputChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          {/* Card Element */}
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              mb: 2,
            }}
          >
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCardIcon color="action" />
              <Typography variant="body2" color="text.secondary">
                Card Information
              </Typography>
            </Box>
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </Box>

          {/* Success Message */}
          {paymentSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Payment processed successfully!
            </Alert>
          )}

          {/* Error Message */}
          {paymentError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {paymentError}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          disabled={isProcessing}
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isProcessing || !stripe}
          startIcon={isProcessing ? <CircularProgress size={20} /> : null}
        >
          {isProcessing ? 'Processing...' : `Pay $${bookingDetails?.price.toFixed(2)}`}
        </Button>
      </DialogActions>
    </form>
  );
};

// Main Payment Form Component
const PaymentForm = ({ open, onClose, bookingDetails, onPaymentComplete }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Payment Details
        </Typography>
      </DialogTitle>
      <Elements stripe={stripePromise}>
        <PaymentFormContent
          bookingDetails={bookingDetails}
          onClose={onClose}
          onPaymentComplete={onPaymentComplete}
        />
      </Elements>
    </Dialog>
  );
};

export default PaymentForm;