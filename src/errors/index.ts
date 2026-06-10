export abstract class AppError extends Error {
	abstract readonly statusCode: number;
	abstract readonly code: string;

	constructor(message: string) {
		super(message);

        this.name = this.constructor.name;
	}
}

export class NotFoundError extends AppError{
    statusCode: number = 404;
    code:string = "NOT_FOUND";
}
export class ValidationError extends AppError{
    statusCode: number = 400;
    code:string = "VALIDATION_ERROR";
    details: unknown[];

    constructor(message:string, details: unknown[]){
        super(message);
        this.details = details
    }
}
export class ConflictError extends AppError{
    statusCode: number = 409;
    code:string = "CONFLICT";
}
export class UnauthorizedError extends AppError{
    statusCode: number = 401;
    code:string = "UNAUTHORIZED";
}
export class ForbiddenError extends AppError{
    statusCode: number = 403;
    code:string = "FORBIDDEN";
}
