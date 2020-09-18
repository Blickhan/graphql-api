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
import bcrypt from 'bcrypt';
import { User } from '../entity';
import { ErrorMessage } from './types';
import { Context } from '../types';
import { authenticateGoogle } from '../middleware/passport';
import validateEmail from '../utils/validateEmail';

@InputType()
class UserInput {
  @Field() email!: string;
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
    if (!validateEmail(userInput.email)) {
      return {
        errors: [{ message: 'Email is an invalid format' }],
      };
    }
    if (userInput.password.length < 8) {
      return {
        errors: [{ message: 'Password must be at least 8 characters' }],
      };
    }

    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      return {
        errors: [{ message: 'Email is already taken' }],
      };
    }

    const hashedPassword = await bcrypt.hash(userInput.password, 10);
    const user = await User.create({
      email: userInput.email,
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
      email: userInput.email,
    });
    if (!user) {
      return {
        errors: [{ message: 'Invalid email or password' }],
      };
    }
    const valid = await bcrypt.compare(userInput.password, user.password);
    if (!valid) {
      return {
        errors: [{ message: 'Invalid email or password' }],
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

  @Mutation(() => UserResponse)
  async authGoogle(
    @Arg('accessToken') accessToken: string,
    @Ctx() { req, res }: Context
  ): Promise<UserResponse> {
    req.body = {
      ...req.body,
      access_token: accessToken,
    };

    try {
      // @ts-ignore
      const { data, info } = await authenticateGoogle(req, res);
      console.log(data);
      if (data) {
        const existingUser = await User.findOne({
          where: { googleId: data.profile.id },
        });
        if (existingUser) {
          req.session.userId = existingUser.id;
          return { user: existingUser };
        }

        const user = await User.create({
          googleId: data.profile.id,
        }).save();
        req.session.userId = user.id;
        return { user };
      }

      if (info) {
        switch (info.code) {
          case 'ETIMEDOUT':
            throw new Error('Failed to reach Google: Try Again');
          default:
            throw new Error('something went wrong');
        }
      }
      throw new Error('server error');
    } catch (error) {
      return { errors: [{ message: error.message }] };
    }
  }
}
