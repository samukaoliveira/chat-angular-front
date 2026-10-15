import { Component } from '@angular/core';
import { AuthService } from 'src/app/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  senha = '';
  message = '';

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    this.authService.login(this.email, this.senha).subscribe({
      next: res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('emailUsuario', this.email.trim().toLowerCase());
        this.router.navigate(['/conversas']);
      },
      error: err => {
        if (err.status === 0) {
          this.message = 'Não foi possível conectar ao servidor.';
        } else if (err.status === 401 || err.status === 403) {
          this.message = 'Usuário ou senha inválidos.';
        } else if (err.status >= 500) {
          this.message = 'Erro interno no servidor. Tente novamente mais tarde.';
        } else {
          this.message = 'Não foi possível realizar o login.';
        }
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
