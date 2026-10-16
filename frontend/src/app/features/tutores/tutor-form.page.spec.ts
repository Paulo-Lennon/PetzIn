import { FormGroup } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { Tutor } from '../../core/models/tutor.model';
import { TutorService } from '../../core/services/tutor.service';
import { TutorFormPage } from './tutor-form.page';

describe('TutorFormPage', () => {
  const tutorService = {
    buscarPorId: vi.fn(),
    cadastrar: vi.fn(),
    atualizar: vi.fn(),
  };
  const tutorCriado = {
    id: 'tutor-1',
    nome: 'Carlos Almeida',
    telefone: '(92) 99999-9999',
    email: null,
    observacoes: null,
    ativo: true,
    criadoEm: '2026-10-16T12:00:00.000Z',
    atualizadoEm: '2026-10-16T12:00:00.000Z',
  } satisfies Tutor;

  let fixture: ComponentFixture<TutorFormPage>;
  let formulario: FormGroup;
  let salvar: () => void;
  let router: Router;

  beforeEach(async () => {
    tutorService.buscarPorId.mockReset();
    tutorService.cadastrar.mockReset();
    tutorService.atualizar.mockReset();
    tutorService.cadastrar.mockReturnValue(of(tutorCriado));

    await TestBed.configureTestingModule({
      imports: [TutorFormPage],
      providers: [
        provideRouter([]),
        { provide: TutorService, useValue: tutorService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TutorFormPage);
    const componente = fixture.componentInstance as unknown as {
      formulario: FormGroup;
      salvar(): void;
    };
    formulario = componente.formulario;
    salvar = () => componente.salvar();
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('não deve enviar um tutor com dados obrigatórios inválidos', () => {
    salvar();

    expect(tutorService.cadastrar).not.toHaveBeenCalled();
    expect(formulario.controls['nome'].touched).toBe(true);
    expect(formulario.controls['telefone'].touched).toBe(true);
  });

  it('deve normalizar os campos opcionais e cadastrar o tutor', () => {
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    formulario.setValue({
      nome: '  Carlos Almeida  ',
      telefone: '(92) 99999-9999',
      email: '',
      observacoes: '',
    });

    salvar();

    expect(tutorService.cadastrar).toHaveBeenCalledWith({
      nome: 'Carlos Almeida',
      telefone: '(92) 99999-9999',
      email: null,
      observacoes: null,
    });
    expect(navegar).toHaveBeenCalledWith(['/tutores']);
  });
});
