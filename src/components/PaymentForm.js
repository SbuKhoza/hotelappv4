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
  TextField,
  Typography,
  Grid,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';

const PaymentForm = ({ 
  open, 
  onClose, 
  bookingDetails, 
  onPaymentComplete 
}) => {
  const [formData, setFormData] = useState({
    cardHolder: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    
    // Card holder validation
    if (!formData.cardHolder.trim()) {
      newErrors.cardHolder = 'Cardholder name is required';
    }

    // Card number validation (16 digits)
    const cardNumberRegex = /^[0-9]{16}$/;
    if (!cardNumberRegex.test(formData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }

    // Expiry date validation (MM/YY format)
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
    } else {
      const [month, year] = formData.expiryDate.split('/');
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      if (expiry < new Date()) {
        newErrors.expiryDate = 'Card has expired';
      }
    }

    // CVV validation (3 or 4 digits)
    const cvvRegex = /^[0-9]{3,4}$/;
    if (!cvvRegex.test(formData.cvv)) {
      newErrors.cvv = 'Please enter a valid CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces every 4 digits
    if (name === 'cardNumber') {
      formattedValue = value
        .replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim()
        .substring(0, 19);
    }

    // Format expiry date with slash
    if (name === 'expiryDate') {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(?=\d)/, '$1/');
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically make an API call to your payment processor
      // const response = await processPayment(formData, bookingDetails);
      
      onPaymentComplete({
        status: 'success',
        transactionId: `TXN${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
        amount: bookingDetails.price
      });
      
      onClose();
    } catch (error) {
      setPaymentError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Payment Details
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Booking Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {bookingDetails?.accommodationName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check-in: {new Date(bookingDetails?.checkInDate).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check-out: {new Date(bookingDetails?.checkOutDate).toLocaleString()}
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                Total: {bookingDetails?.price}
              </Typography>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cardholder Name"
                name="cardHolder"
                value={formData.cardHolder}
                onChange={handleInputChange}
                error={!!errors.cardHolder}
                helperText={errors.cardHolder}
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
                label="Card Number"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                error={!!errors.cardNumber}
                helperText={errors.cardNumber}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CreditCardIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                name="expiryDate"
                placeholder="MM/YY"
                value={formData.expiryDate}
                onChange={handleInputChange}
                error={!!errors.expiryDate}
                helperText={errors.expiryDate}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="CVV"
                name="cvv"
                value={formData.cvv}
                onChange={handleInputChange}
                error={!!errors.cvv}
                helperText={errors.cvv}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          {paymentError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {paymentError}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isProcessing}
          startIcon={isProcessing ? <CircularProgress size={20} /> : null}
        >
          {isProcessing ? 'Processing...' : `Pay ${bookingDetails?.price}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentForm;