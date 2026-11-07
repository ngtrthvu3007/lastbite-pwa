import { ArgumentsHost, BadRequestException, Catch, type ValidationError } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { GqlContextType } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

// DTO decorators use an error code as their message, so a constraint message is the code the
// client maps to its own text. A *_REQUIRED code wins when several constraints fail on one field.
function toFieldError(error: ValidationError): { field: string; code: string } {
  const codes = Object.values(error.constraints ?? {});

  return {
    field: error.property,
    code: codes.find((code) => code.endsWith('_REQUIRED')) ?? codes[0],
  };
}

// `message` keeps the shape ValidationPipe returns by default; `fields` is added next to it.
export function buildValidationError(errors: ValidationError[]): BadRequestException {
  return new BadRequestException({
    message: errors.flatMap((error) => Object.values(error.constraints ?? {})),
    fields: errors.map(toFieldError),
  });
}

// buildValidationError puts `fields` ({ field, code }[]) in the response body. Apollo would bury
// it under extensions.originalError, so GraphQL gets it as extensions.fields; REST is untouched.
@Catch(BadRequestException)
export class ValidationExceptionFilter extends BaseExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost): GraphQLError | void {
    const body = exception.getResponse();
    const isGraphql = host.getType<GqlContextType>() === 'graphql';

    if (!isGraphql || typeof body !== 'object' || !('fields' in body)) {
      return super.catch(exception, host); // REST keeps the default response
    }

    return new GraphQLError('Validation failed', {
      extensions: { code: 'BAD_USER_INPUT', fields: body.fields },
    });
  }
}
