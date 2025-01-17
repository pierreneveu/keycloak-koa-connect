import { ParameterizedContext } from 'koa';

/**
 * Created by zhangsong on 2018/8/9.
 */
export default function(keycloak: any) {
  return async function grantAttacher(ctx: ParameterizedContext, next: () => Promise<void>) {
    ctx.state.kauth.grant = await keycloak.getGrant(ctx);
    await next();
  };
}
