import bcrypt from 'bcrypt';
import { UsuarioRepository } from '../repositories/UsuarioRepository';

// Erro específico para dados inválidos
export class ErroValidacao extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroValidacao';
  }
}

export class UsuarioService {
  // Verifica se o e-mail já está cadastrado
  async verificarEmail(email: string): Promise<boolean> {
    const usuario = await UsuarioRepository.findOne({
      where: { email },
    });

    return usuario !== null;
  }

  // Cadastra um novo usuário
  async cadastrar(nome: string, email: string, senha: string) {
    // 1. Valida se os dados foram enviados corretamente
    if (
      typeof nome !== 'string' ||
      typeof email !== 'string' ||
      typeof senha !== 'string'
    ) {
      throw new ErroValidacao('Nome, e-mail e senha são obrigatórios');
    }

    // 2. Impede nome vazio ou apenas espaços
    nome = nome.trim();

    if (nome.length === 0) {
      throw new ErroValidacao('O nome não pode estar vazio');
    }

    // 3. Normaliza e valida o e-mail
    email = email.trim().toLowerCase();

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regexEmail.test(email) || email.length > 255) {
      throw new ErroValidacao('Informe um e-mail válido');
    }

    // 4. Verifica o tamanho da senha
    if (senha.length < 7 || senha.length > 12) {
      throw new ErroValidacao('A senha deve conter entre 7 e 12 caracteres');
    }

    // 5. Exige letras, números e caracteres especiais
    const possuiLetra = /[A-Za-z]/.test(senha);
    const possuiNumero = /[0-9]/.test(senha);
    const possuiEspecial = /[^A-Za-z0-9]/.test(senha);

    if (!possuiLetra || !possuiNumero || !possuiEspecial) {
      throw new ErroValidacao(
        'A senha deve conter letras, números e pelo menos um caractere especial',
      );
    }

    // 6. Verifica se o e-mail já existe
    const emailExiste = await this.verificarEmail(email);

    if (emailExiste) {
      throw new ErroValidacao('Este e-mail já está cadastrado');
    }

    // 7. Gera o hash da senha
    const senhaHash = await bcrypt.hash(senha, 12);

    // 8. Prepara o usuário
    const usuario = UsuarioRepository.create({
      nome,
      email,
      senhaHash,
    });

    // 9. Salva no PostgreSQL
    const usuarioSalvo = await UsuarioRepository.save(usuario);

    // 10. Retorna apenas os dados públicos
    return {
      id: usuarioSalvo.id,
      nome: usuarioSalvo.nome,
      email: usuarioSalvo.email,
      criadoEm: usuarioSalvo.criadoEm,
    };
  }
}
