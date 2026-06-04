import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Product } from '../../models';
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

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      const request$ = user 
        ? this.apiService.getProductsExceptUserId(user.id)
        : this.apiService.getProducts();

      request$.subscribe({
        next: (data) => {
          console.log('Home data:', data);
          // Show up to 4 popular products
          this.products = data.slice(0, 4);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('API Error in Home:', err);
        }
      });
    });
  }
}
