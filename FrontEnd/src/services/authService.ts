import axios from 'axios';

const API_URL = 'https://localhost:7248/api/Auth';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registerAPI = async (userData: any) => {
  try {
    const res = await axios.post(`${API_URL}/register`, userData);
    return { success: true, message: res.data.message };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Lỗi đăng ký" };
  }
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loginAPI = async (loginData: any) => {
  try {
    const res = await axios.post(`${API_URL}/login`, loginData);
    return { success: true, data: res.data };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Lỗi đăng nhập" };
  }
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateProfileAPI = async (userId: number, data: any) => {
  try {
    const res = await axios.put(`${API_URL}/profile/${userId}`, data);
    return { success: true, data: res.data }; 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Lỗi cập nhật" };
  }
};