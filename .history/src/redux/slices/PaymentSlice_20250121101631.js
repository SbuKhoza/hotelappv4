import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Create async thunk for handling payment success
export const handlePaymentSuccess = createAsyncThunk(
  'payment/handlePaymentSuccess',
  async (paymentDetails, { dispatch }) => {
    try {
      return paymentDetails;
    } catch (error) {
      throw error;
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    status: 'idle',
    error: null,
    paymentSuccess: false,
    paymentDetails: null
  },
  reducers: {
    clearPaymentStatus: (state) => {
      state.status = 'idle';
      state.error = null;
      state.paymentSuccess = false;
      state.paymentDetails = null;
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
      });
  },
});

export const { clearPaymentStatus, setPaymentSuccess } = paymentSlice.actions;

export const selectPaymentStatus = (state) => state.payment.status;
export const selectPaymentError = (state) => state.payment.error;
export const selectPaymentSuccess = (state) => state.payment.paymentSuccess;
export const selectPaymentDetails = (state) => state.payment.paymentDetails;

export default paymentSlice.reducer;