import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../service/Firebase';

// Async thunk for creating a booking
export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData) => {
    try {
      // Check if the accommodation is available for the selected dates
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('accommodationId', '==', bookingData.accommodationId),
        where('checkInDate', '<=', bookingData.checkOutDate),
        where('checkOutDate', '>=', bookingData.checkInDate)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error('Accommodation is not available for the selected dates');
      }

      // If available, create the booking
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        createdAt: new Date().toISOString(),
        status: 'confirmed'
      });

      return { id: docRef.id, ...bookingData };
    } catch (error) {
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