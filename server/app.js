import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

import queryRouter from "./routes/query.js";
import userRouter from "./routes/users.js";
import memoryRouter from "./routes/memories.js";
import voiceMemoryRouter from "./routes/voiceMemoryRouter.js";
import extensionRouter from "./routes/extensionRouter.js";
import documentRouter from "./routes/document.js";
import imageRouter from "./routes/imageUpload.js";
import analyseRouter from "./routes/analyse.js";
import taskRouter from "./routes/taskRouter.js";
import Router from "./routes/meeting.js";

app.use("/api", queryRouter);
app.use("/api", userRouter);
app.use("/api", memoryRouter);
app.use("/api", voiceMemoryRouter);
app.use("/api", extensionRouter);
app.use("/api/document", documentRouter);
app.use("/api", imageRouter);
app.use("/api", analyseRouter);
app.use("/api", taskRouter);
app.use("/api/meetings", Router);

app.listen(5000, () => {
  console.log("🚀 MindVault AI Twin running at http://localhost:5000");
});
