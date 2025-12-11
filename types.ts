export enum Category {
  Shoes = 'Обувь',
  Clothes = 'Одежда',
  Accessories = 'Аксессуары',
  Other = 'Другое'
}

export interface Product {
  idProduct: number;
  name: string;
  category: string; 
  price: number;
  description: string;
  code?: string;
  imageUrl?: string; 
}

export interface User {
  idUser: number;
  idRole: number;
  login: string;
  username: string;
  phoneNumber?: string;
  fullName: string;
  password?: string; // Optional for UI, needed for register DTO mapping if used directly
}

export interface AuthResponse {
  token: string;
  login: string;
  idUser: number;
}

export type LoginResponse = AuthResponse;

export interface AdminAuthResponse {
  token: string;
  username: string;
  idAdministrator: number;
}

export interface Review {
  idReview: number;
  idUser: number;
  idProduct: number;
  title: string;
  text: string;
  reviewDate: string;
  // UI helper, might need join on backend or separate fetch
  username?: string; 
}

export interface Order {
  idOrder: number;
  idUser: number;
  address: string;
  orderDate: string;
  // Status is not in C# model, treating as optional for UI compatibility if needed
  status?: string; 
}

export interface Cart {
  idCart: number;
  idProduct: number;
  amount: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: number;
}

// DTOs
export interface RegisterDto {
  login: string;
  password: string;
  username: string;
  phoneNumber?: string;
  fullName: string;
}

export interface LoginDto {
  login: string;
  password: string;
}

export interface AdminLoginDto {
  username: string;
  password: string;
}

export interface CreateOrderDto {
  idUser: number;
  address: string;
  orderDate: string;
}

export interface CreateReviewDto {
  idUser: number;
  idProduct: number;
  title: string;
  text: string;
  reviewDate: string;
}
