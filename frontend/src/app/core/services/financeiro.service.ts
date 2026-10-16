import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../config/api.config';
import { ResumoFinanceiro } from '../models/financeiro.model';

@Injectable({ providedIn: 'root' })
export class FinanceiroService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  obterResumo(filtros?: { dataInicio?: string; dataFim?: string }) {
    let params = new HttpParams();

    if (filtros?.dataInicio) {
      params = params.set('dataInicio', filtros.dataInicio);
    }

    if (filtros?.dataFim) {
      params = params.set('dataFim', filtros.dataFim);
    }

    return this.http.get<ResumoFinanceiro>(`${this.apiUrl}/financeiro/resumo`, {
      params,
    });
  }
}
