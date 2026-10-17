import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { RegistroClinico } from '../../core/models/cuidados.model';
import { Pet } from '../../core/models/pet.model';
import { CuidadosService } from '../../core/services/cuidados.service';

@Component({
  selector: 'app-prontuario-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './prontuario.page.html',
  styleUrl: './cuidados.page.css',
})
export class ProntuarioPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly cuidadosService = inject(CuidadosService);

  protected readonly pet = signal<Pet | null>(null);
  protected readonly registros = signal<RegistroClinico[]>([]);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly mensagemDeErro = signal(false);
  protected readonly formulario = this.formBuilder.nonNullable.group({
    vacinasEmDia: ['', Validators.required],
    alergias: ['', [Validators.required, Validators.maxLength(2000)]],
    condicoesClinicas: ['', [Validators.required, Validators.maxLength(2000)]],
    restricoesAlimentares: ['', [Validators.required, Validators.maxLength(2000)]],
    veterinarioNome: ['', [Validators.required, Validators.maxLength(150)]],
    veterinarioTelefone: ['', Validators.required],
    observacoes: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  ngOnInit(): void {
    const petId = this.route.snapshot.paramMap.get('id');
    if (!petId) {
      this.exibirErro('Pet inválido.');
      this.carregando.set(false);
      return;
    }
    forkJoin({
      resumo: this.cuidadosService.buscarFicha(petId),
      registros: this.cuidadosService.listarRegistros(petId),
    })
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: ({ resumo, registros }) => {
          this.pet.set(resumo.pet);
          this.registros.set(registros);
          if (resumo.ficha) {
            this.formulario.patchValue({
              vacinasEmDia:
                resumo.ficha.vacinasEmDia === null
                  ? ''
                  : String(resumo.ficha.vacinasEmDia),
              alergias: resumo.ficha.alergias ?? '',
              condicoesClinicas: resumo.ficha.condicoesClinicas ?? '',
              restricoesAlimentares: resumo.ficha.restricoesAlimentares ?? '',
              veterinarioNome: resumo.ficha.veterinarioNome ?? '',
              veterinarioTelefone: resumo.ficha.veterinarioTelefone ?? '',
              observacoes: resumo.ficha.observacoes ?? '',
            });
          }
        },
        error: (erro: HttpErrorResponse) =>
          this.exibirErro(erro.error?.mensagem ?? 'Não foi possível carregar o prontuário.'),
      });
  }

  protected salvar(): void {
    const pet = this.pet();
    if (!pet || this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.exibirErro(
        'Preencha todos os campos. Se não houver nada a declarar, informe N/A.',
      );
      return;
    }
    const dados = this.formulario.getRawValue();
    this.salvando.set(true);
    this.mensagem.set(null);
    this.cuidadosService
      .salvarFicha(pet.id, {
        vacinasEmDia: dados.vacinasEmDia === 'true',
        alergias: dados.alergias.trim(),
        condicoesClinicas: dados.condicoesClinicas.trim(),
        restricoesAlimentares: dados.restricoesAlimentares.trim(),
        veterinarioNome: dados.veterinarioNome.trim(),
        veterinarioTelefone: dados.veterinarioTelefone.trim(),
        observacoes: dados.observacoes.trim(),
      })
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => this.exibirSucesso('Ficha clínica salva com sucesso.'),
        error: (erro: HttpErrorResponse) =>
          this.exibirErro(erro.error?.mensagem ?? 'Não foi possível salvar a ficha clínica.'),
      });
  }

  protected rotuloTipo(tipo: RegistroClinico['tipo']): string {
    return {
      ALIMENTACAO: 'Alimentação',
      HIDRATACAO: 'Hidratação',
      SINAIS_VITAIS: 'Sinais vitais',
      COMPORTAMENTO: 'Comportamento',
      HIGIENE: 'Higiene',
      ATIVIDADE: 'Atividade',
      OCORRENCIA: 'Ocorrência',
      OBSERVACAO: 'Observação',
    }[tipo];
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
