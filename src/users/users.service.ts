// ============================================================
// REQUEST-SCOPED PROVIDER: Scope.REQUEST creates a new instance
// per incoming request, enabling per-request context like
// the current user, tenant ID, or request-specific logging.
//
// Note: Request-scoped providers make their entire dependency
// tree request-scoped. Use only when truly needed.
// ============================================================
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { REQUEST } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

// ── Custom Provider example (useFactory) ────────────────────
// In users.module.ts you could define:
//   { provide: 'SALT_ROUNDS', useFactory: (cfg: ConfigService) => cfg.get('BCRYPT_ROUNDS', 10), inject: [ConfigService] }
// Then inject it here with @Inject('SALT_ROUNDS')
// ────────────────────────────────────────────────────────────

@Injectable({ scope: Scope.REQUEST }) // New instance per request
export class UsersService {
  private readonly CACHE_PREFIX = 'user:';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,

    // ============================================================
    // CACHING: Inject Cache from CacheModule (backed by Redis)
    // ============================================================
    @Inject(CACHE_MANAGER)
    private cache: Cache,

    // ============================================================
    // REQUEST INJECTION: Access the raw request in a service.
    // Useful for extracting user context, tracing headers, etc.
    // ============================================================
    @Inject(REQUEST)
    private readonly request: FastifyRequest,
  ) {}

  // Convenience: who is making this request
  private get requestingUserId(): string | undefined {
    return (this.request as any).user?.id;
  }

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(`Email ${dto.email} is already registered`);
    }

    // const hashed = await bcrypt.hash(dto.password, 12);
    const hashed = await argon2.hash(dto.password);
    const user = this.usersRepo.create({ ...dto, password: hashed });
    const saved = await this.usersRepo.save(user);

    // Invalidate list cache when a new user is created
    await this.cache.del('users:list');
    return saved;
  }

  async findAll(): Promise<UserEntity[]> {
    // ============================================================
    // CACHING: Check Redis before hitting the database
    // ============================================================
    const cacheKey = 'users:list';
    const cached = await this.cache.get<UserEntity[]>(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT: users:list');
      return cached;
    }

    console.log('❌ Cache MISS: users:list — querying DB');
    const users = await this.usersRepo.find({ where: { isActive: true } });
    await this.cache.set(cacheKey, users, this.CACHE_TTL * 1000);
    return users;
  }

  async findOne(id: string): Promise<UserEntity> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await this.cache.get<UserEntity>(cacheKey);
    if (cached) return cached;

    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    await this.cache.set(cacheKey, user, this.CACHE_TTL * 1000);
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password') // password is select:false by default
      .where('user.email = :email', { email })
      .getOne();
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findOne(id);
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 12);
    }
    Object.assign(user, dto);
    const updated = await this.usersRepo.save(user);

    // Bust cache
    await this.cache.del(`${this.CACHE_PREFIX}${id}`);
    await this.cache.del('users:list');
    return updated;
  }

  async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
    const user = await this.findOne(id);
    user.refreshToken = refreshToken;
    await this.usersRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepo.softRemove(user);
    await this.cache.del(`${this.CACHE_PREFIX}${id}`);
    await this.cache.del('users:list');
  }
}
