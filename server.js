import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/mongodb.js";
import authRouter from "./src/routes/authRoutes.js";

dotenv.config();
const PORT = process.env.PORT || 4000;

connectDB();

const app = express();
// app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: "true" }));

// API Endpoints

app.get("/", (req, res) => {
  res.send("API working");
});

app.use("/api/auth", authRouter);

// Server
app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});
// "start": "nodemon --env-file=.env server.js"  this need add package.json
