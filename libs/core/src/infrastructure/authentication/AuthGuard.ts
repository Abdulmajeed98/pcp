import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Caller } from '../../domain/caller/Caller';
import { callerFromClaims } from './AccessTokenClaims';
import { AccessTokenVerifier, InvalidAccessToken } from './AccessTokenVerifier';
import { CallerResolver } from './CallerResolver';
import { PreAuthorize } from './PreAuthorize';
import { Public } from './Public';

type RequestWithHeaders = { headers: { authorization?: string } };

function bearerTokenOf(request: RequestWithHeaders): string | undefined {
  const [scheme, token] = (request.headers.authorization ?? '').split(' ');

  return scheme.toLowerCase() === 'bearer' && token ? token : undefined;
}

// The one guard in front of every endpoint. An endpoint says who may call it
// with `@PreAuthorize` or `@Public`, and one that says nothing is refused.
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenVerifier: AccessTokenVerifier,
    private readonly callerResolver: CallerResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];

    if (this.reflector.getAllAndOverride(Public, targets)) return true;

    const token = bearerTokenOf(context.switchToHttp().getRequest<RequestWithHeaders>());
    if (token === undefined) throw new UnauthorizedException();

    const caller = await this.callerOf(token);

    // An endpoint with no access rule, or with an empty one, is closed to
    // every caller.
    const roles = this.reflector.getAllAndOverride(PreAuthorize, targets) ?? [];
    if (!caller.hasAnyRole(roles)) throw new ForbiddenException();

    this.callerResolver.setCaller(caller);

    return true;
  }

  // The reason a token is refused goes to the log and never to the caller.
  private async callerOf(token: string): Promise<Caller> {
    let caller: Caller | undefined;
    try {
      caller = callerFromClaims(await this.accessTokenVerifier.verify(token));
    } catch (error) {
      if (error instanceof InvalidAccessToken) {
        this.logger.warn(`A token was refused: ${error.message}`);
        throw new UnauthorizedException();
      }
      this.logger.error(error, 'No token can be verified');
      throw new ServiceUnavailableException();
    }

    if (caller === undefined) {
      this.logger.warn('A token was refused: it does not name a login');
      throw new UnauthorizedException();
    }

    return caller;
  }
}
