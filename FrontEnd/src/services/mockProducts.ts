import axios from 'axios';

// 1. INTERFACES
export interface ProductMock {
  id: number;
  title: string;
  price: number;
  description?: string;
  images: string[];
  badges?: string[];
  
  // 👇 Đã thêm mới 2 trường này để sửa lỗi đỏ
  categoryId: number;      
  subCategoryId: number;   
  
  category?: string;       // Tên danh mục (VD: Nữ)
  subCategory?: string;    // Tên sub (VD: Áo thun)
  sizes?: string[];
  selectedSize?: string;
}

// Interface trả về từ Backend (C#)
interface BackendProduct {
  productId: number;
  title: string;
  price: number;
  description: string;
  
  // ID từ backend
  categoryId: number;
  subCategoryId: number;

  category: { categoryName: string; categoryCode: string } | null;
  subCategory: { subCategoryCode: string; subCategoryName: string } | null;
  productImages: { imageUrl: string; isMain: boolean }[] | [];
  productSizes: { sizeName: string }[] | [];
  productBadges: { badgeName: string }[] | [];
}

// Interface danh mục
export interface Category {
    categoryId: number;
    categoryName: string;
    categoryCode: string;
}

// Interface danh mục con
export interface SubCategory {
    subCategoryId: number;
    subCategoryName: string;
    categoryId: number; 
}

export interface PagedResult {
  data: ProductMock[];
  total: number;
}

// URL GỐC
const API_URL = 'https://localhost:7248/api/Products'; 

// 2. MAPPER (Chuyển dữ liệu C# -> React)
const mapToFrontend = (item: BackendProduct): ProductMock => {
  const sortedImages = item.productImages?.sort((a, b) => (b.isMain === true ? 1 : 0) - (a.isMain === true ? 1 : 0));
  
  return {
    id: item.productId,
    title: item.title,
    price: item.price,
    description: item.description || "",
    
    // 👇 MAP ID TỪ BACKEND SANG FRONTEND
    categoryId: item.categoryId,
    subCategoryId: item.subCategoryId,

    category: item.category?.categoryName || "",
    subCategory: item.subCategory?.subCategoryName || "", // Lấy tên hiển thị
    
    images: sortedImages && sortedImages.length > 0 
            ? sortedImages.map(img => img.imageUrl) 
            : ["https://via.placeholder.com/300?text=No+Image"],
    badges: item.productBadges?.map(b => b.badgeName) || [],
    sizes: item.productSizes?.map(s => s.sizeName) || []
  };
};

const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
};

// =========================================================
// A. CÁC HÀM PUBLIC (KHÁCH HÀNG)
// =========================================================

export const getProductsPaged = async (
  page: number = 1, 
  pageSize: number = 12, 
  category: string = '',
  subCategory: string = '',
  minPrice: number = 0,
  maxPrice: number = 10000000,
  sort: string = 'default',
  search: string = '',
  sizes: string[] = [],
  random: boolean = false 
): Promise<PagedResult> => {
  try {
    const res = await axios.get(API_URL, {
      params: { 
        page, pageSize, 
        category: category || null, 
        subCategory: subCategory || null,
        minPrice: minPrice > 0 ? minPrice : null, 
        maxPrice: maxPrice < 10000000 ? maxPrice : null,
        sort: sort !== 'default' ? sort : null,
        search: search || null,
        sizes: sizes.length > 0 ? sizes.join(',') : null,
        random: random 
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = res.data.data || res.data.Data || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = res.data.total || res.data.Total || 0;
    
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: list.map((item: any) => mapToFrontend(item)),
      total: total
    };
  } catch (error) {
    console.error("Lỗi API:", error);
    return { data: [], total: 0 };
  }
};

export const getProductById = async (id: number): Promise<ProductMock | undefined> => {
  try {
    const res = await axios.get(`${API_URL}/${id}`);
    return mapToFrontend(res.data);
  } catch (error) {
    console.error(error)
    return undefined;
  }
};

export const getNewProducts = async (): Promise<ProductMock[]> => {
  const result = await getProductsPaged(1, 8, "", "", 0, 10000000, "default", "", [], true);
  return result.data;
};

export const getRandomProductsByCategory = async (categoryCode: string, count: number = 4) => {
  const result = await getProductsPaged(1, count, categoryCode, "", 0, 10000000, "default", "", [], true);
  return result.data;
};

export const getAllSizes = async (): Promise<string[]> => {
  try {
    const res = await axios.get(`${API_URL}/sizes`);
    return res.data; 
  } catch  {
    return [];
  }
};

// =========================================================
// B. CÁC HÀM ADMIN
// =========================================================

export const getAllProducts = async () => {
    const result = await getProductsPaged(1, 1000); 
    return result.data;
};

export const getCategories = async () => {
    try {
        const res = await axios.get(`${API_URL}/categories`); 
        return res.data;
    } catch  {
        return [];
    }
};

// Hàm lấy tất cả SubCategory (Mới thêm)
export const getAllSubCategories = async () => {
    try {
        const res = await axios.get(`${API_URL}/subcategories`); 
        return res.data;
    } catch  {
        return [];
    }
};

// Hàm lấy SubCategory theo ID cha (Dự phòng)
export const getSubCategoriesByCatId = async (catId: number) => {
    try {
        const res = await axios.get(`https://localhost:7248/api/Categories/${catId}/subcategories`);
        return res.data; 
    } catch  {
        return [];
    }
};

export const deleteProduct = async (id: number) => {
    const res = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
    return res.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createProduct = async (productData: any) => {
    const res = await axios.post(`${API_URL}/create`, productData, getAuthHeader());
    return res.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateProduct = async (id: number, productData: any) => {
    const res = await axios.put(`${API_URL}/update/${id}`, productData, getAuthHeader());
    return res.data;
};

export const createCategory = async (name: string, code: string) => {
    const res = await axios.post(`https://localhost:7248/api/Categories`, { 
        categoryName: name, 
        categoryCode: code 
    }, getAuthHeader());
    return res.data;
};

// Helpers
export const getProductsByCategory = async (cat: string) => (await getProductsPaged(1, 100, cat)).data;
export const getProductsBySubCategory = async (sub: string) => (await getProductsPaged(1, 100, "", sub)).data;
export const mockProducts: ProductMock[] = [];