import { error } from 'console';
import { CircleDashed } from 'lucide-react';
import mongoose from 'mongoose';

const  MONGODB_URI = process.env.MONGODB_URI;

declare global {
    var mongooseCashe: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

let cached = global.mongooseCashe;

if (!cached) {
    cached = global.mongooseCashe = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    if(!MONGODB_URI) throw new Error('MONGODB_URI is set in the .env file');

    if(cached.conn) return cached.conn;

    if(cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {bufferCommands: false});
    }

    try {
        cached.conn = await cached.promise;
    }catch(err) {
        cached.promise = null;
        throw err;
    }

    console.log(`Connected to database ${process.env.NODE_ENV} - ${MONGODB_URI}`);

}