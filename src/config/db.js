import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    await mongoose.connect(process.env.MONGO_URI);

    // 🔇 Pas de logs en test
    if (process.env.NODE_ENV !== "test") {
      console.log("MongoDB connected ✅");
    }

  } catch (error) {
    console.error("MongoDB connection error ❌", error.message);

    // ❌ Ne jamais tuer les tests
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  }
};

export default connectDB;