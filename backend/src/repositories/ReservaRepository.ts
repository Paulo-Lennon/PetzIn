import { AppDataSource } from '../config/database';
import { Reserva } from '../entities/Reserva';

export const ReservaRepository = AppDataSource.getRepository(Reserva);
