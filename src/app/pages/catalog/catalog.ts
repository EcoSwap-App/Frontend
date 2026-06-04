import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Product } from '../../models';
import { ProductCard } from '../../components/product-card/product-card';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, ProductCard, FormsModule],
  templateUrl: './catalog.html',
})
export class Catalog implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm: string = '';
  selectedCategory: number | '' = '';

  constructor(
    private apiService: ApiService, 
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      const apiCall = user 
        ? this.apiService.getProductsExceptUserId(user.id)
        : this.apiService.getProducts();

      apiCall.subscribe({
        next: (data) => {
          console.log('Catalog raw data:', data);
          // Fallback for available in case it's string or boolean
          this.products = data.filter(p => p.available === true || String(p.available) === 'true');
          console.log('Products after availability filter:', this.products);
          this.applyFilters(); // Call applyFilters to initialize filteredProducts properly
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('API Error in Catalog:', err);
          this.products = [
            {id: 1, title: 'Mock Book', description: 'API Error Fallback', price: 0, status: 'new', categoryId: 1, userId: 1, available: true, createdAt: '', images: []}
          ];
          this.applyFilters();
        }
      });
    });
  }

  applyFilters() {
    console.log('Applying filters. Search:', this.searchTerm, 'Category:', this.selectedCategory);
    this.filteredProducts = this.products.filter(p => {
      const search = this.searchTerm || '';
      const titleMatch = p.title ? p.title.toLowerCase().includes(search.toLowerCase()) : false;
      const descMatch = p.description ? p.description.toLowerCase().includes(search.toLowerCase()) : false;
      const matchSearch = titleMatch || descMatch;
      
      const matchCategory = (this.selectedCategory !== '') 
        ? Number(p.categoryId) === Number(this.selectedCategory) 
        : true;
        
      return matchSearch && matchCategory;
    });
    console.log('Filtered products count:', this.filteredProducts.length);
  }
}
