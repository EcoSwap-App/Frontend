import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth';
import { ApiService } from '../../services/api';
import { Chat, Message, User, Product } from '../../models';
import { forkJoin, map, Observable } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
})
export class ChatComponent implements OnInit, OnDestroy {
  chats: Chat[] = [];
  activeChat: Chat | null = null;
  messages: Message[] = [];
  currentUser: User | null = null;
  newMessageText = '';
  
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  // Maps to store extra info for UI
  chatDetails = new Map<number, { otherUser: User, product: Product }>();

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUser;
    if (!this.currentUser) return;

    this.chatService.initForUser(this.currentUser.id);

    this.chatService.chats$.subscribe(chats => {
      console.log('chat.ts received chats:', chats);
      this.chats = chats;
      this.loadChatDetails(chats);
      
      // Auto-select chat if passed in route query params
      const chatIdParam = this.route.snapshot.queryParamMap.get('chatId');
      if (chatIdParam) {
        const id = Number(chatIdParam);
        const chat = chats.find(c => Number(c.id) === id); // Fix potential string vs number comparison here
        if (chat) this.selectChat(chat);
      } else if (chats.length > 0 && !this.activeChat) {
        this.selectChat(chats[0]);
      }
      console.log('chat.ts activeChat after select:', this.activeChat);
      this.cdr.detectChanges();
    });

    this.chatService.messages$.subscribe(messages => {
      this.messages = messages;
      this.cdr.detectChanges();
      this.scrollToBottom();
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      } catch(err) { }
    }, 50); // slight delay to allow DOM render
  }

  loadChatDetails(chats: Chat[]) {
    if (!this.currentUser) return;
    
    const currentUserId = Number(this.currentUser.id);
    
    chats.forEach(chat => {
      if (!this.chatDetails.has(Number(chat.id))) {
        const otherUserId = chat.participants.find(id => Number(id) !== currentUserId);
        if (otherUserId) {
          forkJoin({
            user: this.apiService.getUserById(otherUserId),
            product: this.apiService.getProductById(chat.productId)
          }).subscribe(({ user, product }) => {
            this.chatDetails.set(Number(chat.id), {
              otherUser: user,
              product: product
            });
            this.cdr.detectChanges();
          });
        }
      }
    });
  }

  selectChat(chat: Chat) {
    this.activeChat = chat;
    this.chatService.setActiveChat(Number(chat.id));
  }

  sendMessage() {
    if (!this.newMessageText.trim() || !this.activeChat || !this.currentUser) return;
    if (this.isProductSold(this.activeChat)) return; // Prevent sending if sold

    const text = this.newMessageText.trim();
    this.newMessageText = ''; // Clear immediately for better UX
    
    this.chatService.sendMessage(Number(this.activeChat.id), Number(this.currentUser.id), text)
      .subscribe(() => {
        // Also create a notification for the other user (only if one doesn't exist unread for this chat)
        const currentUserId = Number(this.currentUser!.id);
        const otherUserId = this.activeChat!.participants.find(id => Number(id) !== currentUserId);
        if (otherUserId) {
          this.apiService.getNotifications(Number(otherUserId)).subscribe(notifs => {
            const hasUnread = notifs.some(n => n.type === 'message' && n.chatId === Number(this.activeChat!.id) && !n.read);
            if (!hasUnread) {
              const productTitle = this.chatDetails.get(Number(this.activeChat!.id))?.product.title || 'un producto';
              this.apiService.createNotification({
                userId: Number(otherUserId),
                type: 'message',
                chatId: Number(this.activeChat!.id),
                text: `${this.currentUser!.name} te ha enviado un mensaje sobre ${productTitle}`,
                read: false,
                createdAt: new Date().toISOString()
              }).subscribe();
            }
          });
        }
      });
  }

  getOtherUser(chat: Chat): User | null {
    return this.chatDetails.get(Number(chat.id))?.otherUser || null;
  }

  getProductTitle(chat: Chat): string {
    return this.chatDetails.get(Number(chat.id))?.product.title || 'Loading...';
  }
  
  isProductOwner(chat: Chat): boolean {
    if (!this.currentUser) return false;
    const product = this.chatDetails.get(Number(chat.id))?.product;
    return product?.userId === Number(this.currentUser.id);
  }

  isProductSold(chat: Chat): boolean {
    const product = this.chatDetails.get(Number(chat.id))?.product;
    return product?.status === 'sold';
  }

  markAsSold() {
    if (!this.activeChat) return;
    const product = this.chatDetails.get(Number(this.activeChat.id))?.product;
    if (!product) return;
    
    if (confirm(`¿Seguro que quieres marcar "${product.title}" como vendido? Esto cerrará el chat.`)) {
      this.apiService.updateProduct(product.id, { status: 'sold', available: false }).subscribe(updatedProduct => {
        const details = this.chatDetails.get(Number(this.activeChat!.id));
        if (details) {
          details.product = updatedProduct;
          this.chatDetails.set(Number(this.activeChat!.id), details);
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteActiveChat() {
    if (!this.activeChat) return;
    if (confirm('¿Seguro que quieres eliminar este chat de tu bandeja?')) {
      this.apiService.deleteChat(this.activeChat.id).subscribe(() => {
        this.activeChat = null;
        this.chatService.refreshChats();
        this.cdr.detectChanges();
      });
    }
  }

  isMyMessage(msg: Message): boolean {
    return Number(msg.senderId) === Number(this.currentUser?.id);
  }

  ngOnDestroy() {
    this.chatService.stopPolling();
  }
}
