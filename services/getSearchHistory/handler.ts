import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handleGetSearchHistory } from './index';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const result = await handleGetSearchHistory(event);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Search history successfully fetched', result }),
    };
  } catch (err: any) {
    console.error('Error in handler:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
