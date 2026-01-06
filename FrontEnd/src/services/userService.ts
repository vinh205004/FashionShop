import axios from 'axios';

const API_URL = 'https://localhost:7248/api/Users'; // Đổi port nếu cần

const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
};

export interface UserDTO {
    userId: number;
    fullName: string;
    username: string;
    email: string;
    phoneNumber: string;
    role: string;
    address: string;
    createdAt: string;
}

// 1. Lấy danh sách
export const getAllUsers = async (): Promise<UserDTO[]> => {
    try {
        const res = await axios.get(API_URL, getAuthHeader());
        return res.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách user:", error);
        return [];
    }
};

// 2. Xóa user
export const deleteUserAPI = async (userId: number) => {
    try {
        const res = await axios.delete(`${API_URL}/${userId}`, getAuthHeader());
        return { success: true, message: res.data.message };
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Lỗi xóa user" };
    }
};

// 3. Thăng cấp Admin
export const promoteUserAPI = async (userId: number) => {
    try {
        const res = await axios.put(`${API_URL}/promote/${userId}`, {}, getAuthHeader());
        return { success: true, message: res.data.message };
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Lỗi thăng cấp" };
    }
};