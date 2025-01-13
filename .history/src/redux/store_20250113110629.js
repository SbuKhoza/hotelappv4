// store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import bookingReducer from './slices/bookingSlice';
import paymentReducer from './slices/PaymentSlice';
import authsliceReducer from './slices/'

const store = configureStore({
  reducer: {
    user: userReducer,
    booking: bookingReducer,
    payment: paymentReducer,
    auth: authsliceReducer,
    
  },
});

export default store;
