import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectInstance = await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `\n MongoDB Connected! DB Host: ${connectInstance.connection.host}`,
    );
  } catch (error) {
    console.log("MongoDB connection is failed: ", error);
    process.exit(1); // stop server if DB fails
  }
};

export default connectDB;
