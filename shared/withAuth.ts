import { APIGatewayProxyEvent } from 'aws-lambda';
import { UnauthorizedError } from './errors';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  username: string;
  groups?: string[];
}

export const getUserFromEvent = (event: APIGatewayProxyEvent): AuthenticatedUser => {
  const claims = event.requestContext.authorizer?.claims;

  if (!claims) {
    throw new UnauthorizedError('Missing claims in request');
  }

  console.log('CLAIMS >>> ', claims);

  return {
    sub: claims.sub,
    email: claims.email,
    username: claims['cognito:username'],
    groups: claims['cognito:groups']
      ? typeof claims['cognito:groups'] === 'string'
        ? [claims['cognito:groups']]
        : claims['cognito:groups']
      : [],
  };
};

export const withAuth = <T>(
  handler: (event: APIGatewayProxyEvent, user: AuthenticatedUser) => Promise<T>,
  requiredRoles?: string[]
) => {
  return async (event: APIGatewayProxyEvent): Promise<T> => {
    const user = getUserFromEvent(event);

    if (requiredRoles?.length && !requiredRoles.some((role) => user.groups?.includes(role))) {
      throw new UnauthorizedError('Insufficient permissions');
    }

    return handler(event, user);
  };
};
