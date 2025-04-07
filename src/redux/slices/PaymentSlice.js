// PaymentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../service/Firebase';

// Create async thunk for handling payment success
export const handlePaymentSuccess = createAsyncThunk(
  'payment/handlePaymentSuccess',
  async (paymentDetails, { dispatch }) => {
    console.log('Payment success handler called with details:', paymentDetails);
    try {
      return paymentDetails;
    } catch (error) {
      console.error('Error in handlePaymentSuccess:', error);
      throw error;
    }
  }
);

// Create async thunk for creating order after payment
export const createOrderAfterPayment = createAsyncThunk(
  'payment/createOrderAfterPayment',
  async (orderData, { rejectWithValue }) => {
    console.log('Starting createOrderAfterPayment with data:', orderData);
    
    try {
      // Ensure db is properly initialized
      console.log('Checking Firestore db object for orders:', db ? 'initialized' : 'not initialized');
      
      if (!db) {
        console.error('Firestore database not initialized for order creation');
        throw new Error('Firestore database not initialized');
      }

      // Reference to the orders collection
      console.log('Creating reference to orders collection');
      const ordersCollection = collection(db, 'orders');
      
      // Prepare data with server timestamp
      const orderWithTimestamp = {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add the order to Firestore
      console.log('Attempting to add order to Firestore...');
      const orderRef = await addDoc(ordersCollection, orderWithTimestamp);
      
      console.log('Order created successfully with ID:', orderRef.id);

      return {
        id: orderRef.id,
        ...orderData  // Keep original timestamps for UI display
      };
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
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
      state.status = 'idle';
      state.error = null;
      state.paymentSuccess = false;
      state.paymentDetails = null;
      state.orderStatus = 'idle';
      state.orderDetails = null;
    },
    setPaymentSuccess: (state, action) => {
      state.paymentSuccess = true;
      state.paymentDetails = action.payload;
      state.status = 'succeeded';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(handlePaymentSuccess.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(handlePaymentSuccess.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.paymentSuccess = true;
        state.paymentDetails = action.payload;
      })
      .addCase(handlePaymentSuccess.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createOrderAfterPayment.pending, (state) => {
        state.orderStatus = 'loading';
      })
      .addCase(createOrderAfterPayment.fulfilled, (state, action) => {
        state.orderStatus = 'succeeded';
        state.orderDetails = action.payload;
      })
      .addCase(createOrderAfterPayment.rejected, (state, action) => {
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