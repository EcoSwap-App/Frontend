import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './register.html',
})
export class Register {
  registerForm: FormGroup;
  error: string = '';
  avatarBase64: string = '';
  isCompressing: boolean = false;
  isMicrosoftLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  async onFileSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      console.log('File selected:', event.target.files[0].name);
      this.isCompressing = true;
      this.cdr?.detectChanges();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      try {
        const file = event.target.files[0];
        console.log('Starting compression...');
        this.avatarBase64 = await this.compressImage(file);
        console.log('Compression successful, length:', this.avatarBase64.length);
      } catch (err) {
        console.error('Error compressing image:', err);
      } finally {
        this.isCompressing = false;
        event.target.value = ''; // Reset file input here as well
        this.cdr?.detectChanges();
        console.log('Spinner should be hidden now');
      }
    }
  }

  removePhoto(event: Event, fileInput: HTMLInputElement) {
    event.stopPropagation();
    this.avatarBase64 = '';
    fileInput.value = '';
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
            const MAX_WIDTH = 400;
            const MAX_HEIGHT = 400;
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
            
            // Use WebP for better compression, quality 0.7
            const dataUrl = canvas.toDataURL('image/webp', 0.7);
            resolve(dataUrl);
          } catch (e) {
            reject(e);
          }
        };
      };
    });
  }

  onSubmit() {
    if (this.registerForm.valid && !this.isCompressing) {
      // Mock registration
      const newUser = {
        name: this.registerForm.value.name,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        avatar: this.avatarBase64,
        universityId: 1,
        career: 'General',
        cycle: 1,
        reputation: 0,
        verified: false,
        active: true,
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      this.http.post('http://localhost:3001/users', newUser).subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: () => {
          this.error = 'Error al crear la cuenta.';
        }
      });
    }
  }

  registerWithMicrosoft() {
    this.isMicrosoftLoading = true;
    this.error = '';
    
    setTimeout(() => {
      const mockRandom = Math.floor(Math.random() * 10000);
      const newUser = {
        name: `Estudiante Verificado ${mockRandom}`,
        email: `u202${mockRandom}@upc.edu.pe`,
        password: 'password123',
        avatar: '',
        universityId: 1,
        career: 'No especificada',
        cycle: 1,
        reputation: 0,
        verified: true, // Auto-verified by Microsoft SSO!
        active: true,
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      this.http.post('http://localhost:3001/users', newUser).subscribe({
        next: () => {
          this.isMicrosoftLoading = false;
          this.authService.login(newUser.email).subscribe(() => {
            this.router.navigate(['/home']);
          });
        },
        error: () => {
          this.isMicrosoftLoading = false;
          this.error = 'Error al conectar con Microsoft.';
        }
      });
    }, 1500);
  }
}
