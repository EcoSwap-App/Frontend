import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, interval, switchMap, of, map, distinctUntilChanged } from 'rxjs';
import { ApiService } from './api';
import { Chat, Message } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {
  private chatsSubject = new BehaviorSubject<Chat[]>([]);
  public chats$ = this.chatsSubject.asObservable();

  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private activeChatIdSubject = new BehaviorSubject<number | string | null>(null);
  public activeChatId$ = this.activeChatIdSubject.asObservable();

  private pollSubscription?: Subscription;
  private userId: number | string | null = null;

  constructor(private apiService: ApiService) {}

  initForUser(userId: number | string) {
    this.userId = userId;
    this.refreshChats();
    this.startPolling();
  }

  private startPolling() {
    this.stopPolling();
    this.pollSubscription = interval(3000).subscribe(() => {
      // Poll for new or updated chats
      if (this.userId) {
        this.apiService.getChats(this.userId).subscribe(chats => {
          chats.sort((a, b) => {
            const timeA = new Date(a.updatedAt || a.createdAt).getTime();
            const timeB = new Date(b.updatedAt || b.createdAt).getTime();
            return timeB - timeA;
          });
          // Compare to prevent UI flicker
          if (JSON.stringify(chats) !== JSON.stringify(this.chatsSubject.value)) {
            this.chatsSubject.next(chats);
          }
        });
      }

      // Poll for messages in the active chat
      const activeChatId = this.activeChatIdSubject.value;
      if (activeChatId) {
        this.apiService.getMessages(activeChatId).subscribe(messages => {
          if (messages.length !== this.messagesSubject.value.length) {
            this.messagesSubject.next(messages);
          }
        });
      }
    });
  }

  stopPolling() {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
      this.pollSubscription = undefined;
    }
  }

  setActiveChat(chatId: number | string) {
    this.activeChatIdSubject.next(chatId);
    this.apiService.getMessages(chatId).subscribe(messages => {
      this.messagesSubject.next(messages);
    });
  }

  refreshChats() {
    if (this.userId) {
      console.log('refreshChats called with userId:', this.userId);
      this.apiService.getChats(this.userId).subscribe(chats => {
        chats.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt).getTime();
          return timeB - timeA;
        });
        console.log('getChats returned:', chats);
        this.chatsSubject.next(chats);
      });
    }
  }

  sendMessage(chatId: number | string, senderId: number | string, text: string) {
    const newMessage = { chatId, senderId, text, createdAt: new Date().toISOString() };
    
    // Also patch the chat to update its updatedAt timestamp so it jumps to the top
    this.apiService.updateChat(chatId, { updatedAt: new Date().toISOString() }).subscribe();
    
    return this.apiService.sendMessage(newMessage).pipe(
      map(savedMessage => {
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, savedMessage]);
        return savedMessage;
      })
    );
  }

  ngOnDestroy() {
    this.stopPolling();
  }
}
