# SamChat Frontend

Aplicação web de chat feita com Angular 10. A interface oferece login, lista de contatos, seleção de usuários para iniciar conversas, histórico de mensagens e recebimento de novas mensagens em tempo real.

## Requisitos

- Node.js e npm compatíveis com Angular CLI 10.
- Backend SamChat em execução e acessível pelo navegador.
- Para a configuração local padrão, o backend deve estar em `http://localhost:8080` e permitir a origem `http://localhost:4200`.

## Executar localmente

```bash
npm install
npm start
```

A aplicação fica disponível em `http://localhost:4200`. O comando `npm start` executa `ng serve` e recarrega a página quando os arquivos do frontend mudam.

## Arquitetura

O projeto é uma aplicação Angular organizada em componentes, serviços, modelos e configuração de rotas:

```text
src/app/
├── app.component.*             # Cabeçalho global e ponto de entrada das rotas
├── app-routing.module.ts        # Rotas e proteção da área autenticada
├── auth.service.ts              # Login, token e identidade local do usuário
├── auth.interceptor.ts          # Envia o JWT nas chamadas HTTP
├── auth.guard.ts                # Redireciona usuários sem token para o login
├── models/                      # Usuario, Conversa e Mensagem
└── components/
    ├── login/                   # Formulário de autenticação
    ├── chat/                    # Layout com contatos e conversa selecionada
    ├── conversas/               # Lista, busca e seletor de usuários
    └── mensagens/               # Histórico, envio e atualização em tempo real
```

### Componentes e responsabilidades

- **`AppComponent`** exibe a marca SamChat, o avatar/nome do usuário autenticado e a ação de sair.
- **`LoginComponent`** envia e-mail e senha para a API, guarda o JWT e abre a área de conversas.
- **`ChatComponent`** organiza a tela em uma lista lateral e um painel principal. Em telas pequenas, a lista e o chat são exibidos em etapas.
- **`ConversasComponent`** carrega os contatos disponíveis na lista, permite filtrar por nome e abre um seletor para buscar todos os usuários do banco.
- **`MensagensComponent`** consulta o histórico, envia mensagens por HTTP, separa balões enviados e recebidos e acompanha novas mensagens pelo WebSocket.
- **`MensagensWebsocketService`** gerencia a conexão STOMP, reconexão e inscrição no tópico da conversa ativa.
- **`ConversaService`** e **`MensagensService`** encapsulam chamadas HTTP relacionadas a usuários, conversas e mensagens.

## Rotas da interface

| Rota | Uso | Acesso |
| --- | --- | --- |
| `/login` | Autenticação | Público |
| `/conversas` | Lista de conversas e tela inicial do chat | Requer token |
| `/conversas/mensagens/:usuarioId` | Conversa com o usuário indicado | Requer token |
| `/mensagens/:usuarioId` | Compatibilidade com a rota antiga; redireciona para a rota aninhada | Requer token no destino |

O `AuthGuard` verifica a presença do token no navegador. O backend continua responsável por validar o JWT e autorizar cada operação.

## Fluxo principal

1. O login envia `{ "email", "senha" }` para `POST /login`.
2. Ao autenticar, o frontend guarda o token em `localStorage` e o e-mail informado como fallback para identificar o usuário atual.
3. O `AuthInterceptor` adiciona `Authorization: Bearer <token>` às chamadas HTTP.
4. A tela carrega a lista lateral em `GET /conversas/listar`.
5. O botão **Adicionar conversa** consulta `GET /usuarios/listar` e permite pesquisar por nome ou e-mail. O frontend remove da lista o próprio usuário, comparando ID/e-mail com os dados disponíveis no JWT e com o e-mail salvo no login.
6. Ao selecionar um contato, a aplicação abre `/conversas/mensagens/:usuarioId` e busca o histórico em `GET /conversas/usuario/{usuarioId}`.
7. O envio usa `POST /conversas/{usuarioChamadoId}/enviar` com o corpo `{ "conteudo": "..." }`. Se ainda não existir conversa, o backend a cria ao receber a primeira mensagem.

### Contrato de listagem de usuários

O frontend chama `GET /usuarios/listar` **sem corpo** e espera uma lista de objetos `Usuario` com `id`, `nome` e `email`. No backend, a assinatura deve ser compatível com essa chamada, por exemplo:

```java
@GetMapping("/listar")
public ResponseEntity<List<Usuario>> usuarios() {
    return ResponseEntity.ok(usuarioService.findAll());
}
```

Um parâmetro obrigatório anotado com `@RequestBody` em um GET sem corpo causa `400 Bad Request` antes de o método ser executado. Para aceitar filtro opcional, use `@RequestParam` e envie o filtro como query string.

## Atualização em tempo real

O envio continua sendo HTTP. Depois de carregar uma conversa com mensagens, o frontend obtém o `conversa.id` da resposta e se inscreve no tópico STOMP:

```text
WebSocket: ws://localhost:8080/ws
Tópico:    /topic/conversas/{conversaId}
```

O token JWT é enviado no cabeçalho STOMP `Authorization` durante o `CONNECT`. O backend publica no tópico após salvar a mensagem; o cliente só assina o tópico e não envia mensagens por STOMP. A conexão tenta se restabelecer automaticamente após uma queda.

Em uma conversa sem histórico, o ID da conversa ainda não está disponível. Após a primeira mensagem, a resposta HTTP fornece esse ID e a tela inicia a inscrição no tópico.

## Configuração de ambiente

As configurações ficam em:

- `src/environments/environment.ts` para desenvolvimento.
- `src/environments/environment.prod.ts` para build de produção.

Os campos `apiUrl` e `websocketUrl` apontam para o backend. Ajuste-os para o ambiente de destino e configure também a origem CORS do backend. A configuração versionada aponta para `localhost`; ela precisa ser alterada para uma implantação real. O serviço de conversas também usa atualmente URLs locais definidas em `conversas.service.ts`.

## Build e testes

```bash
npm run build
npm test
```

O build de produção pode ser gerado com:

```bash
ng build --prod
```

Os artefatos ficam em `dist/`. Os testes unitários usam Karma e Jasmine.
