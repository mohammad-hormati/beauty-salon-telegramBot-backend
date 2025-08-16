import { fetchServices } from "../utils/api";
import { buildDisplayButtons } from "../utils/buttons";

export const listServicesAction = async (ctx: any) => {
  const services = await fetchServices();
  if (!services.length) return ctx.reply("❌در حال حاضر هیچ لاین فعالی وجود ندارد.");
  const buttons = buildDisplayButtons(
    services.map((s: any) => ({ label: s.name, value: s.id })),
  );
  ctx.reply("📋  لاین‌های فعال در سالن زیبایی بانو حسینی:", buttons);
};
