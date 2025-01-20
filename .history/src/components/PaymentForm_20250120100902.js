// Updated price formatting helper
const formatZAR = (amount) => {
  // First, ensure we have a valid input
  if (amount === null || amount === undefined) {
    console.warn('Received null or undefined amount');
    return 'R 0.00';
  }

  try {
    let number;
    
    // Handle different input types
    if (typeof amount === 'object' && amount !== null) {
      number = parseFloat(amount.value || 0);
    } else if (typeof amount === 'string') {
      // Remove 'R', spaces, and commas, then convert to number
      const cleanString = amount.replace(/[^0-9.-]+/g, '');
      number = parseFloat(cleanString);
    } else if (typeof amount === 'number') {
      number = amount;
    } else {
      number = 0;
    }

    // Check if we have a valid number
    if (isNaN(number)) {
      console.warn('Invalid amount value:', amount);
      return 'R 0.00';
    }

    // Format the number
    return `R ${number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  } catch (error) {
    console.error('Error formatting price:', error);
    return 'R 0.00';
  }
};

// Updated price formatting logic in component
const formattedPrice = (() => {
  try {
    const price = bookingDetails?.price;
    
    // Handle undefined or null price
    if (price === undefined || price === null) {
      console.warn('No price provided in booking details');
      return '0.00';
    }

    // Handle different price formats
    let number;
    if (typeof price === 'string') {
      // Remove currency symbol, spaces, and commas
      const cleanPrice = price.replace(/[^0-9.-]+/g, '');
      number = parseFloat(cleanPrice);
    } else if (typeof price === 'number') {
      number = price;
    } else {
      console.warn('Invalid price format:', price);
      return '0.00';
    }

    if (isNaN(number)) {
      console.warn('Price could not be parsed to number:', price);
      return '0.00';
    }

    return number.toFixed(2);
  } catch (error) {
    console.error('Error processing price:', error);
    return '0.00';
  }
})();

// Updated Firebase transaction code for price comparison
const updateFirebaseAfterPayment = async (paymentData) => {
  if (!currentUser?.uid) {
    throw new Error('User not authenticated');
  }

  try {
    const result = await runTransaction(db, async (transaction) => {
      // ... existing code ...

      // Safely parse and compare prices
      const accommodationPrice = (() => {
        const price = accommodationData.price;
        if (typeof price === 'string') {
          return parseFloat(price.replace(/[^0-9.-]+/g, ''));
        }
        return parseFloat(price || 0);
      })();

      const bookingPrice = (() => {
        const price = bookingDetails.price;
        if (typeof price === 'string') {
          return parseFloat(price.replace(/[^0-9.-]+/g, ''));
        }
        return parseFloat(price || 0);
      })();

      if (isNaN(accommodationPrice) || isNaN(bookingPrice)) {
        throw new Error('Invalid price format');
      }

      if (accommodationPrice !== bookingPrice) {
        throw new Error('Price has changed. Please refresh and try again.');
      }

      // ... rest of the transaction code ...
    });

    return result;
  } catch (error) {
    console.error('Firebase transaction error:', error);
    throw new Error(error.message || 'An error occurred during booking');
  }
};