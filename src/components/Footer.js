import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Grid,
  Divider,
  IconButton,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  Phone,
  Email,
  LocationOn,
} from '@mui/icons-material';

function Footer() {
  const theme = useTheme();

  const socialLinks = [
    { icon: <Facebook />, url: '#', label: 'Facebook' },
    { icon: <Twitter />, url: '#', label: 'Twitter' },
    { icon: <Instagram />, url: '#', label: 'Instagram' },
    { icon: <LinkedIn />, url: '#', label: 'LinkedIn' },
  ];

  const contactInfo = [
    { icon: <Phone />, text: '+27 78 029 6288' },
    { icon: <Email />, text: 'contact@steadyhotel.com' },
    { icon: <LocationOn />, text: 'Block 8 Thulani 36 street Snakepark Soweto, 1863' },
  ];

  const footerLinks = [
    { title: 'About Us', href: '/about' },
    { title: 'Contact Us', href: '/contact' },
    { title: 'Accommodations', href: '/accommodations' },
    { title: 'Profile', href: '/profile' },
    { title: 'Terms and Conditions', href: '/terms' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'black', // Changed from primary.main to black
        color: 'primary.contrastText',
        pt: 6,
        pb: 3,
        position: 'relative',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Contact Information */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Contact Us
            </Typography>
            <Stack spacing={2}>
              {contactInfo.map((contact, index) => (
                <Stack
                  key={index}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ color: 'primary.contrastText' }}
                >
                  {contact.icon}
                  <Typography variant="body2">{contact.text}</Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>

          {/* Navigation Links */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Quick Links
            </Typography>
            <Stack spacing={1}>
              {footerLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  sx={{
                    color: 'primary.contrastText',
                    textDecoration: 'none',
                    '&:hover': {
                      color: 'secondary.main',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {link.title}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Map */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Location
            </Typography>
            <Box
              component="iframe"
              title="Steady Hotel Location"
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d14316.114454160583!2d27.8262675!3d-26.2282598!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e95a370271c9caf%3A0x681c783f9fd7672!2sMalloya%20Group!5e0!3m2!1sen!2sza!4v1730361999396!5m2!1sen!2sza"
              sx={{
                width: '100%',
                height: 200,
                border: 'none',
                borderRadius: 1,
              }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Grid>
        </Grid>

        {/* Social Media Links */}
        <Box sx={{ mt: 4, mb: 3 }}>
          <Divider sx={{ mb: 3, borderColor: 'rgba(255, 255, 255, 0.12)' }} />
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            alignItems="center"
          >
            {socialLinks.map((social, index) => (
              <IconButton
                key={index}
                href={social.url}
                aria-label={social.label}
                sx={{
                  color: 'primary.contrastText',
                  '&:hover': {
                    color: 'secondary.main',
                  },
                }}
              >
                {social.icon}
              </IconButton>
            ))}
          </Stack>
        </Box>

        {/* Copyright */}
        <Typography
          variant="body2"
          align="center"
          sx={{ mt: 2, opacity: 0.7 }}
        >
          © {new Date().getFullYear()} Steady Hotel, a division of Malloya Group. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;