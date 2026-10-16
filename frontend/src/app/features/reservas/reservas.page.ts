import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reserva, StatusReserva } from '../../core/models/reserva.model';
import { ReservaService } from '../../core/services/reserva.service';

@Component({
  selector: 'app-reservas-page',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './reservas.page.html',
  styleUrl: './reservas.page.css',
})
export class ReservasPage implements OnInit {
  private readonly reservaService = inject(ReservaService);

  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly filtroStatus = signal<StatusReserva | 'TODAS'>('TODAS');

  ngOnInit(): void {
    this.carregar();
  }

  protected filtrar(status: StatusReserva | 'TODAS'): void {
    this.filtroStatus.set(status);
    this.carregar();
  }

  protected rotuloStatus(status: Reserva['status']): string {
    return {
      AGENDADA: 'Agendada',
      EM_ANDAMENTO: 'Em hospedagem',
      CONCLUIDA: 'Concluída',
      CANCELADA: 'Cancelada',
    }[status];
  }

  protected rotuloPagamento(status: Reserva['statusPagamento']): string {
    return { PENDENTE: 'Pendente', PARCIAL: 'Parcial', PAGO: 'Pago' }[status];
  }

  private carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);
    const filtro = this.filtroStatus();
    const status: StatusReserva | undefined = filtro === 'TODAS' ? undefined : filtro;
    this.reservaService.listar({ status }).subscribe({
      next: (reservas) => {
        this.reservas.set(reservas);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  protected classeStatus(status: Reserva['status']): string {
    return `status status-${status.toLowerCase()}`;
  }
}
