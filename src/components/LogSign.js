import React, { useState } from 'react';
import { Button, TextField, Box, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth } from '../service/Firebase'; // Import Firebase authentication
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/slices/userSlice'; // Redux action to set user

function LogSign() {
  const [isLogin, setIsLogin] = useState(true); // State to toggle login/signup
  const [loading, setLoading] = useState(false); // Loader state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate(); // For navigation
  const dispatch = useDispatch();

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // Show loader

    try {
      if (isLogin) {
        // Handle login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        dispatch(setUser({ email: user.email, uid: user.uid }));
        navigate('/'); // Redirect to home page
      } else {
        // Handle signup
        if (password !== confirmPassword) {
          alert('Passwords do not match!');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        dispatch(setUser({ email: user.email, uid: user.uid, name }));
        navigate('/'); // Redirect to home page
      }
    } catch (error) {
      console.error('Error during authentication', error);
      alert(error.message);
    } finally {
      setLoading(false); // Stop loader
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: 2,
      }}
    >
      <Typography variant="h4" gutterBottom>
        {isLogin ? 'Login' : 'Signup'}
      </Typography>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <TextField
            fullWidth
            label="Name"
            variant="outlined"
            margin="normal"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <TextField
          fullWidth
          label="Email"
          variant="outlined"
          margin="normal"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          fullWidth
          label="Password"
          variant="outlined"
          margin="normal"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {!isLogin && (
          <TextField
            fullWidth
            label="Confirm Password"
            variant="outlined"
            margin="normal"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        )}

        <Button
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          type="submit"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : isLogin ? 'Login' : 'Sign Up'}
        </Button>
      </form>

      <Button variant="text" onClick={toggleForm} sx={{ mt: 1 }}>
        {isLogin ? 'Don’t have an account? Sign Up' : 'Already have an account? Login'}
      </Button>
    </Box>
  );
}

export default LogSign;
