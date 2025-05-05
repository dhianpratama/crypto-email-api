import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handleGetSearchHistory } from './index';
import { AppError } from '@shared/errors';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const result = await handleGetSearchHistory(event);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Search history successfully fetched', result }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const message = err.message || 'Unexpected error';
    return {
      statusCode,
      body: JSON.stringify({ error: message }),
    };
  }
};
