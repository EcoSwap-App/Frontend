import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product, Category, User, Chat, Message, Notification, Review } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3001';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getProductsByUserId(userId: number | string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products?userId=${userId}`);
  }

  getProductsExceptUserId(userId: number | string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`).pipe(
      map(products => products.filter(p => String(p.userId) !== String(userId)))
    );
  }

  getProductById(id: number | string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  addProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: number | string, product: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${id}`, product);
  }

  deleteProduct(id: number | string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUserById(id: number | string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: number | string, user: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}`, user);
  }

  toggleFavorite(userId: number | string, productId: number | string, currentFavorites: (number | string)[] = []): Observable<User> {
    const strProductId = String(productId);
    const isFavorited = currentFavorites.map(String).includes(strProductId);

    const newFavorites = isFavorited
      ? currentFavorites.filter(id => String(id) !== strProductId)
      : [...currentFavorites, productId];

    return this.updateUser(userId, { favorites: newFavorites });
  }

  getChats(userId: number | string): Observable<Chat[]> {
    const strId = String(userId);
    return this.http.get<Chat[]>(`${this.apiUrl}/chats`).pipe(
      map(chats => chats.filter(c => c.participants.map(String).includes(strId)))
    );
  }

  createChat(chat: Partial<Chat>): Observable<Chat> {
    return this.http.post<Chat>(`${this.apiUrl}/chats`, chat);
  }

  updateChat(id: number | string, chat: Partial<Chat>): Observable<Chat> {
    return this.http.patch<Chat>(`${this.apiUrl}/chats/${id}`, chat);
  }

  deleteChat(id: number | string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/chats/${id}`);
  }

  getMessages(chatId: number | string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/messages?chatId=${chatId}`);
  }

  sendMessage(message: Partial<Message>): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/messages`, message);
  }

  updateMessage(id: number | string, message: Partial<Message>): Observable<Message> {
    return this.http.patch<Message>(`${this.apiUrl}/messages/${id}`, message);
  }

  getNotifications(userId: number | string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications?userId=${userId}&_sort=-createdAt`);
  }

  markNotificationRead(id: number | string, read: boolean = true): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/notifications/${id}`, { read });
  }

  createNotification(notification: Partial<Notification>): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/notifications`, notification);
  }

  deleteNotification(id: number | string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notifications/${id}`);
  }

  getReviews(userId: number | string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/reviews?targetUserId=${userId}&_sort=-createdAt`);
  }

  addReview(review: Partial<Review>): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/reviews`, review);
  }

  deleteReview(id: number | string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reviews/${id}`);
  }
}
