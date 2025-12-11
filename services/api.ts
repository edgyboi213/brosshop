
import { API_BASE_URL } from '../constants';
import { 
  Product, User, Order, Review, Cart, 
  LoginDto, RegisterDto, AdminLoginDto, 
  AuthResponse, AdminAuthResponse, 
  CreateOrderDto, CreateReviewDto 
} from '../types';

// Helper to convert object keys to camelCase recursively
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && typeof obj === 'object') {
    // Return Date objects as is
    if (obj instanceof Date) return obj;

    return Object.keys(obj).reduce((result, key) => {
      // Convert first char to lower case
      const newKey = key.charAt(0).toLowerCase() + key.slice(1);
      result[newKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

const getHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    let errorMessage = `API Error: ${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      if (errorData) {
         if (typeof errorData === 'string') {
             errorMessage = errorData;
         } else if (errorData.message) {
             errorMessage = errorData.message;
         } else if (errorData.title) {
             errorMessage = errorData.title;
         } 
         
         // Handle ASP.NET Core Validation errors dictionary
         if (errorData.errors) {
             const validationErrors = Object.values(errorData.errors).flat().join(', ');
             if (validationErrors) {
                 errorMessage += `: ${validationErrors}`;
             }
         }
      }
    } catch (e) {
      // Ignore JSON parse error on error response
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const data = await res.json();
    // Convert backend PascalCase (if any) to frontend camelCase
    return toCamelCase(data);
  }
  return {} as T;
};

const request = async <T>(method: string, endpoint: string, body?: any, token?: string): Promise<T> => {
  const config: RequestInit = {
    method,
    headers: getHeaders(token),
  };

  if (body) {
    // Send JSON as is. We rely on caller to structure it correctly (e.g. PascalCase if needed).
    config.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
    return handleResponse<T>(res);
  } catch (error: any) {
    console.error(`Request failed: ${method} ${endpoint}`, error);
    throw error;
  }
};

// --- API Services ---

export const AuthApi = {
  register: (data: RegisterDto) => request<any>('POST', '/Auth/register', data),
  login: (data: LoginDto) => request<AuthResponse>('POST', '/Auth/login', data),
};

export const AdminAuthApi = {
  // Corrected URL: removed "Controller" suffix standard in ASP.NET routing
  login: (data: AdminLoginDto) => request<AdminAuthResponse>('POST', '/AdminAuth/login', data),
};

export const ProductsApi = {
  getAll: () => request<Product[]>('GET', '/Products'),
  getById: (id: number) => request<Product>('GET', `/Products/${id}`),
  create: (data: Omit<Product, 'idProduct'>, token: string) => request<Product>('POST', '/Products', data, token),
  update: (id: number, data: Product, token: string) => request<void>('PUT', `/Products/${id}`, data, token),
  delete: (id: number, token: string) => request<void>('DELETE', `/Products/${id}`, undefined, token),
};

export const OrdersApi = {
  getAll: (token: string) => request<Order[]>('GET', '/Orders', undefined, token),
  getById: (id: number, token: string) => request<Order>('GET', `/Orders/${id}`, undefined, token),
  create: (data: CreateOrderDto, token: string) => request<Order>('POST', '/Orders', data, token),
  update: (id: number, data: Order, token: string) => request<void>('PUT', `/Orders/${id}`, data, token),
  delete: (id: number, token: string) => request<void>('DELETE', `/Orders/${id}`, undefined, token),
};

export const UsersApi = {
  getAll: (token: string) => request<User[]>('GET', '/Users', undefined, token),
  getById: (id: number, token: string) => request<User>('GET', `/Users/${id}`, undefined, token),
  update: (id: number, data: User, token: string) => request<void>('PUT', `/Users/${id}`, data, token),
  delete: (id: number, token: string) => request<void>('DELETE', `/Users/${id}`, undefined, token),
};

export const ReviewsApi = {
  getAll: () => request<Review[]>('GET', '/Reviews'),
  getById: (id: number) => request<Review>('GET', `/Reviews/${id}`),
  // Allow 'any' data to support manual PascalCase payloads
  create: (data: any, token: string) => request<Review>('POST', '/Reviews', data, token),
  update: (id: number, data: Review, token: string) => request<void>('PUT', `/Reviews/${id}`, data, token),
  delete: (id: number, token: string) => request<void>('DELETE', `/Reviews/${id}`, undefined, token),
};

export const CartApi = {
  getAll: () => request<Cart[]>('GET', '/Cart'),
  getById: (id: number) => request<Cart>('GET', `/Cart/${id}`),
  create: (data: Omit<Cart, 'idCart'>) => request<Cart>('POST', '/Cart', data),
  update: (id: number, data: Cart) => request<void>('PUT', `/Cart/${id}`, data),
  delete: (id: number) => request<void>('DELETE', `/Cart/${id}`),
};
