import React, { useState, useEffect } from 'react';
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
import { 
  doc, 
  collection, 
  setDoc, 
  updateDoc, 
  serverTimestamp,

  runTransaction,
  query,
  where 

} from 'firebase/firestore';
import { db } from '../service/Firebase';
import { setPaymentSuccess } from '../redux/slices/PaymentSlice';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';

// Improved price validation and formatting
const validateAndFormatPrice = (price) => {
  if (price === null || price === undefined) {
    return 0;
  }

  try {
    if (typeof price === 'number') {
      return price;
    }

    if (typeof price === 'string') {
      // Remove all non-numeric characters except decimal point
      const cleanPrice = price.replace(/[^0-9.]/g, '');
      const parsedPrice = parseFloat(cleanPrice);
      return isNaN(parsedPrice) ? 0 : parsedPrice;
    }

    if (typeof price === 'object' && price !== null && 'value' in price) {
      return validateAndFormatPrice(price.value);
    }

    return 0;
  } catch (error) {
    console.error('Price validation error:', error);
    return 0;
  }
};

const formatZAR = (amount) => {
  const validAmount = validateAndFormatPrice(amount);
  return `R ${validAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
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

const defaultBookingDetails = {
  price: 0,
  accommodationName: '',
  checkInDate: new Date(),
  checkOutDate: new Date(),
  accommodationId: '',
  userId: '',
};

const PaymentForm = ({
  open = false,
  onClose = () => { },
  bookingDetails = defaultBookingDetails,
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
  const [validatedPrice, setValidatedPrice] = useState(0);

  // Validate booking details on component mount and when they change
  useEffect(() => {
    const price = validateAndFormatPrice(bookingDetails?.price);
    setValidatedPrice(price);
    
    if (price === 0) {
      console.warn('Invalid or zero price detected:', bookingDetails?.price);
    }
  }, [bookingDetails]);

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

    if (validatedPrice <= 0) {
      errors.price = 'Invalid price amount';
    }

    if (!currentUser?.uid) {
      errors.auth = 'User must be authenticated';
    }

    if (!stripe || !elements) {
      errors.stripe = 'Payment system is not ready';
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

<<<<<<< HEAD

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

        const accommodationData = accommodationDoc.data();
        if (!accommodationData) {
          throw new Error('Invalid accommodation data');
        }

        if (accommodationData.status === 'booked') {
          throw new Error('Accommodation is no longer available');
        }

        // Price validation
        const accommodationPrice = validateAndFormatPrice(accommodationData.price);
        const bookingPrice = validateAndFormatPrice(bookingDetails.price);

        if (accommodationPrice !== bookingPrice) {
          throw new Error('Price has changed. Please refresh and try again.');
        }

        // Prepare booking document
        const bookingData = {
          userId: currentUser.uid,
          accommodationId: bookingDetails.accommodationId || '',
          accommodationName: bookingDetails.accommodationName || '',
          checkInDate: bookingDetails.checkInDate ? new Date(bookingDetails.checkInDate) : new Date(),
          checkOutDate: bookingDetails.checkOutDate ? new Date(bookingDetails.checkOutDate) : new Date(),
          price: bookingPrice,
          status: 'confirmed',
          paymentId: paymentData?.transactionId || '',
          customerName: billingDetails.name || '',
          customerEmail: billingDetails.email || '',
          createdAt: timestamp,
          updatedAt: timestamp
        };

        // Prepare order document
        const orderData = {
          ...bookingData,
          orderStatus: 'completed',
          paymentMethod: 'card',
          paymentDetails: {
            last4: paymentData?.paymentMethod?.card?.last4 || '',
            brand: paymentData?.paymentMethod?.card?.brand || '',
            expiryMonth: paymentData?.paymentMethod?.card?.exp_month || '',
            expiryYear: paymentData?.paymentMethod?.card?.exp_year || ''
          }
        };

        // Create document references
        const bookingRef = doc(db, 'bookings', bookingId);
        const orderRef = doc(collection(db, 'orders'), bookingId);

        // Execute transaction
        transaction.set(bookingRef, bookingData);
        transaction.set(orderRef, orderData);
        transaction.update(accommodationRef, {
          status: 'booked',
          lastBookedAt: timestamp,
          currentBookingId: bookingId
        });

        return { bookingId, orderData };
      });

      return result;
    } catch (error) {
      console.error('Firebase transaction error:', error);
      throw new Error(error.message || 'An error occurred during booking');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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

      // Process payment
      const paymentData = {
        status: 'success',
        transactionId: `pm_${Date.now()}`,
        amount: validatedPrice,
        paymentMethod: paymentMethod,
      };

      // Update Firebase
      const result = await updateFirebaseAfterPayment(paymentData);

      // Update UI and state
      dispatch(setPaymentSuccess(true));
      setLocalPaymentSuccess(true);
      onPaymentComplete({ ...paymentData, ...result });

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
      onClose={!isProcessing ? onClose : undefined}
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
                  Total: {formatZAR(validatedPrice)}
                </Typography>
              </CardContent>
            </Card>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Full Name"
                  name="name"
                  value={billingDetails.name}
                  onChange={handleInputChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  disabled={isProcessing}
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
                  required
                  label="Email"
                  name="email"
                  type="email"
                  value={billingDetails.email}
                  onChange={handleInputChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  disabled={isProcessing}
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
                opacity: isProcessing ? 0.7 : 1,
                pointerEvents: isProcessing ? 'none' : 'auto'
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
            {formErrors.price && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {formErrors.price}
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
            {isProcessing ? 'Processing...' : `Pay ${formatZAR(validatedPrice)}`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PaymentForm;