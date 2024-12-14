import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: never, ctx: ExecutionContext) => {
    if (ctx.getType() !== 'http') {
      return;
    }
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
