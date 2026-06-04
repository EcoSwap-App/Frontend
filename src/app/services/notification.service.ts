import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, interval, switchMap, of, map } from 'rxjs';
import { ApiService } from './api';
import { Notification } from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private pollSubscription?: Subscription;
  private userId: number | string | null = null;

  constructor(private apiService: ApiService) {}

  initForUser(userId: number | string) {
    this.userId = userId;
    this.refreshNotifications();
    this.startPolling();
  }

  private startPolling() {
    this.stopPolling();
    this.pollSubscription = interval(5000)
      .pipe(
        switchMap(() => {
          if (this.userId) {
            return this.apiService.getNotifications(this.userId);
          }
          return of(null);
        })
      )
      .subscribe(notifications => {
        if (notifications) {
          const currentLength = this.notificationsSubject.value.length;
          // Simple check for new notifications, or if unread status changed
          if (notifications.length !== currentLength || this.hasUnreadChanges(notifications)) {
            this.updateState(notifications);
          }
        }
      });
  }

  private hasUnreadChanges(newNotifications: Notification[]): boolean {
    const current = this.notificationsSubject.value;
    if (newNotifications.length !== current.length) return true;
    
    for (let i = 0; i < newNotifications.length; i++) {
      if (newNotifications[i].read !== current[i]?.read) {
        return true;
      }
    }
    return false;
  }

  refreshNotifications() {
    if (this.userId) {
      this.apiService.getNotifications(this.userId).subscribe(notifications => {
        this.updateState(notifications);
      });
    }
  }

  private updateState(notifications: Notification[]) {
    this.notificationsSubject.next(notifications);
    this.unreadCountSubject.next(notifications.filter(n => !n.read).length);
  }

  markAsRead(id: number | string) {
    return this.apiService.markNotificationRead(id, true).pipe(
      map(() => {
        // Update local state optimisticly
        const notifications = this.notificationsSubject.value.map(n => 
          String(n.id) === String(id) ? { ...n, read: true } : n
        );
        this.updateState(notifications);
      })
    );
  }

  deleteNotification(id: number | string) {
    return this.apiService.deleteNotification(id).pipe(
      map(() => {
        const notifications = this.notificationsSubject.value.filter(n => String(n.id) !== String(id));
        this.updateState(notifications);
      })
    );
  }

  stopPolling() {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
      this.pollSubscription = undefined;
    }
  }

  ngOnDestroy() {
    this.stopPolling();
  }
}
