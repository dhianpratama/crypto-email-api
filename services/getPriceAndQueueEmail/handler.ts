import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handleCryptoRequest } from './index';
import { AppError } from '@shared/errors';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    await handleCryptoRequest(event);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Price request received. You will get an email shortly.',
      }),
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
