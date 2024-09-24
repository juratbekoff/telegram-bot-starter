import {MyContext} from "../bot";

export async function Start(ctx: MyContext) {
    return await ctx.reply("Hello!")
}