export class HttpError extends Error {
  status: number;
  code?: string | undefined;
  errors?: Record<string, string> | undefined;

  constructor(
    status: number,
    message: string,
    code?: string,
    errors?: Record<string, string>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}