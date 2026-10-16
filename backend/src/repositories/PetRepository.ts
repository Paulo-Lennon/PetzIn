import { AppDataSource } from '../config/database';
import { Pet } from '../entities/Pet';

export const PetRepository = AppDataSource.getRepository(Pet);
