# Trod.ai

Trod.ai is a video editing web application that allows users to import and edit videos. Currently, the project consists of the frontend implementation, with authentication via Google.

## Installation

Follow these steps to set up and run the project on your local machine:

### 1. Install Dependencies

Run the following command to install all required dependencies:

```sh
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory and configure the following environment variables:

```
AUTH_SECRET=your-auth-secret-here-this-random

GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-key
NEXTAUTH_SECRET=your-random-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### 3. Run the Development Server

Start the local development server by running:

```sh
npm run dev
```

Then, open your browser and navigate to:

```
http://localhost:3000
```

## Usage

1. You will see the landing page upon visiting the website.
2. Click the **Register Now** button to sign up.
3. Register using Google (currently, only Google authentication is available).
4. After logging in, you will be redirected to the **Dashboard Home Page**.
5. From the dashboard, import a video to proceed.
6. You will be redirected to the **Edit Page**, where you can edit your video (only frontend functionality is available for now).

## Features

- Google authentication
- Video import functionality (frontend only)
- Video editing interface (frontend only)

## Technologies Used

- Next.js
- React
- Tailwind CSS
- NextAuth.js (for authentication)

## Future Enhancements

- Complete authentication system with email/password login
- Backend implementation for video processing
- Additional editing features

##

