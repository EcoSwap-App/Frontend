import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Product, Category } from '../../models';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-my-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, DragDropModule],
  templateUrl: './my-product-details.html',
})
export class MyProductDetails implements OnInit {
  product: Product | null = null;
  selectedImage: string = '';
  isEditMode = false;
  isAvailable = true;
  saveSuccess = false;
  deleteConfirm = false;
  isCompressing = false;
  previewImage: string | null = null;
  categories: Category[] = [];
  editForm!: FormGroup;
  imagesBase64: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.apiService.getCategories().subscribe((cats) => {
      this.categories = cats;
      this.cdr.detectChanges();
    });

    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadProductDetails(id);
      }
    });
  }

  loadProductDetails(id: number) {
    this.apiService.getProductById(id).subscribe((data) => {
      // Verify ownership
      const user = this.authService.currentUser;

      if (!user || Number(data.userId) !== Number(user.id)) {
        this.router.navigate(['/catalog']); // Redirect if not owner
        return;
      }
      this.product = data;
      this.isAvailable = false;
      this.imagesBase64 = data.images ? [...data.images] : [];

      if (data.images && data.images.length > 0) {
        this.selectedImage =
          data.images[0].startsWith('data:image') || data.images[0].startsWith('http')
            ? data.images[0]
            : 'assets/' + data.images[0];
      } else {
        this.selectedImage =
          'https://images.unsplash.com/photo-1544716278-e513176f20b5?auto=format&fit=crop&q=80&w=800';
      }

      this.editForm = this.fb.group({
        type: [data.type || 'sale', Validators.required],
        title: [data.title, Validators.required],
        description: [data.description, Validators.required],
        price: [data.price, [Validators.required, Validators.min(0)]],
        status: [data.status, Validators.required],
        categoryId: [String(data.categoryId), Validators.required],
      });

      this.cdr.detectChanges();
    });
  }

  enterEditMode() {
    this.isEditMode = true;
    this.saveSuccess = false;
  }

  cancelEdit() {
    this.isEditMode = false;
    this.imagesBase64 = this.product?.images ? [...this.product.images] : [];
    this.editForm.patchValue({
      type: this.product?.type || 'sale',
      title: this.product?.title,
      description: this.product?.description,
      price: this.product?.price,
      status: this.product?.status,
      categoryId: this.product?.categoryId,
    });
  }

  saveChanges() {
    if (!this.editForm.valid || !this.product) return;

    const updated = {
      ...this.product,
      ...this.editForm.value,
      price: Number(this.editForm.value.price),
      categoryId: Number(this.editForm.value.categoryId),
      images: this.imagesBase64,
    };

    this.apiService.updateProduct(this.product.id, updated).subscribe((data) => {
      this.product = data;
      this.isEditMode = false;
      this.saveSuccess = true;
      if (data.images && data.images.length > 0) {
        this.selectedImage =
          data.images[0].startsWith('data:image') || data.images[0].startsWith('http')
            ? data.images[0]
            : 'assets/' + data.images[0];
      }
      setTimeout(() => (this.saveSuccess = false), 3000);
      this.cdr.detectChanges();
    });
  }

  toggleAvailability() {
    if (!this.product) return;
    const updated = { ...this.product, available: !this.isAvailable };
    this.apiService.updateProduct(this.product.id, updated).subscribe((data) => {
      this.isAvailable = data.available;
      this.product = data;
      this.cdr.detectChanges();
    });
  }

  confirmDelete() {
    this.deleteConfirm = true;
  }

  cancelDelete() {
    this.deleteConfirm = false;
  }

  deleteProduct() {
    if (!this.product) return;
    this.apiService.deleteProduct(this.product.id).subscribe(() => {
      this.router.navigate(['/my-products']);
    });
  }

  async onFileSelected(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    this.isCompressing = true;
    this.cdr.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 50));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.match(/image\/*/)) {
        try {
          const compressed = await this.compressImage(file);
          this.imagesBase64.push(compressed);
        } catch (error) {
          console.error('Error procesando imagen:', error);
        }
      }
    }
    this.isCompressing = false;
    this.cdr.detectChanges();
    event.target.value = '';
  }

  removeImage(index: number, event: Event) {
    event.stopPropagation();
    this.imagesBase64.splice(index, 1);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.imagesBase64, event.previousIndex, event.currentIndex);
  }

  openPreview(img: string) {
    this.previewImage = img;
  }

  closePreview() {
    this.previewImage = null;
  }

  compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.onerror = (e) => reject(e);
        img.src = event.target.result;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX = 600;
            let w = img.width,
              h = img.height;
            if (w > h) {
              if (w > MAX) {
                h *= MAX / w;
                w = MAX;
              }
            } else {
              if (h > MAX) {
                w *= MAX / h;
                h = MAX;
              }
            }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/webp', 0.7));
          } catch (e) {
            reject(e);
          }
        };
      };
    });
  }
}
