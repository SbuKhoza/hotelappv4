// store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import bookingReducer from './slices/bookingSlice';
import paymentReducer from './slices/PaymentSlice';
import authSliceReducer

const store = configureStore({
  reducer: {
    user: userReducer,
    booking: bookingReducer,
    payment: paymentReducer,
    auth: authSliceReducer,
    
  },
});

export default store;
