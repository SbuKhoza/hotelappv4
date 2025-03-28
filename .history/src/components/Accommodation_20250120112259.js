import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { db, storage } from '../service/Firebase';
import { collection, getDocs } from "firebase/firestore";
import { ref, getDownloadURL, listAll } from "firebase/storage";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Grid,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { createBooking, clearBookingStatus } from '../redux/slices/bookingSlice';
import PaymentForm from '../components/PaymentForm';


const formatZAR = (amount) => {
  console.log('Price before formatting:', amount);

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

function Accommodation() {
  const dispatch = useDispatch();
  const bookingStatus = useSelector((state) => state.booking.status);
  const bookingError = useSelector((state) => state.booking.error);

  // States
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);
  const [bookingData, setBookingData] = useState({
    checkInDate: null,
    checkOutDate: null,
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Fetch accommodations on component mount
  useEffect(() => {
    const fetchAccommodations = async () => {
      try {
        const accommodationCollection = collection(db, 'accommodation');
        const accommodationSnapshot = await getDocs(accommodationCollection);
        const accommodationList = await Promise.all(accommodationSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const imagesRef = ref(storage, `accommodations/${doc.id}`);
          try {
            const imagesList = await listAll(imagesRef);
            const imageUrls = await Promise.all(
              imagesList.items.map((imageRef) => getDownloadURL(imageRef))
            );
            return { ...data, id: doc.id, imageUrls };
          } catch (error) {
            console.error(`Error fetching images for accommodation ${doc.id}:`, error);
            return { ...data, id: doc.id, imageUrls: [] };
          }
        }));

        setAccommodations(accommodationList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching accommodations:", error);
        setError("Failed to load accommodations. Please try again later.");
        setLoading(false);
      }
    };

    fetchAccommodations();
  }, []);

  // Handle viewing accommodation details
  const handleClickOpen = (accommodation) => {
    setSelectedAccommodation(accommodation);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAccommodation(null);
  };

  // Handle booking dialog
  const handleBookingOpen = (accommodation) => {
    setSelectedAccommodation(accommodation);
    setBookingOpen(true);
  };

  const handleBookingClose = () => {
    setBookingOpen(false);
    setBookingData({
      checkInDate: null,
      checkOutDate: null,
    });
  };

  // Handle booking submission
  const handleBookingSubmit = () => {
    if (!bookingData.checkInDate || !bookingData.checkOutDate) {
      setError("Please fill in all required fields");
      setSnackbarOpen(true);
      return;
    }

    if (bookingData.checkInDate >= bookingData.checkOutDate) {
      setError("Check-out date must be after check-in date");
      setSnackbarOpen(true);
      return;
    }

    setBookingOpen(false);
    setPaymentOpen(true);
  };

  const handlePaymentComplete = async (paymentDetails) => {
    const bookingPayload = {
      accommodationId: selectedAccommodation.id,
      accommodationName: selectedAccommodation.name,
      checkInDate: bookingData.checkInDate.toISOString(),
      checkOutDate: bookingData.checkOutDate.toISOString(),
      price: selectedAccommodation.price,
      userId: 'guest',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      paymentDetails
    };

    try {
      await dispatch(createBooking(bookingPayload)).unwrap();
      setPaymentOpen(false);
      setError(null);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Booking failed:', error);
      setError(error.message || 'Failed to create booking');
      setSnackbarOpen(true);
    }
  };

  // Helper function to get amenities list
  const getAmenitiesList = (amenities) => {
    if (typeof amenities === 'object' && amenities !== null) {
      return Object.keys(amenities)
        .filter(key => amenities[key])
        .map(key => key.charAt(0).toUpperCase() + key.slice(1));
    }
    return [];
  };

  // Carousel settings
  const carouselSettings = {
    showThumbs: false,
    showStatus: false,
    showIndicators: true,
    infiniteLoop: true,
    useKeyboardArrows: true,
    autoPlay: false,
    emulateTouch: true,
    swipeable: true,
    showArrows: true,
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, padding: 2 }}>
      <Typography variant="h1" sx={{ textAlign: 'center', fontSize: '2rem', marginBottom: 3 }}>
        Accommodations
      </Typography>

      {/* Accommodations Grid */}
      <Grid container spacing={2} justifyContent="center">
        {accommodations.map((accommodation) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={accommodation.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={accommodation.imageUrls[0] || '/placeholder-image.jpg'}
                alt={accommodation.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="div">
                  {accommodation.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {accommodation.description}
                </Typography>
                <Typography variant="subtitle1">
                  Guests: {accommodation.guests || 'Not specified'}
                </Typography>
                <Typography variant="subtitle1">
                  Amenities: {getAmenitiesList(accommodation.amenities).join(', ') || 'None listed'}
                </Typography>

                <Typography variant="h6" sx={{ mt: 2 }}>
                  Price: {formatZAR(accommodation.price)}
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, mt: 'auto' }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => handleClickOpen(accommodation)}
                >
                  View Details
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Details Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: '90%',
            maxHeight: '90vh',
            '& .carousel .slide img': {
              maxHeight: '50vh',
              objectFit: 'contain'
            }
          }
        }}
      >
        {selectedAccommodation && (
          <>
            <DialogTitle>{selectedAccommodation.name}</DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Carousel {...carouselSettings}>
                  {selectedAccommodation.imageUrls.map((url, index) => (
                    <div key={index}>
                      <img
                        src={url}
                        alt={`${selectedAccommodation.name} - Image ${index + 1}`}
                        style={{ width: '100%', height: '50vh', objectFit: 'contain' }}
                      />
                    </div>
                  ))}
                </Carousel>
              </Box>
              <Typography variant="body1" paragraph>
                {selectedAccommodation.description}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Guests: {selectedAccommodation.guests || 'Not specified'}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Amenities: {getAmenitiesList(selectedAccommodation.amenities).join(', ') || 'None listed'}
              </Typography>

              <Typography variant="h6" gutterBottom>
                Price: {formatZAR(selectedAccommodation.price)}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => {
                  handleClose();
                  handleBookingOpen(selectedAccommodation);
                }}
                sx={{ mt: 2 }}
              >
                Book Now
              </Button>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Booking Dialog */}
      <Dialog
        open={bookingOpen}
        onClose={handleBookingClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Book Accommodation</DialogTitle>
        <DialogContent>
          {selectedAccommodation && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedAccommodation.name}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Price: {formatZAR(selectedAccommodation.price)}
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ mt: 3, mb: 2 }}>
                  <DateTimePicker
                    label="Check-in Date & Time"
                    value={bookingData.checkInDate}
                    onChange={(newValue) => {
                      setBookingData(prev => ({ ...prev, checkInDate: newValue }));
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    minDateTime={new Date()}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <DateTimePicker
                    label="Check-out Date & Time"
                    value={bookingData.checkOutDate}
                    onChange={(newValue) => {
                      setBookingData(prev => ({ ...prev, checkOutDate: newValue }));
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    minDateTime={bookingData.checkInDate || new Date()}
                  />
                </Box>
              </LocalizationProvider>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBookingClose}>Cancel</Button>
          <Button
            onClick={handleBookingSubmit}
            variant="contained"
            color="primary"
            disabled={bookingStatus === 'loading'}
          >
            {bookingStatus === 'loading' ? <CircularProgress size={24} /> : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => {
          setSnackbarOpen(false);
          dispatch(clearBookingStatus());
        }}
      >
        <Alert
          onClose={() => {
            setSnackbarOpen(false);
            dispatch(clearBookingStatus());
          }}
          severity={bookingStatus === 'succeeded' ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {bookingStatus === 'succeeded'
            ? 'Booking confirmed successfully!'
            : error || bookingError || 'Please fill in all required fields'}
        </Alert>
      </Snackbar>

      <PaymentForm
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        bookingDetails={{
          accommodationName: selectedAccommodation?.name,
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          price: selectedAccommodation?.price
        }}
        onPaymentComplete={handlePaymentComplete}
      />

    </Box>
  );
}

export default Accommodation;