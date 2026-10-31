========================================================================
LIBRARY MANAGEMENT SYSTEM (LMS) - SETUP GUIDE
========================================================================

Follow these detailed steps to set up and run the project locally.

------------------------------------------------------------------------
PREREQUISITES
------------------------------------------------------------------------
- Node.js installed (v18 or higher is recommended).
- MongoDB Atlas cluster account (or existing MongoDB Atlas connection URI).

------------------------------------------------------------------------
STEP 1: BACKEND SETUP
------------------------------------------------------------------------
1. Open your terminal and navigate to the backend folder:
   cd backend

2. Install all dependencies:
   npm install

3. Configure your Environment Variables:
   - Your backend/.env file must have your MongoDB Atlas URI:
     MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/library_management_db?retryWrites=true&w=majority"
   - Refer to .env.sample for other optional settings (PORT, JWT_SECRET, RAZORPAY_KEY, etc.).

4. Start the backend development server:
   npm run dev

The backend server will run at: http://localhost:3000

------------------------------------------------------------------------
STEP 2: FRONTEND SETUP
------------------------------------------------------------------------
1. Open a new terminal and navigate to the frontend folder:
   cd frontend

2. Install all dependencies:
   npm install

3. Configure your Environment Variables:
   - frontend/.env:
     VITE_API_URL=http://localhost:3000/api

4. Start the frontend development server:
   npm run dev

The frontend application will run at: http://localhost:5173

------------------------------------------------------------------------
DEFAULT / SEEDED ACCOUNTS
------------------------------------------------------------------------
User accounts are stored online in your MongoDB Atlas database.
Refer to your database or seeded accounts (e.g. admin@admin.com).

------------------------------------------------------------------------
SYSTEM ARCHITECTURE
------------------------------------------------------------------------
1. Database:
   - 100% cloud-hosted on MongoDB Atlas via MONGODB_URI in backend/.env.
   - All operations (students, admissions, attendance, payments, shifts, seats) 
     execute directly against MongoDB Atlas.
   - No local offline database or SQLite/SQL files are used.

2. Library Admin:
   - The standalone library-admin section has been decoupled into its own repo.
   - This repository contains the full Backend API (Node.js + Express + Mongoose)
     and the Client Frontend (React 19 + Vite).
