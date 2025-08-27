import { buildInlineButtonsWithNav } from '../utils/buttons';
import { getUserSession, clearUserSession } from '../utils/session';
import { fetchAvailableSlots, createAppointment } from '../utils/api';
import { nextNDays } from '../../utils/dateConverter';
import { prisma } from '../../app';
import { Markup } from 'telegraf';

export const serviceSelectionAction = async (ctx: any) => {
  const serviceId = Number(ctx.match[1]);
  const session = getUserSession(ctx.from.id);
  session.selectedServiceId = serviceId;
  session.step = 'awaiting_day';

  const days = nextNDays(7);
  const buttons = buildInlineButtonsWithNav(
    days.map((d) => ({ label: d.formatted, value: d.date.toISOString() })),
    'day',
    2,
    { back: 'back_to_service', cancel: 'cancel_appointment' },
  );
  ctx.editMessageText('📅 لطفا روز مورد نظر خود را انتخاب کنید:', buttons);
};

export const daySelectionAction = async (ctx: any) => {
  const selectedDayIso = ctx.match[1];
  const selectedDay = new Date(selectedDayIso);
  const session = getUserSession(ctx.from.id);
  session.selectedDayIso = selectedDayIso;
  session.step = 'awaiting_slot';

  try {
    const availableSlots = await fetchAvailableSlots(session.selectedServiceId!);
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

    ctx.editMessageText('🕒 لطفا ساعت مورد نظر خود را انتخاب کنید:', slotButtons);
  } catch {
    ctx.reply('خطا در دریافت نوبت‌ها');
  }
};

export const slotSelectionAction = async (ctx: any) => {
  const slotIso = ctx.match[1];
  const session = getUserSession(ctx.from.id);

  const startDate = new Date(slotIso);
  if (isNaN(startDate.getTime())) {
    return ctx.reply('❌ تاریخ یا زمان انتخاب شده معتبر نیست');
  }

  try {
    const service = await prisma.service.findUnique({
      where: { id: session.selectedServiceId! },
    });
    if (!service) {
      return ctx.reply('❌ سرویس انتخابی معتبر نیست');
    }

    const endDate = new Date(startDate.getTime() + service.durationMin * 60000);
    session.selectedSlot = { startDate, endDate };
    session.step = 'awaiting_confirmation';

    const serviceName = service.name;

    const buttons = buildInlineButtonsWithNav([{ label: '✅ تایید نهایی نوبت', value: 'yes' }], 'confirm', 2, {
      back: 'back_to_slot',
      cancel: 'cancel_appointment',
    });

    ctx.editMessageText(
      `🔎 لطفاً اطلاعات زیر را بررسی کنید:\n\n` +
        `👤 نام: ${session.name || 'نام ثبت نشده'}\n` +
        `📞 شماره: ${session.phone || 'ثبت نشده'}\n` +
        `💅 لاین: ${serviceName}\n` +
        `🗓  تاریخ: ${new Intl.DateTimeFormat('fa-IR').format(startDate)}\n` +
        `🕒  زمان: ${startDate.toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit' })} تا ${endDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}\n\n` +
        `در صورت تایید، دکمه زیر را بزنید.`,
      buttons,
    );
  } catch {
    ctx.reply('خطا در انتخاب نوبت');
  }
};

export const confirmAppointmentAction = async (ctx: any) => {
  const session = getUserSession(ctx.from.id);

  if (!session.selectedSlot || !session.selectedServiceId) {
    return ctx.reply('❌ اطلاعات انتخابی شما معتبر نیست. لطفا دوباره تلاش کنید.');
  }

  const { startDate, endDate } = session.selectedSlot;

  try {
    await createAppointment(
      ctx.from.id,
      session.name || 'نام ثبت نشده',
      session.phone || '',
      session.selectedServiceId,
      startDate,
      endDate,
    );

    ctx.reply(`🎉 نوبت شما با موفقیت ثبت شد!`);

    clearUserSession(ctx.from.id);
  } catch (err) {
    console.error('DB Error:', err);
    ctx.reply('⚠️ خطا در ثبت اطلاعات، لطفا دوباره تلاش کنید');
  }
};

export const myAppointmentsAction = async (ctx: any) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { user: { telegramId: String(ctx.from.id) } },
      include: { service: true },
      orderBy: { startDate: 'asc' },
    });

    if (!appointments.length) {
      return ctx.reply('📭 شما هیچ نوبت فعالی ندارید.');
    }

    for (const app of appointments) {
      const start = new Date(app.startDate);
      const end = new Date(app.endDate);

      await ctx.reply(
        `📝 نوبت شما:\n` +
          `💅 لاین: ${app.service?.name}\n` +
          `📅 تاریخ: ${new Intl.DateTimeFormat('fa-IR').format(start)}\n` +
          `🕒 ساعت: ${start.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })} تا ${end.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
        Markup.inlineKeyboard([[Markup.button.callback('❌ لغو نوبت', `cancel_appointment_${app.id}`)]]),
      );
    }
  } catch (err) {
    console.error(err);
    ctx.reply('⚠️ خطا در دریافت نوبت‌های شما.');
  }
};

export const cancelAppointmentByIdAction = async (ctx: any) => {
  const appointmentId = Number(ctx.match[1]);
  try {
    const deleted = await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    await ctx.editMessageText(
      `❌ نوبت شما در تاریخ ${new Intl.DateTimeFormat('fa-IR').format(deleted.startDate)} لغو شد.`,
    );
  } catch (err) {
    console.error(err);
    ctx.reply('⚠️ خطا در لغو نوبت.');
  }
};
