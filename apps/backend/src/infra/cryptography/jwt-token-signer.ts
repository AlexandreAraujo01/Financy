import jwt, { type SignOptions } from 'jsonwebtoken';
import { TokenPayload, TokenSigner } from '@/ports/token-signer';

export class JwtTokenSigner implements TokenSigner {
  constructor(
    private readonly secret: string,
    // Formato do pacote ms: '15m', '1d', '7d'...
    private readonly expiresIn: string,
  ) {}

  async sign(payload: TokenPayload): Promise<string> {
    const options = { expiresIn: this.expiresIn } as SignOptions;
    return jwt.sign({ ...payload }, this.secret, options);
  }

  // async pra que o erro do jwt.verify (token adulterado ou expirado) vire rejeição.
  async verify(token: string): Promise<TokenPayload> {
    const { sub } = jwt.verify(token, this.secret) as jwt.JwtPayload;
    if (typeof sub !== 'string') throw new jwt.JsonWebTokenError('missing sub');
    return { sub };
  }
}
