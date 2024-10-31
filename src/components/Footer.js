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
    { icon: <Phone />, text: '+1 (555) 123-4567' },
    { icon: <Email />, text: 'contact@steadyhotel.com' },
    { icon: <LocationOn />, text: '123 Hotel Street, City, Country' },
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
        backgroundColor: 'primary.main',
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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.8354345095277!2d144.96305761531!3d-37.816279442021254!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577c8bcbd4f94a!2sSteady%20Hotel!5e0!3m2!1sen!2sus!4v1670000000000!5m2!1sen!2sus"
              sx={{
                width: '100%',
                height: 200,
                border: 'none',
                borderRadius: 1,
              }}
              loading="lazy"
              allowFullScreen
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