import axios from 'axios';

// Interface Frontend
export interface SubCategory {
  id: number;
  name: string;
  slug: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  subCategories: SubCategory[];
}

// Interface Backend (Cấu trúc mới sau khi Scaffold)
interface BackendCategory {
  categoryId: number;
  categoryName: string;
  categoryCode: string;
  // Trường này mới xuất hiện do bảng trung gian
  categorySubCategories: {
    subCategory: {
      subCategoryId: number;
      subCategoryName: string;
      subCategoryCode: string;
    }
  }[];
}

const API_URL = 'https://localhost:7248/api/Categories';

export const getCategories = async (): Promise<Category[]> => {
  try {
    // Chỉ cần gọi 1 API duy nhất, không cần gọi song song nữa
    const res = await axios.get<BackendCategory[]>(API_URL);

    // Map dữ liệu
    return res.data.map(cat => ({
      id: cat.categoryId,
      name: cat.categoryName,
      slug: cat.categoryCode,
      
      // Lấy danh sách con thông qua bảng trung gian
      subCategories: cat.categorySubCategories.map(item => ({
        id: item.subCategory.subCategoryId,
        name: item.subCategory.subCategoryName,
        slug: item.subCategory.subCategoryCode
      }))
    }));

  } catch (error) {
    console.error("Lỗi API Categories:", error);
    return [];
  }
};