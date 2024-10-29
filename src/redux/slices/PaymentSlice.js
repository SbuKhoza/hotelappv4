import { createSlice } from '@reduxjs/toolkit';

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    status: 'idle',
    error: null,
    paymentSuccess: false,
  },
  reducers: {
    clearPaymentStatus: (state) => {
      state.status = 'idle';
      state.error = null;
      state.paymentSuccess = false;
    },
    setPaymentSuccess: (state, action) => {
      state.paymentSuccess = action.payload;
    },
  },
});

export const { clearPaymentStatus, setPaymentSuccess } = paymentSlice.actions;

// Selectors
export const selectPaymentStatus = (state) => state.payment.status;
export const selectPaymentError = (state) => state.payment.error;
export const selectPaymentSuccess = (state) => state.payment.paymentSuccess;

export default paymentSlice.reducer;