import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
})
export class ProductCard implements OnInit {
  @Input() product!: Product;
  isMyProduct = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.currentUser;
    if (user && this.product) {
      this.isMyProduct = Number(this.product.userId) === Number(user.id);
    }
  }

  getStars(reputation: number): number[] {
    return Array(Math.round(reputation) || 0).fill(0);
  }

  getEmptyStars(reputation: number): number[] {
    return Array(5 - (Math.round(reputation) || 0)).fill(0);
  }
}
