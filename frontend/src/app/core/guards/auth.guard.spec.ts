import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const authService = {
    autenticado: vi.fn(),
  };

  beforeEach(() => {
    authService.autenticado.mockReset();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });
  });

  it('deve permitir o acesso quando existe uma sessão autenticada', () => {
    authService.autenticado.mockReturnValue(true);

    const resultado = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(resultado).toBe(true);
  });

  it('deve redirecionar para o login quando não existe sessão', () => {
    authService.autenticado.mockReturnValue(false);

    const resultado = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(resultado).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe('/login');
  });
});
