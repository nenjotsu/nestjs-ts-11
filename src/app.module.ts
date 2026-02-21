import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local','.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.TIMESCALEDB_USER,
      password: process.env.TIMESCALEDB_PASSWORD,
      database: process.env.TIMESCALEDB_DB,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    // console.log({
    //   type: 'postgres',
    //   host: process.env.DB_HOST || 'localhost',
    //   port: parseInt(process.env.DB_PORT || '5432', 10),
    //   username: process.env.TIMESCALEDB_USER,
    //   password: process.env.TIMESCALEDB_PASSWORD,
    //   database: process.env.TIMESCALEDB_DB,
    //   entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //   synchronize: true,
    // });
  }
}
