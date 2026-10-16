import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';
import { CriarPet, Pet, SexoPet } from '../../core/models/pet.model';
import { Tutor } from '../../core/models/tutor.model';
import { PetService } from '../../core/services/pet.service';
import { TutorService } from '../../core/services/tutor.service';

@Component({
  selector: 'app-pet-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pet-form.page.html',
  styleUrl: '../shared/entity-form.page.css',
})
export class PetFormPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly petService = inject(PetService);
  private readonly tutorService = inject(TutorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly petId = this.route.snapshot.paramMap.get('id');
  protected readonly editando = Boolean(this.petId);
  protected readonly hoje = new Date().toISOString().slice(0, 10);
  protected readonly tutores = signal<Tutor[]>([]);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly formulario = this.formBuilder.nonNullable.group({
    tutorId: ['', Validators.required],
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    especie: ['', [Validators.required, Validators.maxLength(50)]],
    raca: ['', Validators.maxLength(100)],
    sexo: ['NAO_INFORMADO' as SexoPet, Validators.required],
    dataNascimento: [''],
    pesoAtual: ['', Validators.pattern(/^\d{1,4}([.,]\d{1,2})?$/)],
    fotoUrl: ['', [Validators.maxLength(500), Validators.pattern(/^https?:\/\/.+/i)]],
    observacoes: ['', Validators.maxLength(2000)],
  });

  ngOnInit(): void {
    const tutores$ = this.tutorService.listar();
    const pet$ = this.petId
      ? this.petService.buscarPorId(this.petId)
      : of<Pet | null>(null);
    const dados$ = forkJoin({ tutores: tutores$, pet: pet$ });

    dados$.pipe(finalize(() => this.carregando.set(false))).subscribe({
      next: (resultado) => {
        this.tutores.set(resultado.tutores);
        if (resultado.pet) {
          const pet = resultado.pet;
          this.formulario.patchValue({
            tutorId: pet.tutorId,
            nome: pet.nome,
            especie: pet.especie,
            raca: pet.raca ?? '',
            sexo: pet.sexo,
            dataNascimento: pet.dataNascimento ?? '',
            pesoAtual: pet.pesoAtual?.toString() ?? '',
            fotoUrl: pet.fotoUrl ?? '',
            observacoes: pet.observacoes ?? '',
          });
        }
      },
      error: (error: HttpErrorResponse) =>
        this.erro.set(error.error?.mensagem ?? 'Não foi possível carregar o formulário.'),
    });
  }

  protected salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valor = this.formulario.getRawValue();
    const dados: CriarPet = {
      tutorId: valor.tutorId,
      nome: valor.nome.trim(),
      especie: valor.especie.trim(),
      raca: valor.raca.trim() || null,
      sexo: valor.sexo,
      dataNascimento: valor.dataNascimento || null,
      pesoAtual: valor.pesoAtual ? Number(valor.pesoAtual.replace(',', '.')) : null,
      fotoUrl: valor.fotoUrl.trim() || null,
      observacoes: valor.observacoes.trim() || null,
    };
    const requisicao = this.petId
      ? this.petService.atualizar(this.petId, dados)
      : this.petService.cadastrar(dados);

    this.salvando.set(true);
    this.erro.set(null);
    requisicao.pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: () => void this.router.navigate(['/pets']),
      error: (error: HttpErrorResponse) =>
        this.erro.set(error.error?.mensagem ?? 'Não foi possível salvar o pet.'),
    });
  }

  protected invalido(campo: keyof typeof this.formulario.controls): boolean {
    const controle = this.formulario.controls[campo];
    return controle.invalid && controle.touched;
  }

  protected fotoValida(): boolean {
    return /^https?:\/\/.+/i.test(this.formulario.controls.fotoUrl.value);
  }
}
