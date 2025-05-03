import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handleCryptoRequest } from './index';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const result = await handleCryptoRequest(event);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Queued for email', result }),
    };
  } catch (err: any) {
    console.error('Error in handler:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
