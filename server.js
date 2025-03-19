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

// Set up OpenAI
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY
// });
// OpenAI chat endpoint
// app.post("/chat", async (req, res) => {
//   const { prompt } = req.body;

//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [{ role: "user", content: prompt }],
//       max_tokens: 512,
//       temperature: 0
//     });

//     res.send(response.choices[0].message.content);
//   } catch (error) {
//     console.error("Error:", error.response?.data || error.message || error);
//     res.status(500).send("Error occurred while processing the request.");
//   }
// });

// Server
app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});
// "start": "nodemon --env-file=.env server.js"  this need add package.json
