import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin, switchMap } from 'rxjs';
import {
  LembreteMedicamento,
  RegistroClinico,
  TipoRegistroClinico,
} from '../../core/models/cuidados.model';
import { Reserva } from '../../core/models/reserva.model';
import { CuidadosService } from '../../core/services/cuidados.service';
import { ReservaService } from '../../core/services/reserva.service';

function paraDataHoraLocal(valor: string): string {
  const data = new Date(valor);
  return new Date(data.getTime() - data.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

@Component({
  selector: 'app-cuidados-reserva-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './cuidados-reserva.page.html',
  styleUrl: './cuidados.page.css',
})
export class CuidadosReservaPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly reservaService = inject(ReservaService);
  private readonly cuidadosService = inject(CuidadosService);

  protected readonly reserva = signal<Reserva | null>(null);
  protected readonly registros = signal<RegistroClinico[]>([]);
  protected readonly lembretes = signal<LembreteMedicamento[]>([]);
  protected readonly carregando = signal(true);
  protected readonly processando = signal(false);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly mensagemDeErro = signal(false);
  protected readonly mensagemRegistro = signal<string | null>(null);
  protected readonly erroRegistro = signal(false);
  protected readonly mensagemLembrete = signal<string | null>(null);
  protected readonly erroLembrete = signal(false);
  protected readonly registroForm = this.formBuilder.nonNullable.group({
    tipo: ['OBSERVACAO' as TipoRegistroClinico, Validators.required],
    dataHora: ['', Validators.required],
    descricao: ['', [Validators.required, Validators.maxLength(2000)]],
    temperatura: [null as number | null],
    peso: [null as number | null],
  });
  protected readonly lembreteForm = this.formBuilder.nonNullable.group({
    medicamento: ['', [Validators.required, Validators.maxLength(150)]],
    dosagem: ['', [Validators.required, Validators.maxLength(100)]],
    viaAdministracao: ['', Validators.maxLength(80)],
    horarioProgramado: ['', Validators.required],
    observacoes: ['', Validators.maxLength(2000)],
  });

  ngOnInit(): void {
    const reservaId = this.route.snapshot.paramMap.get('id');
    if (!reservaId) {
      this.exibirErro('Reserva inválida.');
      this.carregando.set(false);
      return;
    }
    this.reservaService
      .buscarPorId(reservaId)
      .pipe(
        switchMap((reserva) => {
          this.reserva.set(reserva);
          return forkJoin({
            registros: this.cuidadosService.listarRegistros(reserva.petId),
            lembretes: this.cuidadosService.listarLembretes({ reservaId }),
          });
        }),
        finalize(() => this.carregando.set(false)),
      )
      .subscribe({
        next: ({ registros, lembretes }) => {
          this.registros.set(registros.filter((item) => item.reservaId === reservaId));
          this.lembretes.set(lembretes);
          const agora = new Date();
          this.registroForm.controls.dataHora.setValue(paraDataHoraLocal(agora.toISOString()));
        },
        error: (erro: HttpErrorResponse) =>
          this.exibirErro(erro.error?.mensagem ?? 'Não foi possível carregar os cuidados.'),
      });
  }

  protected salvarRegistro(): void {
    const reserva = this.reserva();
    if (!reserva || this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      this.exibirStatusRegistro('Preencha os campos obrigatórios do cuidado.', true);
      return;
    }
    const dados = this.registroForm.getRawValue();
    this.processando.set(true);
    this.mensagemRegistro.set(null);
    this.cuidadosService
      .criarRegistro(reserva.id, {
        ...dados,
        dataHora: new Date(dados.dataHora).toISOString(),
      })
      .pipe(finalize(() => this.processando.set(false)))
      .subscribe({
        next: (registro) => {
          this.registros.update((atuais) => [registro, ...atuais]);
          this.registroForm.controls.descricao.reset();
          this.registroForm.controls.temperatura.reset();
          this.registroForm.controls.peso.reset();
          this.exibirStatusRegistro('Cuidado registrado no histórico do pet.', false);
        },
        error: (erro: HttpErrorResponse) =>
          this.exibirStatusRegistro(
            erro.error?.mensagem ?? 'Não foi possível registrar o cuidado.',
            true,
          ),
      });
  }

  protected salvarLembrete(): void {
    const reserva = this.reserva();
    if (!reserva || this.lembreteForm.invalid) {
      this.lembreteForm.markAllAsTouched();
      this.exibirStatusLembrete(
        'Preencha os campos obrigatórios do lembrete.',
        true,
      );
      return;
    }
    const dados = this.lembreteForm.getRawValue();
    this.processando.set(true);
    this.mensagemLembrete.set(null);
    this.cuidadosService
      .criarLembrete(reserva.id, {
        ...dados,
        horarioProgramado: new Date(dados.horarioProgramado).toISOString(),
      })
      .pipe(finalize(() => this.processando.set(false)))
      .subscribe({
        next: (lembrete) => {
          this.lembretes.update((atuais) =>
            [...atuais, lembrete].sort((a, b) =>
              a.horarioProgramado.localeCompare(b.horarioProgramado),
            ),
          );
          this.lembreteForm.reset();
          this.exibirStatusLembrete('Lembrete de medicamento criado.', false);
        },
        error: (erro: HttpErrorResponse) =>
          this.exibirStatusLembrete(
            erro.error?.mensagem ?? 'Não foi possível criar o lembrete.',
            true,
          ),
      });
  }

  protected administrar(lembrete: LembreteMedicamento): void {
    this.atualizarLembrete(lembrete, 'ADMINISTRADO');
  }

  protected naoAdministrar(lembrete: LembreteMedicamento): void {
    const motivo = window.prompt('Informe o motivo da não administração:')?.trim();
    if (motivo) this.atualizarLembrete(lembrete, 'NAO_ADMINISTRADO', motivo);
  }

  protected cancelar(lembrete: LembreteMedicamento): void {
    this.processando.set(true);
    this.cuidadosService.cancelarLembrete(lembrete.id)
      .pipe(finalize(() => this.processando.set(false)))
      .subscribe({
        next: () => {
          this.lembretes.update((itens) =>
            itens.map((item) => item.id === lembrete.id ? { ...item, status: 'CANCELADO' } : item),
          );
          this.exibirSucesso('Lembrete cancelado.');
        },
        error: (erro: HttpErrorResponse) => this.exibirErro(erro.error?.mensagem ?? 'Não foi possível cancelar o lembrete.'),
      });
  }

  protected rotuloStatus(status: LembreteMedicamento['status']): string {
    return { PENDENTE: 'Pendente', ADMINISTRADO: 'Administrado', NAO_ADMINISTRADO: 'Não administrado', CANCELADO: 'Cancelado' }[status];
  }

  private atualizarLembrete(lembrete: LembreteMedicamento, status: 'ADMINISTRADO' | 'NAO_ADMINISTRADO', motivo?: string): void {
    this.processando.set(true);
    this.cuidadosService.alterarStatusLembrete(lembrete.id, status, motivo)
      .pipe(finalize(() => this.processando.set(false)))
      .subscribe({
        next: (atualizado) => {
          this.lembretes.update((itens) => itens.map((item) => item.id === atualizado.id ? atualizado : item));
          this.exibirSucesso('Situação do medicamento atualizada.');
        },
        error: (erro: HttpErrorResponse) => this.exibirErro(erro.error?.mensagem ?? 'Não foi possível atualizar o lembrete.'),
      });
  }

  private exibirStatusRegistro(mensagem: string, erro: boolean): void {
    this.mensagemRegistro.set(mensagem);
    this.erroRegistro.set(erro);
  }

  private exibirStatusLembrete(mensagem: string, erro: boolean): void {
    this.mensagemLembrete.set(mensagem);
    this.erroLembrete.set(erro);
  }

  private exibirSucesso(mensagem: string): void { this.mensagem.set(mensagem); this.mensagemDeErro.set(false); }
  private exibirErro(mensagem: string): void { this.mensagem.set(mensagem); this.mensagemDeErro.set(true); }
}
