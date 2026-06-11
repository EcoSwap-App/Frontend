import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Product } from '../../models';

@Component({
  selector: 'app-my-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-product-details.html',
})
export class MyProductDetails implements OnInit {
  product: Product | null = null;
  selectedImage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
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
      // Verify ownership
      const user = this.authService.currentUser;

      if (!user || Number(data.userId) !== Number(user.id)) {
        this.router.navigate(['/catalog']); // Redirect if not owner
        return;
      }
      this.product = data;
      console.log('Producto asignado:', this.product);
      if (data.images && data.images.length > 0) {
        this.selectedImage =
          data.images[0].startsWith('data:image') || data.images[0].startsWith('http')
            ? data.images[0]
            : 'assets/' + data.images[0];
      } else {
        this.selectedImage = 'https://images.unsplash.com/photo-1544716278-e513176f20b5?auto=format&fit=crop&q=80&w=800';
      }
      this.cdr.detectChanges();
    });
  }
}
