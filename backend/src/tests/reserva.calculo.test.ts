import { describe, expect, it } from 'vitest';
import { ModalidadeCobranca } from '../entities/Reserva';
import { calcularValorReserva } from '../services/ReservaService';

function data(horas: number, minutos = 0): Date {
  return new Date(Date.UTC(2030, 0, 1, horas, minutos));
}

describe('cálculo de reservas', () => {
  it('cobra horas completas na modalidade por hora', () => {
    expect(
      calcularValorReserva(
        ModalidadeCobranca.HORA,
        data(8),
        data(10),
      ),
    ).toBe(20);
  });

  it('arredonda uma fração de hora para a hora seguinte', () => {
    expect(
      calcularValorReserva(
        ModalidadeCobranca.HORA,
        data(8),
        data(10, 1),
      ),
    ).toBe(30);
  });

  it('cobra no mínimo uma diária quando essa modalidade é contratada', () => {
    expect(
      calcularValorReserva(
        ModalidadeCobranca.DIARIA,
        data(8),
        new Date(Date.UTC(2030, 0, 2, 4)),
      ),
    ).toBe(240);
  });

  it('calcula múltiplas diárias completas', () => {
    expect(
      calcularValorReserva(
        ModalidadeCobranca.DIARIA,
        data(8),
        new Date(Date.UTC(2030, 0, 3, 8)),
      ),
    ).toBe(480);
  });

  it('soma às diárias as horas excedentes arredondadas', () => {
    expect(
      calcularValorReserva(
        ModalidadeCobranca.DIARIA,
        data(8),
        new Date(Date.UTC(2030, 0, 3, 9, 1)),
      ),
    ).toBe(500);
  });

  it('calcula uma diária mais duas horas para 25h30', () => {
    expect(
      calcularValorReserva(
        ModalidadeCobranca.DIARIA,
        data(8),
        new Date(Date.UTC(2030, 0, 2, 9, 30)),
      ),
    ).toBe(260);
  });
});
