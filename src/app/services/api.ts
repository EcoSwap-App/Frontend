import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product, Category, User, Chat, Message, Notification } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3001';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getProductsByUserId(userId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products?userId=${userId}`);
  }

  getProductsExceptUserId(userId: number): Observable<Product[]> {
    // Note: json-server v1 beta might not fully support _ne, but this matches json-server conventions.
    // If it fails, the frontend will fallback to client-side filtering.
    return this.http.get<Product[]>(`${this.apiUrl}/products?userId_ne=${userId}`);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  addProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${id}`, product);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}`, user);
  }

  getChats(userId: number | string): Observable<Chat[]> {
    const numId = Number(userId);
    return this.http.get<Chat[]>(`${this.apiUrl}/chats`).pipe(
      map(chats => chats.filter(c => c.participants.map(Number).includes(numId)))
    );
  }

  createChat(chat: Partial<Chat>): Observable<Chat> {
    return this.http.post<Chat>(`${this.apiUrl}/chats`, chat);
  }

  deleteChat(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/chats/${id}`);
  }

  getMessages(chatId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/messages?chatId=${chatId}`);
  }

  sendMessage(message: Partial<Message>): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/messages`, message);
  }

  getNotifications(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications?userId=${userId}&_sort=-createdAt`);
  }

  markNotificationRead(id: number, read: boolean = true): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/notifications/${id}`, { read });
  }

  createNotification(notification: Partial<Notification>): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/notifications`, notification);
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notifications/${id}`);
  }
}
