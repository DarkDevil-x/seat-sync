# SeatSync - Event Palace

SeatSync is a modern, high-performance SaaS platform for event ticketing and seat reservations. Built with a responsive, dynamic UI and optimized for scalability, SeatSync allows organizers to manage events and users to seamlessly select and book seats.

## Features

- **Interactive Seat Selection**: A responsive, touch-friendly interactive seat map that scales perfectly across devices.
- **Dynamic Theming**: Premium light and dark modes with glassmorphism UI and optimized performance.
- **Google OAuth**: Fast and secure authentication utilizing Google OAuth and JSON Web Tokens (JWT).
- **Admin Dashboard**: Manage events, generate tickets, and analyze sales through a centralized dashboard.
- **Ticket Generation**: Automatically generate and download beautiful PDF tickets.
- **Serverless Architecture**: Built on Vite and Vercel Serverless functions, ensuring lightning-fast performance and seamless scalability.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Radix UI, Framer Motion
- **Backend**: Vercel Serverless Functions (`/api`), Node.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (JSON Web Tokens), Google OAuth

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` (or use your existing configuration).
   Required variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `APP_URL`
4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

This application is configured out-of-the-box for **Vercel**. 

1. Import the repository into your Vercel Dashboard.
2. Add your environment variables in the Vercel project settings.
3. Deploy! Vercel will automatically build the Vite frontend and host the `/api` directory as Serverless Functions.

## License

MIT License
