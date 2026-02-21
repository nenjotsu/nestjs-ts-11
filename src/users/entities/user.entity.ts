// src/modules/users/entities/user.entity.ts
// ============================================================
// CLASS SERIALIZER: @Exclude() prevents sensitive fields
// (password, refreshToken) from leaking in API responses.
// Used together with ClassSerializerInterceptor.
// ============================================================
import { Exclude, Expose, Transform } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @Column({ unique: true })
  @Expose()
  email: string;

  @Column()
  @Expose()
  firstName: string;

  @Column()
  @Expose()
  lastName: string;

  // ── @Exclude(): never sent to clients ───────────────────
  @Column({ select: false }) // Also excluded from DB queries by default
  @Exclude()
  password: string;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @Column({ nullable: true })
  @Exclude()
  twoFactorSecret: string;
  // ────────────────────────────────────────────────────────

  @Column('simple-array', { default: 'user' })
  @Expose()
  roles: string[];

  @Column({ default: true })
  @Expose()
  isActive: boolean;

  @CreateDateColumn()
  @Expose()
  createdAt: Date;

  @UpdateDateColumn()
  @Expose()
  updatedAt: Date;

  // Virtual field: full name computed from first + last
  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}