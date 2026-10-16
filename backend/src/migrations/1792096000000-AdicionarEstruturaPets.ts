import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionarEstruturaPets1792096000000
  implements MigrationInterface
{
  name = 'AdicionarEstruturaPets1792096000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "ativo" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "atualizadoEm" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE TABLE "tutores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(150) NOT NULL, "telefone" character varying(15) NOT NULL, "email" character varying(255), "observacoes" text, "ativo" boolean NOT NULL DEFAULT true, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), "atualizadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_tutores_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tutores_nome" ON "tutores" ("nome")`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pets_sexo_enum" AS ENUM('MACHO', 'FEMEA', 'NAO_INFORMADO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "pets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(150) NOT NULL, "especie" character varying(50) NOT NULL, "raca" character varying(100), "sexo" "public"."pets_sexo_enum" NOT NULL DEFAULT 'NAO_INFORMADO', "dataNascimento" date, "pesoAtual" numeric(6,2), "fotoUrl" character varying(500), "observacoes" text, "ativo" boolean NOT NULL DEFAULT true, "tutorId" uuid NOT NULL, "criadoEm" TIMESTAMP NOT NULL DEFAULT now(), "atualizadoEm" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_pets_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pets_tutor_id" ON "pets" ("tutorId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "pets" ADD CONSTRAINT "FK_pets_tutor" FOREIGN KEY ("tutorId") REFERENCES "tutores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pets" DROP CONSTRAINT "FK_pets_tutor"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_pets_tutor_id"`);
    await queryRunner.query(`DROP TABLE "pets"`);
    await queryRunner.query(`DROP TYPE "public"."pets_sexo_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tutores_nome"`);
    await queryRunner.query(`DROP TABLE "tutores"`);
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN "atualizadoEm"`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "ativo"`);
  }
}
