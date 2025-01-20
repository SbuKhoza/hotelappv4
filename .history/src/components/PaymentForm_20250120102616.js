import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { usePaystackPayment } from 'react-paystack';
import { createBooking } from '../redux/slices/bookingSlice';
import { setPaymentSuccess } from '../redux/slices/paymentSlice';
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
} from '@mui/material';

const PaymentForm = ({ open, onClose, bookingDetails, onPaymentComplete }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // Convert price to lowest currency unit (kobo for NGN)
  const amount = bookingDetails?.price ? Math.round(parseFloat(bookingDetails.price) * 100) : 0;

  const config = {
    reference: new Date().getTime().toString(),
    email: email,
    amount: amount,
    publicKey: 'pk_test_83cc29f38b42ed879380c7af93c42c027c30d80f',
    currency: 'NGN',
  };

  const onSuccess = (reference) => {
    // Create booking with payment details
    const bookingPayload = {
      accommodationId: bookingDetails.accommodationId,
      accommodationName: bookingDetails.accommodationName,
      checkInDate: bookingDetails.checkInDate,
      checkOutDate: bookingDetails.checkOutDate,
      price: bookingDetails.price,
      paymentId: reference.reference,
      paymentStatus: 'completed',
      email: email,
      userId: 'guest', // Replace with actual user ID if available
    };

    dispatch(createBooking(bookingPayload))
      .unwrap()
      .then(() => {
        dispatch(setPaymentSuccess(true));
        onPaymentComplete && onPaymentComplete(reference);
        onClose();
      })
      .catch((error) => {
        setError('Failed to create booking. Please contact support.');
        console.error('Booking creation failed:', error);
      });
  };

  const onClose = () => {
    setError('Payment cancelled');
  };

  const initializePayment = usePaystackPayment(config);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    if (!bookingDetails.checkInDate || !bookingDetails.checkOutDate) {
      setError('Please select check-in and check-out dates');
      return;
    }
    initializePayment(onSuccess, onClose);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Complete Your Booking</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Booking Details
          </Typography>
          
          <Typography variant="body1" gutterBottom>
            Accommodation: {bookingDetails?.accommodationName}
          </Typography>
          
          <Typography variant="body1" gutterBottom>
            Check-in: {bookingDetails?.checkInDate?.toLocaleString()}
          </Typography>
          
          <Typography variant="body1" gutterBottom>
            Check-out: {bookingDetails?.checkOutDate?.toLocaleString()}
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Amount: NGN {bookingDetails?.price}
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
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
        >
          Pay Now
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentForm;