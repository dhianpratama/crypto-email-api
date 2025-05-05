export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public name: string = 'AppError'
  ) {
    super(message);
    this.name = name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'ValidationError');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NotFoundError');
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string) {
    super(message, 502, 'ExternalServiceError');
  }
}
