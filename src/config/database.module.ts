// src/config/database.module.ts
// ============================================================
// DYNAMIC MODULE: Implements the forRoot() pattern for
// configurable modules. Consumers call:
//   DatabaseModule.forRoot({ host: '...', port: 5432 })
// ============================================================
import { DynamicModule, Global, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Global() // Makes TypeORM available everywhere without re-importing
@Module({})
export class DatabaseModule {
  /**
   * Static factory method — the "forRoot pattern".
   * Returns a DynamicModule configured with the given options.
   * This is how @nestjs/typeorm, @nestjs/config etc. work internally.
   */
  static forRoot(options: TypeOrmModuleOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            ...options,
            // Force-enable logging in dev
            logging: process.env.NODE_ENV === 'development',
            // Connection pool settings
            extra: {
              max: 20,        // max pool size
              idleTimeoutMillis: 30000,
            },
          }),
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
}