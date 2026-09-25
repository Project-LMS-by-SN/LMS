========================================================================
LIBRARY MANAGEMENT SYSTEM (LMS) - SETUP GUIDE
========================================================================

Follow these detailed steps to set up and run the project locally.

------------------------------------------------------------------------
PREREQUISITES
------------------------------------------------------------------------
Make sure you have Node.js installed (v18 or higher is recommended).

------------------------------------------------------------------------
STEP 1: BACKEND SETUP
------------------------------------------------------------------------
1. Open your terminal and navigate to the backend folder:
   cd backend

2. Install all dependencies:
   npm install

3. Configure your Environment Variables:
   - Copy the ".env.sample" file and rename it to ".env":
     cp .env.sample .env
   - (Optional) Open ".env" and modify the settings (e.g. PORT, JWT_SECRET, RAZORPAY_KEY, etc.) if needed.

4. Initialize the SQLite database schema:
   npx prisma db push

5. Start the backend development server:
   npm run dev

The backend server will run at: http://localhost:3000

------------------------------------------------------------------------
STEP 2: FRONTEND SETUP
------------------------------------------------------------------------
1. Open a new terminal and navigate to the frontend folder:
   cd frontend

2. Install all dependencies:
   npm install

3. Start the frontend development server:
   npm run dev

The frontend application will run at: http://localhost:5173

------------------------------------------------------------------------
DEFAULT LOGIN CREDENTIALS
------------------------------------------------------------------------
Once both servers are running, you can log in using these default owner accounts:

- Main Admin / Owner:
  Email: admin@admin.com
  Password: 123456

- Whitelisted Pro Owners (Starter / Pro tiers):
  Email: admin100@admin.com  (PRO_100 tier - max 100 students)
  Email: admin200@admin.com  (PRO_200 tier - max 200 students)
  Password: Password123!

------------------------------------------------------------------------
FEATURES & SYSTEM BEHAVIOR
------------------------------------------------------------------------
1. Role-Based Access Control (RBAC):
   - Only accounts with role 'OWNER' can modify Shifts, configure Fee Plans, change default passwords, manage active subscriptions, delete admissions, or manually suspend members.
   - Staff accounts cannot access settings password modification, shifts, fee plan controls, manual student suspension, or student deletion.

2. Auto-Suspension System:
   - Any student who has not paid/renewed their plan for more than 15 days is automatically marked as suspended (status: DISABLED).
   - Suspended students are blocked from checking in for attendance.

3. Favicon & Title:
   - Browser tab favicon is styled as the emoji "📚" and title is "LIBRARY".
