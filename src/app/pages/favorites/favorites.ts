import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { ProductCard } from '../../components/product-card/product-card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, ProductCard, RouterLink],
  templateUrl: './favorites.html',
})
export class Favorites implements OnInit {
  products: Product[] = [];
  loading = true;

  constructor(private apiService: ApiService, private authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (!user) return;
      const favoriteIds = user.favorites || [];
      
      this.apiService.getProducts().subscribe({
        next: (allProducts) => {
          this.products = allProducts.filter(p => favoriteIds.map(String).includes(String(p.id)));
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching products', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    });
  }
}
