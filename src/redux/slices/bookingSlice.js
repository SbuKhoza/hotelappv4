import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../service/Firebase';
import { collection, addDoc } from 'firebase/firestore';

// Define the initial state
const initialState = {
  bookings: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  currentBooking: null,
};

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
      const bookingRef = await addDoc(bookingsCollection, {
        ...bookingData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('Debug Log: Booking created with ID:', bookingRef.id);
      return {
        id: bookingRef.id,
        ...bookingData
      };
    } catch (error) {
      console.error('Debug Log: Error creating booking:', error);
      return rejectWithValue(error.message || 'Failed to create booking');
    }
  }
);

// Create the booking slice
const bookingSlice = createSlice({
  name: 'booking',
  initialState,
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
        state.status = 'loading';
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Add the new booking to the state
        state.bookings = [...state.bookings, action.payload];
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const { clearBookingStatus, setCurrentBooking } = bookingSlice.actions;
export default bookingSlice.reducer;