import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  protected readonly authService = inject(AuthService);
  protected readonly menuAberto = signal(false);

  protected readonly navegacao = [
    { rota: '/dashboard', icone: '⌂', texto: 'Dashboard' },
    { rota: '/reservas', icone: '▣', texto: 'Reservas' },
    { rota: '/pets', icone: '●', texto: 'Pets' },
    { rota: '/tutores', icone: '♙', texto: 'Clientes (Tutores)' },
    { rota: '/financeiro', icone: '▥', texto: 'Financeiro' },
    { rota: '/configuracoes/senha', icone: '⚙', texto: 'Configurações' },
  ];

  protected alternarMenu(): void {
    this.menuAberto.update((aberto) => !aberto);
  }

  protected fecharMenu(): void {
    this.menuAberto.set(false);
  }
}
