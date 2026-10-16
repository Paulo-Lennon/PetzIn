import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionarReservas1792182400000 implements MigrationInterface {
  name = 'AdicionarReservas1792182400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."reservas_modalidade_enum" AS ENUM('HORA', 'DIARIA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reservas_status_enum" AS ENUM('AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA')`,
    );
    await queryRunner.query(
      `CREATE TABLE "reservas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "petId" uuid NOT NULL, "dataEntrada" TIMESTAMP WITH TIME ZONE NOT NULL, "dataSaida" TIMESTAMP WITH TIME ZONE NOT NULL, "numeroCanil" integer NOT NULL, "modalidade" "public"."reservas_modalidade_enum" NOT NULL, "tarifaHora" numeric(10,2) NOT NULL, "tarifaDiaria" numeric(10,2) NOT NULL, "valorTotal" numeric(10,2) NOT NULL, "status" "public"."reservas_status_enum" NOT NULL DEFAULT 'AGENDADA', "observacoes" text, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), "atualizadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_reservas_periodo" CHECK ("dataSaida" > "dataEntrada"), CONSTRAINT "CHK_reservas_canil_positivo" CHECK ("numeroCanil" > 0), CONSTRAINT "CHK_reservas_valores" CHECK ("tarifaHora" > 0 AND "tarifaDiaria" > 0 AND "valorTotal" > 0), CONSTRAINT "PK_reservas_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reservas_pet_id" ON "reservas" ("petId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reservas_canil_periodo" ON "reservas" ("numeroCanil", "dataEntrada", "dataSaida")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reservas_status" ON "reservas" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas" ADD CONSTRAINT "FK_reservas_pet" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reservas" DROP CONSTRAINT "FK_reservas_pet"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_reservas_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_reservas_canil_periodo"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_reservas_pet_id"`);
    await queryRunner.query(`DROP TABLE "reservas"`);
    await queryRunner.query(`DROP TYPE "public"."reservas_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."reservas_modalidade_enum"`);
  }
}
