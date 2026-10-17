import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../config/api.config';
import {
  FichaClinica,
  LembreteMedicamento,
  RegistroClinico,
  ResumoFichaClinica,
  StatusLembreteMedicamento,
} from '../models/cuidados.model';

@Injectable({ providedIn: 'root' })
export class CuidadosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  buscarFicha(petId: string) {
    return this.http.get<ResumoFichaClinica>(`${this.apiUrl}/pets/${petId}/ficha-clinica`);
  }

  salvarFicha(petId: string, dados: Partial<FichaClinica>) {
    return this.http.put<FichaClinica>(`${this.apiUrl}/pets/${petId}/ficha-clinica`, dados);
  }

  listarRegistros(petId: string) {
    return this.http.get<RegistroClinico[]>(`${this.apiUrl}/pets/${petId}/registros-clinicos`);
  }

  criarRegistro(reservaId: string, dados: Partial<RegistroClinico>) {
    return this.http.post<RegistroClinico>(
      `${this.apiUrl}/reservas/${reservaId}/registros-clinicos`,
      dados,
    );
  }

  criarLembrete(reservaId: string, dados: Partial<LembreteMedicamento>) {
    return this.http.post<LembreteMedicamento>(
      `${this.apiUrl}/reservas/${reservaId}/lembretes-medicamentos`,
      dados,
    );
  }

  listarLembretes(filtros?: {
    reservaId?: string;
    status?: StatusLembreteMedicamento;
  }) {
    let params = new HttpParams();
    if (filtros?.reservaId) params = params.set('reservaId', filtros.reservaId);
    if (filtros?.status) params = params.set('status', filtros.status);
    return this.http.get<LembreteMedicamento[]>(`${this.apiUrl}/lembretes-medicamentos`, {
      params,
    });
  }

  alterarStatusLembrete(
    id: string,
    status: 'ADMINISTRADO' | 'NAO_ADMINISTRADO',
    motivoNaoAdministrado?: string,
  ) {
    return this.http.patch<LembreteMedicamento>(
      `${this.apiUrl}/lembretes-medicamentos/${id}/status`,
      { status, motivoNaoAdministrado },
    );
  }

  cancelarLembrete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/lembretes-medicamentos/${id}`);
  }
}
