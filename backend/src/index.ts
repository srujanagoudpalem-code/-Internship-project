import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRoutes from './routes/authRoutes';
import returnRoutes from './routes/returnRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Built-in body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve local uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Fallback for unmatched routes (404)
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// Global Error Handler
app.use(errorHandler);

// Listen
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

export default app;

