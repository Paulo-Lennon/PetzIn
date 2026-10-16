import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

function confirmarSenha(controle: AbstractControl): ValidationErrors | null {
  const novaSenha = controle.get('novaSenha')?.value;
  const confirmacao = controle.get('confirmacao')?.value;
  return novaSenha && confirmacao && novaSenha !== confirmacao
    ? { senhasDiferentes: true }
    : null;
}

@Component({
  selector: 'app-alterar-senha-page',
  imports: [ReactiveFormsModule],
  templateUrl: './alterar-senha.page.html',
  styleUrl: './alterar-senha.page.css',
})
export class AlterarSenhaPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly salvando = signal(false);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly mensagemDeErro = signal(false);
  protected readonly formulario = this.formBuilder.nonNullable.group(
    {
      senhaAtual: ['', Validators.required],
      novaSenha: [
        '',
        [
          Validators.required,
          Validators.minLength(7),
          Validators.maxLength(12),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),
        ],
      ],
      confirmacao: ['', Validators.required],
    },
    { validators: confirmarSenha },
  );

  protected salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { senhaAtual, novaSenha } = this.formulario.getRawValue();
    if (senhaAtual === novaSenha) {
      this.exibirErro('A nova senha deve ser diferente da senha atual.');
      return;
    }

    this.salvando.set(true);
    this.mensagem.set(null);
    this.authService
      .alterarSenha(senhaAtual, novaSenha)
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.formulario.reset();
          this.mensagemDeErro.set(false);
          this.mensagem.set('Senha alterada com sucesso. Use a nova senha no próximo login.');
        },
        error: (error: HttpErrorResponse) =>
          this.exibirErro(error.error?.mensagem ?? 'Não foi possível alterar a senha.'),
      });
  }

  protected invalido(campo: keyof typeof this.formulario.controls): boolean {
    const controle = this.formulario.controls[campo];
    return controle.invalid && controle.touched;
  }

  private exibirErro(mensagem: string): void {
    this.mensagemDeErro.set(true);
    this.mensagem.set(mensagem);
  }
}
