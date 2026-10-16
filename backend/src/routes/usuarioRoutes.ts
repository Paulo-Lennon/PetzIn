import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { autenticarToken } from '../middlewares/autenticacao';

// Cria o roteador do Express
const router = Router();

// Instancia o Controller
const usuarioController = new UsuarioController();

// Define a rota pública para autenticar usuários.
router.post('/usuarios/login', (req, res) => {
  void usuarioController.login(req, res);
});

// Retorna os dados públicos do usuário autenticado.
router.get('/usuarios/me', autenticarToken, (req, res) => {
  void usuarioController.perfil(req, res);
});

// Altera a senha da conta administrativa autenticada.
router.patch('/usuarios/me/senha', autenticarToken, (req, res) => {
  void usuarioController.alterarSenha(req, res);
});

// Define a rota para cadastrar usuários
router.post('/usuarios', (req, res) => {
  void usuarioController.cadastrar(req, res);
});

// Exporta as rotas
export default router;
