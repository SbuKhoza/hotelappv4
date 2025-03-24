// PaymentForm.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePaystackPayment } from 'react-paystack';
import { createBooking } from '../redux/slices/bookingSlice';
import { setPaymentSuccess } from '../redux/slices/PaymentSlice';
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
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    // Handle booking status changes
    if (bookingStatus === 'failed') {
      setError('Failed to create booking. Please contact support.');
      setIsProcessing(false);
    }
  }, [bookingStatus]);

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

  

  const handlePaystackClose = () => {
    setError('Payment was cancelled');
  };

  const initializePaystack = usePaystackPayment(config);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (!user) {
        navigate('/login');
        return;
      }

      if (!bookingDetails?.checkInDate || !bookingDetails?.checkOutDate) {
        setError('Please select check-in and check-out dates');
        return;
      }

      if (!amount || amount <= 0) {
        setError('Invalid payment amount');
        return;
      }

      initializePaystack(onSuccess, handlePaystackClose);
    } catch (error) {
      console.error('Error initializing payment:', error);
      setError('Failed to initialize payment. Please try again.');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle>Complete Your Booking</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {!user && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please <Button color="inherit" onClick={() => navigate('/login')}>log in</Button> to complete your booking
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
        </Box>
      </DialogContent>
      <DialogActions>
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
      </DialogActions>
    </Dialog>
  );
};

export default PaymentForm;