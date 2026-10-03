export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Requisição inválida') {
    super(400, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Não autenticado') {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Acesso negado') {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Recurso não encontrado') {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflito') {
    super(409, message);
  }
}
