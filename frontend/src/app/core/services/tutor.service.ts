import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../config/api.config';
import { CriarTutor, Tutor } from '../models/tutor.model';

@Injectable({ providedIn: 'root' })
export class TutorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  listar() {
    return this.http.get<Tutor[]>(`${this.apiUrl}/tutores`);
  }

  buscarPorId(id: string) {
    return this.http.get<Tutor>(`${this.apiUrl}/tutores/${id}`);
  }

  cadastrar(dados: CriarTutor) {
    return this.http.post<Tutor>(`${this.apiUrl}/tutores`, dados);
  }

  atualizar(id: string, dados: Partial<CriarTutor>) {
    return this.http.put<Tutor>(`${this.apiUrl}/tutores/${id}`, dados);
  }

  desativar(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/tutores/${id}`);
  }
}
