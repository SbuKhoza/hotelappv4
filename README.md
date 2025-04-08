# Steady Hotel App

## Overview

Steady Hotel is a modern hotel booking application that provides users with a seamless experience to search, book, and manage their hotel accommodations. The application is built with React and integrates with Firebase for backend services.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Firebase Configuration](#firebase-configuration)
- [State Management](#state-management)
- [Available Scripts](#available-scripts)
- [Payment Integration](#payment-integration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- User authentication (login/signup)
- Home page with featured accommodations
- Detailed accommodation viewing
- User profile management
- Booking system with date selection
- Payment processing with Stripe 
- Responsive design for mobile and desktop

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- Firebase account
- Stripe account for payment processing

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/SbuKhoza/hotelappv4.git
   ```
    Hosted link: https://hotelappv4.vercel.app/

2. Navigate to the project directory:
   ```
   cd hotelappv4
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add your Firebase configuration:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   
   # Optional for development with Firebase emulators
   REACT_APP_USE_FIREBASE_EMULATORS=true
   
   # Payment gateway keys
   REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
   REACT_APP_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
   ```

5. Start the development server:
   ```
   npm start
   ```

## Project Structure

```
hotelappv4/
├── public/
├── src/
│   ├── components/
│   │   ├── Navbar.js
│   │   └── ... (other components)
│   ├── pages/
│   │   ├── Home.js
│   │   ├── LoginSignup.js
│   │   ├── Profile.js
│   │   ├── AccommodationPage.js
│   │   └── ... (other pages)
│   ├── store/
│   │   ├── slices/
│   │   │   ├── userSlice.js
│   │   │   ├── bookingSlice.js
│   │   │   ├── PaymentSlice.js
│   │   │   └── accommodationSlice.js
│   │   └── store.js
│   ├── firebase/
│   │   └── config.js
│   ├── App.js
│   └── index.js
├── .env
├── package.json
└── README.md
```

## Firebase Configuration

The application uses Firebase for authentication, database (Firestore), and storage. The configuration is set up in `src/firebase/config.js`. 

For development purposes, you can use Firebase emulators by setting `REACT_APP_USE_FIREBASE_EMULATORS=true` in your `.env` file.

## State Management

Redux is used for state management with the following slices:

- **userSlice**: Manages user authentication state and profile information
- **bookingSlice**: Handles booking-related state including date selection and room information
- **PaymentSlice**: Manages payment processing state
- **accommodationSlice**: Stores accommodation data and filtering options

## Available Scripts

In the project directory, you can run:

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from create-react-app configuration

## Payment Integration

The application supports multiple payment options:

1. **Stripe**: Integrated using `@stripe/react-stripe-js` and `@stripe/stripe-js` libraries
2. **Paystack**: Integrated using `react-paystack` library

To enable payments, ensure you have set up the appropriate API keys in your `.env` file.

## Deployment

To deploy the application:

1. Build the production version:
   ```
   npm run build
   ```

2. Deploy to Firebase Hosting:
   ```
   npm install -g firebase-tools
   firebase login
   firebase init (select hosting)
   firebase deploy
   ```

Alternatively, you can deploy to platforms like Netlify, Vercel, or GitHub Pages.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Sibusiso Khoza - sibusisok59@gmail.com

Project Link: [https://github.com/SbuKhoza/hotelappv4](https://github.com/SbuKhoza/hotelappv4)

---

© 2025 Steady Hotel. All Rights Reserved.