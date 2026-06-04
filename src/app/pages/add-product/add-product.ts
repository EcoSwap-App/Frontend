import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Category } from '../../models';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './add-product.html',
})
export class AddProduct implements OnInit {
  productForm: FormGroup;
  success: boolean = false;
  imagesBase64: string[] = [];
  isCompressing: boolean = false;
  previewImage: string | null = null;
  draggedIndex: number | null = null;
  categories: Category[] = [];

  ngOnInit() {
    this.apiService.getCategories().subscribe({
      next: (cats) => {
        console.log('Categories loaded:', cats);
        this.categories = cats;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching categories:', err)
    });
  }

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      status: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      categoryId: ['', Validators.required],
      subcategoryId: ['']
    });
  }

  async onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.isCompressing = true;
      this.cdr.detectChanges(); // Force UI update to show spinner
      
      // Allow UI to render the spinner before blocking the thread
      await new Promise(resolve => setTimeout(resolve, 50));
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.match(/image\/*/)) {
          try {
            const compressed = await this.compressImage(file);
            this.imagesBase64.push(compressed);
          } catch (error) {
            console.error('Error procesando la imagen:', error);
          }
        }
      }
      this.isCompressing = false;
      this.cdr.detectChanges(); // Force UI update to hide spinner
    }
    // Reset file input
    event.target.value = '';
  }

  removeImage(index: number, event: Event) {
    event.stopPropagation();
    this.imagesBase64.splice(index, 1);
  }

  // Drag and Drop Logic
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
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG with 0.85 quality for better visuals
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl);
          } catch (e) {
            reject(e);
          }
        };
      };
    });
  }

  onSubmit() {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      const user = this.authService.currentUser;
      
      const newProduct = {
        title: formValue.title,
        description: formValue.description,
        price: Number(formValue.price),
        status: formValue.status,
        categoryId: Number(formValue.categoryId),
        userId: user ? user.id : 1,
        available: true,
        createdAt: new Date().toISOString().split('T')[0],
        images: this.imagesBase64
      };

      this.apiService.addProduct(newProduct).subscribe(() => {
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/my-products']);
        }, 1500);
      });
    }
  }
}
