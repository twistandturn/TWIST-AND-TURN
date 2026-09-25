# Twist & Turn Competition Platform

## Overview
This project turns the existing Twist & Turn website into a full competition platform with authentication, TTID generation, user dashboard, competition registrations, result management, certificates, and a hidden admin area.

## Features
- Sign up / login / logout
- JWT authentication with secure cookies
- TTID auto-generation in the format TT000001
- User dashboard with profile and competition history
- Competition registration and admin moderation
- Results and downloadable PDF certificates
- MongoDB-backed data model

## File Structure
- server.js - Main server entry point
- routes/ - API route definitions
- controllers/ - Request handlers
- models/ - Mongoose schemas
- middleware/ - Auth and validation middleware
- public/ - Frontend pages and scripts

## Installation
1. Install Node.js
2. Install dependencies:
   npm install
3. Create a MongoDB database
4. Copy .env.example to .env and set your values
5. Start the app:
   npm start

## Environment Variables
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/twistandturn
JWT_SECRET=change_this_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## MongoDB Setup
- Install MongoDB locally or use MongoDB Atlas
- Ensure the connection string is set in .env

## API Overview
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/competitions
- POST /api/competitions
- POST /api/registrations
- GET /api/registrations/mine
- POST /api/results
- POST /api/certificates/generate
- GET /api/users/profile
