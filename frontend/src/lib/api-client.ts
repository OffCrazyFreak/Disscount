import axios from "axios";

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types for our API responses
export interface Product {
  id: string;
  name: string;
  price: number;
  store: string;
  location: string;
  image?: string;
  discount?: number;
  originalPrice?: number;
  barcode?: string;
  category?: string;
}

export interface ProductSearchResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

// API functions
export const productApi = {
  // Search products by query
  searchProducts: async (
    query: string,
    page = 1,
    limit = 20
  ): Promise<ProductSearchResponse> => {
    try {
      const response = await api.get("/api/products/search", {
        params: { q: query, page, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching products:", error);

      // For now, return mock data when API is not available
      return {
        products: mockProducts.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase())
        ),
        total: mockProducts.length,
        page: 1,
        limit: 20,
      };
    }
  },

  // Search product by barcode
  searchByBarcode: async (barcode: string): Promise<Product | null> => {
    try {
      const response = await api.get(`/api/products/barcode/${barcode}`);
      return response.data;
    } catch (error) {
      console.error("Error searching by barcode:", error);
      return null;
    }
  },

  // Get product details
  getProduct: async (id: string): Promise<Product | null> => {
    try {
      const response = await api.get(`/api/products/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error getting product:", error);
      return null;
    }
  },
};

// Mock data for development (remove when real API is ready)
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Coca Cola 0.5L",
    price: 2.99,
    store: "Konzum",
    location: "Zagreb, Ilica 1",
    discount: 15,
    originalPrice: 3.49,
    barcode: "1234567890123",
    category: "Napitci",
  },
  {
    id: "2",
    name: "Coca Cola 0.5L",
    price: 3.19,
    store: "Kaufland",
    location: "Zagreb, Jankomir",
    barcode: "1234567890123",
    category: "Napitci",
  },
  {
    id: "3",
    name: "Coca Cola 0.5L",
    price: 2.89,
    store: "Lidl",
    location: "Zagreb, Arena Centar",
    discount: 20,
    originalPrice: 3.59,
    barcode: "1234567890123",
    category: "Napitci",
  },
  {
    id: "4",
    name: "Pepsi Cola 0.5L",
    price: 2.79,
    store: "Plodine",
    location: "Split, City Mall",
    barcode: "1234567890124",
    category: "Napitci",
  },
  {
    id: "5",
    name: "Mlijeko 1L",
    price: 1.49,
    store: "Konzum",
    location: "Zagreb, Ilica 1",
    barcode: "2234567890123",
    category: "Mliječni proizvodi",
  },
  {
    id: "6",
    name: "Mlijeko 1L",
    price: 1.39,
    store: "Lidl",
    location: "Zagreb, Arena Centar",
    discount: 10,
    originalPrice: 1.59,
    barcode: "2234567890123",
    category: "Mliječni proizvodi",
  },
  {
    id: "7",
    name: "Kruh 500g",
    price: 0.89,
    store: "Pekara Dubravica",
    location: "Zagreb, Dubrava",
    barcode: "3234567890123",
    category: "Pekarski proizvodi",
  },
  {
    id: "8",
    name: "Kruh 500g",
    price: 0.99,
    store: "Konzum",
    location: "Zagreb, Ilica 1",
    barcode: "3234567890123",
    category: "Pekarski proizvodi",
  },
];

// Future integration with cijene.dev API
export const cijeneDevApi = {
  searchProducts: async (query: string) => {
    // TODO: Implement when cijene.dev API is available
    // This will be the main API integration point
    console.log("Will integrate with cijene.dev API for query:", query);

    // For now, use our mock data
    return mockProducts.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  },
};
