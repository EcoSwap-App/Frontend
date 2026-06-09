import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';

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
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value.email).subscribe(users => {
        if (users && users.length > 0) {
          this.router.navigate(['/home']);
        } else {
          this.error = 'Credenciales inválidas o usuario no encontrado.';
        }
      });
    }
  }

  loginWithMicrosoft() {
    this.isMicrosoftLoading = true;
    this.error = '';
    
    // Simulate OAuth redirect and processing
    setTimeout(() => {
      // In this mock MVP, if the user typed an email, we try to log them in with that email.
      // Otherwise, we fallback to our default test user Juan Perez.
      const emailToUse = this.loginForm.value.email || 'juan@upc.edu.pe';
      
      this.authService.login(emailToUse).subscribe({
        next: (users) => {
          this.isMicrosoftLoading = false;
          if (users && users.length > 0) {
            this.router.navigate(['/home']);
          } else {
            this.error = 'Error al conectar con Microsoft. El usuario no existe en la base de datos simulada.';
          }
        },
        error: () => {
          this.isMicrosoftLoading = false;
          this.error = 'Error de conexión con el servidor.';
        }
      });
    }, 1500);
  }
}
