// Banner.js
import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';

function Banner() {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsZoomed(true);
    }, 100); // Delay before zoom starts

    return () => clearTimeout(timer); // Cleanup on unmount
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        height: '500px', // Maintain height for layout
        overflow: 'hidden',
        position: 'relative', // Ensure it stays in normal layout flow
        zIndex: 1, // Keeps it on top if needed
      }}
    >
      <Box
        component="img"
        src="/images/banner.jpg"
        alt="Banner"
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'transform 10s ease', 
          transform: isZoomed ? 'scale(1.2)' : 'scale(1)', // Zoom in only
        }}
      />
    </Box>
  );
}

export default Banner;