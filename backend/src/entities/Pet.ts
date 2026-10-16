import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  ValueTransformer,
} from 'typeorm';
import { Tutor } from './Tutor';

const transformarDecimal: ValueTransformer = {
  to: (valor: number | null) => valor,
  from: (valor: string | null) => (valor === null ? null : Number(valor)),
};

export enum SexoPet {
  MACHO = 'MACHO',
  FEMEA = 'FEMEA',
  NAO_INFORMADO = 'NAO_INFORMADO',
}

@Entity('pets')
@Index('IDX_pets_tutor_id', ['tutorId'])
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nome!: string;

  @Column({ type: 'varchar', length: 50 })
  especie!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  raca!: string | null;

  @Column({
    type: 'enum',
    enum: SexoPet,
    default: SexoPet.NAO_INFORMADO,
  })
  sexo!: SexoPet;

  @Column({ type: 'date', nullable: true })
  dataNascimento!: string | null;

  @Column({
    type: 'numeric',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: transformarDecimal,
  })
  pesoAtual!: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fotoUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes!: string | null;

  @Column({ type: 'boolean', default: true })
  ativo!: boolean;

  @Column({ type: 'uuid' })
  tutorId!: string;

  @ManyToOne(() => Tutor, (tutor) => tutor.pets, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'tutorId' })
  tutor!: Tutor;

  @CreateDateColumn()
  criadoEm!: Date;

  @UpdateDateColumn()
  atualizadoEm!: Date;
}
