import React, { useEffect, useState } from 'react';
import { db } from '../service/Firebase';  // Ensure this path is correct based on your project structure
import { collection, getDocs } from "firebase/firestore";
import { Card, CardMedia, CardContent, Typography, Button, Grid, Box, Dialog, DialogContent, DialogTitle } from '@mui/material';

function Accommodation() {
  const [accommodations, setAccommodations] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);

  // Fetch accommodations from Firestore
  useEffect(() => {
    const fetchAccommodations = async () => {
      const accommodationCollection = collection(db, 'accommodation'); // Correct collection name
      const accommodationSnapshot = await getDocs(accommodationCollection);
      const accommodationList = accommodationSnapshot.docs.map(doc => doc.data());

      // Log fetched data for debugging
      console.log("Fetched accommodations:", accommodationList);

      setAccommodations(accommodationList);
    };

    fetchAccommodations();
  }, []);

  // Function to handle opening the dialog
  const handleClickOpen = (accommodation) => {
    setSelectedAccommodation(accommodation);
    setOpen(true);
  };

  // Function to handle closing the dialog
  const handleClose = () => {
    setOpen(false);
    setSelectedAccommodation(null);
  };

  // Function to convert amenities object into a list of available amenities
  const getAmenitiesList = (amenities) => {
    if (typeof amenities === 'object' && amenities !== null) {
      return Object.keys(amenities)
        .filter(key => amenities[key]) // Only include amenities that are true
        .map(key => key.charAt(0).toUpperCase() + key.slice(1)); // Capitalize the first letter of each amenity
    }
    return [];
  };

  return (
    <Box sx={{ flexGrow: 1, padding: 2 }}>
      <Grid container spacing={2}>
        {accommodations.map((accommodation, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card sx={{ maxWidth: 345 }}>
              <CardMedia
                component="img"
                height="200"
                image={accommodation.imageUrl || 'defaultImage.jpg'}
                alt={accommodation.name}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {accommodation.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {accommodation.description}
                </Typography>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Guests: {accommodation.guests ? accommodation.guests : 'Not specified'}


                </Typography>
                <Typography variant="subtitle1">
                  Amenities: {getAmenitiesList(accommodation.amenities).length > 0 
                    ? getAmenitiesList(accommodation.amenities).join(', ') 
                    : 'No amenities available'}
                </Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Price: {accommodation.price}
                </Typography>
              </CardContent>
              <Box sx={{ padding: 2 }}>
                <Button variant="contained" color="primary" fullWidth onClick={() => handleClickOpen(accommodation)}>
                  View
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Popup Dialog for viewing accommodation details */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{selectedAccommodation?.name}</DialogTitle>
        <DialogContent>
          {selectedAccommodation && (
            <Box>
              <img
                src={selectedAccommodation.imageUrl || 'defaultImage.jpg'}
                alt={selectedAccommodation.name}
                style={{ width: '100%', height: 'auto', marginBottom: '16px' }}
              />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedAccommodation.description}
              </Typography>
              <Typography variant="subtitle1">
              Guests: {selectedAccommodation?.guests ? selectedAccommodation.guests : 'Not specified'}

              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Amenities: {getAmenitiesList(selectedAccommodation.amenities).length > 0 
                  ? getAmenitiesList(selectedAccommodation.amenities).join(', ') 
                  : 'No amenities available'}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Price: {selectedAccommodation.price}
              </Typography>
              <Button variant="contained" color="primary" fullWidth onClick={() => alert('Booking confirmed!')}>
                Book Now
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Accommodation;
