import axios from 'axios';

// 1. INTERFACES
export interface ProductMock {
  id: number;
  title: string;
  price: number;
  description?: string;
  images: string[];
  badges?: string[];
  category?: string;
  subCategory?: string;
  sizes?: string[];
  selectedSize?: string;
}

interface BackendProduct {
  productId: number;
  title: string;
  price: number;
  description: string;
  category: { categoryName: string; categoryCode: string } | null;
  subCategory: { subCategoryCode: string } | null;
  productImages: { imageUrl: string }[] | [];
  productSizes: { sizeName: string }[] | [];
  productBadges: { badgeName: string }[] | [];
}

export interface PagedResult {
  data: ProductMock[];
  total: number;
}

const API_URL = 'https://localhost:7248/api/Products';

// 2. MAPPER 
const mapToFrontend = (item: BackendProduct): ProductMock => {
  return {
    id: item.productId,
    title: item.title,
    price: item.price,
    description: item.description || "",
    images: item.productImages && item.productImages.length > 0 
            ? item.productImages.map(img => img.imageUrl ? img.imageUrl : "https://via.placeholder.com/300?text=No+Image") 
            : ["https://via.placeholder.com/300?text=No+Image"],
    badges: item.productBadges?.map(b => b.badgeName) || [],
    category: item.category?.categoryName || "",
    subCategory: item.subCategory?.subCategoryCode || "",
    sizes: item.productSizes?.map(s => s.sizeName) || []
  };
};

// =========================================================
// HÀM GỌI API CHÍNH (MASTER FUNCTION)
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
  random: boolean = false // Thêm tham số random vào đây luôn
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
        random: random // Truyền random xuống backend
      }
    });

    // Xử lý data trả về an toàn
    const list = res.data.data || res.data.Data || [];
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

// =========================================================
// CÁC HÀM PHỤ (Viết ngắn gọn bằng cách gọi hàm chính)
// =========================================================

// Lấy chi tiết 1 sản phẩm
export const getProductById = async (id: number): Promise<ProductMock | undefined> => {
  try {
    const res = await axios.get(`${API_URL}/${id}`);
    return mapToFrontend(res.data);
  } catch (error) {
    console.error(error)
    return undefined;
  }
};

// Lấy sản phẩm mới (lấy ngẫu nhiên 8 cái)
export const getNewProducts = async (): Promise<ProductMock[]> => {
  const result = await getProductsPaged(1, 8, "", "", 0, 10000000, "default", "", [], true);
  return result.data;
};

// Lấy ngẫu nhiên theo danh mục
export const getRandomProductsByCategory = async (categoryCode: string, count: number = 4) => {
  const result = await getProductsPaged(1, count, categoryCode, "", 0, 10000000, "default", "", [], true);
  return result.data;
};

// Lấy danh sách Size
export const getAllSizes = async (): Promise<string[]> => {
  try {
    const res = await axios.get(`${API_URL}/sizes`);
    return res.data; 
  } catch (error) {
    console.error(error)
    return [];
  }
};


export const getAllProducts = async () => (await getProductsPaged(1, 100)).data;
export const getProductsByCategory = async (cat: string) => (await getProductsPaged(1, 100, cat)).data;
export const getProductsBySubCategory = async (sub: string) => (await getProductsPaged(1, 100, "", sub)).data;

export const mockProducts: ProductMock[] = [];