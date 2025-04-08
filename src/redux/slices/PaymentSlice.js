import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../service/Firebase';
import { collection, addDoc } from 'firebase/firestore';

// Define the initial state
const initialState = {
  paymentStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  paymentError: null,
  orderStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  orderError: null,
  orderId: null,
  paymentSuccess: false,
  paymentDetails: null,
};

// Create async thunk for creating order after payment
export const createOrderAfterPayment = createAsyncThunk(
  'payment/createOrderAfterPayment',
  async (orderData, { rejectWithValue }) => {
    console.log('Debug Log: Creating order after payment in Firebase', orderData);
    try {
      // Ensure db is properly initialized
      if (!db) {
        console.error('Debug Log: Firestore database not initialized');
        throw new Error('Firestore database not initialized');
      }
      
      // Reference to the orders collection
      const ordersCollection = collection(db, 'orders');
      
      // Add the order to Firestore with timestamp
      const orderRef = await addDoc(ordersCollection, {
        ...orderData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('Debug Log: Order created with ID:', orderRef.id);
      return {
        id: orderRef.id,
        ...orderData
      };
    } catch (error) {
      console.error('Debug Log: Error creating order:', error);
      return rejectWithValue(error.message || 'Failed to create order');
    }
  }
);

// Create the payment slice
const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentStatus: (state) => {
      console.log('Debug Log: Clearing payment status');
      state.paymentStatus = 'idle';
      state.paymentError = null;
      state.orderStatus = 'idle';
      state.orderError = null;
    },
    setPaymentSuccess: (state, action) => {
      console.log('Debug Log: Setting payment success', action.payload);
      state.paymentStatus = 'succeeded';
      state.paymentSuccess = true;
      state.paymentDetails = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrderAfterPayment.pending, (state) => {
        state.orderStatus = 'loading';
      })
      .addCase(createOrderAfterPayment.fulfilled, (state, action) => {
        state.orderStatus = 'succeeded';
        state.orderId = action.payload.id;
        state.orderError = null;
      })
      .addCase(createOrderAfterPayment.rejected, (state, action) => {
        state.orderStatus = 'failed';
        state.orderError = action.payload;
      });
  },
});

// Export actions and reducer
export const { clearPaymentStatus, setPaymentSuccess } = paymentSlice.actions;
export default paymentSlice.reducer;