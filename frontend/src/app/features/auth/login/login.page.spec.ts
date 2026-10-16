import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RespostaLogin } from '../../../core/models/usuario.model';
import { AuthService } from '../../../core/services/auth.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  const respostaLogin: RespostaLogin = {
    token: 'token-de-teste',
    usuario: {
      id: 'usuario-1',
      nome: 'Paulo',
      email: 'paulo@petzin.com',
      criadoEm: '2026-10-16T12:00:00.000Z',
    },
  };
  const authService = { login: vi.fn() };
  const router = { navigate: vi.fn() };

  let fixture: ComponentFixture<LoginPage>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    authService.login.mockReset();
    router.navigate.mockReset();
    router.navigate.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  function preencher(email: string, senha: string): void {
    const emailInput = elemento.querySelector<HTMLInputElement>('#email')!;
    const senhaInput = elemento.querySelector<HTMLInputElement>('#senha')!;
    emailInput.value = email;
    emailInput.dispatchEvent(new Event('input'));
    senhaInput.value = senha;
    senhaInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function enviar(): void {
    elemento.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('deve exibir validações e não chamar a API com formulário inválido', () => {
    enviar();

    expect(authService.login).not.toHaveBeenCalled();
    expect(elemento.textContent).toContain('Informe um e-mail válido.');
    expect(elemento.textContent).toContain('Informe sua senha.');
  });

  it('deve autenticar e navegar para o dashboard', () => {
    authService.login.mockReturnValue(of(respostaLogin));
    preencher('paulo@petzin.com', 'Senha@123');

    enviar();

    expect(authService.login).toHaveBeenCalledWith('paulo@petzin.com', 'Senha@123');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('deve apresentar a mensagem devolvida pela API quando o login falhar', () => {
    authService.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { mensagem: 'E-mail ou senha inválidos.' },
          }),
      ),
    );
    preencher('paulo@petzin.com', 'senha-errada');

    enviar();

    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain(
      'E-mail ou senha inválidos.',
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
