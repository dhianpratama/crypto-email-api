import { SQSEvent } from 'aws-lambda';
import { handleEmailRequest } from './index';

export const handler = async (event: SQSEvent): Promise<void> => {
  await handleEmailRequest(event);
};
