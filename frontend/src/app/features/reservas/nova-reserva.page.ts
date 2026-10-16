import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { Pet } from '../../core/models/pet.model';
import { ModalidadeCobranca, Reserva } from '../../core/models/reserva.model';
import { PetService } from '../../core/services/pet.service';
import { ReservaService } from '../../core/services/reserva.service';
import { calcularPreviaReserva } from './reserva-calculo';

function validarPeriodo(controle: AbstractControl): ValidationErrors | null {
  const entrada = controle.get('dataEntrada')?.value;
  const saida = controle.get('dataSaida')?.value;
  const erros: ValidationErrors = {};

  if (entrada) {
    const inicioMinutoAtual = new Date();
    inicioMinutoAtual.setSeconds(0, 0);
    if (new Date(entrada).getTime() < inicioMinutoAtual.getTime()) {
      erros['dataPassada'] = true;
    }
  }

  if (entrada && saida && new Date(saida).getTime() <= new Date(entrada).getTime()) {
    erros['periodoInvalido'] = true;
  }

  return Object.keys(erros).length ? erros : null;
}

function paraDataHoraLocal(valor: string): string {
  const data = new Date(valor);
  const ajusteFuso = data.getTimezoneOffset() * 60_000;
  return new Date(data.getTime() - ajusteFuso).toISOString().slice(0, 16);
}

@Component({
  selector: 'app-nova-reserva-page',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './nova-reserva.page.html',
  styleUrl: './nova-reserva.page.css',
})
export class NovaReservaPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly petService = inject(PetService);
  private readonly reservaService = inject(ReservaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly reservaId = this.route.snapshot.paramMap.get('id');
  protected readonly editando = Boolean(this.reservaId);
  protected readonly dataMinima = paraDataHoraLocal(new Date().toISOString());
  protected readonly pets = signal<Pet[]>([]);
  protected readonly carregando = signal(this.editando);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly avisoDataPassada = signal(false);
  protected readonly tarifaHora = signal(10);
  protected readonly tarifaDiaria = signal(240);
  protected readonly formulario = this.formBuilder.nonNullable.group(
    {
      petId: ['', Validators.required],
      dataEntrada: ['', Validators.required],
      dataSaida: ['', Validators.required],
      numeroCanil: [1, [Validators.required, Validators.min(1)]],
      modalidade: ['DIARIA' as ModalidadeCobranca, Validators.required],
      observacoes: ['', Validators.maxLength(2000)],
    },
    { validators: validarPeriodo },
  );

  ngOnInit(): void {
    if (!this.reservaId) {
      this.petService.listar().subscribe({
        next: (pets) => this.pets.set(pets),
        error: () => this.erro.set('Não foi possível carregar os pets.'),
      });
      return;
    }

    forkJoin({
      pets: this.petService.listar(),
      reserva: this.reservaService.buscarPorId(this.reservaId),
    })
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: ({ pets, reserva }) => this.preencherEdicao(pets, reserva),
        error: (error: HttpErrorResponse) =>
          this.erro.set(error.error?.mensagem ?? 'Não foi possível carregar a reserva.'),
      });
  }

  protected salvar(): void {
    this.formulario.updateValueAndValidity();
    if (this.formulario.hasError('dataPassada')) {
      this.formulario.controls.dataEntrada.markAsTouched();
      this.avisoDataPassada.set(true);
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const dados = this.formulario.getRawValue();
    this.salvando.set(true);
    this.erro.set(null);

    const payload = {
      ...dados,
      modalidade: dados.modalidade,
      dataEntrada: new Date(dados.dataEntrada).toISOString(),
      dataSaida: new Date(dados.dataSaida).toISOString(),
      observacoes: dados.observacoes.trim() || null,
    };
    const requisicao = this.reservaId
      ? this.reservaService.atualizar(this.reservaId, payload)
      : this.reservaService.cadastrar(payload);

    requisicao
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: (reserva) => void this.router.navigate(['/reservas', reserva.id]),
        error: (error: HttpErrorResponse) =>
          this.erro.set(error.error?.mensagem ?? 'Não foi possível salvar a reserva.'),
      });
  }

  protected validarDataEntrada(): void {
    this.formulario.updateValueAndValidity();
    if (this.formulario.hasError('dataPassada')) {
      this.avisoDataPassada.set(true);
    }
  }

  protected previa() {
    const valor = this.formulario.getRawValue();
    if (!valor.dataEntrada || !valor.dataSaida) return null;

    return calcularPreviaReserva(
      valor.modalidade,
      new Date(valor.dataEntrada),
      new Date(valor.dataSaida),
      this.tarifaHora(),
      this.tarifaDiaria(),
    );
  }

  private preencherEdicao(pets: Pet[], reserva: Reserva): void {
    this.pets.set(pets);
    this.tarifaHora.set(reserva.tarifaHora);
    this.tarifaDiaria.set(reserva.tarifaDiaria);

    if (reserva.status !== 'AGENDADA') {
      this.erro.set('Somente reservas agendadas podem ser editadas.');
      this.formulario.disable();
      return;
    }

    this.formulario.patchValue({
      petId: reserva.petId,
      dataEntrada: paraDataHoraLocal(reserva.dataEntrada),
      dataSaida: paraDataHoraLocal(reserva.dataSaida),
      numeroCanil: reserva.numeroCanil,
      modalidade: reserva.modalidade,
      observacoes: reserva.observacoes ?? '',
    });
  }
}
