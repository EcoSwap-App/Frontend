import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { User, Product } from '../../models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  user: User | null = null;
  products: Product[] = [];
  soldCount: number = 0;
  activeCount: number = 0;
  isCompressing: boolean = false;
  viewingImage: string | null = null;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (this.user) {
        this.loadMetrics();
      }
      this.cdr.detectChanges();
    });
  }

  loadMetrics() {
    if (!this.user) return;
    this.apiService.getProductsByUserId(this.user.id).subscribe(products => {
      this.products = products;
      this.soldCount = products.filter(p => p.status === 'sold').length;
      this.activeCount = products.filter(p => p.available === true || String(p.available) === 'true').length;
      this.cdr.detectChanges();
    });
  }

  async onFileSelected(event: any) {
    if (event.target.files && event.target.files[0] && this.user) {
      this.isCompressing = true;
      this.cdr.detectChanges();
      try {
        const file = event.target.files[0];
        const compressed = await this.compressImage(file);
        
        // Save to API
        this.apiService.updateUser(this.user.id, { avatar: compressed }).subscribe({
          next: (savedUser) => {
            this.authService.updateCurrentUser(savedUser);
            this.isCompressing = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error(err);
            this.isCompressing = false;
            this.cdr.detectChanges();
          }
        });
      } catch (err) {
        console.error('Error compressing image:', err);
        this.isCompressing = false;
        this.cdr.detectChanges();
      }
    }
  }

  deletePhoto() {
    if (this.user && confirm('¿Estás seguro de que deseas eliminar tu foto de perfil?')) {
      this.isCompressing = true;
      this.apiService.updateUser(this.user.id, { avatar: '' }).subscribe({
        next: (savedUser) => {
          this.authService.updateCurrentUser(savedUser);
          this.isCompressing = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.isCompressing = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  viewPhoto() {
    if (this.user?.avatar) {
      this.viewingImage = this.user.avatar;
    }
  }

  closePhotoViewer() {
    this.viewingImage = null;
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
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl);
          } catch (e) {
            reject(e);
          }
        };
      };
    });
  }
}
