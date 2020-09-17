import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class ErrorMessage {
  @Field() message: string;
}

@ObjectType()
export class BooleanResponse {
  @Field(() => [ErrorMessage], { nullable: true })
  errors?: ErrorMessage[];
  @Field({ nullable: true })
  success?: boolean;
}
