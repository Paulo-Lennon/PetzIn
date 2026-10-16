import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Pet } from '../../core/models/pet.model';
import { PetService } from '../../core/services/pet.service';

@Component({
  selector: 'app-pets-page',
  imports: [RouterLink],
  templateUrl: './pets.page.html',
  styleUrl: './pets.page.css',
})
export class PetsPage implements OnInit {
  private readonly petService = inject(PetService);

  protected readonly pets = signal<Pet[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly mensagem = signal<string | null>(null);
  protected readonly mensagemDeErro = signal(false);
  protected readonly petParaDesativar = signal<Pet | null>(null);
  protected readonly desativando = signal(false);

  ngOnInit(): void {
    this.carregar();
  }

  protected solicitarDesativacao(pet: Pet): void {
    this.petParaDesativar.set(pet);
    this.mensagem.set(null);
    this.mensagemDeErro.set(false);
  }

  protected cancelarDesativacao(): void {
    if (!this.desativando()) {
      this.petParaDesativar.set(null);
    }
  }

  protected confirmarDesativacao(): void {
    const pet = this.petParaDesativar();
    if (!pet) return;

    this.desativando.set(true);
    this.petService
      .desativar(pet.id)
      .pipe(finalize(() => this.desativando.set(false)))
      .subscribe({
        next: () => {
          this.pets.update((pets) => pets.filter((item) => item.id !== pet.id));
          this.petParaDesativar.set(null);
          this.mensagem.set(`${pet.nome} foi desativado com sucesso.`);
          this.mensagemDeErro.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.petParaDesativar.set(null);
          this.mensagem.set(
            error.error?.mensagem ?? 'Não foi possível desativar o pet.',
          );
          this.mensagemDeErro.set(true);
        },
      });
  }

  protected iniciais(nome: string): string {
    return nome.trim().charAt(0).toUpperCase();
  }

  private carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);
    this.petService.listar().subscribe({
      next: (pets) => {
        this.pets.set(pets);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }
}
