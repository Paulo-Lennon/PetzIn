import { AppDataSource } from '../config/database';
import { Usuario } from '../entities/Usuario';

// Cria o repositório para acessar a tabela de usuários
export const UsuarioRepository = AppDataSource.getRepository(Usuario);
