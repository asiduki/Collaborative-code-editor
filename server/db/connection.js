import mongoose from "mongoose";

const Connect = async () => {
  try {
    await mongoose
      .connect(process.env.MONGODB_URI)
      .then(console.log("Connected with Mongodb"));
  } catch (error) {
    console.log(error);
  }
};

export default Connect;
