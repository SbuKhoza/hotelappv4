import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../service/Firebase';

// Create booking async thunk
export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData, { rejectWithValue }) => {
    console.log('Debug Log: Creating booking in Firebase', bookingData);
    try {
      // Ensure db is properly initialized
      if (!db) {
        console.error('Debug Log: Firestore database not initialized');
        throw new Error('Firestore database not initialized');
      }
      
      // Reference to the bookings collection
      const bookingsCollection = collection(db, 'bookings');
      
      // Add the booking to Firestore
      const bookingRef = await addDoc(bookingsCollection, bookingData);
      
      console.log('Debug Log: Booking created with ID:', bookingRef.id);
      return {
        id: bookingRef.id,
        ...bookingData
      };
    } catch (error) {
      console.error('Debug Log: Error creating booking:', error);
      return rejectWithValue(error.message);
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    bookings: [],
    status: 'idle',
    error: null,
    currentBooking: null
  },
  reducers: {
    clearBookingStatus: (state) => {
      console.log('Debug Log: Clearing booking status');
      state.status = 'idle';
      state.error = null;
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.pending, (state) => {
        console.log('Debug Log: Booking creation pending');
        state.status = 'loading';
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        console.log('Debug Log: Booking creation fulfilled', action.payload);
        state.status = 'succeeded';
        state.bookings.push(action.payload);
        state.currentBooking = action.payload;
      })
      .addCase(createBooking.rejected, (state, action) => {
        console.log('Debug Log: Booking creation rejected', action.payload);
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearBookingStatus, setCurrentBooking } = bookingSlice.actions;

export default bookingSlice.reducer;