import { Conversa } from "./conversa";

export interface Mensagem {
  id: number;
  conteudo: string;
  horaEnvio: string;
  conversa: Conversa;
  senderId: number;
}
