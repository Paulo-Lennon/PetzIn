import express from 'express';
import cors from 'cors';
import { tratarErros } from './middlewares/tratamentoErros';
import petRoutes from './routes/petRoutes';
import reservaRoutes from './routes/reservaRoutes';
import tutorRoutes from './routes/tutorRoutes';
import usuarioRoutes from './routes/usuarioRoutes';

const app = express();

// Configuração dos middlewares
app.use(cors());
app.use(express.json());

// Registra as rotas de usuários
app.use(usuarioRoutes);
app.use(tutorRoutes);
app.use(petRoutes);
app.use(reservaRoutes);

// Rota para verificar o funcionamento da API
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API PetzIn funcionando!',
  });
});

// Padroniza erros que não foram tratados pelas rotas e controllers.
app.use(tratarErros);

export default app;
