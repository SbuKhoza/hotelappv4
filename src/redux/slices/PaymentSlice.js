import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../service/Firebase';

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
      
      // Add the order to Firestore
      const orderRef = await addDoc(ordersCollection, orderData);
      
      console.log('Debug Log: Order created with ID:', orderRef.id);
      return {
        id: orderRef.id,
        ...orderData
      };
    } catch (error) {
      console.error('Debug Log: Error creating order:', error);
      return rejectWithValue(error.message);
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    status: 'idle',
    error: null,
    paymentSuccess: false,
    paymentDetails: null,
    orderStatus: 'idle',
    orderDetails: null
  },
  reducers: {
    clearPaymentStatus: (state) => {
      console.log('Debug Log: Clearing payment status');
      state.status = 'idle';
      state.error = null;
      state.paymentSuccess = false;
      state.paymentDetails = null;
      state.orderStatus = 'idle';
      state.orderDetails = null;
    },
    setPaymentSuccess: (state, action) => {
      console.log('Debug Log: Setting payment success', action.payload);
      state.paymentSuccess = true;
      state.paymentDetails = action.payload;
      state.status = 'succeeded';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrderAfterPayment.pending, (state) => {
        console.log('Debug Log: Order creation pending');
        state.orderStatus = 'loading';
      })
      .addCase(createOrderAfterPayment.fulfilled, (state, action) => {
        console.log('Debug Log: Order creation fulfilled', action.payload);
        state.orderStatus = 'succeeded';
        state.orderDetails = action.payload;
      })
      .addCase(createOrderAfterPayment.rejected, (state, action) => {
        console.log('Debug Log: Order creation rejected', action.payload);
        state.orderStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearPaymentStatus, setPaymentSuccess } = paymentSlice.actions;

export const selectPaymentStatus = (state) => state.payment.status;
export const selectPaymentError = (state) => state.payment.error;
export const selectPaymentSuccess = (state) => state.payment.paymentSuccess;
export const selectPaymentDetails = (state) => state.payment.paymentDetails;
export const selectOrderStatus = (state) => state.payment.orderStatus;
export const selectOrderDetails = (state) => state.payment.orderDetails;

export default paymentSlice.reducer;