# Gamer Store App

A full-stack gaming store application built with React, Vite, Express, and Firebase.

## Features

- **Game Catalog**: Browse and search for games and digital products.
- **User Profiles**: Manage your profile, owned games, and wishlist.
- **Wallet System**: Recharge and use your wallet for purchases.
- **Steam Integration**: Link your Steam account for personalized recommendations.
- **Secure Checkout**: Integrated with Stripe for secure payments.
- **Admin Dashboard**: Manage orders, products, and user roles.

## Setup

### Environment Variables

Create a `.env` file in the root directory and add the following variables:

```env
GEMINI_API_KEY=your_gemini_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STEAM_API_KEY=your_steam_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide React, Motion.
- **Backend**: Express, Vite Middleware.
- **Database**: Firestore.
- **Authentication**: Firebase Auth (Google Login).
- **Payments**: Stripe.
- **AI**: Google Gemini API.
