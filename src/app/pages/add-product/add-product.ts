import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-product.html',
})
export class AddProduct {
  productForm: FormGroup;
  success: boolean = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
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

  onSubmit() {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      const newProduct = {
        title: formValue.title,
        description: formValue.description,
        price: Number(formValue.price),
        status: formValue.status,
        categoryId: Number(formValue.categoryId),
        userId: 1, // Mock user id
        available: true,
        createdAt: new Date().toISOString().split('T')[0],
        images: []
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
