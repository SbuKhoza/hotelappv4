

  const handlePaystackClose = () => {
    console.log('Payment cancelled by user');
    setError('Payment was cancelled');
  };

  const initializePaystack = usePaystackPayment(config);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
      if (!user) {
        console.log('User not logged in, redirecting to login');
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

      console.log('Initializing Paystack payment');
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
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!user || !amount}
        >
          Pay Now R {amount / 100}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentForm;