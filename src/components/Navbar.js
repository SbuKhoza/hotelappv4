import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { styled } from '@mui/system';

const StyledAppBar = styled(AppBar)(({ isHovered }) => ({
  backgroundColor: isHovered ? 'black' : 'transparent',
  boxShadow: 'none',
  color: isHovered ? 'white' : 'black',
  transition: 'background-color 0.5s ease, color 0.5s ease', // Smooth color transition
}));

const StyledLink = styled(Link)({
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  color: 'inherit', // Inherit color from AppBar
  transition: 'color 0.5s ease', // Smooth text color change
  '&:hover': {
    color: '#f5f5f5',
  },
});

function Navbar() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isHovered, setIsHovered] = useState(false); // Track hover state
  const [loggedIn, setLoggedIn] = useState(false); // Simulate login state
  const [userName, setUserName] = useState('John Doe'); // Simulate user name

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <StyledAppBar
      position="static"
      isHovered={isHovered}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontFamily: 'serif',
            letterSpacing: '2px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)', // Subtle text shadow for a stylish look
            transition: 'color 0.5s ease', // Only change color, no scaling
          }}
        >
          STEADY HOTEL
        </Typography>

        <Button color="inherit">
          {loggedIn ? userName : <StyledLink to="/loginsignup">Login/SignUP</StyledLink>}
        </Button>

        <IconButton edge="end" color="inherit" onClick={handleMenuOpen}>
          <MenuIcon />
        </IconButton>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleMenuClose}>
            <StyledLink to="/">Home</StyledLink>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <StyledLink to="/accommodationpage">Accommodations</StyledLink>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <StyledLink to="/about">About</StyledLink>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <StyledLink to="/contact">Contact us</StyledLink>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <StyledLink to="/profile">My Dashboard</StyledLink>
          </MenuItem>
        </Menu>
      </Toolbar>
    </StyledAppBar>
  );
}

export default Navbar;
