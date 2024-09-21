const express = require("express");
const app = express();
const port = process.env.PORT || 1234;
const fs = require("fs");
const mongoose = require("mongoose");
const morgan = require("morgan");
const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");

const session = require("express-session");
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");

let redisClient = createClient({
  url: `redis://${process.env.REDIS_URL || "redis"}:${
    process.env.REDIS_PORT || 6379
  }`,
});
redisClient.connect().catch(console.error);

let redisStore = new RedisStore({
  client: redisClient,
  prefix: "myapp:",
});

// Initialize session storage.
app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || "keyboard cat",
    cookie: {
      httpOnly: true, // защита от XSS атак
      secure: process.env.NODE_ENV === "production", // cookies только через HTTPS в production
      maxAge: 1000 * 60 * 30, // время жизни cookie в миллисекундах (30 минут)
      saveUninitialized: false, // recommended: only save session when data exists
      resave: true,
    },
  })
);

app.use((req, res, next) => {
  if (req.session) {
    console.log("Session ID:", req.session);
  } else {
    console.log("No current session...");
  }
  next();
});

let MAX_ATTEMPTS = 5;

const connectWithRetry = () => {
  if (MAX_ATTEMPTS <= 0) {
    console.log("MAX ATTEMPTS REACHED. Programm shutting down...");
    process.exit(0);
  }
  MAX_ATTEMPTS--;
  mongoose
    .connect(process.env.ME_CONFIG_MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("Connected!"))
    .catch((e) => {
      console.log(
        `On attempt number ${5 - MAX_ATTEMPTS} --> Some error occured: `,
        e
      );
      console.log("Recursively trying again...");
      setTimeout(() => {
        connectWithRetry();
      }, 5000);
    });
};

connectWithRetry();

app.use(express.json());
app.use(morgan("dev"));

app.use("/posts", postRouter);
app.use("/users", userRouter);

app.listen(port, () => console.log(`Server running on port ${port}`));
