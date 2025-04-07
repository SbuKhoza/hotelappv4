// bookingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../service/Firebase';

// Test function to verify Firebase connection
const testFirestore = async () => {
  try {
    const testCollection = collection(db, 'test_connection');
    const result = await addDoc(testCollection, { 
      timestamp: serverTimestamp(),
      testField: "Connection test" 
    });
    console.log("Firestore test successful, doc ID:", result.id);
    return true;
  } catch (error) {
    console.error("Firestore test failed:", error);
    return false;
  }
};

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData, { rejectWithValue }) => {
    console.log('Starting createBooking thunk with data:', bookingData);
    
    try {
      // Validate DB connection
      console.log('Checking Firestore db object:', db ? 'initialized' : 'not initialized');
      
      if (!db) {
        console.error('Firestore database not initialized');
        throw new Error('Firestore database not initialized');
      }

      // Optional: Test Firestore connection first
      console.log('Testing Firestore connection...');
      const testResult = await testFirestore();
      if (!testResult) {
        console.error('Test write to Firestore failed');
      } else {
        console.log('Test write to Firestore succeeded');
      }

      // Reference to the bookings collection
      console.log('Creating reference to bookings collection');
      const bookingsCollection = collection(db, 'bookings');
      
      // Prepare data with server timestamp
      const bookingWithTimestamp = {
        ...bookingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add the booking to Firestore
      console.log('Attempting to add booking to Firestore...');
      const bookingRef = await addDoc(bookingsCollection, bookingWithTimestamp);
      
      console.log('Booking created successfully with ID:', bookingRef.id);

      return {
        id: bookingRef.id,
        ...bookingData  // Keep original timestamps for UI display
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
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
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearBookingStatus } = bookingSlice.actions;
export default bookingSlice.reducer;