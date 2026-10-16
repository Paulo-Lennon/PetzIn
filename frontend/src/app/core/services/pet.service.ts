import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../config/api.config';
import { CriarPet, Pet } from '../models/pet.model';

@Injectable({ providedIn: 'root' })
export class PetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  listar(tutorId?: string) {
    const params = tutorId ? new HttpParams().set('tutorId', tutorId) : undefined;
    return this.http.get<Pet[]>(`${this.apiUrl}/pets`, { params });
  }

  buscarPorId(id: string) {
    return this.http.get<Pet>(`${this.apiUrl}/pets/${id}`);
  }

  cadastrar(dados: CriarPet) {
    return this.http.post<Pet>(`${this.apiUrl}/pets`, dados);
  }

  atualizar(id: string, dados: Partial<CriarPet>) {
    return this.http.put<Pet>(`${this.apiUrl}/pets/${id}`, dados);
  }

  desativar(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/pets/${id}`);
  }
}
