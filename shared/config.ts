export const CONFIG = {
    QUEUE_URL: process.env.QUEUE_URL,
    REGION: process.env.AWS_REGION || 'us-east-1', // optional, for SDK clients
    SES_SENDER: process.env.SES_SENDER || '',      // for email microservice
    DYNAMO_ENDPOINT: process.env.DYNAMO_ENDPOINT,
    IS_LOCAL: process.env.IS_LOCAL,
};
