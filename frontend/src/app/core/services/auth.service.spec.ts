import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { API_URL } from '../config/api.config';
import { RespostaLogin } from '../models/usuario.model';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const apiUrl = 'http://api.petzin.test';
  const respostaLogin: RespostaLogin = {
    token: 'token-de-teste',
    usuario: {
      id: 'usuario-1',
      nome: 'Paulo',
      email: 'paulo@petzin.com',
      criadoEm: '2026-10-16T12:00:00.000Z',
    },
  };

  let service: AuthService;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_URL, useValue: apiUrl },
      ],
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('deve autenticar e armazenar a sessão recebida da API', () => {
    service.login('PAULO@PETZIN.COM', 'Senha@123').subscribe();

    const requisicao = httpTesting.expectOne(`${apiUrl}/usuarios/login`);
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({
      email: 'PAULO@PETZIN.COM',
      senha: 'Senha@123',
    });
    requisicao.flush(respostaLogin);

    expect(service.autenticado()).toBe(true);
    expect(service.token()).toBe(respostaLogin.token);
    expect(service.usuario()).toEqual(respostaLogin.usuario);
    expect(localStorage.getItem('petzin_token')).toBe(respostaLogin.token);
    expect(JSON.parse(localStorage.getItem('petzin_usuario') ?? 'null')).toEqual(
      respostaLogin.usuario,
    );
  });

  it('deve enviar a alteração de senha para o usuário autenticado', () => {
    service.alterarSenha('Senha@123', 'Nova@456').subscribe();

    const requisicao = httpTesting.expectOne(`${apiUrl}/usuarios/me/senha`);
    expect(requisicao.request.method).toBe('PATCH');
    expect(requisicao.request.body).toEqual({
      senhaAtual: 'Senha@123',
      novaSenha: 'Nova@456',
    });
    requisicao.flush(null);
  });

  it('deve limpar a sessão e redirecionar para o login ao sair', () => {
    service.login('paulo@petzin.com', 'Senha@123').subscribe();
    httpTesting.expectOne(`${apiUrl}/usuarios/login`).flush(respostaLogin);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    service.sair();

    expect(service.autenticado()).toBe(false);
    expect(service.token()).toBeNull();
    expect(service.usuario()).toBeNull();
    expect(localStorage.getItem('petzin_token')).toBeNull();
    expect(localStorage.getItem('petzin_usuario')).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });
});
