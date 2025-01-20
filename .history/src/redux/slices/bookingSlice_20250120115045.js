import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../service/Firebase';

// Create a payment intent
export const createPaymentIntent = createAsyncThunk(
  'booking/createPaymentIntent',
  async (bookingData) => {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: bookingData.price,
          currency: 'ZAR',
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create payment intent');
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
);

// Confirm booking after successful payment
export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData) => {
    try {
      // Check availability
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

      // Create the booking with payment information
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        createdAt: new Date().toISOString(),
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentId: bookingData.paymentId
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
    paymentIntent: null,
    error: null,
  },
  reducers: {
    clearBookingStatus: (state) => {
      state.status = 'idle';
      state.error = null;
      state.paymentIntent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPaymentIntent.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.status = 'payment_ready';
        state.paymentIntent = action.payload;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
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