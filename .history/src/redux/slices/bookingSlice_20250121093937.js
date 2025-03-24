// bookingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../service/Firebase';

// Helper function to convert dates to Firestore Timestamps
const convertDatesToTimestamps = (bookingData) => {
  return {
    ...bookingData,
    checkInDate: Timestamp.fromDate(new Date(bookingData.checkInDate)),
    checkOutDate: Timestamp.fromDate(new Date(bookingData.checkOutDate)),
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date())
  };
};

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      // Validate database connection
      if (!db) {
        throw new Error('Firestore database not initialized');
      }

      // Reference to the bookings collection
      const bookingsRef = collection(db, 'bookings');

      // Check for date conflicts
      const conflictQuery = query(
        bookingsRef,
        where('accommodationId', '==', bookingData.accommodationId),
        where('checkInDate', '<=', Timestamp.fromDate(new Date(bookingData.checkOutDate))),
        where('checkOutDate', '>=', Timestamp.fromDate(new Date(bookingData.checkInDate))),
        where('status', 'in', ['pending', 'confirmed'])
      );

      const conflictSnapshot = await getDocs(conflictQuery);
      if (!conflictSnapshot.empty) {
        return rejectWithValue('Selected dates are not available');
      }

      // Prepare booking data for Firestore
      const firestoreBookingData = convertDatesToTimestamps({
        ...bookingData,
        status: 'confirmed',
        paymentStatus: 'completed',
        bookingReference: `BOOK-${Date.now()}`,
        metadata: {
          userAgent: window.navigator.userAgent,
          bookingPlatform: 'web',
          lastUpdated: Timestamp.fromDate(new Date())
        }
      });

      // Create the booking document in Firestore
      const docRef = await addDoc(bookingsRef, firestoreBookingData);
      console.log('Booking document created with ID:', docRef.id);

      // Return the created booking with its ID
      return {
        id: docRef.id,
        ...firestoreBookingData
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Booking slice definition
const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    bookings: [],
    currentBooking: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearBookingStatus: (state) => {
      state.status = 'idle';
      state.error = null;
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.bookings.push(action.payload);
        state.currentBooking = action.payload;
        state.error = null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to create booking';
      });
  },
});

export const { clearBookingStatus, setCurrentBooking } = bookingSlice.actions;
export default bookingSlice.reducer;