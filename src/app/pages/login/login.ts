import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { SupabaseService } from '../../services/supabase.service';
import { from } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  loginForm: FormGroup;
  error: string = '';
  isMicrosoftLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(
        this.loginForm.value.email,
        this.loginForm.value.password
      ).subscribe({
        next: (user) => {
          if (user) {
            this.router.navigate(['/home']);
          } else {
            this.error = 'Credenciales inválidas o usuario no encontrado.';
          }
        },
        error: (err) => {
          this.error = 'Credenciales inválidas o error de conexión: ' + (err.message || err);
        }
      });
    }
  }

  loginWithMicrosoft() {
    this.isMicrosoftLoading = true;
    this.error = '';
    
    from(this.supabaseService.client.auth.signInWithOAuth({
      provider: 'azure',
    })).subscribe({
      next: (res) => {
        if (res.error) {
          this.error = res.error.message;
          this.isMicrosoftLoading = false;
        }
      },
      error: (err) => {
        this.error = 'Error de conexión con Microsoft.';
        this.isMicrosoftLoading = false;
      }
    });
  }
}
