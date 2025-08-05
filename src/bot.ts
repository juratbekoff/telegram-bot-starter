import { Bot, Context, SessionFlavor } from "grammy";

import * as dotenv from "dotenv";
import { errorHandler, session, SessionData } from "./middlewares";
import { router } from "./routes";
import { Start } from "./controllers";
import { logger } from "./lib";
import cron from "node-cron";
import { getTravelRoutes } from "./lib/api";

dotenv.config();

export type MyContext = Context & SessionFlavor<SessionData>;
const bot = new Bot<MyContext>(process.env.BOT_TOKEN);

// Simple configuration
const ALLOWED_USERS = [-1002534865885];
const DEBUG_USER = 791944079; // some id will be here
const CHECK_DATES = JSON.parse(process.env.CHECK_DATES);

bot.use(session);
bot.use(router);

function formatTicketMessage(routeData: any): string {
  const { number, departureDate, arrivalDate, originRoute, cars } = routeData;

  const totalSeats = cars.reduce(
    (total: number, car: any) => total + car.freeSeats,
    0
  );

  let message = "";

  if (totalSeats > 100) {
    message = `🎫 <b>Yangi chiptalar topildi!</b>\n\n`;
  } else if (totalSeats > 50) {
    message = `⚡ <b>Cheklangan joylar mavjud!</b>\n\n`;
  } else if (totalSeats > 20) {
    message = `🚨 <b>Kam joylar qoldi - tezroq oling!</b>\n\n`;
  } else if (totalSeats > 10) {
    message = `🔥 <b>Oxirgi joylar - shoshiling!</b>\n\n`;
  } else {
    message = `⚠️ <b>Faqat ${totalSeats} ta joy qoldi!</b>\n\n`;
  }

  message += `Poyezd: <b>${number}</b>\n`;
  message += `Mashrut: <b>${originRoute.depStationName} → ${originRoute.arvStationName}</b>\n`;
  message += `Jo'nab ketish: <b>${departureDate}</b>\n`;
  message += `Yetib kelish: <b>${arrivalDate}</b>\n\n`;

  if (cars && cars.length > 0) {
    message += `💺 <b>Mavjud joylar:</b>\n`;
    cars.forEach((car: any) => {
      message += `• ${car.type}: <b>${car.freeSeats} ta</b>\n`;
    });
  }

  return message;
}

function hasAvailableTickets(routeData: any): boolean {
  return (
    routeData.cars &&
    routeData.cars.length > 0 &&
    routeData.cars.some((car: any) => car.freeSeats > 0)
  );
}

async function sendDebugReport(message: string) {
  if (DEBUG_USER) {
    try {
      await bot.api.sendMessage(DEBUG_USER, message, {
        parse_mode: "HTML",
      });
    } catch (error) {
      logger.error("Failed to send debug report:", error);
    }
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes} min${
      minutes > 1 ? "s" : ""
    }, ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
  } else {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }
}

async function checkTicketAvailability() {
  const startTime = new Date();
  let totalChecked = 0;
  let totalAvailable = 0;
  let errors: string[] = [];
  let dateResults: string[] = [];

  try {
    for (const checkDate of CHECK_DATES) {
      logger.info(`Checking availability for ${checkDate}`);

      try {
        const travelRoutes = await getTravelRoutes(checkDate);

        if (travelRoutes.success && travelRoutes.data) {
          totalChecked += travelRoutes.data.length;
          let availableForDate = 0;

          for (const route of travelRoutes.data) {
            if (hasAvailableTickets(route)) {
              availableForDate++;
              totalAvailable++;

              logger.info(
                `Tickets available for route ${route.number} on ${checkDate}`
              );

              const message = formatTicketMessage(route);

              for (const userId of ALLOWED_USERS) {
                try {
                  await bot.api.sendMessage(userId, message, {
                    parse_mode: "HTML",
                  });
                  logger.info(
                    `Notification sent to user ${userId} for ${checkDate}`
                  );
                } catch (sendError) {
                  const errorMsg = `Failed to send notification to user ${userId}: ${sendError}`;
                  logger.error(errorMsg);
                  errors.push(errorMsg);
                }
              }
            }
          }

          dateResults.push(
            `📊 <b>${checkDate}</b>: ✅ ${travelRoutes.data.length} routes, ${availableForDate} available`
          );
        } else {
          const errorMsg = `Failed to retrieve travel routes for ${checkDate}: ${
            travelRoutes.message || "Unknown error"
          }`;
          logger.error(errorMsg);
          errors.push(errorMsg);
          dateResults.push(
            `📊 <b>${checkDate}</b>: ❌ ${
              travelRoutes.message || "Unknown error"
            }`
          );
        }
      } catch (dateError) {
        const errorMsg = `Error processing date ${checkDate}: ${dateError}`;
        logger.error(errorMsg);
        errors.push(errorMsg);
        dateResults.push(`📊 <b>${checkDate}</b>: 🔴 ${dateError}`);
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    let summaryReport = `📋 <b>Debug Summary Report</b>\n`;
    summaryReport += `⏰ Duration: ${formatDuration(duration)}\n`;
    summaryReport += `📅 Dates checked: ${CHECK_DATES.length}\n`;
    summaryReport += `🚆 Total routes: ${totalChecked}\n`;
    summaryReport += `🎫 Available routes: ${totalAvailable}\n`;
    summaryReport += `❌ Errors: ${errors.length}\n\n`;

    summaryReport += dateResults.join("\n") + "\n\n";

    if (errors.length > 0) {
      summaryReport += `🔴 <b>Errors:</b>\n`;
      errors.forEach((error, index) => {
        summaryReport += `${index + 1}. ${error}\n`;
      });
    } else {
      summaryReport += `✅ <b>No errors detected!</b>`;
    }

    await sendDebugReport(summaryReport);
  } catch (error) {
    logger.error("Critical error in ticket availability check:", error);

    await sendDebugReport(
      `🚨 <b>CRITICAL ERROR</b>\n` +
        `❌ Error: ${error}\n` +
        `⏰ Time: ${new Date().toLocaleString()}`
    );
  }
}

cron.schedule("*/30 * * * * *", checkTicketAvailability);

bot.command("check", async (ctx) => {
  if (!ALLOWED_USERS.includes(ctx.from?.id || 0)) {
    await ctx.reply("Bu buyruq faqat admin uchun!");
    return;
  }

  await ctx.reply("Tekshirish boshlanmoqda... ⏳");
  await checkTicketAvailability();
  await ctx.reply("Tekshirish tugadi! ✅");
});

bot.command("debug", async (ctx) => {
  if (ctx.from?.id !== DEBUG_USER) {
    await ctx.reply("Bu buyruq faqat debug user uchun!");
    return;
  }

  const debugInfo =
    `🛠️ <b>Debug Info</b>\n\n` +
    `📅 Check Dates: ${CHECK_DATES.join(", ")}\n` +
    `👥 Allowed Users: ${ALLOWED_USERS.length}\n` +
    `🔧 Debug User: ${DEBUG_USER}\n` +
    `🤖 Bot Status: Active\n` +
    `⏰ Last Check: Every 30 seconds`;

  await ctx.reply(debugInfo, { parse_mode: "HTML" });
});

bot.command("start", Start);
bot.catch(errorHandler);

bot.start({
  onStart: () => {
    logger.info(`https://t.me/${bot.botInfo.username} has been started`);
    logger.info("Ticket monitoring system initialized");
    logger.info(`Monitoring dates: ${CHECK_DATES.join(", ")}`);
    logger.info(`Debug user: ${DEBUG_USER}`);
  },
});

export { bot };
