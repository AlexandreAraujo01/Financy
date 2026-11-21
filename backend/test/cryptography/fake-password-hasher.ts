import { PasswordHasher } from '@/ports/password-hasher';

// Reversível de propósito, pra os testes conseguirem conferir o que foi hasheado.
export class FakePasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return Promise.resolve(`hashed:${plain}`);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return Promise.resolve(hashed === `hashed:${plain}`);
  }
}
