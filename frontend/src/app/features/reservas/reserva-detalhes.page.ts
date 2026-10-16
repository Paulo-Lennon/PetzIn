import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Reserva, StatusReserva } from '../../core/models/reserva.model';
import { ReservaService } from '../../core/services/reserva.service';

@Component({
  selector: 'app-reserva-detalhes-page',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './reserva-detalhes.page.html',
  styleUrl: './reserva-detalhes.page.css',
})
export class ReservaDetalhesPage implements OnInit {
  private readonly reservaService = inject(ReservaService);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly reserva = signal<Reserva | null>(null);
  protected readonly carregando = signal(true);
  protected readonly processando = signal<string | null>(null);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly mensagemDeErro = signal(false);
  protected readonly confirmarCancelamento = signal(false);
  protected readonly pagamentoForm = this.formBuilder.nonNullable.group({
    valorPago: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.exibirErro('Reserva inválida.');
      this.carregando.set(false);
      return;
    }

    this.reservaService
      .buscarPorId(id)
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (reserva) => this.atualizarReserva(reserva),
        error: (error: HttpErrorResponse) =>
          this.exibirErro(error.error?.mensagem ?? 'Não foi possível carregar a reserva.'),
      });
  }

  protected alterarStatus(status: StatusReserva): void {
    const reserva = this.reserva();
    if (!reserva) return;

    this.processando.set('status');
    this.limparMensagem();
    this.reservaService
      .alterarStatus(reserva.id, status)
      .pipe(finalize(() => this.processando.set(null)))
      .subscribe({
        next: (atualizada) => {
          this.atualizarReserva({ ...reserva, ...atualizada });
          this.exibirSucesso(
            status === 'EM_ANDAMENTO'
              ? 'Hospedagem iniciada com sucesso.'
              : 'Hospedagem concluída com sucesso.',
          );
        },
        error: (error: HttpErrorResponse) =>
          this.exibirErro(error.error?.mensagem ?? 'Não foi possível alterar o status.'),
      });
  }

  protected registrarPagamento(): void {
    const reserva = this.reserva();
    if (!reserva || this.pagamentoForm.invalid) {
      this.pagamentoForm.markAllAsTouched();
      return;
    }

    this.processando.set('pagamento');
    this.limparMensagem();
    this.reservaService
      .registrarPagamento(reserva.id, this.pagamentoForm.controls.valorPago.value)
      .pipe(finalize(() => this.processando.set(null)))
      .subscribe({
        next: (atualizada) => {
          this.atualizarReserva({ ...reserva, ...atualizada });
          this.exibirSucesso('Pagamento atualizado com sucesso.');
        },
        error: (error: HttpErrorResponse) =>
          this.exibirErro(error.error?.mensagem ?? 'Não foi possível registrar o pagamento.'),
      });
  }

  protected cancelarReserva(): void {
    const reserva = this.reserva();
    if (!reserva) return;

    this.processando.set('cancelamento');
    this.limparMensagem();
    this.reservaService
      .cancelar(reserva.id)
      .pipe(finalize(() => this.processando.set(null)))
      .subscribe({
        next: () => {
          this.reserva.set({ ...reserva, status: 'CANCELADA' });
          this.confirmarCancelamento.set(false);
          this.exibirSucesso('Reserva cancelada. O histórico foi preservado.');
        },
        error: (error: HttpErrorResponse) => {
          this.confirmarCancelamento.set(false);
          this.exibirErro(error.error?.mensagem ?? 'Não foi possível cancelar a reserva.');
        },
      });
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

  protected saldo(reserva: Reserva): number {
    return Math.max(0, reserva.valorTotal - reserva.valorPago);
  }

  private atualizarReserva(reserva: Reserva): void {
    this.reserva.set(reserva);
    this.pagamentoForm.controls.valorPago.setValue(reserva.valorPago);
  }

  private limparMensagem(): void {
    this.mensagem.set(null);
    this.mensagemDeErro.set(false);
  }

  private exibirSucesso(mensagem: string): void {
    this.mensagem.set(mensagem);
    this.mensagemDeErro.set(false);
  }

  private exibirErro(mensagem: string): void {
    this.mensagem.set(mensagem);
    this.mensagemDeErro.set(true);
  }
}
