export const __prod__ = process.env.NODE_ENV === 'production';

export enum Topic {
  TodoAdded = 'TODO_ADDED',
  TodoDeleted = 'TODO_DELETED',
  TodoUpdated = 'TODO_UPDATED',
}
