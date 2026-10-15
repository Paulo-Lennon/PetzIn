import 'reflect-metadata';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API PetzIn funcionando!',
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`PetzIn API rodando na porta ${PORT}`);
});
