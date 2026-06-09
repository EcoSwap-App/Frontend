import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Product, Category, User } from '../../models';
import { ProductCard } from '../../components/product-card/product-card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ProductCard, RouterLink],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  currentUser: User | null = null;
  trendingProducts: Product[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      const request$ = user 
        ? this.apiService.getProductsExceptUserId(user.id)
        : this.apiService.getProducts();

      request$.subscribe({
        next: (data) => {
          // Newest first for the feed
          this.products = [...data].reverse().slice(0, 10);
          // Popular/Trending for right sidebar (mock logic)
          this.trendingProducts = [...data].sort((a, b) => b.price - a.price).slice(0, 3);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('API Error in Home:', err);
        }
      });
    });

    this.apiService.getCategories().subscribe(cats => {
      this.categories = cats;
      this.cdr.detectChanges();
    });
  }
}
