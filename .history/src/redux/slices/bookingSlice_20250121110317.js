// bookingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc } from 'firebase/firestore';
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

      // Add the booking to Firestore
      const bookingRef = await addDoc(bookingsCollection, bookingData);
      
      console.log('Booking created with ID:', bookingRef.id);

      return {
        id: bookingRef.id,
        ...bookingData
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