export interface ResumoFinanceiro {
  periodo: {
    dataInicio: string | null;
    dataFim: string | null;
  };
  totalPrevisto: number;
  totalRecebido: number;
  totalPendente: number;
  quantidadeReservas: number;
  quantidadeCanceladas: number;
  pagamentos: {
    pendentes: number;
    parciais: number;
    pagos: number;
  };
}
