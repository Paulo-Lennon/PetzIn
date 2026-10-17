import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../config/api.config';
import { CuidadosService } from './cuidados.service';

describe('CuidadosService', () => {
  const apiUrl = 'http://api.petzin.test';
  let service: CuidadosService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: apiUrl },
      ],
    });
    service = TestBed.inject(CuidadosService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('consulta e salva a ficha clínica do pet', () => {
    service.buscarFicha('pet-1').subscribe();
    const consulta = httpTesting.expectOne(`${apiUrl}/pets/pet-1/ficha-clinica`);
    expect(consulta.request.method).toBe('GET');
    consulta.flush({ pet: {}, ficha: null });

    service.salvarFicha('pet-1', { alergias: 'Dipirona' }).subscribe();
    const atualizacao = httpTesting.expectOne(`${apiUrl}/pets/pet-1/ficha-clinica`);
    expect(atualizacao.request.method).toBe('PUT');
    expect(atualizacao.request.body).toEqual({ alergias: 'Dipirona' });
    atualizacao.flush({});
  });

  it('cria um registro clínico vinculado à reserva', () => {
    const dados = { tipo: 'OBSERVACAO' as const, descricao: 'Pet tranquilo.' };
    service.criarRegistro('reserva-1', dados).subscribe();

    const requisicao = httpTesting.expectOne(
      `${apiUrl}/reservas/reserva-1/registros-clinicos`,
    );
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual(dados);
    requisicao.flush({});
  });

  it('filtra lembretes pendentes de uma reserva', () => {
    service.listarLembretes({ reservaId: 'reserva-1', status: 'PENDENTE' }).subscribe();

    const requisicao = httpTesting.expectOne(
      `${apiUrl}/lembretes-medicamentos?reservaId=reserva-1&status=PENDENTE`,
    );
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush([]);
  });

  it('registra uma dose como não administrada com justificativa', () => {
    service
      .alterarStatusLembrete('lembrete-1', 'NAO_ADMINISTRADO', 'Orientação do tutor')
      .subscribe();

    const requisicao = httpTesting.expectOne(
      `${apiUrl}/lembretes-medicamentos/lembrete-1/status`,
    );
    expect(requisicao.request.method).toBe('PATCH');
    expect(requisicao.request.body).toEqual({
      status: 'NAO_ADMINISTRADO',
      motivoNaoAdministrado: 'Orientação do tutor',
    });
    requisicao.flush({});
  });
});
