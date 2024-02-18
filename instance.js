import axios from "axios";

const instance = axios.create({
  baseURL: "https://api.github.com/users",
  timeout: 5000,
});

export default instance;
