import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Mensagem } from '../../models/mensagem';

@Injectable({ providedIn: 'root' })
export class MensagensWebsocketService {
  private client: Client;
  private subscription: StompSubscription | null = null;
  private conversaId: number | null = null;
  private mensagensSubject = new Subject<Mensagem>();

  constructor() {
    this.client = new Client({
      brokerURL: environment.websocketUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: {}
    });

    this.client.onConnect = () => this.inscreverNaConversa();
    this.client.onStompError = frame => {
      console.error('Erro STOMP:', frame.headers['message'], frame.body);
    };
    this.client.onWebSocketError = erro => {
      console.error('Erro na conexão WebSocket:', erro);
    };
  }

  escutarConversa(conversaId: number): Observable<Mensagem> {
    this.conversaId = conversaId;
    this.subscription?.unsubscribe();
    this.subscription = null;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Não foi possível conectar ao chat sem um token de autenticação.');
      return this.mensagensSubject.asObservable();
    }

    this.client.connectHeaders = { Authorization: `Bearer ${token}` };
    if (!this.client.active) {
      this.client.activate();
    } else if (this.client.connected) {
      this.inscreverNaConversa();
    }

    return this.mensagensSubject.asObservable();
  }

  encerrarConversa(): void {
    this.conversaId = null;
    this.subscription?.unsubscribe();
    this.subscription = null;
    if (this.client.active) {
      this.client.deactivate();
    }
  }

  private inscreverNaConversa(): void {
    if (this.conversaId === null || !this.client.connected) {
      return;
    }

    this.subscription?.unsubscribe();
    this.subscription = this.client.subscribe(
      `/topic/conversas/${this.conversaId}`,
      (frame: IMessage) => {
        try {
          this.mensagensSubject.next(JSON.parse(frame.body) as Mensagem);
        } catch (erro) {
          console.error('Não foi possível interpretar a mensagem recebida:', erro);
        }
      }
    );
  }
}
