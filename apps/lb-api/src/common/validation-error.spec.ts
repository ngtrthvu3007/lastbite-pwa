import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { GraphQLError } from 'graphql';
import { ValidationExceptionFilter } from './validation-error';

const FIELDS = [{ field: 'name', code: 'NAME_REQUIRED' }];

function createHost(type: 'graphql' | 'http') {
  return { getType: () => type } as ArgumentsHost;
}

describe('ValidationExceptionFilter', () => {
  const baseCatch = jest.spyOn(BaseExceptionFilter.prototype, 'catch').mockImplementation();
  const filter = new ValidationExceptionFilter();

  afterEach(() => baseCatch.mockClear());
  afterAll(() => baseCatch.mockRestore());

  it('exposes the fields as extensions.fields for GraphQL', () => {
    const exception = new BadRequestException({ message: ['NAME_REQUIRED'], fields: FIELDS });

    const result = filter.catch(exception, createHost('graphql'));

    expect(result).toBeInstanceOf(GraphQLError);
    expect(result).toMatchObject({ extensions: { code: 'BAD_USER_INPUT', fields: FIELDS } });
    expect(baseCatch).not.toHaveBeenCalled();
  });

  it('leaves a GraphQL bad request without fields to the default filter', () => {
    const exception = new BadRequestException('Bad request');
    const host = createHost('graphql');

    filter.catch(exception, host);

    expect(baseCatch).toHaveBeenCalledWith(exception, host);
  });

  it('leaves REST to the default filter even when fields are present', () => {
    const exception = new BadRequestException({ message: ['NAME_REQUIRED'], fields: FIELDS });
    const host = createHost('http');

    filter.catch(exception, host);

    expect(baseCatch).toHaveBeenCalledWith(exception, host);
  });
});
