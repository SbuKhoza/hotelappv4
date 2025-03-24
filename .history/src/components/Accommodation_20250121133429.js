// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { db, storage } from '../service/Firebase';
// import { collection, getDocs } from "firebase/firestore";
// import { ref, getDownloadURL, listAll } from "firebase/storage";
// import {
//   Card,
//   CardMedia,
//   CardContent,
//   Typography,
//   Button,
//   Grid,
//   Box,
//   Dialog,
//   DialogContent,
//   DialogTitle,
//   TextField,
//   DialogActions,
//   Alert,
//   Snackbar,
//   CircularProgress
// } from '@mui/material';
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { Carousel } from 'react-responsive-carousel';
// import 'react-responsive-carousel/lib/styles/carousel.min.css';
// import { createBooking, clearBookingStatus } from '../redux/slices/bookingSlice';
// import PaymentForm from '../components/PaymentForm';

// const formatZAR = (amount) => {
//   console.log('Price before formatting:', amount);

//   let number;

//   if (amount === null || amount === undefined) {
//     return 'R 0.00';
//   }

//   if (typeof amount === 'object' && amount.hasOwnProperty('value')) {
//     number = parseFloat(amount.value);
//   } else if (typeof amount === 'string') {
//     number = parseFloat(amount.replace(/[R\s,]/g, ''));
//   } else {
//     number = parseFloat(amount);
//   }

//   if (isNaN(number)) {
//     console.error('Invalid price value:', amount);
//     return 'R 0.00';
//   }

//   return `R ${number.toFixed(2)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// };

// const MAX_GUESTS = {
//   'Conference Hall': 250,
//   'Spa': 10,
//   'Honeymoon Suite': 2,
//   'Standard Room': 10
// };

// function Accommodation() {
//   const dispatch = useDispatch();
//   const bookingStatus = useSelector((state) => state.booking.status);
//   const bookingError = useSelector((state) => state.booking.error);

//   // States
//   const [accommodations, setAccommodations] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [open, setOpen] = useState(false);
//   const [bookingOpen, setBookingOpen] = useState(false);
//   const [selectedAccommodation, setSelectedAccommodation] = useState(null);
//   const [bookingData, setBookingData] = useState({
//     checkInDate: null,
//     checkOutDate: null,
//     numberOfGuests: 1
//   });
//   const [snackbarOpen, setSnackbarOpen] = useState(false);
//   const [paymentOpen, setPaymentOpen] = useState(false);

//   // Fetch accommodations on component mount
//   useEffect(() => {
//     const fetchAccommodations = async () => {
//       try {
//         const accommodationCollection = collection(db, 'accommodation');
//         const accommodationSnapshot = await getDocs(accommodationCollection);
//         const accommodationList = await Promise.all(accommodationSnapshot.docs.map(async (doc) => {
//           const data = doc.data();
//           const imagesRef = ref(storage, `accommodations/${doc.id}`);
//           try {
//             const imagesList = await listAll(imagesRef);
//             const imageUrls = await Promise.all(
//               imagesList.items.map((imageRef) => getDownloadURL(imageRef))
//             );
//             return { ...data, id: doc.id, imageUrls };
//           } catch (error) {
//             console.error(`Error fetching images for accommodation ${doc.id}:`, error);
//             return { ...data, id: doc.id, imageUrls: [] };
//           }
//         }));

//         setAccommodations(accommodationList);
//         setLoading(false);
//       } catch (error) {
//         console.error("Error fetching accommodations:", error);
//         setError("Failed to load accommodations. Please try again later.");
//         setLoading(false);
//       }
//     };

//     fetchAccommodations();
//   }, []);

//   const handleClickOpen = (accommodation) => {
//     setSelectedAccommodation(accommodation);
//     setOpen(true);
//   };

//   const handleClose = () => {
//     setOpen(false);
//     setSelectedAccommodation(null);
//   };

//   const handleBookingOpen = (accommodation) => {
//     setSelectedAccommodation(accommodation);
//     setBookingOpen(true);
//   };

//   const handleBookingClose = () => {
//     setBookingOpen(false);
//     setBookingData({
//       checkInDate: null,
//       checkOutDate: null,
//       numberOfGuests: 1
//     });
//   };

//   const handleBookingSubmit = () => {
//     if (!bookingData.checkInDate || !bookingData.checkOutDate || !bookingData.numberOfGuests) {
//       setError("Please fill in all required fields");
//       setSnackbarOpen(true);
//       return;
//     }

//     if (bookingData.checkInDate >= bookingData.checkOutDate) {
//       setError("Check-out date must be after check-in date");
//       setSnackbarOpen(true);
//       return;
//     }

//     const maxGuests = MAX_GUESTS[selectedAccommodation.name] || 1;
//     if (bookingData.numberOfGuests > maxGuests) {
//       setError(`Maximum ${maxGuests} guests allowed for ${selectedAccommodation.name}`);
//       setSnackbarOpen(true);
//       return;
//     }

//     setBookingOpen(false);
//     setPaymentOpen(true);
//   };

//   const handlePaymentComplete = async (paymentDetails) => {
//     const bookingPayload = {
//       accommodationId: selectedAccommodation.id,
//       accommodationName: selectedAccommodation.name,
//       checkInDate: bookingData.checkInDate.toISOString(),
//       checkOutDate: bookingData.checkOutDate.toISOString(),
//       numberOfGuests: bookingData.numberOfGuests,
//       price: selectedAccommodation.price,
//       userId: 'guest',
//       status: 'confirmed',
//       createdAt: new Date().toISOString(),
//       paymentDetails
//     };

//     try {
//       await dispatch(createBooking(bookingPayload)).unwrap();
//       setPaymentOpen(false);
//       setError(null);
//       setSnackbarOpen(true);
//     } catch (error) {
//       console.error('Booking failed:', error);
//       setError(error.message || 'Failed to create booking');
//       setSnackbarOpen(true);
//     }
//   };

//   const getAmenitiesList = (amenities) => {
//     if (typeof amenities === 'object' && amenities !== null) {
//       return Object.keys(amenities)
//         .filter(key => amenities[key])
//         .map(key => key.charAt(0).toUpperCase() + key.slice(1));
//     }
//     return [];
//   };

//   const carouselSettings = {
//     showThumbs: false,
//     showStatus: false,
//     showIndicators: true,
//     infiniteLoop: true,
//     useKeyboardArrows: true,
//     autoPlay: false,
//     emulateTouch: true,
//     swipeable: true,
//     showArrows: true,
//   };

//   if (loading) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
//         <CircularProgress />
//       </Box>
//     );
//   }

//   if (error) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
//         <Alert severity="error">{error}</Alert>
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ flexGrow: 1, padding: 2 }}>
//       <Typography variant="h1" sx={{ textAlign: 'center', fontSize: '2rem', marginBottom: 3, color: 'black' }}>
//         Accommodations
//       </Typography>

//       <Grid container spacing={2} justifyContent="center">
//         {accommodations.map((accommodation) => (
//           <Grid item xs={12} sm={6} md={4} lg={3} key={accommodation.id}>
//             <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
//               <CardMedia
//                 component="img"
//                 height="200"
//                 image={accommodation.imageUrls[0] || '/placeholder-image.jpg'}
//                 alt={accommodation.name}
//                 sx={{ objectFit: 'cover' }}
//               />
//               <CardContent sx={{ flexGrow: 1 }}>
//                 <Typography gutterBottom variant="h5" component="div" sx={{ color: 'black' }}>
//                   {accommodation.name}
//                 </Typography>
//                 <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
//                   {accommodation.description}
//                 </Typography>
//                 <Typography variant="subtitle1" sx={{ color: 'black' }}>
//                   Max Guests: {MAX_GUESTS[accommodation.name] || 'Not specified'}
//                 </Typography>
//                 <Typography variant="subtitle1" sx={{ color: 'black' }}>
//                   Amenities: {getAmenitiesList(accommodation.amenities).join(', ') || 'None listed'}
//                 </Typography>
//                 <Typography variant="h6" sx={{ mt: 2, color: 'black' }}>
//                   Price: {formatZAR(accommodation.price)}
//                 </Typography>
//               </CardContent>
//               <Box sx={{ p: 2, mt: 'auto' }}>
//                 <Button
//                   variant="contained"
//                   sx={{ bgcolor: 'black', '&:hover': { bgcolor: '#333' } }}
//                   fullWidth
//                   onClick={() => handleClickOpen(accommodation)}
//                 >
//                   View Details
//                 </Button>
//               </Box>
//             </Card>
//           </Grid>
//         ))}
//       </Grid>

//       <Dialog
//         open={open}
//         onClose={handleClose}
//         maxWidth="md"
//         fullWidth
//         sx={{
//           '& .MuiDialog-paper': {
//             width: '90%',
//             maxHeight: '90vh',
//             '& .carousel .slide img': {
//               maxHeight: '50vh',
//               objectFit: 'contain'
//             }
//           }
//         }}
//       >
//         {selectedAccommodation && (
//           <>
//             <DialogTitle sx={{ color: 'black' }}>{selectedAccommodation.name}</DialogTitle>
//             <DialogContent>
//               <Box sx={{ mb: 2 }}>
//                 <Carousel {...carouselSettings}>
//                   {selectedAccommodation.imageUrls.map((url, index) => (
//                     <div key={index}>
//                       <img
//                         src={url}
//                         alt={`${selectedAccommodation.name} - Image ${index + 1}`}
//                         style={{ width: '100%', height: '50vh', objectFit: 'contain' }}
//                       />
//                     </div>
//                   ))}
//                 </Carousel>
//               </Box>
//               <Typography variant="body1" paragraph sx={{ color: 'black' }}>
//                 {selectedAccommodation.description}
//               </Typography>
//               <Typography variant="subtitle1" gutterBottom sx={{ color: 'black' }}>
//                 Max Guests: {MAX_GUESTS[selectedAccommodation.name] || 'Not specified'}
//               </Typography>
//               <Typography variant="subtitle1" gutterBottom sx={{ color: 'black' }}>
//                 Amenities: {getAmenitiesList(selectedAccommodation.amenities).join(', ') || 'None listed'}
//               </Typography>
//               <Typography variant="h6" gutterBottom sx={{ color: 'black' }}>
//                 Price: {formatZAR(selectedAccommodation.price)}
//               </Typography>
//               <Button
//                 variant="contained"
//                 sx={{ bgcolor: 'black', '&:hover': { bgcolor: '#333' }, mt: 2 }}
//                 fullWidth
//                 onClick={() => {
//                   handleClose();
//                   handleBookingOpen(selectedAccommodation);
//                 }}
//               >
//                 Book Now
//               </Button>
//             </DialogContent>
//           </>
//         )}
//       </Dialog>

//       <Dialog
//         open={bookingOpen}
//         onClose={handleBookingClose}
//         maxWidth="sm"
//         fullWidth
//       >
//         <DialogTitle sx={{ color: 'black' }}>Book Accommodation</DialogTitle>
//         <DialogContent>
//           {selectedAccommodation && (
//             <Box sx={{ mt: 2 }}>
//               <Typography variant="h6" gutterBottom sx={{ color: 'black' }}>
//                 {selectedAccommodation.name}
//               </Typography>
//               <Typography variant="body2" color="text.secondary" gutterBottom>
//                 Price: {formatZAR(selectedAccommodation.price)}
//               </Typography>
              
//               <TextField
//                 fullWidth
//                 type="number"
//                 label="Number of Guests"
//                 value={bookingData.numberOfGuests}
//                 onChange={(e) => {
//                   const value = Math.max(1, parseInt(e.target.value) || 1);
//                   setBookingData(prev => ({ ...prev, numberOfGuests: value }));
//                 }}
//                 InputProps={{ inputProps: { min: 1, max: MAX_GUESTS[selectedAccommodation.name] } }}
//                 helperText={`Maximum ${MAX_GUESTS[selectedAccommodation.name]} guests allowed`}
//                 sx={{ mb: 2 }}
//               />

//               <LocalizationProvider dateAdapter={AdapterDateFns}>
//                 <Box sx={{ mt: 3, mb: 2 }}>
//                   <DateTimePicker
//                     label="Check-in Date & Time"
//                     value={bookingData.checkInDate}
//                     onChange={(newValue) => {
//                       setBookingData(prev => ({ ...prev, checkInDate: newValue }));
//                     }}
//                     renderInput={(params) => <TextField {...params} fullWidth />}
//                     minDateTime={new Date()}
//                   />
//                 </Box>
//                 <Box sx={{ mb: 2 }}>
//                   <DateTimePicker
//                     label="Check-out Date & Time"
//                     value={bookingData.checkOutDate}
//                     onChange={(newValue) => {
//                       setBookingData(prev => ({ ...prev, checkOutDate: newValue }));
//                     }}
//                     renderInput={(params) => <TextField {...params} fullWidth />}
//                     minDateTime={bookingData.checkInDate || new Date()}
//                   />
//                 </Box>
//               </LocalizationProvider>
//             </Box>
//           )}
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleBookingClose} sx={{ color: 'black' }}>Cancel</Button>
//           <Button
//             onClick={handleBookingSubmit}
//             variant="contained"
//             sx={{ bgcolor: 'black', '&:hover': { bgcolor: '#333' } }}
//             disabled={bookingStatus === 'loading'}
//           >
//             {bookingStatus === 'loading' ? <CircularProgress size={24} /> : 'Confirm Booking'}
//           </Button>
//         </DialogActions>
      
//         </Dialog>

// {/* Success/Error Snackbar */}
// <Snackbar
//   open={snackbarOpen}
//   autoHideDuration={6000}
//   onClose={() => {
//     setSnackbarOpen(false);
//     dispatch(clearBookingStatus());
//   }}
// >
//   <Alert
//     onClose={() => {
//       setSnackbarOpen(false);
//       dispatch(clearBookingStatus());
//     }}
//     severity={bookingStatus === 'succeeded' ? 'success' : 'error'}
//     sx={{ width: '100%' }}
//   >
//     {bookingStatus === 'succeeded'
//       ? 'Booking confirmed successfully!'
//       : error || bookingError || 'Please fill in all required fields'}
//   </Alert>
// </Snackbar>

// {/* Payment Form Dialog */}
// <PaymentForm
//   open={paymentOpen}
//   onClose={() => setPaymentOpen(false)}
//   bookingDetails={{
//     accommodationName: selectedAccommodation?.name,
//     checkInDate: bookingData.checkInDate,
//     checkOutDate: bookingData.checkOutDate,
//     numberOfGuests: bookingData.numberOfGuests,
//     price: selectedAccommodation?.price
//   }}
//   onPaymentComplete={handlePaymentComplete}
// />

// </Box>
// );
// }

// export default Accommodation;


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
import { clearPaymentStatus } from '../redux/slices/paymentSlice';
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

const MAX_GUESTS = {
  'Conference Hall': 250,
  'Spa': 10,
  'Honeymoon Suite': 2,
  'Standard Room': 10
};

function Accommodation() {
  const dispatch = useDispatch();
  const bookingStatus = useSelector((state) => state.booking.status);
  const bookingError = useSelector((state) => state.booking.error);
  const paymentSuccess = useSelector((state) => state.payment.paymentSuccess);

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


  