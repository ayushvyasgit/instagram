import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';
import authRoutes from './routes/auth.routes.js';
// Add these imports at the top
import postRoutes from './routes/post.routes.js';
import commentRoutes from './routes/comment.routes.js';
import likeRoutes from './routes/like.routes.js';

// Add these routes after the auth routes line

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow any localhost port for development
    if (/^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    const allowed = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (origin === allowed) return callback(null, true);
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Trust proxy (for rate limiting with correct IP)
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;