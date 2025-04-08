import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  InputAdornment
} from '@mui/material';
import { 
  createBooking 
} from '../redux/slices/bookingSlice';
import { 
  createOrderAfterPayment,
  setPaymentSuccess 
} from '../redux/slices/PaymentSlice';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import DateRangeIcon from '@mui/icons-material/DateRange';
import LockIcon from '@mui/icons-material/Lock';

function PaymentForm({ open, onClose, bookingDetails, onPaymentComplete }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const bookingStatus = useSelector((state) => state.booking.status);
  const orderStatus = useSelector((state) => state.payment.orderStatus);
  const bookingError = useSelector((state) => state.booking.error);
  const orderError = useSelector((state) => state.payment.orderError);
  
  const [paymentData, setPaymentData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Effect to handle successful booking creation
  useEffect(() => {
    if (bookingStatus === 'succeeded' && orderStatus === 'succeeded') {
      // Both the booking and order were created successfully
      setIsProcessing(false);
      if (onPaymentComplete) {
        onPaymentComplete({
          paymentId: Math.random().toString(36).substr(2, 9), // Mock payment ID
          status: 'completed'
        });
      }
      // Signal payment success to the Redux store
      dispatch(setPaymentSuccess({
        transactionId: Math.random().toString(36).substr(2, 9),
        amount: bookingDetails.price,
        timestamp: new Date().toISOString()
      }));
    }
  }, [bookingStatus, orderStatus, dispatch, onPaymentComplete, bookingDetails]);

  // Effect to handle errors
  useEffect(() => {
    if (bookingStatus === 'failed' || orderStatus === 'failed') {
      setIsProcessing(false);
      setFormErrors({
        payment: bookingError || orderError || 'Payment processing failed'
      });
    }
  }, [bookingStatus, orderStatus, bookingError, orderError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Input validations
    if (name === 'number') {
      if (!/^\d*$/.test(value.replace(/\s/g, ''))) return;
      // Format card number with spaces
      const formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setPaymentData({
        ...paymentData,
        [name]: formattedValue
      });
      return;
    }
    
    if (name === 'expiry') {
      if (!/^\d*$/.test(value.replace('/', ''))) return;
      // Format expiry as MM/YY
      let formattedValue = value.replace(/\//g, '');
      if (formattedValue.length > 2) {
        formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2, 4);
      }
      setPaymentData({
        ...paymentData,
        [name]: formattedValue
      });
      return;
    }
    
    if (name === 'cvc' && !/^\d*$/.test(value)) {
      return;
    }
    
    setPaymentData({
      ...paymentData,
      [name]: value
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!paymentData.number || paymentData.number.replace(/\s/g, '').length < 16) {
      errors.number = 'Valid card number is required';
    }
    
    if (!paymentData.name) {
      errors.name = 'Cardholder name is required';
    }
    
    if (!paymentData.expiry || paymentData.expiry.length < 5) {
      errors.expiry = 'Valid expiry date (MM/YY) is required';
    } else {
      const [month, year] = paymentData.expiry.split('/');
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        errors.expiry = 'Month must be between 01-12';
      }
    }
    
    if (!paymentData.cvc || paymentData.cvc.length < 3) {
      errors.cvc = 'Valid security code is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatCheckInDate = (date) => {
    return date ? new Date(date).toISOString() : new Date().toISOString();
  };
  
  const formatCheckOutDate = (date) => {
    if (!date) {
      // If checkout date is missing, set it to check-in date + 1 day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString();
    }
    return new Date(date).toISOString();
  };

  const formatPrice = (price) => {
    if (!price) return "0";
    
    if (typeof price === 'object' && price.value) {
      return price.value.toString();
    }
    if (typeof price === 'string') {
      // Remove R, spaces, and commas then return as string
      return price.replace(/[R\s,]/g, '');
    }
    return price.toString();
  };

  // Get user display name or email as fallback
  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0]; // Use part before @ as name
    return "Guest"; // Fallback if no identifiable name is available
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!user || !user.uid) {
      setFormErrors({
        payment: "You must be logged in to complete this booking"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Get accommodation details with fallbacks for undefined values
      const accommodationId = bookingDetails?.accommodationId || "unknown";
      const accommodationName = bookingDetails?.accommodationName || "Accommodation";
      const numberOfGuests = bookingDetails?.numberOfGuests || 1;
      const formattedPrice = formatPrice(bookingDetails?.price);
      
      // Get user details with fallbacks
      const userId = user?.uid;
      const userEmail = user?.email || "no-email@example.com";
      const userName = getUserDisplayName();
      
      // First create the booking in Firestore - now with status 'pending' instead of 'confirmed'
      const bookingData = {
        accommodationId,
        accommodationName,
        userId,
        userEmail,
        userName,
        checkInDate: formatCheckInDate(bookingDetails?.checkInDate),
        checkOutDate: formatCheckOutDate(bookingDetails?.checkOutDate),
        numberOfGuests,
        totalPrice: formattedPrice,
        status: 'pending', // Changed from 'confirmed' to 'pending'
        paymentStatus: 'completed',
        createdAt: new Date().toISOString() // Ensure we always have this field
      };
      
      console.log("Saving booking data:", bookingData);
      
      // Dispatch action to create booking
      await dispatch(createBooking(bookingData)).unwrap();
      
      // Create order after successful booking
      const orderData = {
        userId,
        userEmail,
        userName,
        accommodationId,
        accommodationName,
        totalAmount: formattedPrice,
        paymentMethod: 'Credit Card',
        paymentDetails: {
          cardLastFour: paymentData.number.replace(/\s/g, '').slice(-4),
          cardholderName: paymentData.name
        },
        status: 'completed',
        createdAt: new Date().toISOString() // Ensure we always have this field
      };
      
      console.log("Saving order data:", orderData);
      
      // Dispatch action to create order
      await dispatch(createOrderAfterPayment(orderData)).unwrap();
      
      // Note: The useEffect will handle the success case
    } catch (error) {
      console.error('Payment processing error:', error);
      setIsProcessing(false);
      setFormErrors({
        payment: error.message || 'Payment processing failed'
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={isProcessing ? null : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ color: 'black' }}>Payment Information</DialogTitle>
      <DialogContent>
        {!user ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please log in before completing your booking.
          </Alert>
        ) : (
          <>
            {bookingDetails && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'black' }}>
                  Booking Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {bookingDetails.accommodationName || "Accommodation"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check-in: {bookingDetails.checkInDate ? new Date(bookingDetails.checkInDate).toLocaleString() : 'Not specified'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check-out: {bookingDetails.checkOutDate ? new Date(bookingDetails.checkOutDate).toLocaleString() : 'Not specified'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Guests: {bookingDetails.numberOfGuests || 1}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', mt: 1 }}>
                  Total: {typeof bookingDetails.price === 'object' ? 
                    `R ${bookingDetails.price.value || '0'}` : 
                    `R ${bookingDetails.price || '0'}`}
                </Typography>
              </Box>
            )}

            {/* Credit Card UI */}
            <Card sx={{ mb: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'black', mb: 2 }}>
                  Credit Card
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1" sx={{ color: 'black' }}>
                    {paymentData.number || '•••• •••• •••• ••••'}
                  </Typography>
                  <Box>
                    {/* Card brand logos could go here */}
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={8}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      CARDHOLDER NAME
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'black' }}>
                      {paymentData.name || 'Your Name'}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      EXPIRES
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'black' }}>
                      {paymentData.expiry || 'MM/YY'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box sx={{ mb: 2 }}>
              <TextField
                label="Card Number"
                name="number"
                fullWidth
                variant="outlined"
                value={paymentData.number}
                onChange={handleInputChange}
                error={!!formErrors.number}
                helperText={formErrors.number}
                inputProps={{ maxLength: 19 }}
                disabled={isProcessing}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CreditCardIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="1234 5678 9012 3456"
              />
              
              <TextField
                label="Cardholder Name"
                name="name"
                fullWidth
                variant="outlined"
                value={paymentData.name}
                onChange={handleInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={isProcessing}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="John Doe"
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Expiry Date"
                  name="expiry"
                  variant="outlined"
                  value={paymentData.expiry}
                  onChange={handleInputChange}
                  error={!!formErrors.expiry}
                  helperText={formErrors.expiry}
                  inputProps={{ maxLength: 5 }}
                  disabled={isProcessing}
                  sx={{ flexGrow: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="MM/YY"
                />
                
                <TextField
                  label="CVC"
                  name="cvc"
                  variant="outlined"
                  value={paymentData.cvc}
                  onChange={handleInputChange}
                  error={!!formErrors.cvc}
                  helperText={formErrors.cvc}
                  inputProps={{ maxLength: 3 }}
                  disabled={isProcessing}
                  sx={{ flexGrow: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="123"
                />
              </Box>
            </Box>

            {formErrors.payment && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {formErrors.payment}
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          sx={{ color: 'black' }}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ bgcolor: 'black', '&:hover': { bgcolor: '#333' } }}
          disabled={isProcessing || !user}
        >
          {isProcessing ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Complete Payment'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PaymentForm;