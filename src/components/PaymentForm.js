import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePaystackPayment } from 'react-paystack';
import { createBooking } from '../redux/slices/bookingSlice';
import { 
  setPaymentSuccess, 
  clearPaymentStatus, 
  createOrderAfterPayment 
} from '../redux/slices/PaymentSlice';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';

const PaymentForm = ({ open, onClose, bookingDetails, onPaymentComplete }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const user = useSelector((state) => state.user.user);
  const bookingStatus = useSelector((state) => state.booking.status);
  const paymentSuccess = useSelector((state) => state.payment.paymentSuccess);
  const orderStatus = useSelector((state) => state.payment.orderStatus);
  const [email, setEmail] = useState('');
  const [debugLog, setDebugLog] = useState([]);

  // Helper function to add to debug log
  const addDebugLog = (message) => {
    console.log(message);
    setDebugLog(prev => [...prev, `${new Date().toISOString().slice(11, 19)}: ${message}`]);
  };

  // Reset states when modal opens
  useEffect(() => {
    if (open) {
      setError('');
      setIsProcessing(false);
      setDebugLog([]);
      dispatch(clearPaymentStatus());
      addDebugLog('Modal opened, states reset');
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      addDebugLog(`User email set: ${user.email}`);
    }
  }, [user]);

  // Auto-close modal on successful payment after a brief delay to show success message
  useEffect(() => {
    if (paymentSuccess) {
      addDebugLog('Payment success detected, preparing to close modal');
      // Add a slight delay before closing to show success message
      setTimeout(() => {
        addDebugLog('Closing modal after success delay');
        onPaymentComplete && onPaymentComplete(paymentSuccess);
        handleDone();
      }, 3000); // Close after 3 seconds
    }
  }, [paymentSuccess, onPaymentComplete]);

  // Handle booking status changes
  useEffect(() => {
    addDebugLog(`Booking status changed to: ${bookingStatus}`);
    if (bookingStatus === 'failed') {
      setError('Failed to create booking. Please contact support.');
      setIsProcessing(false);
      addDebugLog('Booking creation failed');
    } else if (bookingStatus === 'succeeded') {
      addDebugLog('Booking creation succeeded');
      setIsProcessing(false);
    }
  }, [bookingStatus]);

  // Handle order status changes
  useEffect(() => {
    addDebugLog(`Order status changed to: ${orderStatus}`);
    if (orderStatus === 'failed') {
      setError('Failed to create order. Please contact support.');
      setIsProcessing(false);
      addDebugLog('Order creation failed');
    }
  }, [orderStatus]);

  const validateAndParsePrice = (price) => {
    try {
      if (typeof price === 'string') {
        return parseFloat(price.replace(/[^\d.-]/g, ''));
      }
      return parseFloat(price);
    } catch (error) {
      console.error('Price parsing error:', error);
      return 0;
    }
  };

  const amount = bookingDetails?.price ? Math.round(validateAndParsePrice(bookingDetails.price) * 100) : 0;

  const config = {
    reference: `BOOK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    email: email,
    amount: amount,
    publicKey: 'pk_test_83cc29f38b42ed879380c7af93c42c027c30d80f',
    currency: 'ZAR',
    metadata: {
      custom_fields: [
        {
          display_name: "User ID",
          variable_name: "user_id",
          value: user?.uid || ''
        }
      ]
    }
  };

  const onSuccess = async (reference) => {
    setIsProcessing(true);
    addDebugLog(`Payment successful with reference: ${reference.reference}`);
    
    try {
      if (!user) {
        addDebugLog('Error: No user found');
        throw new Error('User authentication required');
      }

      const bookingPayload = {
        accommodationId: bookingDetails.accommodationId,
        accommodationName: bookingDetails.accommodationName,
        checkInDate: bookingDetails.checkInDate.toISOString(),
        checkOutDate: bookingDetails.checkOutDate.toISOString(),
        numberOfGuests: bookingDetails.numberOfGuests,
        price: bookingDetails.price,
        paymentId: reference.reference,
        paymentStatus: 'completed',
        paymentReference: {
          ...reference,
          processingDate: new Date().toISOString()
        },
        email: user.email,
        userId: user.uid,
        userName: user.displayName || user.email,
        customerContact: user.phoneNumber || '',
        bookingType: 'accommodation',
        currency: 'ZAR',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      addDebugLog('Creating booking with payload');
      
      try {
        addDebugLog('Dispatching createBooking action');
        const result = await dispatch(createBooking(bookingPayload)).unwrap();
        addDebugLog(`Booking created with ID: ${result?.id || 'unknown'}`);
        
        if (result && result.id) {
          // Create order in Firebase after successful booking
          const orderPayload = {
            ...bookingPayload,
            bookingId: result.id,
            orderType: 'accommodation',
            orderStatus: 'confirmed'
          };
          
          addDebugLog('Creating order after successful booking');
          await dispatch(createOrderAfterPayment(orderPayload)).unwrap();
          addDebugLog('Order created successfully');
          
          addDebugLog('Setting payment success status');
          dispatch(setPaymentSuccess({ 
            ...reference, 
            bookingId: result.id 
          }));
        } else {
          addDebugLog('Error: Invalid result from booking creation');
          throw new Error('Failed to create booking record');
        }
      } catch (dispatchError) {
        addDebugLog(`Error in dispatch: ${dispatchError.message}`);
        throw dispatchError;
      }
    } catch (error) {
      console.error('Error in payment success handler:', error);
      addDebugLog(`Error processing payment: ${error.message}`);
      setError(error.message || 'Failed to process booking. Please contact support.');
      setIsProcessing(false);
    }
  };

  const handlePaystackClose = () => {
    setError('Payment was cancelled');
    setIsProcessing(false);
    addDebugLog('Payment cancelled by user');
  };

  const initializePaystack = usePaystackPayment(config);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    addDebugLog('Payment submission initiated');
    
    try {
      if (!user) {
        addDebugLog('No user logged in, redirecting to login');
        navigate('/loginsignup');
        return;
      }

      if (!bookingDetails?.checkInDate || !bookingDetails?.checkOutDate) {
        addDebugLog('Missing dates');
        setError('Please select check-in and check-out dates');
        return;
      }

      if (!amount || amount <= 0) {
        addDebugLog('Invalid amount');
        setError('Invalid payment amount');
        return;
      }

      addDebugLog('Initializing Paystack payment');
      initializePaystack(onSuccess, handlePaystackClose);
    } catch (error) {
      console.error('Error initializing payment:', error);
      addDebugLog(`Payment initialization error: ${error.message}`);
      setError('Failed to initialize payment. Please try again.');
    }
  };

  const handleDone = () => {
    addDebugLog('Handling done - clearing payment status');
    dispatch(clearPaymentStatus());
    onClose();
  };

  // Prevent closing the dialog by clicking outside when payment is successful
  const handleDialogClose = (event, reason) => {
    if (paymentSuccess) {
      addDebugLog('Preventing dialog close - payment success in progress');
      return; // Do nothing if payment is successful
    }
    addDebugLog('Dialog closing normally');
    onClose(); // Otherwise, close normally
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleDialogClose}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle>
        {paymentSuccess ? 'Booking Confirmed!' : 'Complete Your Booking'}
      </DialogTitle>
      <DialogContent>
        {paymentSuccess ? (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Your payment was successful and your booking has been confirmed!
            </Alert>
            <Typography variant="body1" gutterBottom>
              A confirmation email has been sent to your email address.
            </Typography>
            <Typography variant="body1" gutterBottom>
              Booking Reference: {config.reference}
            </Typography>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {!user && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Please <Button color="inherit" onClick={() => navigate('/loginsignup')}>log in</Button> to complete your booking
              </Alert>
            )}

            <Typography variant="h6" gutterBottom>
              Booking Details
            </Typography>
            
            <Typography variant="body1" gutterBottom>
              Accommodation: {bookingDetails?.accommodationName || 'N/A'}
            </Typography>
            
            <Typography variant="body1" gutterBottom>
              Check-in: {bookingDetails?.checkInDate?.toLocaleString() || 'Not selected'}
            </Typography>
            
            <Typography variant="body1" gutterBottom>
              Check-out: {bookingDetails?.checkOutDate?.toLocaleString() || 'Not selected'}
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Amount: R {amount / 100}
            </Typography>

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!user}
              error={!!error && !email}
              helperText={!email && error ? 'Email is required' : ''}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            
            {/* Debug Log Display (you can comment this out in production) */}
            {debugLog.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: 150, overflow: 'auto' }}>
                <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  Debug Log:
                </Typography>
                {debugLog.map((log, i) => (
                  <Typography key={i} variant="caption" component="div" sx={{ fontFamily: 'monospace' }}>
                    {log}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {paymentSuccess ? (
          <Button 
            onClick={handleDone}
            variant="contained"
            color="primary"
            fullWidth
          >
            Done
          </Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={isProcessing}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={!user || !amount || isProcessing}
            >
              {isProcessing ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Processing...
                </>
              ) : (
                `Pay Now R ${amount / 100}`
              )}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentForm;