import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionarCuidadosClinicos1792190000000
  implements MigrationInterface
{
  name = 'AdicionarCuidadosClinicos1792190000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."registros_clinicos_tipo_enum" AS ENUM('ALIMENTACAO', 'HIDRATACAO', 'SINAIS_VITAIS', 'COMPORTAMENTO', 'HIGIENE', 'ATIVIDADE', 'OCORRENCIA', 'OBSERVACAO')`);
    await queryRunner.query(`CREATE TYPE "public"."lembretes_medicamentos_status_enum" AS ENUM('PENDENTE', 'ADMINISTRADO', 'NAO_ADMINISTRADO', 'CANCELADO')`);
    await queryRunner.query(`CREATE TABLE "fichas_clinicas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "petId" uuid NOT NULL, "vacinasEmDia" boolean, "alergias" text, "condicoesClinicas" text, "restricoesAlimentares" text, "veterinarioNome" character varying(150), "veterinarioTelefone" character varying(15), "observacoes" text, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), "atualizadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fichas_clinicas_pet" UNIQUE ("petId"), CONSTRAINT "PK_fichas_clinicas" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "registros_clinicos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "petId" uuid NOT NULL, "reservaId" uuid NOT NULL, "tipo" "public"."registros_clinicos_tipo_enum" NOT NULL, "dataHora" TIMESTAMP WITH TIME ZONE NOT NULL, "descricao" text NOT NULL, "temperatura" numeric(4,1), "peso" numeric(6,2), "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_registros_clinicos" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_registros_clinicos_pet_data" ON "registros_clinicos" ("petId", "dataHora")`);
    await queryRunner.query(`CREATE INDEX "IDX_registros_clinicos_reserva" ON "registros_clinicos" ("reservaId")`);
    await queryRunner.query(`CREATE TABLE "lembretes_medicamentos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "petId" uuid NOT NULL, "reservaId" uuid NOT NULL, "medicamento" character varying(150) NOT NULL, "dosagem" character varying(100) NOT NULL, "viaAdministracao" character varying(80), "horarioProgramado" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."lembretes_medicamentos_status_enum" NOT NULL DEFAULT 'PENDENTE', "observacoes" text, "administradoEm" TIMESTAMP WITH TIME ZONE, "motivoNaoAdministrado" text, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), "atualizadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_lembretes_medicamentos" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_lembretes_medicamentos_horario_status" ON "lembretes_medicamentos" ("horarioProgramado", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_lembretes_medicamentos_reserva" ON "lembretes_medicamentos" ("reservaId")`);
    await queryRunner.query(`ALTER TABLE "fichas_clinicas" ADD CONSTRAINT "FK_fichas_clinicas_pet" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "registros_clinicos" ADD CONSTRAINT "FK_registros_clinicos_pet" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "registros_clinicos" ADD CONSTRAINT "FK_registros_clinicos_reserva" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "lembretes_medicamentos" ADD CONSTRAINT "FK_lembretes_medicamentos_pet" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "lembretes_medicamentos" ADD CONSTRAINT "FK_lembretes_medicamentos_reserva" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lembretes_medicamentos" DROP CONSTRAINT "FK_lembretes_medicamentos_reserva"`);
    await queryRunner.query(`ALTER TABLE "lembretes_medicamentos" DROP CONSTRAINT "FK_lembretes_medicamentos_pet"`);
    await queryRunner.query(`ALTER TABLE "registros_clinicos" DROP CONSTRAINT "FK_registros_clinicos_reserva"`);
    await queryRunner.query(`ALTER TABLE "registros_clinicos" DROP CONSTRAINT "FK_registros_clinicos_pet"`);
    await queryRunner.query(`ALTER TABLE "fichas_clinicas" DROP CONSTRAINT "FK_fichas_clinicas_pet"`);
    await queryRunner.query(`DROP TABLE "lembretes_medicamentos"`);
    await queryRunner.query(`DROP TABLE "registros_clinicos"`);
    await queryRunner.query(`DROP TABLE "fichas_clinicas"`);
    await queryRunner.query(`DROP TYPE "public"."lembretes_medicamentos_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."registros_clinicos_tipo_enum"`);
  }
}
