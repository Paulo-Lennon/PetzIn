import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CriarTutor } from '../../core/models/tutor.model';
import { TutorService } from '../../core/services/tutor.service';

@Component({
  selector: 'app-tutor-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './tutor-form.page.html',
  styleUrl: '../shared/entity-form.page.css',
})
export class TutorFormPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly tutorService = inject(TutorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly tutorId = this.route.snapshot.paramMap.get('id');
  protected readonly editando = Boolean(this.tutorId);
  protected readonly carregando = signal(this.editando);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly formulario = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    telefone: [
      '',
      [Validators.required, Validators.pattern(/^\D*(?:\d\D*){10,15}$/)],
    ],
    email: ['', [Validators.email, Validators.maxLength(255)]],
    observacoes: ['', Validators.maxLength(2000)],
  });

  ngOnInit(): void {
    if (!this.tutorId) return;

    this.tutorService
      .buscarPorId(this.tutorId)
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (tutor) =>
          this.formulario.patchValue({
            nome: tutor.nome,
            telefone: tutor.telefone,
            email: tutor.email ?? '',
            observacoes: tutor.observacoes ?? '',
          }),
        error: (error: HttpErrorResponse) =>
          this.erro.set(error.error?.mensagem ?? 'Não foi possível carregar o tutor.'),
      });
  }

  protected salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valor = this.formulario.getRawValue();
    const dados: CriarTutor = {
      nome: valor.nome.trim(),
      telefone: valor.telefone,
      email: valor.email.trim() || null,
      observacoes: valor.observacoes.trim() || null,
    };
    const requisicao = this.tutorId
      ? this.tutorService.atualizar(this.tutorId, dados)
      : this.tutorService.cadastrar(dados);

    this.salvando.set(true);
    this.erro.set(null);
    requisicao.pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: () => void this.router.navigate(['/tutores']),
      error: (error: HttpErrorResponse) =>
        this.erro.set(error.error?.mensagem ?? 'Não foi possível salvar o tutor.'),
    });
  }

  protected invalido(campo: keyof typeof this.formulario.controls): boolean {
    const controle = this.formulario.controls[campo];
    return controle.invalid && controle.touched;
  }
}
