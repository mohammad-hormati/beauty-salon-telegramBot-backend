import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { clearUserSession, getUserSession } from './utils/session';
import { listServicesAction } from './actions/serviceActions';
import {
  serviceSelectionAction,
  daySelectionAction,
  slotSelectionAction,
  confirmAppointmentAction,
} from './actions/appointmentActions';
import { fetchServices, ensureUserExists, fetchAvailableSlots } from './utils/api';
import { buildInlineButtonsWithNav } from './utils/buttons';
import { nextNDays } from '../utils/dateConverter';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// ---------- Bot commands ----------
bot.start(async (ctx) => {
  const welcomeMsg = `سلام! 👋 به سالن زیبایی بانو حسینی خوش آمدید\nبرای ادامه یکی از گزینه‌های زیر را انتخاب کنید:`;
  await ctx.reply(
    welcomeMsg,
    Markup.inlineKeyboard([
      [Markup.button.callback('📅 دریافت نوبت', 'get_appointment')],
      [Markup.button.callback('💅 مشاهده لاین‌های فعال', 'list_services')],
      [Markup.button.url('📸 نمونه کار', 'https://t.me/banoohoseinii')],
      [Markup.button.callback('📝 مشاوره', 'noop')],
    ]),
  );
});

// ---------- Actions ----------
bot.action('get_appointment', async (ctx) => {
  await ctx.answerCbQuery();
  getUserSession(ctx.from.id).step = 'awaiting_name';

  ctx.reply('✍️ لطفا نام و نام خانوادگی خود را وارد کنید:');
});

bot.action(/service_(\d+)/, serviceSelectionAction);
bot.action(/day_(.+)/, daySelectionAction);
bot.action(/slot_(.+)/, slotSelectionAction);
bot.action(/confirm_(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  await confirmAppointmentAction(ctx);
});

bot.action('list_services', listServicesAction);

// ---------- Cancel ----------
bot.action('cancel_appointment', async (ctx) => {
  await ctx.answerCbQuery();
  clearUserSession(ctx.from.id);
  await ctx.editMessageText('❌ فرآیند نوبت‌گیری لغو شد.\nبرای شروع مجدد /start را بزنید.');
});

// ---------- Back ----------
bot.action('back_to_service', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getUserSession(ctx.from.id);
  session.step = 'awaiting_service';

  const services = await fetchServices();
  if (!services.length) return ctx.reply('❌ در حال حاضر هیچ لاین فعالی وجود ندارد');

  const buttons = buildInlineButtonsWithNav(
    services.map((s: any) => ({ label: s.name, value: s.id })),
    'service',
    2,
    { cancel: 'cancel_appointment' },
  );

  await ctx.editMessageText('📋 لطفا لاین مورد نظر خود را انتخاب کنید:', buttons);
});

bot.action('back_to_day', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getUserSession(ctx.from.id);
  session.step = 'awaiting_day';

  const days = nextNDays(7);
  const buttons = buildInlineButtonsWithNav(
    days.map((d) => ({ label: d.formatted, value: d.date.toISOString() })),
    'day',
    2,
    { back: 'back_to_service', cancel: 'cancel_appointment' },
  );

  await ctx.editMessageText('📅 لطفا روز مورد نظر خود را انتخاب کنید:', buttons);
});

bot.action('back_to_slot', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getUserSession(ctx.from.id);

  if (!session.selectedServiceId || !session.selectedDayIso) {
    return ctx.editMessageText(
      '❌ اطلاعات کافی برای بازگشت به مرحله قبل وجود ندارد.',
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ بازگشت به سرویس', 'back_to_service')],
        [Markup.button.callback('❌ لغو', 'cancel_appointment')],
      ]),
    );
  }

  session.step = 'awaiting_slot';
  const selectedDay = new Date(session.selectedDayIso);

  try {
    const availableSlots = await fetchAvailableSlots(session.selectedServiceId);
    const dayKey = Object.keys(availableSlots).find(
      (key) => new Date(key).toDateString() === selectedDay.toDateString(),
    );

    if (!dayKey || availableSlots[dayKey].length === 0) {
      return ctx.editMessageText(
        'در این روز نوبت آزاد موجود نیست.',
        buildInlineButtonsWithNav([], 'noop', 1, {
          back: 'back_to_day',
          cancel: 'cancel_appointment',
        }),
      );
    }

    const slotButtons = buildInlineButtonsWithNav(
      availableSlots[dayKey].map((iso: string) => {
        const t = new Date(iso);
        return {
          label: t.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          value: iso,
        };
      }),
      'slot',
      2,
      { back: 'back_to_day', cancel: 'cancel_appointment' },
    );

    await ctx.editMessageText('🕒 لطفا ساعت مورد نظر خود را انتخاب کنید:', slotButtons);
  } catch (e) {
    await ctx.editMessageText(
      'خطا در دریافت نوبت‌ها. لطفاً دوباره تلاش کنید.',
      buildInlineButtonsWithNav([], 'noop', 1, {
        back: 'back_to_day',
        cancel: 'cancel_appointment',
      }),
    );
  }
});

bot.action('noop', async (ctx) => await ctx.answerCbQuery());

// ---------- Text handler ----------
bot.on('text', async (ctx) => {
  const { id: userId } = ctx.from;
  const session = getUserSession(userId);

  if (session.step === 'awaiting_name') {
    session.name = ctx.message.text;
    session.step = 'awaiting_phone';
    return ctx.reply('📞 لطفا شماره تلفن خود را وارد کنید:');
  }

  if (session.step === 'awaiting_phone') {
    session.phone = ctx.message.text;

    try {
      if (!session.name || !session.phone) {
        return ctx.reply('❌ نام یا شماره تلفن وارد نشده است. لطفا مجددا تلاش کنید.');
      }
      await ensureUserExists(userId, session.name, session.phone);

      const services = await fetchServices();
      if (!services.length) return ctx.reply('❌ در حال حاضر هیچ لاین فعالی وجود ندارد');

      session.step = 'awaiting_service';
      const buttons = buildInlineButtonsWithNav(
        services.map((s: any) => ({ label: s.name, value: s.id })),
        'service',
        2,
        { cancel: 'cancel_appointment' },
      );
      return ctx.reply('📋 لطفا لاین مورد نظر خود را انتخاب کنید:', buttons);
    } catch (err) {
      console.error(err);
      return ctx.reply('❌ خطا در ثبت یا بررسی اطلاعات کاربر');
    }
  }
});

export default bot;
