import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../service/Firebase';

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData) => {
    try {
      // Ensure db is properly initialized
      if (!db) {
        throw new Error('Firestore database not initialized');
      }

      // Reference to the bookings collection
      const bookingsCollection = collection(db, 'bookings');

      // Check for existing bookings
      const q = query(
        bookingsCollection,
        where('accommodationId', '==', bookingData.accommodationId),
        where('checkInDate', '<=', bookingData.checkOutDate),
        where('checkOutDate', '>=', bookingData.checkInDate),
        where('status', 'in', ['pending', 'confirmed'])
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error('Accommodation is not available for the selected dates');
      }

      // Format dates as ISO strings if they're Date objects
      const formattedBookingData = {
        ...bookingData,
        checkInDate: bookingData.checkInDate instanceof Date 
          ? bookingData.checkInDate.toISOString() 
          : bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate instanceof Date 
          ? bookingData.checkOutDate.toISOString() 
          : bookingData.checkOutDate,
        createdAt: new Date().toISOString(),
        status: 'pending',
        paymentStatus: 'completed',
        updatedAt: new Date().toISOString()
      };

      // Add the booking to Firestore
      const bookingRef = await addDoc(bookingsCollection, formattedBookingData);
      
      console.log('Booking created with ID:', bookingRef.id);

      return {
        id: bookingRef.id,
        ...formattedBookingData
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    bookings: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    clearBookingStatus: (state) => {
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.bookings.push(action.payload);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { clearBookingStatus } = bookingSlice.actions;
export default bookingSlice.reducer;