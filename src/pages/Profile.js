import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { auth } from '../service/Firebase';
import { updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { setUser } from '../redux/slices/userSlice';
import { 
  Button, 
  TextField, 
  CircularProgress, 
  Box, 
  Typography, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Avatar,
  IconButton,
  Paper,
  Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Input = styled('input')({
  display: 'none',
});

const StyledCard = styled(Paper)(({ theme }) => ({
  width: 400,
  height: 200,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: theme.spacing(3),
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[10],
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: theme.shadows[20],
  },
}));

function Profile() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    profilePicture: null
  });
  const [editMode, setEditMode] = useState({
    email: false,
    phone: false,
  });
  const [openPopup, setOpenPopup] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const fileInputRef = useRef();

  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    if (user) {
      setUserInfo({
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        profilePicture: user.photoURL || null
      });
    }
  }, [user]);

  const handleView = async () => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserInfo({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          profilePicture: userData.profilePicture || null
        });
      }
      setOpenPopup(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setSnackbar({ open: true, message: 'Error fetching user data. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field) => {
    setEditMode((prev) => ({ ...prev, [field]: true }));
    setUnsavedChanges(true);
  };

  const handleChange = (field, value) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  const handleClose = () => {
    if (unsavedChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        setOpenPopup(false);
        setEditMode({ email: false, phone: false });
        setUnsavedChanges(false);
      }
    } else {
      setOpenPopup(false);
      setEditMode({ email: false, phone: false });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        profilePicture: userInfo.profilePicture
      });

      await updateProfile(auth.currentUser, {
        displayName: userInfo.name,
        photoURL: userInfo.profilePicture
      });

      dispatch(setUser({
        ...auth.currentUser,
        displayName: userInfo.name,
        photoURL: userInfo.profilePicture
      }));

      setUnsavedChanges(false);
      setOpenPopup(false);
      setSnackbar({ open: true, message: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({ open: true, message: 'Error updating profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const storageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        setUserInfo(prev => ({ ...prev, profilePicture: downloadURL }));
        setUnsavedChanges(true);
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        setSnackbar({ open: true, message: 'Error uploading profile picture. Please try again.' });
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'grey.100' }}>
      <StyledCard elevation={10}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AccountCircleIcon sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h5" component="div">
            User Profile
          </Typography>
        </Box>
        {loading ? (
          <CircularProgress sx={{ alignSelf: 'center' }} />
        ) : (
          <Typography variant="body1" sx={{ mb: 2 }}>
            Click "View Profile" to see and edit your information.
          </Typography>
        )}
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={handleView}
          sx={{ 
            alignSelf: 'flex-start',
            color: 'primary.main',
            bgcolor: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'grey.100',
            }
          }}
        >
          View Profile
        </Button>
      </StyledCard>

      <Dialog 
        open={openPopup} 
        onClose={handleClose} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24,
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 2 }}>
          User Profile Information
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={userInfo.profilePicture}
              sx={{ width: 100, height: 100, mb: 2 }}
            />
            <label htmlFor="icon-button-file">
              <Input
                accept="image/*"
                id="icon-button-file"
                type="file"
                onChange={handleProfilePictureUpload}
                ref={fileInputRef}
              />
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
              >
                <CameraAltIcon />
              </IconButton>
            </label>
          </Box>

          <Box sx={{ my: 2 }}>
            <Typography variant="h6">{userInfo.name}</Typography>
          </Box>

          <Box sx={{ my: 2 }}>
            {editMode.email ? (
              <TextField
                fullWidth
                label="Email"
                value={userInfo.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => setEditMode((prev) => ({ ...prev, email: false }))}
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>{userInfo.email}</Typography>
                <Button onClick={() => handleEdit('email')} size="small">
                  Edit
                </Button>
              </Box>
            )}
          </Box>

          <Box sx={{ my: 2 }}>
            {editMode.phone ? (
              <TextField
                fullWidth
                label="Phone"
                value={userInfo.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => setEditMode((prev) => ({ ...prev, phone: false }))}
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>{userInfo.phone}</Typography>
                <Button onClick={() => handleEdit('phone')} size="small">
                  Edit
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'grey.100' }}>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained" disabled={!unsavedChanges || loading}>
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}

export default Profile;