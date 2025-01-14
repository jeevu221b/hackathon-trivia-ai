# Hackathon-Trivia-AI
This is the backend of the game Trivia, built to support the iOS application. The backend is built using Node.js and integrates several powerful technologies to support dynamic gameplay, real-time multiplayer features, and secure data handling.

## Features

- Real-time multiplayer trivia support using **Socket.IO**
- User authentication with **JWT**
- Daily quests and rewards management
- Gacha-style card mechanics with custom abilities

## Prerequisites

Before running the backend, ensure you have the following installed:

- **Node.js** (v16 or later)
- **npm** or **yarn** (for dependency management)
- **MongoDB** (for database operations)
- **PM2** (for production process management)


## Installation


1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/hollywood-quiz-backend.git
   cd hollywood-quiz-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the environment variables in a `.env` file.

4. Start the MongoDB service on your local machine or configure it remotely.

## How to Run

### Development Mode

1. Run the application in development mode:

   ```bash
   npm run dev
   ```

   This will start the server with **nodemon**, enabling hot reloading for seamless development.

2. Open your browser or API testing tool (e.g., Postman) and test the endpoints using:

   ```
   http://localhost:5000
   ```

### Production Mode with PM2

1. Install PM2 globally if not already installed:

   ```bash
   npm install -g pm2
   ```

2. Start the backend using PM2:

   ```bash
   pm2 start ./src/server.js --name trivia-backend
   ```

3. View logs to monitor the server:

   ```bash
   pm2 logs trivia-backend
   ```

4. To stop the backend:

   ```bash
   pm2 stop trivia-backend
   ```

5. To restart the backend:

   ```bash
   pm2 restart trivia-backend
   ```
