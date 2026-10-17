import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CuidadosService } from '../../core/services/cuidados.service';
import { ProntuarioPage } from './prontuario.page';

describe('ProntuarioPage', () => {
  let fixture: ComponentFixture<ProntuarioPage>;
  const cuidadosService = {
    buscarFicha: vi.fn(() =>
      of({
        pet: {
          id: 'pet-1',
          tutorId: 'tutor-1',
          nome: 'Rex',
          especie: 'Cachorro',
          raca: 'Labrador',
          sexo: 'MACHO',
          dataNascimento: null,
          pesoAtual: null,
          fotoUrl: null,
          observacoes: null,
          ativo: true,
          criadoEm: '2026-10-16T12:00:00.000Z',
          atualizadoEm: '2026-10-16T12:00:00.000Z',
        },
        ficha: null,
      }),
    ),
    listarRegistros: vi.fn(() => of([])),
    salvarFicha: vi.fn(() => of({})),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProntuarioPage],
      providers: [
        provideRouter([]),
        { provide: CuidadosService, useValue: cuidadosService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'pet-1' } } },
        },
      ],
    }).compileComponents();

    cuidadosService.salvarFicha.mockClear();
    fixture = TestBed.createComponent(ProntuarioPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('impede ficha vazia e mostra a orientação logo abaixo do botão', () => {
    const botao = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    botao.click();
    fixture.detectChanges();

    const feedback = fixture.nativeElement.querySelector(
      '.form-feedback.error',
    ) as HTMLElement;
    expect(cuidadosService.salvarFicha).not.toHaveBeenCalled();
    expect(feedback.textContent).toContain('Preencha todos os campos');
    expect(feedback.textContent).toContain('N/A');
    expect(feedback.previousElementSibling?.classList).toContain('form-actions');
  });
});
