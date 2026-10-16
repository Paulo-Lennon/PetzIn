import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Define a tabela no PostgreSQL
@Entity('usuarios')
export class Usuario {
  // Identificador único gerado automaticamente
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Nome do usuário
  @Column({ type: 'varchar', length: 150 })
  nome!: string;

  // E-mail obrigatório e único
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  // Senha armazenada como hash, nunca em texto puro
  @Column({ type: 'varchar', length: 255, select: false })
  senhaHash!: string;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  // Data de criação do cadastro
  @CreateDateColumn()
  criadoEm!: Date;

  @UpdateDateColumn()
  atualizadoEm!: Date;
}
