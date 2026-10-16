import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { Pet } from '../../core/models/pet.model';
import { Reserva } from '../../core/models/reserva.model';
import { PetService } from '../../core/services/pet.service';
import { ReservaService } from '../../core/services/reserva.service';
import { NovaReservaPage } from './nova-reserva.page';

function paraCampoDataHora(data: Date): string {
  const ajusteFuso = data.getTimezoneOffset() * 60_000;
  return new Date(data.getTime() - ajusteFuso).toISOString().slice(0, 16);
}

describe('NovaReservaPage', () => {
  const pet = {
    id: 'pet-1',
    tutorId: 'tutor-1',
    nome: 'Rex',
    especie: 'Cachorro',
    raca: 'Labrador',
    sexo: 'MACHO',
    dataNascimento: null,
    pesoAtual: 28.5,
    fotoUrl: null,
    observacoes: null,
    ativo: true,
    criadoEm: '2026-10-16T12:00:00.000Z',
    atualizadoEm: '2026-10-16T12:00:00.000Z',
  } satisfies Pet;
  const petService = { listar: vi.fn() };
  const reservaService = {
    buscarPorId: vi.fn(),
    cadastrar: vi.fn(),
    atualizar: vi.fn(),
  };

  let fixture: ComponentFixture<NovaReservaPage>;
  let formulario: FormGroup;
  let salvar: () => void;
  let avisoDataPassada: () => boolean;
  let router: Router;

  beforeEach(async () => {
    petService.listar.mockReset();
    reservaService.buscarPorId.mockReset();
    reservaService.cadastrar.mockReset();
    reservaService.atualizar.mockReset();
    petService.listar.mockReturnValue(of([pet]));

    await TestBed.configureTestingModule({
      imports: [NovaReservaPage],
      providers: [
        provideRouter([]),
        { provide: PetService, useValue: petService },
        { provide: ReservaService, useValue: reservaService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NovaReservaPage);
    const componente = fixture.componentInstance as unknown as {
      formulario: FormGroup;
      avisoDataPassada(): boolean;
      salvar(): void;
    };
    formulario = componente.formulario;
    salvar = () => componente.salvar();
    avisoDataPassada = () => componente.avisoDataPassada();
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('deve bloquear uma reserva com entrada em data passada', () => {
    const entrada = paraCampoDataHora(new Date(Date.now() - 60 * 60 * 1000));
    const saida = paraCampoDataHora(new Date(Date.now() + 60 * 60 * 1000));
    formulario.setValue({
      petId: pet.id,
      dataEntrada: entrada,
      dataSaida: saida,
      numeroCanil: 1,
      modalidade: 'HORA',
      observacoes: '',
    });

    salvar();
    fixture.detectChanges();

    expect(avisoDataPassada()).toBe(true);
    expect(reservaService.cadastrar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeTruthy();
  });

  it('deve rejeitar um período cuja saída não seja posterior à entrada', () => {
    const entrada = paraCampoDataHora(new Date(Date.now() + 48 * 60 * 60 * 1000));
    formulario.setValue({
      petId: pet.id,
      dataEntrada: entrada,
      dataSaida: entrada,
      numeroCanil: 1,
      modalidade: 'DIARIA',
      observacoes: '',
    });

    salvar();

    expect(formulario.hasError('periodoInvalido')).toBe(true);
    expect(reservaService.cadastrar).not.toHaveBeenCalled();
  });

  it('deve cadastrar uma reserva futura e abrir seus detalhes', () => {
    const entrada = paraCampoDataHora(new Date(Date.now() + 48 * 60 * 60 * 1000));
    const saida = paraCampoDataHora(new Date(Date.now() + 74 * 60 * 60 * 1000));
    const reservaCriada = {
      id: 'reserva-1',
      petId: pet.id,
      dataEntrada: new Date(entrada).toISOString(),
      dataSaida: new Date(saida).toISOString(),
      numeroCanil: 5,
      modalidade: 'DIARIA',
      tarifaHora: 10,
      tarifaDiaria: 240,
      valorTotal: 260,
      valorPago: 0,
      statusPagamento: 'PENDENTE',
      pagoEm: null,
      status: 'AGENDADA',
      observacoes: null,
      criadoEm: '2026-10-16T12:00:00.000Z',
      atualizadoEm: '2026-10-16T12:00:00.000Z',
    } satisfies Reserva;
    reservaService.cadastrar.mockReturnValue(of(reservaCriada));
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    formulario.setValue({
      petId: pet.id,
      dataEntrada: entrada,
      dataSaida: saida,
      numeroCanil: 5,
      modalidade: 'DIARIA',
      observacoes: '   ',
    });

    salvar();

    expect(reservaService.cadastrar).toHaveBeenCalledWith({
      petId: pet.id,
      dataEntrada: new Date(entrada).toISOString(),
      dataSaida: new Date(saida).toISOString(),
      numeroCanil: 5,
      modalidade: 'DIARIA',
      observacoes: null,
    });
    expect(navegar).toHaveBeenCalledWith(['/reservas', reservaCriada.id]);
  });
});
