import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../config/api.config';
import { RespostaLogin, Usuario } from '../models/usuario.model';

const CHAVE_TOKEN = 'petzin_token';
const CHAVE_USUARIO = 'petzin_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = inject(API_URL);

  readonly token = signal<string | null>(localStorage.getItem(CHAVE_TOKEN));
  readonly usuario = signal<Usuario | null>(this.lerUsuarioArmazenado());
  readonly autenticado = () => Boolean(this.token());

  login(email: string, senha: string): Observable<RespostaLogin> {
    return this.http
      .post<RespostaLogin>(`${this.apiUrl}/usuarios/login`, { email, senha })
      .pipe(tap((resposta) => this.armazenarSessao(resposta)));
  }

  sair(): void {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
    this.token.set(null);
    this.usuario.set(null);
    void this.router.navigate(['/login']);
  }

  private armazenarSessao(resposta: RespostaLogin): void {
    localStorage.setItem(CHAVE_TOKEN, resposta.token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(resposta.usuario));
    this.token.set(resposta.token);
    this.usuario.set(resposta.usuario);
  }

  private lerUsuarioArmazenado(): Usuario | null {
    const usuario = localStorage.getItem(CHAVE_USUARIO);

    if (!usuario) {
      return null;
    }

    try {
      return JSON.parse(usuario) as Usuario;
    } catch {
      localStorage.removeItem(CHAVE_USUARIO);
      return null;
    }
  }
}
