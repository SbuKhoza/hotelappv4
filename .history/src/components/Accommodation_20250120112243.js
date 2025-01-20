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

// Guest limits configuration
const GUEST_LIMITS = {
  'Conference Hall': 250,
  'Spa': 10,
  'Honeymoon Suite': 2,
  'Standard Room': 10
};

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
    numberOfGuests: 1
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [guestError, setGuestError] = useState('');

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

  const handleGuestsChange = (event) => {
    const guests = parseInt(event.target.value);
    const maxGuests = GUEST_LIMITS[selectedAccommodation.name] || Infinity;
    
    if (guests > maxGuests) {
      setGuestError(`Maximum ${maxGuests} guests allowed for ${selectedAccommodation.name}`);
    } else if (guests < 1) {
      setGuestError('Minimum 1 guest required');
    } else {
      setGuestError('');
    }

    setBookingData(prev => ({
      ...prev,
      numberOfGuests: guests
    }));
  };

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
    setBookingData(prev => ({
      ...prev,
      numberOfGuests: 1
    }));
    setGuestError('');
  };

  const handleBookingClose = () => {
    setBookingOpen(false);
    setBookingData({
      checkInDate: null,
      checkOutDate: null,
      numberOfGuests: 1
    });
    setGuestError('');
  };

  // Handle booking submission
  const handleBookingSubmit = () => {
    if (!bookingData.checkInDate || !bookingData.checkOutDate || !bookingData.numberOfGuests) {
      setError("Please fill in all required fields");
      setSnackbarOpen(true);
      return;
    }

    if (bookingData.checkInDate >= bookingData.checkOutDate) {
      setError("Check-out date must be after check-in date");
      setSnackbarOpen(true);
      return;
    }

    if (guestError) {
      setError(guestError);
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
      numberOfGuests: bookingData.numberOfGuests,
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

  // ... (rest of the component remains the same until the Booking Dialog)

  return (
    <Box sx={{ flexGrow: 1, padding: 2 }}>
      {/* ... (previous JSX remains the same) */}

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

              <TextField
                fullWidth
                type="number"
                label="Number of Guests"
                value={bookingData.numberOfGuests}
                onChange={handleGuestsChange}
                error={!!guestError}
                helperText={guestError}
                margin="normal"
                InputProps={{
                  inputProps: { min: 1, max: GUEST_LIMITS[selectedAccommodation.name] || Infinity }
                }}
              />

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
            sx={{ backgroundColor: '#000000', '&:hover': { backgroundColor: '#333333' } }}
            disabled={bookingStatus === 'loading' || !!guestError}
          >
            {bookingStatus === 'loading' ? <CircularProgress size={24} /> : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ... (rest of the dialogs and components remain the same) */}

    </Box>
  );
}

export default Accommodation;