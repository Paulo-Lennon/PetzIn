import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../config/api.config';
import {
  CriarReserva,
  Reserva,
  StatusReserva,
} from '../models/reserva.model';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  listar(filtros?: { petId?: string; status?: StatusReserva }) {
    let params = new HttpParams();

    if (filtros?.petId) {
      params = params.set('petId', filtros.petId);
    }

    if (filtros?.status) {
      params = params.set('status', filtros.status);
    }

    return this.http.get<Reserva[]>(`${this.apiUrl}/reservas`, { params });
  }

  buscarPorId(id: string) {
    return this.http.get<Reserva>(`${this.apiUrl}/reservas/${id}`);
  }

  cadastrar(dados: CriarReserva) {
    return this.http.post<Reserva>(`${this.apiUrl}/reservas`, dados);
  }

  atualizar(id: string, dados: Partial<CriarReserva>) {
    return this.http.put<Reserva>(`${this.apiUrl}/reservas/${id}`, dados);
  }

  alterarStatus(id: string, status: StatusReserva) {
    return this.http.patch<Reserva>(`${this.apiUrl}/reservas/${id}/status`, {
      status,
    });
  }

  registrarPagamento(id: string, valorPago: number) {
    return this.http.patch<Reserva>(`${this.apiUrl}/reservas/${id}/pagamento`, {
      valorPago,
    });
  }

  cancelar(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/reservas/${id}`);
  }
}
