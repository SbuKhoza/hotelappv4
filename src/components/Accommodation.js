import React, { useEffect, useState } from 'react';
import { db, storage } from '../service/Firebase';
import { collection, getDocs } from "firebase/firestore";
import { ref, getDownloadURL, listAll } from "firebase/storage";
import { Card, CardMedia, CardContent, Typography, Button, Grid, Box, Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css'; 

function Accommodation() {
  const [accommodations, setAccommodations] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);

  useEffect(() => {
    const fetchAccommodations = async () => {
      const accommodationCollection = collection(db, 'accommodation');
      const accommodationSnapshot = await getDocs(accommodationCollection);
      const accommodationList = await Promise.all(accommodationSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const imagesRef = ref(storage, `accommodations/${doc.id}`);
        const imagesList = await listAll(imagesRef);
        const imageUrls = await Promise.all(
          imagesList.items.map((imageRef) => getDownloadURL(imageRef))
        );
        return { ...data, id: doc.id, imageUrls };
      }));

      console.log("Fetched accommodations:", accommodationList);
      setAccommodations(accommodationList);
    };

    fetchAccommodations();
  }, []);

  const handleClickOpen = (accommodation) => {
    setSelectedAccommodation(accommodation);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAccommodation(null);
  };

  const getAmenitiesList = (amenities) => {
    if (typeof amenities === 'object' && amenities !== null) {
      return Object.keys(amenities)
        .filter(key => amenities[key])
        .map(key => key.charAt(0).toUpperCase() + key.slice(1));
    }
    return [];
  };

  const carouselSettings = {
    showThumbs: false,
    showStatus: false,
    showIndicators: false,
    infiniteLoop: true,
    useKeyboardArrows: true,
    autoPlay: false,
    emulateTouch: true,
    swipeable: true,
  };

  return (
    <Box sx={{ flexGrow: 1, padding: 2 }}>
      <Typography varient="h1" sx={{ textAlign: 'center', fontSize: '2rem', marginBottom: 3 }}>
        Accommodations
      </Typography>
      
      <Grid container spacing={1} justifyContent="center">
        {accommodations.map((accommodation) => (
          <Grid item xs={12} sm={6} md={3} key={accommodation.id} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Card sx={{ width: '100%', maxWidth: 280, m: 0.5 }}>
              <CardMedia
                component="img"
                height="200"
                image={accommodation.imageUrls[0] || 'defaultImage.jpg'}
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
                  Guests: {accommodation.guests || 'Not specified'}
                </Typography>
                <Typography variant="subtitle1">
                  Amenities: {getAmenitiesList(accommodation.amenities).join(', ') || 'No amenities available'}
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

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': { 
            width: '60%', 
            height: '90vh',
            '& .carousel .slide img': {
              maxHeight: '50vh',
              objectFit: 'contain'
            },
            '& .carousel .control-arrow': {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: '20px',
              opacity: 0.8,
              transition: 'opacity 0.2s ease-in-out',
              '&:hover': {
                opacity: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        }}
      >
        {selectedAccommodation && (
          <>
            <DialogTitle>{selectedAccommodation.name}</DialogTitle>
            <DialogContent>
              <Box sx={{ height: '50vh', marginBottom: '16px' }}>
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
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedAccommodation.description}
              </Typography>
              <Typography variant="subtitle1">
                Guests: {selectedAccommodation.guests || 'Not specified'}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Amenities: {getAmenitiesList(selectedAccommodation.amenities).join(', ') || 'No amenities available'}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Price: {selectedAccommodation.price}
              </Typography>
              <Button variant="contained" color="primary" fullWidth onClick={() => alert('Booking confirmed!')}>
                Book Now
              </Button>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default Accommodation;