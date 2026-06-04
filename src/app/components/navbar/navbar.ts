import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
})
export class Navbar implements OnInit {
  unreadCount$;
  notifications$;
  isNotificationsOpen = false;

  constructor(
    public authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.unreadCount$ = this.notificationService.unreadCount$;
    this.notifications$ = this.notificationService.notifications$;
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.notificationService.initForUser(user.id);
      } else {
        this.notificationService.stopPolling();
      }
    });
  }

  @ViewChild('notificationsDropdown') notificationsDropdown!: ElementRef;

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (this.isNotificationsOpen && this.notificationsDropdown && !this.notificationsDropdown.nativeElement.contains(event.target)) {
      this.isNotificationsOpen = false;
    }
  }

  toggleNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  markAsRead(notification: any, event: Event) {
    event.stopPropagation();
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
  }

  deleteNotification(id: number, event: Event) {
    event.stopPropagation();
    this.notificationService.deleteNotification(id).subscribe();
  }

  goToChat(chatId: number) {
    this.isNotificationsOpen = false;
    this.router.navigate(['/chat'], { queryParams: { chat: chatId } });
  }
}
