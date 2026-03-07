import mongoose from 'mongoose';
import User from './models/user.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function checkData() {
    const logFile = 'debug_log.txt';
    let output = '';
    const log = (msg) => {
        output += msg + '\n';
        console.log(msg);
    };

    try {
        const url = process.env.MONGO_URL;
        log("Connecting to DB...");
        await mongoose.connect(url);
        log("Connected to DB successfully");

        const users = await User.find({}).limit(10);
        log(`Found ${users.length} users in DB sample`);

        for (const u of users) {
            log(`User: ${u.username} (${u._id})`);
            log(` - followers count (array): ${u.followers?.length || 0}`);
            log(` - following count (array): ${u.following?.length || 0}`);
            log(` - followersCount (field): ${u.followersCount}`);
            log(` - followingCount (field): ${u.followingCount}`);
            log('---');
        }

        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    avgFollowers: { $avg: "$followersCount" },
                    maxFollowers: { $max: "$followersCount" },
                    totalWithStats: { $sum: { $cond: [{ $gt: ["$followersCount", 0] }, 1, 0] } }
                }
            }
        ]);
        log(`Aggregate stats: ${JSON.stringify(stats, null, 2)}`);

        fs.writeFileSync(logFile, output);
        log(`Log written to ${logFile}`);
        process.exit(0);
    } catch (err) {
        log(`DEBUG SCRIPT ERROR: ${err.message}`);
        fs.writeFileSync(logFile, output + `\nERROR: ${err.stack}`);
        process.exit(1);
    }
}

checkData();
