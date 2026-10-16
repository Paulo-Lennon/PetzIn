import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { tratarErros } from './middlewares/tratamentoErros';
import usuarioRoutes from './routes/usuarioRoutes';

const app = express();

// Configuração dos middlewares
app.use(cors());
app.use(express.json());
// Registra as rotas de usuários
app.use(usuarioRoutes);

// Rota para verificar o funcionamento da API
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API PetzIn funcionando!',
  });
});

// Padroniza erros que não foram tratados pelas rotas e controllers.
app.use(tratarErros);

const PORT = 3000;

// Inicializa a conexão com o PostgreSQL
async function iniciarServidor() {
  try {
    await AppDataSource.initialize();

    console.log('PostgreSQL conectado com sucesso!');

    // Inicia o servidor somente após conectar ao banco
    app.listen(PORT, () => {
      console.log(`PetzIn API rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao conectar ao PostgreSQL:', error);
    process.exit(1);
  }
}

iniciarServidor();
