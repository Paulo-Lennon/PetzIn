import { AppDataSource } from '../config/database';
import { Usuario } from '../entities/Usuario';

// Cria o repositório para acessar a tabela de usuários
export const UsuarioRepository = AppDataSource.getRepository(Usuario);

// O hash da senha é selecionado somente durante a autenticação.
export async function buscarUsuarioPorEmailComSenha(
  email: string,
): Promise<Usuario | null> {
  return UsuarioRepository.createQueryBuilder('usuario')
    .addSelect('usuario.senhaHash')
    .where('usuario.email = :email', { email })
    .getOne();
}

export async function buscarUsuarioPorId(id: string): Promise<Usuario | null> {
  return UsuarioRepository.findOne({
    where: { id },
  });
}
