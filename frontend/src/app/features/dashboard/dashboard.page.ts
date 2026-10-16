import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ResumoFinanceiro } from '../../core/models/financeiro.model';
import { Reserva } from '../../core/models/reserva.model';
import { FinanceiroService } from '../../core/services/financeiro.service';
import { PetService } from '../../core/services/pet.service';
import { ReservaService } from '../../core/services/reserva.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage implements OnInit {
  private readonly petService = inject(PetService);
  private readonly reservaService = inject(ReservaService);
  private readonly financeiroService = inject(FinanceiroService);

  protected readonly hoje = new Date();
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly quantidadePets = signal(0);
  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly financeiro = signal<ResumoFinanceiro | null>(null);
  protected readonly quantidadeHospedados = computed(
    () => this.reservas().filter((reserva) => reserva.status === 'EM_ANDAMENTO').length,
  );
  protected readonly quantidadeAgendadas = computed(
    () => this.reservas().filter((reserva) => reserva.status === 'AGENDADA').length,
  );
  protected readonly hospedados = computed(() =>
    this.reservas().filter((reserva) => reserva.status === 'EM_ANDAMENTO').slice(0, 4),
  );
  protected readonly proximas = computed(() =>
    this.reservas().filter((reserva) => reserva.status === 'AGENDADA').slice(0, 4),
  );

  ngOnInit(): void {
    forkJoin({
      pets: this.petService.listar(),
      reservas: this.reservaService.listar(),
      financeiro: this.financeiroService.obterResumo(),
    }).subscribe({
      next: ({ pets, reservas, financeiro }) => {
        this.quantidadePets.set(pets.length);
        this.reservas.set(reservas);
        this.financeiro.set(financeiro);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }
}
