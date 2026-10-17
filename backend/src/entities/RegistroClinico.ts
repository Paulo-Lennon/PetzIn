import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  ValueTransformer,
} from 'typeorm';
import { Pet } from './Pet';
import { Reserva } from './Reserva';

const transformarDecimal: ValueTransformer = {
  to: (valor: number | null) => valor,
  from: (valor: string | null) => (valor === null ? null : Number(valor)),
};

export enum TipoRegistroClinico {
  ALIMENTACAO = 'ALIMENTACAO',
  HIDRATACAO = 'HIDRATACAO',
  SINAIS_VITAIS = 'SINAIS_VITAIS',
  COMPORTAMENTO = 'COMPORTAMENTO',
  HIGIENE = 'HIGIENE',
  ATIVIDADE = 'ATIVIDADE',
  OCORRENCIA = 'OCORRENCIA',
  OBSERVACAO = 'OBSERVACAO',
}

@Entity('registros_clinicos')
@Index('IDX_registros_clinicos_pet_data', ['petId', 'dataHora'])
@Index('IDX_registros_clinicos_reserva', ['reservaId'])
export class RegistroClinico {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  petId!: string;

  @ManyToOne(() => Pet, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'petId' })
  pet!: Pet;

  @Column({ type: 'uuid' })
  reservaId!: string;

  @ManyToOne(() => Reserva, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reservaId' })
  reserva!: Reserva;

  @Column({ type: 'enum', enum: TipoRegistroClinico })
  tipo!: TipoRegistroClinico;

  @Column({ type: 'timestamptz' })
  dataHora!: Date;

  @Column({ type: 'text' })
  descricao!: string;

  @Column({
    type: 'numeric',
    precision: 4,
    scale: 1,
    nullable: true,
    transformer: transformarDecimal,
  })
  temperatura!: number | null;

  @Column({
    type: 'numeric',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: transformarDecimal,
  })
  peso!: number | null;

  @CreateDateColumn()
  criadoEm!: Date;
}
