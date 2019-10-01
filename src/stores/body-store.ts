/**
 * Created by zhangsong on 2018/9/14.
 */

const bodyStore = {
  get(ctx: any): any {
    const { jwt } = ctx.request.body;
    if (jwt) {
      return {
        access_token: jwt,
      };
    }
  },
};

export default bodyStore;
