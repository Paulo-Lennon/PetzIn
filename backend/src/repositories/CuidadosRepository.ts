import { AppDataSource } from '../config/database';
import { FichaClinica } from '../entities/FichaClinica';
import { LembreteMedicamento } from '../entities/LembreteMedicamento';
import { RegistroClinico } from '../entities/RegistroClinico';

export const FichaClinicaRepository = AppDataSource.getRepository(FichaClinica);
export const RegistroClinicoRepository =
  AppDataSource.getRepository(RegistroClinico);
export const LembreteMedicamentoRepository =
  AppDataSource.getRepository(LembreteMedicamento);
