import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import store from './redux/store';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
// Replace 'your_publishable_key' with your actual Stripe publishable key
const stripePromise = loadStripe('pk_test_RIXll9Ms047XX7GIsxcYWs5Y00vFwwnGgB');

// Stripe configuration options
const stripeOptions = {
  fonts: [
    {
      cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
    },
  ],
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Elements stripe={stripePromise} options={stripeOptions}>
        <App />
      </Elements>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();