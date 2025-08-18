import { buildInlineButtons } from "../utils/buttons";
import { getUserSession, clearUserSession } from "../utils/session";
import { fetchAvailableSlots, createAppointment } from "../utils/api";
import { nextNDays } from "../../utils/dateConverter";
import { prisma } from "../../app";

export const serviceSelectionAction = async (ctx: any) => {
  const serviceId = Number(ctx.match[1]);
  const session = getUserSession(ctx.from.id);
  session.selectedServiceId = serviceId;

  const days = nextNDays(7);
  const buttons = buildInlineButtons(
    days.map((d) => ({ label: d.formatted, value: d.date.toISOString() })),
    "day"
  );
  ctx.editMessageText("لطفا روز مورد نظر خود را انتخاب کنید:", buttons);
};

export const daySelectionAction = async (ctx: any) => {
  const selectedDayIso = ctx.match[1];
  const selectedDay = new Date(selectedDayIso);
  const session = getUserSession(ctx.from.id);

  try {
    const availableSlots = await fetchAvailableSlots(session.selectedServiceId);
    const dayKey = Object.keys(availableSlots).find((key) =>
      new Date(key).toDateString() === selectedDay.toDateString()
    );

    if (!dayKey || availableSlots[dayKey].length === 0) {
      return ctx.reply("در این روز نوبت آزاد موجود نیست.");
    }

    const slotButtons = buildInlineButtons(
      availableSlots[dayKey].map((iso: string) => {
        const t = new Date(iso);
        return {
          label: t.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
          value: iso,
        };
      }),
      "slot",
      3
    );

    ctx.editMessageText("لطفا زمان مورد نظر را انتخاب کنید:", slotButtons);
  } catch {
    ctx.reply("خطا در دریافت نوبت‌ها");
  }
};

export const slotSelectionAction = async (ctx: any) => {
  const slotIso = ctx.match[1];
  const session = getUserSession(ctx.from.id);

  const startDate = new Date(slotIso);
  if (isNaN(startDate.getTime())) {
    return ctx.reply("❌ تاریخ یا زمان انتخاب شده معتبر نیست");
  }

  try {
    // گرفتن مدت زمان سرویس انتخابی از session یا دیتابیس
    const service = await prisma.service.findUnique({
      where: { id: session.selectedServiceId },
    });
    if (!service) {
      return ctx.reply("❌ سرویس انتخابی معتبر نیست");
    }

    const endDate = new Date(startDate.getTime() + service.durationMin * 60000);

    await createAppointment(
      ctx.from.id,
      session.name,
      session.phone,
      session.selectedServiceId,
      startDate,
      endDate
    );

    ctx.reply(
      `🎉 نوبت شما با موفقیت ثبت شد!\n` +
        `🗓 تاریخ و زمان: ${startDate.toLocaleString("fa-IR")} تا ${endDate.toLocaleTimeString("fa-IR")}\n` +
        `👤 نام: ${session.name || "نام ثبت نشده"}\n📞 شماره: ${session.phone || "ثبت نشده"}`
    );

    clearUserSession(ctx.from.id);
  } catch (err) {
    console.error("DB Error:", err);
    ctx.reply("خطا در ثبت اطلاعات، لطفا دوباره تلاش کنید");
  }
};

