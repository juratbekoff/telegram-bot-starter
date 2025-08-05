import { allowedUsers } from "../lib";
import { MyContext } from "../bot";

export async function Start(ctx: MyContext) {
  if (!allowedUsers.includes(ctx.chatId)) {
    return await ctx.reply("Afsuski bu bot siz uchun emas!");
  }

  return await ctx.reply("Xush kelibsiz!");
}
