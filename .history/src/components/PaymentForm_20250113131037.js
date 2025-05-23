import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
// import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { doc, collection, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../service/Firebase';
import { setPaymentSuccess } from '../redux/slices/PaymentSlice';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import { query, where } from 'firebase/firestore';


const formatZAR = (amount) => {
  console.log('Payment price before formatting:', amount);
  
  let number;
  
  if (amount === null || amount === undefined) {
    return 'R 0.00';
  }
  
  if (typeof amount === 'object' && amount.hasOwnProperty('value')) {
    number = parseFloat(amount.value);
  } else if (typeof amount === 'string') {
    number = parseFloat(amount.replace(/[R\s,]/g, ''));
  } else {
    number = parseFloat(amount);
  }
  
  if (isNaN(number)) {
    console.error('Invalid price value:', amount);
    return 'R 0.00';
  }
  
  return `R ${number.toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

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
  onClose = () => { },
  bookingDetails = {
    price: 0,
    accommodationName: '',
    checkInDate: new Date(),
    checkOutDate: new Date(),
    accommodationId: '',
    userId: '',
  },
  onPaymentComplete = () => { }
}) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.user);
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setLocalPaymentSuccess] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const formattedPrice = (() => {
    const price = bookingDetails?.price;
    console.log('Booking details price:', price);
    
    if (!price) return '0.00';
    
    let number;
    if (typeof price === 'string') {
      number = parseFloat(price.replace(/[R\s,]/g, ''));
    } else {
      number = parseFloat(price);
    }
    
    return isNaN(number) ? '0.00' : number.toFixed(2);
  })();

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


const updateFirebaseAfterPayment = async (paymentData) => {
  if (!currentUser?.uid) {
    throw new Error('User not authenticated');
  }

  try {
    // Use a transaction to ensure all updates succeed or fail together
    await runTransaction(db, async (transaction) => {
      const timestamp = serverTimestamp();
      const bookingId = `booking_${Date.now()}_${currentUser.uid}`;

      // Check if accommodation is still available
      const accommodationRef = doc(db, 'accommodations', bookingDetails.accommodationId);
      const accommodationDoc = await transaction.get(accommodationRef);

      if (!accommodationDoc.exists()) {
        throw new Error('Accommodation not found');
      }

      const accommodationData = accommodationDoc.data();
      if (accommodationData.status === 'booked') {
        throw new Error('Accommodation is no longer available');
      }

      const updateFirebaseAfterPayment = async (paymentData) => {
        if (!currentUser?.uid) {
          throw new Error('User not authenticated');
        }
      
        try {
          const timestamp = serverTimestamp();
          const bookingId = `booking_${Date.now()}_${currentUser.uid}`;
      
          // Start a transaction
          await runTransaction(db, async (transaction) => {
            // Check accommodation availability
            const accommodationRef = doc(db, 'accommodations', bookingDetails.accommodationId);
            const accommodationDoc = await transaction.get(accommodationRef);
      
            if (!accommodationDoc.exists()) {
              throw new Error('Accommodation not found');
            }
      
            const accommodationData = accommodationDoc.data();
            
            // Check if the accommodation is already booked
            if (accommodationData.status === 'booked') {
              throw new Error('Accommodation is no longer available');
            }
      
            // Check if the dates are still available
            const isDateConflict = await checkDateConflicts(
              transaction,
              bookingDetails.accommodationId,
              bookingDetails.checkInDate,
              bookingDetails.checkOutDate
            );
      
            if (isDateConflict) {
              throw new Error('Selected dates are no longer available');
            }
      
            // Create booking document
            const bookingRef = doc(db, 'bookings', bookingId);
            const bookingData = {
              userId: currentUser.uid,
              accommodationId: bookingDetails.accommodationId,
              accommodationName: bookingDetails.accommodationName,
              checkInDate: new Date(bookingDetails.checkInDate),
              checkOutDate: new Date(bookingDetails.checkOutDate),
              price: parseFloat(bookingDetails.price),
              status: 'confirmed',
              paymentId: paymentData.transactionId,
              customerName: billingDetails.name,
              customerEmail: billingDetails.email,
              createdAt: timestamp,
              updatedAt: timestamp
            };
      
            // Create order document
            const orderRef = doc(collection(db, 'orders'), bookingId);
            const orderData = {
              ...bookingData,
              orderStatus: 'completed',
              paymentMethod: 'card',
              paymentDetails: {
                last4: paymentData.paymentMethod.card.last4,
                brand: paymentData.paymentMethod.card.brand,
                expiryMonth: paymentData.paymentMethod.card.exp_month,
                expiryYear: paymentData.paymentMethod.card.exp_year
              }
            };
      
            // Perform all updates atomically
            transaction.set(bookingRef, bookingData);
            transaction.set(orderRef, orderData);
            transaction.update(accommodationRef, {
              status: 'booked',
              lastBookedAt: timestamp,
              currentBookingId: bookingId,
              lastBookedBy: currentUser.uid
            });
          });
      
          return true;
        } catch (error) {
          console.error('Firebase transaction error:', error);
          throw new Error(getErrorMessage(error));
        }
      };
      
      // Helper function to check for date conflicts
      const checkDateConflicts = async (transaction, accommodationId, checkIn, checkOut) => {
        const bookingsRef = collection(db, 'bookings');
        const existingBookings = await transaction.get(
          query(
            bookingsRef,
            where('accommodationId', '==', accommodationId),
            where('status', '==', 'confirmed'),
            where('checkOutDate', '>', new Date(checkIn)),
            where('checkInDate', '<', new Date(checkOut))
          )
        );
      
        return !existingBookings.empty;
      };
      
      // Helper function to get user-friendly error messages
      const getErrorMessage = (error) => {
        switch (error.code) {
          case 'permission-denied':
            return 'You do not have permission to make this booking';
          case 'not-found':
            return 'The selected accommodation is no longer available';
          case 'failed-precondition':
            return 'This accommodation was just booked by someone else';
          default:
            return error.message || 'Booking failed. Please try again.';
        }
      };

      // Create booking document
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingData = {
        userId: currentUser.uid,
        accommodationId: bookingDetails.accommodationId,
        accommodationName: bookingDetails.accommodationName,
        checkInDate: new Date(bookingDetails.checkInDate),
        checkOutDate: new Date(bookingDetails.checkOutDate),
        price: parseFloat(bookingDetails.price),
        status: 'confirmed',
        paymentId: paymentData.transactionId,
        customerName: billingDetails.name,
        customerEmail: billingDetails.email,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      // Create order document
      const orderRef = doc(collection(db, 'orders'), bookingId);
      const orderData = {
        ...bookingData,
        orderStatus: 'completed',
        paymentMethod: 'card',
        paymentDetails: {
          last4: paymentData.paymentMethod.card.last4,
          brand: paymentData.paymentMethod.card.brand,
          expiryMonth: paymentData.paymentMethod.card.exp_month,
          expiryYear: paymentData.paymentMethod.card.exp_year
        }
      };

      // Perform all updates within the transaction
      transaction.set(bookingRef, bookingData);
      transaction.set(orderRef, orderData);
      transaction.update(accommodationRef, {
        status: 'booked',
        lastBookedAt: timestamp,
        currentBookingId: bookingId
      });
    });

    return true;
  } catch (error) {
    console.error('Firebase transaction error:', error);
    // Provide more specific error messages based on the error type
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to make this booking');
    } else if (error.code === 'not-found') {
      throw new Error('The selected accommodation is no longer available');
    } else if (error.message.includes('Accommodation is no longer available')) {
      throw new Error('This accommodation was just booked by someone else');
    }
    throw new Error(`Booking failed: ${error.message}`);
  }
};

const handleSubmit = async (event) => {
  event.preventDefault();

  if (!stripe || !elements || !currentUser?.uid) {
    setPaymentError('Please login to continue with payment');
    return;
  }

  if (!validateForm()) {
    return;
  }

  setIsProcessing(true);
  setPaymentError(null);

  try {
    // Create Stripe payment method
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

    // Process payment (replace with actual Stripe payment processing)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const paymentData = {
      status: 'success',
      transactionId: `pm_${Date.now()}`, // Replace with actual Stripe payment intent ID
      amount: bookingDetails.price,
      paymentMethod: paymentMethod,
    };

    // Update Firebase after successful payment
    await updateFirebaseAfterPayment(paymentData);

    // Update Redux state and UI
    dispatch(setPaymentSuccess(true));
    setLocalPaymentSuccess(true);
    onPaymentComplete(paymentData);

    // Close dialog after success
    setTimeout(() => onClose(), 2000);
  } catch (err) {
    console.error('Payment Error:', err);
    setPaymentError(err.message || 'Payment failed. Please try again.');
    dispatch(setPaymentSuccess(false));
  } finally {
    setIsProcessing(false);
  }

};

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
                  Total: {formatZAR(formattedPrice)}
                </Typography>
              </CardContent>
            </Card>

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
            {isProcessing ? 'Processing...' : `Pay ${formatZAR(formattedPrice)}`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PaymentForm;