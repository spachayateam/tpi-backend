import "dotenv/config";
import cors from "cors";
import express from "express";
import session from "cookie-session";
import bodyParser from "body-parser";

import router from "./routes/index.js";

const app = express();

app.use(bodyParser.json());

// app.use(
//   cors({
//     origin: ["http://localhost:5500", "https://9d2pkw8k-5500.brs.devtunnels.ms"],
//     methods: ["POST", "GET", "PUT", "DELETE"],
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

app.use(cors());

app.use(
  session({
    name: "session",
    secret: process.env.SECRET_KEY,
    secure: false,
    maxAge: 1000 * 60 * 60 * 2,
    httpOnly: true,
    sameSite: "lax",
  })
);

app.use("/api", router);

app.use((req, res) => {
  console.log(req.method, req.url);
  res.status(404).send({ message: "Resource not found" });
});

app.listen(process.env.PORT || 3000, () => console.log("Server started on port 3000"));
