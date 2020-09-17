import {
  Resolver,
  Mutation,
  Arg,
  InputType,
  Field,
  ObjectType,
  Ctx,
  Query,
} from 'type-graphql';
import { ErrorMessage } from './types';
import { User } from '../entity/User';
import bcrypt from 'bcrypt';
import { Context } from 'src/types';

@InputType()
class UserInput {
  @Field() username!: string;
  @Field() password!: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [ErrorMessage], { nullable: true })
  errors?: ErrorMessage[];
  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { userId }: Context) {
    // you are not logged in
    if (!userId) {
      return null;
    }
    return await User.findOne(userId);
  }

  @Mutation(() => UserResponse)
  async signup(
    @Arg('userInput') userInput: UserInput,
    @Ctx() { req }: Context
  ): Promise<UserResponse> {
    if (userInput.username.length < 3) {
      return {
        errors: [{ message: 'Username must be at least 3 characters' }],
      };
    }
    if (userInput.password.length < 8) {
      return {
        errors: [{ message: 'Password must be at least 8 characters' }],
      };
    }

    const existingUser = await User.findOne({ username: userInput.username });
    if (existingUser) {
      return {
        errors: [{ message: 'Username is already taken' }],
      };
    }

    const hashedPassword = await bcrypt.hash(userInput.password, 10);
    const user = await User.create({
      username: userInput.username,
      password: hashedPassword,
    }).save();

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('userInput') userInput: UserInput,
    @Ctx() { req }: Context
  ): Promise<UserResponse> {
    const user = await User.findOne({
      username: userInput.username,
    });
    if (!user) {
      return {
        errors: [{ message: 'Invalid username or password' }],
      };
    }
    const valid = await bcrypt.compare(userInput.password, user.password);
    if (!valid) {
      return {
        errors: [{ message: 'Invalid username or password' }],
      };
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req }: Context): Boolean {
    if (!req.session.userId) {
      return false;
    }

    req.session.destroy((err) => console.log(err));

    return true;
  }
}
