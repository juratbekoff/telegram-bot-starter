import {BotError, GrammyError, HttpError} from "grammy";

export async function errorHandler(err: BotError) {
    const ctx = err.ctx;
    const e = err.error;

    console.log(e);

    if (e instanceof GrammyError) {
        if (e.description === "Forbidden: bot was blocked by the user") {
            // await userService.updateStatusByTgId(ctx.chat.id, true);
            console.log(`We blocked the user with ID: ${ctx.chat?.id}`);
        }
        console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    }
}