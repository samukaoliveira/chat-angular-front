import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Usuario } from '../../models/usuario';
import { Mensagem } from 'src/app/models/mensagem';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MensagensService {

  private apiUrl = `${environment.apiUrl}/conversas`;

  constructor(private http: HttpClient) {}

  pesquisarConversasPorId(id: number): Observable<Mensagem[]> {
    return this.http.get<Mensagem[]>(
      `${this.apiUrl}/usuario/${id}`
    );
  }

  enviar(mensagem: string, idUsuario: number): Observable<Mensagem> {
    return this.http.post<Mensagem>(
      `${this.apiUrl}/${idUsuario}/enviar`,
      { conteudo: mensagem
      }
    );
  }

  pesquisarConversasPorNome(nomeUsuario: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(
      `${this.apiUrl}`,
      { params: {
        nomeUsuario: nomeUsuario }
      }
    );
  }

  formatarHora(data: string): string {
    if (!data) {
      return '';
    }

    const dataMensagem = new Date(data);
    if (isNaN(dataMensagem.getTime())) {
      const [dataParte, horaParte = ''] = data.split(' ');
      const [dia, mes, ano] = dataParte.split('/').map(Number);
      const [hora, minuto] = horaParte.split(':').map(Number);
      if (!dia || !mes || !ano) return data;
      return `${dataParte}, ${String(hora || 0).padStart(2, '0')}:${String(minuto || 0).padStart(2, '0')}`;
    }

    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const hora = `${String(dataMensagem.getHours()).padStart(2, '0')}:${String(dataMensagem.getMinutes()).padStart(2, '0')}`;

    if (
      dataMensagem.getDate() === hoje.getDate() &&
      dataMensagem.getMonth() === hoje.getMonth() &&
      dataMensagem.getFullYear() === hoje.getFullYear()
    ) {
      return `hoje, ${hora}`;
    }

    if (
      dataMensagem.getDate() === ontem.getDate() &&
      dataMensagem.getMonth() === ontem.getMonth() &&
      dataMensagem.getFullYear() === ontem.getFullYear()
    ) {
      return `ontem, ${hora}`;
    }

    return `${String(dataMensagem.getDate()).padStart(2, '0')}/${String(dataMensagem.getMonth() + 1).padStart(2, '0')}/${dataMensagem.getFullYear()}, ${hora}`;
  }
}
