import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePaystackPayment } from 'react-paystack';
import { createBooking } from '../redux/slices/bookingSlice';
import { setPaymentSuccess } from '../redux/slices/paymentSlice';
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
} from '@mui/material';

const PaymentForm = ({ open, onClose, bookingDetails, onPaymentComplete }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  // Get user from Redux store
  const user = useSelector((state) => state.user.user);
  const [email, setEmail] = useState('');

  // Set email from user data when component mounts or user changes
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      setError('Please log in to make a booking');
    } else {
      setError('');
    }
  }, [user]);

  // Convert price to lowest currency unit (kobo for NGN)
  const amount = bookingDetails?.price ? Math.round(parseFloat(bookingDetails.price) * 100) : 0;

  const config = {
    reference: new Date().getTime().toString(),
    email: email,
    amount: amount,
    publicKey: 'pk_test_83cc29f38b42ed879380c7af93c42c027c30d80f',
    currency: 'NGN',
    metadata: {
      userId: user?.uid,
      userName: user?.name
    }
  };

  const onSuccess = (reference) => {
    if (!user) {
      setError('User authentication required');
      navigate('/login');
      return;
    }

    // Create booking with payment details and user information
    const bookingPayload = {
      accommodationId: bookingDetails.accommodationId,
      accommodationName: bookingDetails.accommodationName,
      checkInDate: bookingDetails.checkInDate,
      checkOutDate: bookingDetails.checkOutDate,
      price: bookingDetails.price,
      paymentId: reference.reference,
      paymentStatus: 'completed',
      email: user.email,
      userId: user.uid,
      userName: user.name,
      createdAt: new Date().toISOString()
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
    
    if (!user) {
      setError('Please log in to continue');
      navigate('/login');
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
          {!user && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please <Button onClick={() => navigate('/login')}>log in</Button> to complete your booking
            </Alert>
          )}

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
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!user}
        >
          Pay Now
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentForm;