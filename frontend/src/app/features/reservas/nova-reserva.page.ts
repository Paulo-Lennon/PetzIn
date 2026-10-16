import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Pet } from '../../core/models/pet.model';
import { PetService } from '../../core/services/pet.service';
import { ReservaService } from '../../core/services/reserva.service';

@Component({
  selector: 'app-nova-reserva-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './nova-reserva.page.html',
  styleUrl: './nova-reserva.page.css',
})
export class NovaReservaPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly petService = inject(PetService);
  private readonly reservaService = inject(ReservaService);
  private readonly router = inject(Router);

  protected readonly pets = signal<Pet[]>([]);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly formulario = this.formBuilder.nonNullable.group({
    petId: ['', Validators.required],
    dataEntrada: ['', Validators.required],
    dataSaida: ['', Validators.required],
    numeroCanil: [1, [Validators.required, Validators.min(1)]],
    modalidade: ['DIARIA' as const, Validators.required],
    observacoes: [''],
  });

  ngOnInit(): void {
    this.petService.listar().subscribe({
      next: (pets) => this.pets.set(pets),
      error: () => this.erro.set('Não foi possível carregar os pets.'),
    });
  }

  protected salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const dados = this.formulario.getRawValue();
    this.salvando.set(true);
    this.erro.set(null);

    this.reservaService
      .cadastrar({
        ...dados,
        modalidade: dados.modalidade,
        dataEntrada: new Date(dados.dataEntrada).toISOString(),
        dataSaida: new Date(dados.dataSaida).toISOString(),
        observacoes: dados.observacoes || null,
      })
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/reservas']),
        error: (error: HttpErrorResponse) =>
          this.erro.set(error.error?.mensagem ?? 'Não foi possível criar a reserva.'),
      });
  }
}
