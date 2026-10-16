import { Component, inject, OnInit, signal } from '@angular/core';
import { Pet } from '../../core/models/pet.model';
import { PetService } from '../../core/services/pet.service';

@Component({
  selector: 'app-pets-page',
  templateUrl: './pets.page.html',
})
export class PetsPage implements OnInit {
  private readonly petService = inject(PetService);

  protected readonly pets = signal<Pet[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);

  ngOnInit(): void {
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
