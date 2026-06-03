import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
})
export class ProductCard {
  @Input() product!: Product;

  getStars(reputation: number): number[] {
    return Array(Math.round(reputation) || 0).fill(0);
  }

  getEmptyStars(reputation: number): number[] {
    return Array(5 - (Math.round(reputation) || 0)).fill(0);
  }
}
