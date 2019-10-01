/**
 * Created by zhangsong on 2018/8/10.
 */
import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import { join } from 'path';
import KeycloakKoaConnect from '../src/index';

const app = new Koa();

const koaRouter = new KoaRouter();
const appRouter = new KoaRouter();

const keycloakKoaConnect = new KeycloakKoaConnect({}, join(__dirname, '..', 'keycloak.json'));

const middlewares = keycloakKoaConnect.middleware();
middlewares.forEach((mid: any) => app.use(mid));
koaRouter.all('*', (ctx: any, next: any) => {
  ctx.body = 'Hello Koa';
});

appRouter.use(
  '/',
  async (ctx: any, next: any) => {
    try {
      await keycloakKoaConnect.protect()(ctx, next);
      await next();
    } catch (e) {
      console.error(e);
    }
  },
  koaRouter.routes(),
);

app.use(appRouter.routes());

// // response
// app.use((ctx) => {
//   ctx.body = 'Hello Koa';
// });

app.listen(3000);
