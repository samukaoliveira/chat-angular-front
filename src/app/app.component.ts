import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'samchat';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  logado(): boolean {
    return this.authService.logado();
  }

  nomeUsuario(): string {
    return this.authService.getNomeUsuario();
  }

  iniciaisUsuario(): string {
    return this.nomeUsuario().split(' ').filter(parte => parte.length > 0).slice(0, 2)
      .map(parte => parte.charAt(0)).join('').toLocaleUpperCase();
  }
}
