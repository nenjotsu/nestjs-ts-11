import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Keyv } from 'keyv';
import KeyvRedis from '@keyv/redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './config/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local','.env'],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: [
          new Keyv({
            store: new KeyvRedis(
              `redis://:${config.get('REDIS_PASSWORD', '')}@${config.get('REDIS_HOST', 'localhost')}:${config.get('REDIS_PORT', 6379)}`
            ),
            ttl: config.get<number>('CACHE_TTL', 60) * 1000,
            namespace: 'myapp', // optional key prefix
          }),
        ],
      }),
    }),
    DatabaseModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.TIMESCALEDB_USER,
      password: process.env.TIMESCALEDB_PASSWORD,
      database: process.env.TIMESCALEDB_DB,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: true,
    }),

    CqrsModule,

    UserModule,

    UsersModule,

    AuthModule,

    ProductsModule,

    OrdersModule,
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
