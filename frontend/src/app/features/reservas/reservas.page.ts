import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reserva } from '../../core/models/reserva.model';
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

  ngOnInit(): void {
    this.reservaService.listar().subscribe({
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
