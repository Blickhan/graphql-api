import {
  Resolver,
  Mutation,
  Field,
  ObjectType,
  Ctx,
  Query,
  Arg,
  Authorized,
  Subscription,
  Root,
  PubSub,
  Publisher,
  Int,
} from 'type-graphql';
import { ErrorMessage, BooleanResponse } from './types';
import { Todo } from '../entity';
import { Context } from '../types';
import { Topic } from '../constants';

@ObjectType()
export class TodoResponse {
  @Field(() => [ErrorMessage], { nullable: true })
  errors?: ErrorMessage[];
  @Field(() => Todo, { nullable: true })
  todo?: Todo;
}

@Resolver()
export class TodoResolver {
  // TODO: add pagination; `Todo.findAndCount()` method, `take` and `skip` params
  @Authorized()
  @Query(() => [Todo], { nullable: true })
  async todos(@Ctx() { userId }: Context): Promise<Todo[]> {
    return await Todo.find({ where: { userId } });
  }

  @Authorized()
  @Mutation(() => TodoResponse)
  async createTodo(
    @Arg('title') title: string,
    @Ctx() { req }: Context,
    @PubSub(Topic.TodoAdded) publish: Publisher<Todo>
  ): Promise<TodoResponse> {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return {
        errors: [{ message: 'Todo text cannot be blank' }],
      };
    }

    const todo = await Todo.create({
      title: trimmedTitle,
      userId: req.session.userId,
    }).save();

    await publish(todo);
    return { todo };
  }

  @Authorized()
  @Mutation(() => TodoResponse)
  async toggleTodo(
    @Arg('id') id: number,
    @Ctx() { userId }: Context,
    @PubSub(Topic.TodoUpdated) publish: Publisher<Todo>
  ): Promise<TodoResponse> {
    const todo = await Todo.findOne(id);
    if (!todo) {
      return {
        errors: [{ message: 'Todo cannot be found' }],
      };
    }

    if (todo.userId !== userId) {
      return {
        errors: [{ message: 'Not authorized to edit this todo' }],
      };
    }

    todo.completed = !todo.completed;
    await Todo.save(todo);

    await publish(todo);
    return { todo };
  }

  @Authorized()
  @Mutation(() => BooleanResponse)
  async deleteTodo(
    @Arg('id') id: number,
    @Ctx() { userId }: Context,
    @PubSub(Topic.TodoDeleted) publish: Publisher<Todo>
  ): Promise<BooleanResponse> {
    const todo = await Todo.findOne(id);
    if (!todo) {
      return {
        errors: [{ message: 'Todo cannot be found' }],
      };
    }

    if (todo.userId !== userId) {
      return {
        errors: [{ message: 'Not authorized to delete this todo' }],
      };
    }

    const copy = Object.assign({}, todo);
    await Todo.remove(todo);

    await publish(copy);
    return { success: true };
  }

  @Authorized()
  @Subscription(() => Todo, {
    topics: Topic.TodoAdded,
    filter: ({ payload, context }) => payload.userId === context.userId,
    nullable: true,
  })
  todoAdded(@Root() todo: Todo): Todo {
    return todo;
  }

  @Authorized()
  @Subscription(() => Int, {
    topics: Topic.TodoDeleted,
    filter: ({ payload, context }) => payload.userId === context.userId,
    nullable: true,
  })
  todoDeleted(@Root() todo: Todo): number {
    return todo.id;
  }

  @Authorized()
  @Subscription(() => Todo, {
    topics: Topic.TodoUpdated,
    filter: ({ payload, context }) => payload.userId === context.userId,
    nullable: true,
  })
  todoUpdated(@Root() todo: Todo): Todo {
    return todo;
  }
}
