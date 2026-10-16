import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { Pet } from '../../core/models/pet.model';
import { Tutor } from '../../core/models/tutor.model';
import { PetService } from '../../core/services/pet.service';
import { TutorService } from '../../core/services/tutor.service';
import { PetFormPage } from './pet-form.page';

describe('PetFormPage', () => {
  const tutor = {
    id: 'tutor-1',
    nome: 'Carlos Almeida',
    telefone: '(92) 99999-9999',
    email: null,
    observacoes: null,
    ativo: true,
    criadoEm: '2026-10-16T12:00:00.000Z',
    atualizadoEm: '2026-10-16T12:00:00.000Z',
  } satisfies Tutor;
  const petCriado = {
    id: 'pet-1',
    tutorId: tutor.id,
    nome: 'Rex',
    especie: 'Cachorro',
    raca: null,
    sexo: 'MACHO',
    dataNascimento: null,
    pesoAtual: 28.5,
    fotoUrl: null,
    observacoes: null,
    ativo: true,
    criadoEm: '2026-10-16T12:00:00.000Z',
    atualizadoEm: '2026-10-16T12:00:00.000Z',
  } satisfies Pet;
  const petService = {
    buscarPorId: vi.fn(),
    cadastrar: vi.fn(),
    atualizar: vi.fn(),
  };
  const tutorService = { listar: vi.fn() };

  let fixture: ComponentFixture<PetFormPage>;
  let formulario: FormGroup;
  let salvar: () => void;
  let router: Router;

  beforeEach(async () => {
    petService.buscarPorId.mockReset();
    petService.cadastrar.mockReset();
    petService.atualizar.mockReset();
    tutorService.listar.mockReset();
    tutorService.listar.mockReturnValue(of([tutor]));
    petService.cadastrar.mockReturnValue(of(petCriado));

    await TestBed.configureTestingModule({
      imports: [PetFormPage],
      providers: [
        provideRouter([]),
        { provide: PetService, useValue: petService },
        { provide: TutorService, useValue: tutorService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PetFormPage);
    const componente = fixture.componentInstance as unknown as {
      formulario: FormGroup;
      salvar(): void;
    };
    formulario = componente.formulario;
    salvar = () => componente.salvar();
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('não deve cadastrar o pet sem tutor, nome e espécie', () => {
    salvar();

    expect(petService.cadastrar).not.toHaveBeenCalled();
    expect(formulario.controls['tutorId'].touched).toBe(true);
    expect(formulario.controls['nome'].touched).toBe(true);
    expect(formulario.controls['especie'].touched).toBe(true);
  });

  it('deve converter o peso decimal e normalizar os campos opcionais', () => {
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    formulario.setValue({
      tutorId: tutor.id,
      nome: '  Rex  ',
      especie: '  Cachorro  ',
      raca: '  ',
      sexo: 'MACHO',
      dataNascimento: '',
      pesoAtual: '28,5',
      fotoUrl: '',
      observacoes: '  ',
    });

    salvar();

    expect(petService.cadastrar).toHaveBeenCalledWith({
      tutorId: tutor.id,
      nome: 'Rex',
      especie: 'Cachorro',
      raca: null,
      sexo: 'MACHO',
      dataNascimento: null,
      pesoAtual: 28.5,
      fotoUrl: null,
      observacoes: null,
    });
    expect(navegar).toHaveBeenCalledWith(['/pets']);
  });
});
