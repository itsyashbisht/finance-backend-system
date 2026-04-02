import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = Number(process.env.PORT);

const startServer = async () => {
  try {
    await connectDB();
    app.on("error", (error) => {
      console.error("Server Error: " + error);
      throw error;
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("MongoDB connection failed! " + error);
    } else {
      console.error("Unknown error during sever startup");
    }
    process.exit(1);
  }
};

startServer();
