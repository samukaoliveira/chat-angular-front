import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ChatComponent } from './components/chat/chat.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './auth.guard';
import { MensagensComponent } from './components/mensagens/mensagens.component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'conversas',
    component: ChatComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'mensagens/:usuarioId',
        component: MensagensComponent
      }
    ]
  },
  {
    path: 'mensagens/:usuarioId',
    redirectTo: 'conversas/mensagens/:usuarioId'
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
