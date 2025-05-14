import { APIGatewayProxyEvent } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { saveSearchRecord } from '@shared/dynamo';
import { sendToQueue } from '@shared/sqs';
import { ValidationError } from '@shared/errors';
import { SearchStatus } from '@shared/types';
import { AuthenticatedUser } from '@shared/withAuth';

interface RequestBody {
  crypto: string;
  email: string;
}

export const handleCryptoRequest = async (
  event: APIGatewayProxyEvent,
  user: AuthenticatedUser
): Promise<void> => {
  if (!event.body) throw new ValidationError('Missing request body');

  const { crypto }: RequestBody = JSON.parse(event.body);

  if (!crypto) throw new ValidationError('Missing "crypto"');

  const timestamp = new Date().toISOString();

  const id = uuidv4();
  await saveSearchRecord({
    id,
    crypto,
    email: user.email,
    requestedAt: timestamp,
    status: SearchStatus.REQUESTED,
  });

  // Step 4: Queue email
  await sendToQueue({
    id,
    crypto,
    email: user.email,
    timestamp,
  });
};
