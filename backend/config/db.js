const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.5.1:27017/aether_events';
    console.log(`Attempting to connect to MongoDB at: ${connStr}`);
    
    // Connect timeout for quick fallback if local db is down
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 3000
    });
    
    console.log(`Database connected: ${conn.connection.host}`);
    isConnected = true;
    return true;
  } catch (err) {
    console.error(`Database connection error: ${err.message}`);
    console.warn('MongoDB not found. Using local memory storage fallback.');
    isConnected = false;
    return false;
  }
};

const getDbStatus = () => isConnected;

module.exports = { connectDB, getDbStatus };
