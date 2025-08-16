import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import { getUserSession } from "./utils/session";
import { listServicesAction } from "./actions/serviceActions";
import { serviceSelectionAction, daySelectionAction, slotSelectionAction } from "./actions/appointmentActions";
import { fetchServices, ensureUserExists } from "./utils/api";
import { buildInlineButtons } from "./utils/buttons";

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// ---------- Bot commands ----------
bot.start(async (ctx) => {
  const welcomeMsg = `سلام! 👋 به سالن زیبایی بانو حسینی خوش آمدید\nبرای ادامه یکی از گزینه‌های زیر را انتخاب کنید:`;
  await ctx.reply(
    welcomeMsg,
    Markup.inlineKeyboard([
      [Markup.button.callback("📅 دریافت نوبت", "get_appointment")],
      [Markup.button.callback("📋 مشاهده لاین‌های فعال", "list_services")],
      [Markup.button.url("📸 نمونه کار", "https://t.me/banoohoseinii")],
      [Markup.button.callback("📝 مشاوره", "noop")],
    ])
  );
});

// ---------- Actions ----------
bot.action("get_appointment", async (ctx) => {
  await ctx.answerCbQuery();
  getUserSession(ctx.from.id).step = "awaiting_name";
  ctx.reply("لطفا نام و نام خانوادگی خود را به فارسی وارد کنید:");
});
bot.action(/service_(\d+)/, serviceSelectionAction);
bot.action(/day_(.+)/, daySelectionAction);
bot.action(/slot_(.+)/, slotSelectionAction);
bot.action("list_services", listServicesAction);
bot.action("noop", async (ctx) => await ctx.answerCbQuery());


// ---------- Text handler ----------
bot.on("text", async (ctx) => {
  const { id: userId } = ctx.from;
  const session = getUserSession(userId);

  if (session.step === "awaiting_name") {
    session.name = ctx.message.text;
    session.step = "awaiting_phone";
    return ctx.reply("شماره تلفن خود را وارد کنید:");
  }

  if (session.step === "awaiting_phone") {
    session.phone = ctx.message.text;

    try {
      await ensureUserExists(userId, session.name, session.phone);

      const services = await fetchServices();
      if (!services.length) return ctx.reply("❌ در حال حاضر هیچ لاین فعالی وجود ندارد");

      session.step = "awaiting_service";
      const buttons = buildInlineButtons(
        services.map((s: any) => ({ label: s.name, value: s.id })),
        "service"
      );
      return ctx.reply("📋 لاین مورد نظر خود را انتخاب کنید:", buttons);
    } catch (err) {
      console.error(err);
      return ctx.reply("❌ خطا در ثبت یا بررسی اطلاعات کاربر");
    }
  }
});

export default bot;
