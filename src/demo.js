import { IPFlare } from ".";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const geolocator = new IPFlare({
  apiKey: process.env.API_KEY,
});

geolocator.lookup("178.238.11.6").then((result) => {
  console.log(result);
});
