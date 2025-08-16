import { Markup } from "telegraf";

export const buildInlineButtons = (items: any[], cbPrefix: string, columns = 2) => {
  return Markup.inlineKeyboard(
    items.map((item) => Markup.button.callback(item.label, `${cbPrefix}_${item.value}`)),
    { columns }
  );
};

export const buildDisplayButtons = (items: any[], columns = 2) => {
  return Markup.inlineKeyboard(
    items.map((item) => Markup.button.callback(item.label, "noop")),
    { columns }
  );
};
