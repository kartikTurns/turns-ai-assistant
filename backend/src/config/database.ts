// Database configuration and connection
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/turnsIq-chat';

export async function connectDatabase(): Promise<void> {
  try {
    const options: any = {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4
    };

    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ MongoDB connected successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Connection type: ${MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown on process termination
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});
