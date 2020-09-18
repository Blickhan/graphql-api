import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ObjectType, Field } from 'type-graphql';
import { Todo } from './Todo';

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @Index({ unique: true, where: 'googleId IS NOT NULL' })
  googleId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @Index({ unique: true, where: 'email IS NOT NULL' })
  email: string;

  @Column({ nullable: true })
  password: string;

  // @Field(() => [Todo])
  @OneToMany(() => Todo, (todo) => todo.user)
  todos: Todo[];

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
