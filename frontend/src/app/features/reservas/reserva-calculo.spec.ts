import { describe, expect, it } from 'vitest';
import { calcularPreviaReserva } from './reserva-calculo';

describe('calcularPreviaReserva', () => {
  it('cobra uma diária e arredonda duas horas excedentes', () => {
    const entrada = new Date('2030-01-01T08:00:00-04:00');
    const saida = new Date('2030-01-02T09:01:00-04:00');

    expect(calcularPreviaReserva('DIARIA', entrada, saida)).toEqual({
      diarias: 1,
      horas: 2,
      valorTotal: 260,
    });
  });

  it('arredonda uma permanência por hora para cima', () => {
    const entrada = new Date('2030-01-01T08:00:00-04:00');
    const saida = new Date('2030-01-01T10:01:00-04:00');

    expect(calcularPreviaReserva('HORA', entrada, saida)?.valorTotal).toBe(30);
  });
});
