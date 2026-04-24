# GhostTalk - Anonymous DM App

A full-stack anonymous direct messaging app featuring End-to-End Encryption, TOTP 2FA, file sharing with virus scanning, and strong privacy controls.

## Folder Structure
- `backend/` - Node.js, Express, Socket.io, MongoDB
- `frontend/` - React, Vite, Tailwind CSS, Socket.io-client, WebCrypto API

## Prerequisites
- Node.js (v18+)
- MongoDB (Running locally on `mongodb://127.0.0.1:27017/ghosttalk` or set `MONGO_URI` in backend `.env`)
- (Optional) ClamAV running locally on port 3310 for file scanning.

## Setup Instructions

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory (Optional):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/ghosttalk
   JWT_SECRET=super_secret_key_here
   FRONTEND_URL=http://localhost:5173
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```

### 3. Usage
1. Open your browser to `http://localhost:5173`.
2. Sign up to create a new account. You will automatically download an encrypted recovery `.txt` file containing your AES-encrypted recovery token.
3. Once logged in, you can search for other users by exact username to start an E2E encrypted chat.
4. Share images and documents securely.
5. In your Profile, you can enable TOTP 2FA and adjust privacy settings.
6. Check the `/admin` panel to monitor suspicious login attempts and account breaches.

## Security Overview
See `Security_Report.md` for a detailed analysis of de-anonymisation vectors and architectural fixes.
