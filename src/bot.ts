import {Bot, Context, SessionFlavor} from "grammy";

import * as dotenv from "dotenv";
import {errorHandler, session, SessionData} from "./middlewares";
import {router} from "./routes";
import {Start} from "./controllers";
import {logger} from "./lib";

dotenv.config();

export type MyContext = Context & SessionFlavor<SessionData>;
const bot = new Bot<MyContext>(process.env.BOT_TOKEN);

bot.use(session);
bot.use(router);

bot.command("start", Start);

bot.catch(errorHandler);

bot.start({
    onStart: () => {
        logger.info(`https://t.me/${bot.botInfo.username} has been started`);
    },
});