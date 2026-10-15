import { Usuario } from '../../models/usuario';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MensagensService } from './mensagens.service';
import { Mensagem } from 'src/app/models/mensagem';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MensagensWebsocketService } from './mensagens-websocket.service';
import { ConversaService } from '../conversas/conversas.service';

@Component({
  selector: 'app-mensagens',
  templateUrl: './mensagens.component.html',
  styleUrls: ['./mensagens.component.scss']
})
export class MensagensComponent implements OnInit, OnDestroy {

  @ViewChild('messageList') messageList!: ElementRef<HTMLDivElement>;

  usuario!: Usuario;

  usuarioId!: number;

  mensagens: Mensagem[] = [];

  novaMensagem = '';

  private routeSubscription: Subscription | null = null;
  private mensagensRealtimeSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private mensagensService: MensagensService,
    private mensagensWebsocket: MensagensWebsocketService,
    private conversaService: ConversaService
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
        this.rolarParaUltimaMensagem();

        const participantes = mensagens[0]?.conversa?.usuarios ?? [];
        const outro = participantes.find(u => u.id === this.usuarioId);
        if (outro) {
          this.usuario = outro;
        }

        if (!this.usuario) {
          this.conversaService.listarConversas().subscribe({
            next: usuarios => this.usuario = usuarios.find(u => u.id === this.usuarioId) as Usuario,
            error: erro => console.error('Erro ao carregar contato:', erro)
          });
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

  isMinhaMensagem(mensagem: Mensagem): boolean {
    return mensagem.senderId !== this.usuarioId;
  }

  iniciais(nome: string): string {
    return nome.split(' ').filter(parte => parte.length > 0).slice(0, 2)
      .map(parte => parte.charAt(0)).join('').toLocaleUpperCase();
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
    this.rolarParaUltimaMensagem();
  }

  private iniciarAtualizacoesEmTempoReal(conversaId: number): void {
    this.mensagensRealtimeSubscription?.unsubscribe();
    this.mensagensRealtimeSubscription = this.mensagensWebsocket
      .escutarConversa(conversaId)
      .subscribe(mensagem => this.adicionarMensagem(mensagem));
  }

  private rolarParaUltimaMensagem(): void {
    setTimeout(() => {
      if (this.messageList) {
        const elemento = this.messageList.nativeElement;
        elemento.scrollTop = elemento.scrollHeight;
      }
    });
  }
}
