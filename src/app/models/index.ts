export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
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
