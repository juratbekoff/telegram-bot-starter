import {Router} from "@grammyjs/router";
import {MyContext} from "../bot";

export const router = new Router<MyContext>((ctx) => ctx.session.state);

