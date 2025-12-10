// Note: copied from viem since it doesn't export these

import { BaseError } from 'viem';

export class InvalidBytesLengthError extends BaseError {
  constructor({
    size,
    targetSize,
    type
  }: {
    size: number;
    targetSize: number;
    type: 'hex' | 'bytes';
  }) {
    super(
      `${type.charAt(0).toUpperCase()}${type
        .slice(1)
        .toLowerCase()} is expected to be ${targetSize} ${type} long, but is ${size} ${type} long.`,
      { name: 'InvalidBytesLengthError' }
    );
  }
}

export class AccountNotFoundError extends BaseError {
  constructor({ docsPath }: { docsPath?: string | undefined } = {}) {
    super(
      [
        'Could not find an Account to execute with this Action.',
        'Please provide an Account with the `account` argument on the Action, or by supplying an `account` to the Client.'
      ].join('\n'),
      {
        docsPath,
        docsSlug: 'account',
        name: 'AccountNotFoundError'
      }
    );
  }
}
