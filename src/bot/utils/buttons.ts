import { Markup } from 'telegraf';

type ButtonItem = { label: string; value?: string | number };

export const buildInlineButtons = (items: any[], cbPrefix: string, columns = 2) => {
  return Markup.inlineKeyboard(
    items.map((item) => Markup.button.callback(item.label, `${cbPrefix}_${item.value}`)),
    { columns },
  );
};

export const buildDisplayButtons = (items: any[], columns = 2) => {
  return Markup.inlineKeyboard(
    items.map((item) => Markup.button.callback(item.label, 'noop')),
    { columns },
  );
};

const toGrid = (buttons: any[], columns: number) => {
  const rows: any[][] = [];
  for (let i = 0; i < buttons.length; i += columns) {
    rows.push(buttons.slice(i, i + columns));
  }
  return rows;
};

export const buildInlineButtonsWithNav = (
  items: ButtonItem[],
  cbPrefix: string,
  columns = 2,
  nav?: { back?: string; cancel?: string },
) => {
  const btns = items.map((item) => Markup.button.callback(item.label, `${cbPrefix}_${item.value}`));
  const rows = toGrid(btns, columns);

  const navRow: any[] = [];
  if (nav?.back) navRow.push(Markup.button.callback('🔙 بازگشت', nav.back));
  if (nav?.cancel) navRow.push(Markup.button.callback('❌ لغو', nav.cancel));
  if (navRow.length) rows.push(navRow);

  return Markup.inlineKeyboard(rows);
};

export const buildDisplayButtonsWithNav = (
  items: ButtonItem[],
  columns = 2,
  nav?: { back?: string; cancel?: string },
) => {
  const btns = items.map((item) => Markup.button.callback(item.label, 'noop'));
  const rows = toGrid(btns, columns);

  const navRow: any[] = [];
  if (nav?.back) navRow.push(Markup.button.callback('🔙 بازگشت', nav.back));
  if (nav?.cancel) navRow.push(Markup.button.callback('❌ لغو', nav.cancel));
  if (navRow.length) rows.push(navRow);

  return Markup.inlineKeyboard(rows);
};
