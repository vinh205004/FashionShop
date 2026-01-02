import axios from "axios";

const API_URL = "http://localhost:7248/api"; 

// Hàm lấy Header chứa Token (Admin cần Token để qua ải Authorize)
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const getDashboardStats = async () => {
  try {
    const res = await axios.get(`${API_URL}/Dashboard/stats`, getAuthHeader());
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy thống kê:", error);
    return null;
  }
};