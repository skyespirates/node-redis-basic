import express from "express";
import { createClient } from "redis";
import { param, validationResult, matchedData } from "express-validator";

import api from "./instance.js";
import { cache } from "./middleware/index.js";
import { formatOutput } from "./utils/helper.js";

// redis connection start

const PORT = 3000;
const REDIS_PORT = 6379;
const HOST = "127.0.0.1";

export const client = createClient({
  socket: {
    host: HOST,
    port: REDIS_PORT,
  },
});
client.on("error", (err) => console.log("Redis Client Error", err));
await client.connect(); // to do await in top level module you should set "type": "module" in your package json to use ES6 import export instead of require/module.exports

// redis connection end

const app = express();

app.get("/", (req, res) => {
  // check whether connection established or not
  console.log(client.isReady, client.isOpen);
  res.status(200).json({
    isConnectionReady: client.isReady,
    isConnectionOpen: client.isOpen,
  });
});

app.get(
  "/repos/:username",
  param("username")
    .trim()
    .notEmpty()
    .isLength({ max: 10 })
    .withMessage("username length should not more than 10 character"),
  cache,
  async (req, res) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        res.send({ error: result.array() });
        return;
      }
      const { username: user } = matchedData(req);
      const { data } = await api(`/${user}`);
      //  await client.set(user, data.public_repos)               // this data will be stored forever (theory-based LOL)
      await client.setEx(user, 30, data.public_repos); // expect stored data to expire within 30 seconds
      const value = await client.get(user);
      res.status(201).json({
        msg: "newly created data",
        data: formatOutput(user, value),
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        msg: "Internal Server Error",
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
