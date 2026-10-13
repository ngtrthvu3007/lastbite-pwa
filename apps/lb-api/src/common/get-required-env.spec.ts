import { getRequiredEnv } from './get-required-env';

describe('getRequiredEnv', () => {
  it('returns the trimmed value of a set variable', () => {
    expect(getRequiredEnv('NAME', { NAME: '  value ' })).toBe('value');
  });

  it.each([undefined, '', '   '])('throws when the variable is %p', (value) => {
    expect(() => getRequiredEnv('NAME', { NAME: value })).toThrow(
      'Missing required environment variable: NAME',
    );
  });
});
