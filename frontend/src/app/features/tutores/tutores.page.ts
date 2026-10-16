import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Tutor } from '../../core/models/tutor.model';
import { TutorService } from '../../core/services/tutor.service';

@Component({
  selector: 'app-tutores-page',
  imports: [RouterLink],
  templateUrl: './tutores.page.html',
  styleUrl: './tutores.page.css',
})
export class TutoresPage implements OnInit {
  private readonly tutorService = inject(TutorService);

  protected readonly tutores = signal<Tutor[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly mensagemDeErro = signal(false);
  protected readonly tutorParaDesativar = signal<Tutor | null>(null);
  protected readonly desativando = signal(false);

  ngOnInit(): void {
    this.carregar();
  }

  protected solicitarDesativacao(tutor: Tutor): void {
    this.tutorParaDesativar.set(tutor);
    this.mensagem.set(null);
    this.mensagemDeErro.set(false);
  }

  protected cancelarDesativacao(): void {
    if (!this.desativando()) {
      this.tutorParaDesativar.set(null);
    }
  }

  protected confirmarDesativacao(): void {
    const tutor = this.tutorParaDesativar();
    if (!tutor) return;

    this.desativando.set(true);
    this.tutorService
      .desativar(tutor.id)
      .pipe(finalize(() => this.desativando.set(false)))
      .subscribe({
        next: () => {
          this.tutores.update((tutores) => tutores.filter((item) => item.id !== tutor.id));
          this.tutorParaDesativar.set(null);
          this.mensagem.set(`${tutor.nome} foi desativado com sucesso.`);
          this.mensagemDeErro.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.tutorParaDesativar.set(null);
          this.mensagem.set(
            error.error?.mensagem ?? 'Não foi possível desativar o tutor.',
          );
          this.mensagemDeErro.set(true);
        },
      });
  }

  private carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);
    this.tutorService.listar().subscribe({
      next: (tutores) => {
        this.tutores.set(tutores);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }
}
