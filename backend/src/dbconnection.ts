import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri!,{
            // Remove deprecated options if any
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        console.log('⚠️  Server will start without database connection.');
        console.log('📝 Make sure MongoDB is running on localhost:27017 or update MONGODB_URI');
        // Don't exit the process, let the server start anyway
    }
};