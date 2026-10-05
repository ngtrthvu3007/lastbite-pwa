import { AppController } from './app.controller';

describe('AppController', () => {
  const appController = new AppController();

  it('returns the health status', () => {
    expect(appController.getHealth()).toBe('ok');
  });
});
