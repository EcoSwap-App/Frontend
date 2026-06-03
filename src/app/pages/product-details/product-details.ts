import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api';
import { Product } from '../../models';
import { ProductCard } from '../../components/product-card/product-card';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './product-details.html',
})
export class ProductDetails implements OnInit {
  product: Product | null = null;
  otherProducts: Product[] = [];
  selectedImage: string = '';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadProductDetails(id);
      }
    });
  }

  loadProductDetails(id: number) {
    this.apiService.getProductById(id).subscribe(data => {
      this.product = data;
      this.selectedImage = (data.images && data.images.length > 0) ? 'assets/' + data.images[0] : 'https://images.unsplash.com/photo-1544716278-e513176f20b5?auto=format&fit=crop&q=80&w=800';
      
      // Load other products
      this.apiService.getProducts().subscribe(allProducts => {
        this.otherProducts = allProducts
          .filter(p => Number(p.id) !== Number(id) && (p.available === true || String(p.available) === 'true'))
          .slice(0, 4); // Take up to 4 other products
        this.cdr.detectChanges();
      });
      this.cdr.detectChanges();
    });
  }

  getStars(reputation: number): number[] {
    return Array(Math.round(reputation) || 0).fill(0);
  }

  getEmptyStars(reputation: number): number[] {
    return Array(5 - (Math.round(reputation) || 0)).fill(0);
  }

  requestProduct() {
    alert(`Has solicitado el producto: ${this.product?.title}. El vendedor será notificado.`);
  }
}
