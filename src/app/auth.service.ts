import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/login`;

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, senha: string) {
    return this.http.post<any>(`${environment.apiUrl}/login`, {
      email,
      senha
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('emailUsuario');
  }

  logado(): boolean{
     return !!this.getToken();
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getNomeUsuario(): string {
    const claims = this.getTokenClaims();
    if (claims) {
      const nome = claims.nome || claims.name || claims.username || claims.preferred_username;
      return String(nome || claims.email || claims.sub || localStorage.getItem('emailUsuario') || 'Minha conta');
    }
    return localStorage.getItem('emailUsuario') || 'Minha conta';
  }

  ehUsuarioAtual(id: number, email: string): boolean {
    const claims = this.getTokenClaims() || {};
    const idClaim = claims.idUsuario || claims.usuarioId || claims.userId || claims.user_id ||
      claims.id || claims.usuario && claims.usuario.id || claims.user && claims.user.id;
    const idAtual = Number(idClaim);

    if (idClaim !== undefined && idClaim !== null && Number.isFinite(idAtual) && idAtual === Number(id)) {
      return true;
    }

    const emailClaim = claims.email ||
      (typeof claims.sub === 'string' && claims.sub.indexOf('@') >= 0 ? claims.sub : '') ||
      localStorage.getItem('emailUsuario') || '';
    return !!email && !!emailClaim && email.trim().toLowerCase() === String(emailClaim).trim().toLowerCase();
  }

  private getTokenClaims(): any | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const preenchido = base64 + '='.repeat((4 - base64.length % 4) % 4);
      const bytes = atob(preenchido);
      const json = decodeURIComponent(Array.prototype.map.call(bytes, (caractere: string) =>
        '%' + caractere.charCodeAt(0).toString(16).padStart(2, '0')
      ).join(''));
      return JSON.parse(json);
    } catch (erro) {
      return null;
    }
  }
}
