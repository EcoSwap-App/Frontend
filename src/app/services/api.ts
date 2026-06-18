import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, from, catchError, of } from 'rxjs';
import { Product, Category, User, Chat, Message, Notification, Review } from '../models';
import { environment } from '../../environments/environment';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService
  ) {}

  private mapProduct(p: any): Product {
    return {
      id: p.id,
      title: p.title,
      description: p.description || '',
      price: p.price,
      status: p.status || 'used',
      categoryId: p.category_id,
      userId: p.user_id,
      available: p.available === true || String(p.available) === 'true',
      type: p.type || 'sale',
      createdAt: p.created_at || new Date().toISOString(),
      images: Array.isArray(p.image_url) ? p.image_url : (p.image_url ? [p.image_url] : []),
      model3d: p.model_3d
    };
  }

  private mapMeetingToChat(m: any): Chat {
    return {
      id: m.id,
      productId: m.product_id,
      participants: [m.creator_id, m.interested_id],
      createdAt: m.created_at || m.meeting_date || new Date().toISOString(),
      updatedAt: m.updated_at || m.created_at || new Date().toISOString()
    };
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`).pipe(
      map(products => (products || []).map(p => this.mapProduct(p)))
    );
  }

  getProductsByUserId(userId: number | string): Observable<Product[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products?userId=${userId}`).pipe(
      map(products => (products || []).map(p => this.mapProduct(p)))
    );
  }

  getProductsExceptUserId(userId: number | string): Observable<Product[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products?excludeUserId=${userId}`).pipe(
      map(products => (products || []).map(p => this.mapProduct(p)))
    );
  }

  getProductById(id: number | string): Observable<Product> {
    return this.http.get<any>(`${this.apiUrl}/products/${id}`).pipe(
      map(p => this.mapProduct(p))
    );
  }

  addProduct(product: Partial<Product>): Observable<Product> {
    const backendProduct = {
      title: product.title,
      price: product.price,
      category: product.categoryId,
      imagesBase64: product.images || [],
      status: product.status || 'used',
      model3d: product.model3d,
      type: product.type || 'sale',
      description: product.description || ''
    };
    return this.http.post<any>(`${this.apiUrl}/products`, backendProduct).pipe(
      map(res => {
        const p = Array.isArray(res) ? res[0] : res;
        return this.mapProduct(p);
      })
    );
  }

  updateProduct(id: number | string, product: Partial<Product>): Observable<Product> {
    const backendProduct = {
      title: product.title,
      price: product.price,
      status: product.status,
      available: product.available,
      model3d: product.model3d,
      description: product.description
    };
    return this.http.put<any>(`${this.apiUrl}/products/${id}`, backendProduct).pipe(
      map(res => {
        const p = Array.isArray(res) ? res[0] : res;
        return this.mapProduct(p);
      })
    );
  }

  deleteProduct(id: number | string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getLocations(): Observable<any[]> {
    return from(this.supabaseService.client.from('locations').select('*')).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      })
    );
  }

  getUsers(): Observable<User[]> {
    return from(this.supabaseService.client.from('users').select('*')).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      })
    );
  }

  getUserById(id: number | string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`).pipe(
      catchError(() => of({
        id,
        name: 'Estudiante EcoSwap',
        email: '',
        career: 'General',
        cycle: 1,
        reputation: 5,
        verified: false,
        active: true,
        createdAt: new Date().toISOString()
      } as User))
    );
  }

  updateUser(id: number | string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/profile`, user);
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
    return this.http.get<any[]>(`${this.apiUrl}/meetings/my-meetings`).pipe(
      map(meetings => (meetings || []).map(m => this.mapMeetingToChat(m)))
    );
  }

  createChat(chat: Partial<Chat>): Observable<Chat> {
    // A chat in our backend is a Meeting
    const sellerId = chat.participants?.find(p => String(p) !== String(this.supabaseService.client.auth.getUser()));
    const backendMeeting = {
      productId: chat.productId,
      interestedId: sellerId || chat.participants?.[1] || '',
      locationId: 1, // Default location
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].slice(0, 5),
      notes: 'Inicio de chat'
    };
    return this.http.post<any>(`${this.apiUrl}/meetings`, backendMeeting).pipe(
      map(res => this.mapMeetingToChat(res))
    );
  }

  updateChat(id: number | string, chat: Partial<Chat>): Observable<Chat> {
    // If confirming the meeting
    return this.http.post<any>(`${this.apiUrl}/meetings/${id}/confirm`, {}).pipe(
      map(res => this.mapMeetingToChat(res))
    );
  }

  deleteChat(id: number | string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/meetings/${id}/cancel`, {});
  }

  getMessages(chatId: number | string): Observable<Message[]> {
    return this.http.get<any[]>(`${this.apiUrl}/meetings/${chatId}/messages`).pipe(
      map(msgs => (msgs || []).map(m => ({
        id: m.id,
        chatId: m.meeting_id,
        senderId: m.sender_id,
        text: m.content,
        createdAt: m.created_at || new Date().toISOString()
      })))
    );
  }

  sendMessage(message: Partial<Message>): Observable<Message> {
    return this.http.post<any>(`${this.apiUrl}/meetings/${message.chatId}/messages`, {
      content: message.text
    }).pipe(
      map(m => ({
        id: m.id,
        chatId: m.meeting_id,
        senderId: m.sender_id,
        text: m.content,
        createdAt: m.created_at || new Date().toISOString()
      }))
    );
  }

  updateMessage(id: number | string, message: Partial<Message>): Observable<Message> {
    // No direct update message endpoint on backend, return mock update or direct message update if needed
    return from(Promise.resolve(message as Message));
  }

  getNotifications(userId: number | string): Observable<Notification[]> {
    return from(this.supabaseService.client.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })).pipe(
      map(response => {
        if (response.error) throw response.error;
        return (response.data || []).map(n => ({
          id: n.id,
          userId: n.user_id,
          type: n.type,
          title: n.title,
          text: n.text || n.message,
          message: n.message || n.text,
          chatId: n.chat_id,
          read: n.read,
          createdAt: n.created_at
        }));
      })
    );
  }

  markNotificationRead(id: number | string, read: boolean = true): Observable<Notification> {
    return from(this.supabaseService.client.from('notifications').update({ read }).eq('id', id).select()).pipe(
      map(response => {
        if (response.error) throw response.error;
        const n = response.data[0];
        return {
          id: n.id,
          userId: n.user_id,
          type: n.type,
          title: n.title,
          text: n.text || n.message,
          message: n.message || n.text,
          chatId: n.chat_id,
          read: n.read,
          createdAt: n.created_at
        };
      })
    );
  }

  createNotification(notification: Partial<Notification>): Observable<Notification> {
    return from(this.supabaseService.client.from('notifications').insert([{
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      text: notification.text || notification.message,
      message: notification.message || notification.text,
      chat_id: notification.chatId,
      read: false
    }]).select()).pipe(
      map(response => {
        if (response.error) throw response.error;
        const n = response.data[0];
        return {
          id: n.id,
          userId: n.user_id,
          type: n.type,
          title: n.title,
          text: n.text || n.message,
          message: n.message || n.text,
          chatId: n.chat_id,
          read: n.read,
          createdAt: n.created_at
        };
      })
    );
  }

  deleteNotification(id: number | string): Observable<any> {
    return from(this.supabaseService.client.from('notifications').delete().eq('id', id)).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      })
    );
  }

  getReviews(userId: number | string): Observable<Review[]> {
    return from(this.supabaseService.client.from('reputations').select('*').eq('user_id', userId)).pipe(
      map(response => {
        if (response.error) throw response.error;
        return (response.data || []).map(r => ({
          id: r.id,
          reviewerId: r.reviewer_id,
          targetUserId: r.user_id,
          rating: r.points,
          comment: r.reason || '',
          createdAt: r.created_at
        }));
      })
    );
  }

  addReview(review: Partial<Review>): Observable<any> {
    const backendReview = {
      targetUserId: review.targetUserId,
      points: review.rating || 5,
      meetingId: 1, // Default or select first meeting
      reason: review.comment || ''
    };
    return this.http.post<any>(`${this.apiUrl}/reputation`, backendReview);
  }

  deleteReview(id: number | string): Observable<any> {
    return from(this.supabaseService.client.from('reputations').delete().eq('id', id));
  }

  createReport(report: { reportedUserId?: number | string; productId?: number | string; reason: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reports`, report);
  }
}
