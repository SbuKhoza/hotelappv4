import React, { useEffect, useState } from 'react';

const Banner = () => {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsZoomed(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-[500px] overflow-hidden">
      <div className="absolute inset-0 w-screen">
        <video 
          className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-in-out ${
            isZoomed ? 'scale-110' : 'scale-100'
          }`}
          autoPlay
          muted
          loop
          playsInline
          style={{ minWidth: '100vw' }}
        >
          <source src="/images/banner.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default Banner;