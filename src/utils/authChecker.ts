import { AuthChecker } from 'type-graphql';
import { get } from 'lodash';
import { Context } from '../types';

export const authChecker: AuthChecker<Context> = ({ context }) => {
  return !!get(context, 'userId');
};
