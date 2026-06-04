export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  universityId: number;
  career: string;
  cycle: number;
  reputation: number;
  verified: boolean;
  active: boolean;
  createdAt: string;
}

export interface University {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Model3D {
  file: string;
  texture: string;
  preview: string;
  scale: number;
  initialRotation: number[];
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  status: string;
  categoryId: number;
  userId: number;
  available: boolean;
  createdAt: string;
  images: string[];
  model3d?: Model3D;
}

export interface Chat {
  id: number;
  productId: number;
  participants: number[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id?: number;
  chatId: number;
  senderId: number;
  text: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  text?: string;
  title?: string;
  message?: string;
  chatId?: number;
  read: boolean;
  createdAt: string;
}
