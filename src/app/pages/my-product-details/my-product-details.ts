import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Product } from '../../models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './my-product-details.html',
})
export class MyProductDetails implements OnInit {
  product: Product | null = null;
  selectedImage: string = '';

  // Edit Modal State
  showEditModal = false;
  editTitle = '';
  editPrice = 0;
  editStatus = 'used';
  editDescription = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProductDetails(id);
      }
    });
  }

  loadProductDetails(id: string) {
    this.apiService.getProductById(id).subscribe({
      next: (data) => {
        // Verify ownership
        const user = this.authService.currentUser;
        if (!user || String(data.userId) !== String(user.id)) {
          console.warn('Access denied or not owner. Redirecting to catalog...', {
            productOwnerId: data.userId,
            currentUserId: user?.id
          });
          this.router.navigate(['/catalog']); // Redirect if not owner
          return;
        }
        this.product = data;
        if (data.images && data.images.length > 0) {
          this.selectedImage = this.formatImage(data.images[0]);
        } else {
          this.selectedImage = 'https://images.unsplash.com/photo-1544716278-e513176f20b5?auto=format&fit=crop&q=80&w=800';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading product details:', err);
        this.router.navigate(['/catalog']); // Redirect to catalog on error
        this.cdr.detectChanges();
      }
    });
  }

  formatImage(img: string): string {
    if (!img) return '';
    return img.startsWith('data:image') || img.startsWith('http') ? img : 'assets/' + img;
  }

  deleteProduct() {
    if (!this.product) return;
    if (confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
      this.apiService.deleteProduct(this.product.id).subscribe({
        next: () => {
          this.router.navigate(['/my-products']);
        },
        error: (err) => {
          console.error('Error deleting product:', err);
          alert('Hubo un error al eliminar el producto.');
        }
      });
    }
  }

  toggleAvailability() {
    if (!this.product) return;
    const newAvailableState = !this.product.available;
    this.apiService.updateProduct(this.product.id, { available: newAvailableState }).subscribe({
      next: (updatedProduct) => {
        this.product!.available = updatedProduct.available;
        this.cdr.detectChanges();
        alert(newAvailableState ? 'Publicación reactivada con éxito.' : 'Publicación pausada con éxito.');
      },
      error: (err) => {
        console.error('Error updating product status:', err);
        alert('Hubo un error al actualizar el estado del producto.');
      }
    });
  }

  openEditModal() {
    if (!this.product) return;
    this.editTitle = this.product.title;
    this.editPrice = this.product.price;
    this.editStatus = this.product.status;
    this.editDescription = this.product.description;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  saveProduct() {
    if (!this.product) return;
    if (!this.editTitle.trim()) {
      alert('El título es obligatorio.');
      return;
    }
    const updateData = {
      title: this.editTitle.trim(),
      price: this.editPrice,
      status: this.editStatus,
      description: this.editDescription.trim()
    };
    this.apiService.updateProduct(this.product.id, updateData).subscribe({
      next: (updated) => {
        this.product = { ...this.product, ...updated, description: updateData.description };
        this.showEditModal = false;
        this.cdr.detectChanges();
        alert('Producto actualizado con éxito.');
      },
      error: (err) => {
        console.error('Error updating product:', err);
        alert('Hubo un error al guardar los cambios.');
      }
    });
  }
}
