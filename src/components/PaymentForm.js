import React, { useState } from 'react';
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
import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';

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

const PaymentForm = ({ 
  open = false, 
  onClose = () => {}, 
  bookingDetails = {
    price: 0,
    accommodationName: '',
    checkInDate: new Date(),
    checkOutDate: new Date()
  }, 
  onPaymentComplete = () => {} 
}) => {
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

  // Format price safely
  const formattedPrice = typeof bookingDetails?.price === 'number' 
    ? bookingDetails.price.toFixed(2) 
    : '0.00';

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingDetails(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

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
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
        billing_details: {
          name: billingDetails.name,
          email: billingDetails.email,
        },
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPaymentSuccess(true);
      onPaymentComplete({
        status: 'success',
        transactionId: paymentMethod.id,
        amount: bookingDetails.price,
        paymentMethod: paymentMethod,
      });

      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setPaymentError(err.message);
      console.error('Payment Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Safely format dates
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Payment Details
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Booking Summary */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Booking Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {bookingDetails?.accommodationName || 'No accommodation specified'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check-in: {formatDate(bookingDetails?.checkInDate)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check-out: {formatDate(bookingDetails?.checkOutDate)}
                </Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Total: ${formattedPrice}
                </Typography>
              </CardContent>
            </Card>

            {/* Rest of the form remains the same */}
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

            {/* Messages */}
            {paymentSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Payment processed successfully!
              </Alert>
            )}
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
            {isProcessing ? 'Processing...' : `Pay $${formattedPrice}`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PaymentForm;