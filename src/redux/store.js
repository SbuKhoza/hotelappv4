// store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import bookingReducer from './slices/bookingSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    booking: bookingReducer,
    // Add other reducers here if needed
  },
});

export default store;
