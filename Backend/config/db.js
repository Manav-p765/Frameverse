import mongoose, { connect } from "mongoose";


const connectdb = async () =>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}


export default connectdb;