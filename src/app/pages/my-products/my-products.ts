import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { Product } from '../../models';
import { ProductCard } from '../../components/product-card/product-card';

@Component({
  selector: 'app-my-products',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './my-products.html',
})
export class MyProducts implements OnInit {
  products: Product[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getProducts().subscribe(data => {
      // Mocking filtering by userId = 1
      this.products = data.filter(p => p.userId === 1);
    });
  }
}
