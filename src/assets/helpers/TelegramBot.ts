import axios from 'axios';

const TELEGRAM_BOT_TOKEN = '7269166380:AAFr8H6skaXyhkVZlzeZF33Pwgt4GNrYqls';
const TELEGRAM_CHAT_ID = '771292914';

export async function sendLogToTelegramBot(message: string, parse_mode: 'html' | string | any) {
    try {
        return await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            protect_content: true,
            parse_mode
        })
    } catch (error) {
        console.log(error)
    }
};

export async function getChatId() {
    try {
        const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
        const updates = response.data.result;
        if (updates.length > 0) {
            const chatId = updates[0].message.chat.id;
            console.log(`Chat ID: ${chatId}`);
        } else {
            console.log('No messages found.');
        }
    } catch (error) {
        console.error(`Error fetching updates: ${error}`);
    }
}