// URL backend (Spring Boot API)
export const API_BASE_URL = "http://localhost:8080/api";

// axios :
import axios from "axios";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
