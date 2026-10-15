import { Conversa } from '../../models/conversa';
import { Usuario } from '../../models/usuario';
import { Component, OnDestroy, OnInit } from '@angular/core';

import { MensagensService } from './mensagens.service';
import { Mensagem } from 'src/app/models/mensagem';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MensagensWebsocketService } from './mensagens-websocket.service';

@Component({
  selector: 'app-conversas',
  templateUrl: './mensagens.component.html',
  styleUrls: ['./mensagens.component.scss']
})
export class MensagensComponent implements OnInit, OnDestroy {

  usuario!: Usuario;

  usuarioId!: number;

  mensagens: Mensagem[] = [];

  novaMensagem = '';

  private routeSubscription: Subscription | null = null;
  private mensagensRealtimeSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private mensagensService: MensagensService,
    private mensagensWebsocket: MensagensWebsocketService
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.mensagensWebsocket.encerrarConversa();
      this.mensagensRealtimeSubscription?.unsubscribe();
      this.mensagens = [];
      this.usuarioId = Number(params.get('usuarioId'));
      this.carregarConversas();
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.mensagensRealtimeSubscription?.unsubscribe();
    this.mensagensWebsocket.encerrarConversa();
  }

  carregarConversas(): void {
  this.mensagensService
    .pesquisarConversasPorId(this.usuarioId)
    .subscribe({
      next: mensagens => {
        this.mensagens = mensagens;

        const participantes = mensagens[0]?.conversa?.usuarios ?? [];
        const outro = participantes.find(u => u.id === this.usuarioId);
        if (outro) {
          this.usuario = outro;
        }

        const conversaId = mensagens[0]?.conversa?.id;
        if (conversaId) {
          this.iniciarAtualizacoesEmTempoReal(conversaId);
        }
      },
      error: erro => {
        console.error('Erro ao carregar mensagens:', erro.status, erro.error);
      }
    });
}

  formatarHora(data: string){
    return this.mensagensService.formatarHora(data);
  }

  enviar(){

    const conteudo = this.novaMensagem.trim();
    if (!conteudo) return;

    this.mensagensService.enviar(conteudo, this.usuarioId)
      .subscribe({
        next: mensagem => {
          const conversaId = mensagem.conversa?.id;
          if (conversaId && !this.mensagensRealtimeSubscription) {
            this.iniciarAtualizacoesEmTempoReal(conversaId);
          }
          this.adicionarMensagem(mensagem);
          this.novaMensagem = '';
        },
        error: erro => console.error('Erro ao enviar', erro.status, erro.error)
      });
  }

  private adicionarMensagem(mensagem: Mensagem): void {
    if (this.mensagens.some(atual => atual.id === mensagem.id)) {
      return;
    }
    this.mensagens = [...this.mensagens, mensagem];
  }

  private iniciarAtualizacoesEmTempoReal(conversaId: number): void {
    this.mensagensRealtimeSubscription?.unsubscribe();
    this.mensagensRealtimeSubscription = this.mensagensWebsocket
      .escutarConversa(conversaId)
      .subscribe(mensagem => this.adicionarMensagem(mensagem));
  }
}
