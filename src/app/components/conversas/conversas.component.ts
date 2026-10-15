import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from '../../models/usuario';
import { ConversaService } from './conversas.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-conversas',
  templateUrl: './conversas.component.html',
  styleUrls: ['./conversas.component.scss']
})
export class ConversasComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuariosDoBanco: Usuario[] = [];
  busca = '';
  buscaNovoContato = '';
  adicionandoConversa = false;
  carregando = true;
  erroAoCarregar = false;
  carregandoUsuariosDisponiveis = false;
  erroAoCarregarUsuarios = false;

  constructor(
    private conversaService: ConversaService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.conversaService.listarConversas().subscribe({
      next: usuarios => {
        this.usuarios = usuarios || [];
        this.carregando = false;
      },
      error: erro => {
        console.error('Erro ao carregar conversas:', erro);
        this.carregando = false;
        this.erroAoCarregar = true;
      }
    });
  }

  get usuariosFiltrados(): Usuario[] {
    const termo = this.busca.trim().toLocaleLowerCase();
    return this.usuarios.filter(usuario =>
      !this.authService.ehUsuarioAtual(usuario.id, usuario.email) &&
      (usuario.nome || '').toLocaleLowerCase().includes(termo)
    );
  }

  get usuariosDisponiveis(): Usuario[] {
    const termo = this.buscaNovoContato.trim().toLocaleLowerCase();
    return this.usuariosDoBanco.filter(usuario =>
      !this.authService.ehUsuarioAtual(usuario.id, usuario.email) && (
        (usuario.nome || '').toLocaleLowerCase().includes(termo) ||
        (usuario.email || '').toLocaleLowerCase().includes(termo)
      )
    );
  }

  abrirSeletorDeUsuarios(): void {
    this.buscaNovoContato = '';
    this.adicionandoConversa = true;
    this.carregandoUsuariosDisponiveis = true;
    this.erroAoCarregarUsuarios = false;

    this.conversaService.listarUsuariosDisponiveis().subscribe({
      next: usuarios => {
        this.usuariosDoBanco = usuarios || [];
        this.carregandoUsuariosDisponiveis = false;
      },
      error: erro => {
        console.error('Erro ao carregar usuários disponíveis:', erro);
        this.carregandoUsuariosDisponiveis = false;
        this.erroAoCarregarUsuarios = true;
      }
    });
  }

  fecharSeletorDeUsuarios(): void {
    this.adicionandoConversa = false;
  }

  iniciarConversa(usuario: Usuario): void {
    this.adicionandoConversa = false;
    this.router.navigate(['/conversas/mensagens', usuario.id]);
  }

  iniciais(nome: string): string {
    return nome.split(' ').filter(parte => parte.length > 0).slice(0, 2)
      .map(parte => parte.charAt(0)).join('').toLocaleUpperCase();
  }
}
