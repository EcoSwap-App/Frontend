import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
})
export class ProductCard implements OnInit {
  @Input() product!: Product;
  isMyProduct = false;
  isFavorite = false;

  constructor(private authService: AuthService, private apiService: ApiService) {}

  ngOnInit() {
    const user = this.authService.currentUser;
    if (user && this.product) {
      this.isMyProduct = String(this.product.userId) === String(user.id);
      this.isFavorite = (user.favorites || []).map(String).includes(String(this.product.id));
    }
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    const user = this.authService.currentUser;
    if (!user) return;

    this.isFavorite = !this.isFavorite; // Optimistic UI update
    
    this.apiService.toggleFavorite(user.id, this.product.id, user.favorites || []).subscribe(updatedUser => {
      this.authService.updateCurrentUser(updatedUser);
    });
  }

  getStars(reputation: number): number[] {
    return Array(Math.round(reputation) || 0).fill(0);
  }

  getEmptyStars(reputation: number): number[] {
    return Array(5 - (Math.round(reputation) || 0)).fill(0);
  }
}
