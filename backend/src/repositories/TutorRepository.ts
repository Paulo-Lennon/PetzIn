import { AppDataSource } from '../config/database';
import { Tutor } from '../entities/Tutor';

export const TutorRepository = AppDataSource.getRepository(Tutor);
