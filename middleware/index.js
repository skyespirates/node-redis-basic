import { client } from "../index.js";
import { formatOutput } from "../utils/helper.js";

export const cache = async (req, res, next) => {
  try {
    const username = req.params.username;
    const data = await client.get(username);
    if (data) {
      res.status(200).json({
        msg: "cached data",
        data: formatOutput(username, data),
      });
    } else {
      next();
    }
  } catch (error) {
    throw error;
  }
};
