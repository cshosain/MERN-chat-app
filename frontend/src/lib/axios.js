import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_BASE_URL + "/api" || "http://localhost:3003/api", // Adjust the base URL as needed
  withCredentials: true, // Include credentials for cross-origin requests
});
