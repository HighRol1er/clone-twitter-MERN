import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";
import notificationRoute from "./routes/notification.route.js"

import connectMongoDB from "./db/connectMongoDB.js";

dotenv.config();

// img 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(express.json({limit:"5mb"})); 
// limit shouldn't be too large to prevent Dos attack 
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// api
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/posts', postRoute);
app.use('/api/notifications', notificationRoute);

app.listen(PORT, () => {
  console.log("Server is listening on", PORT);
  connectMongoDB();
})

