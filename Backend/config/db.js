/**
 * Database Connection
 *
 * Connects to MongoDB using the MONGO_URL environment variable.
 * Exits the process on connection failure to prevent the server
 * from running in a broken state.
 */

import mongoose from "mongoose";

const connectdb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
    } catch (error) {
        console.error(`[DB] Connection failed: ${error.message}`);
        process.exit(1); // Fatal — server cannot function without the database
    }
}

export default connectdb;