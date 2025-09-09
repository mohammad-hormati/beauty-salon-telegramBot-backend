import app from './app.js';
import dotenv from 'dotenv';
import bot from './bot/bot.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  bot
    .launch()
    .then(() => console.log('🤖 Telegram bot started'))
    .catch((err) => console.error('Failed to start bot:', err));
});
