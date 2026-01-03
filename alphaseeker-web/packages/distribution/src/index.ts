import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { TelegramFormatter } from './formatters/telegram';
import { NewsItem } from '@alphaseeker/shared';

admin.initializeApp();

/**
 * Cloud Function que se dispara cuando se crea una nueva noticia en Firestore.
 */
export const onNewsCreated = functions.firestore
    .document('news/{newsId}')
    .onCreate(async (snapshot, context) => {
        const newsItem = snapshot.data() as NewsItem;
        newsItem.id = snapshot.id; // Asegurar que el ID está presente para el enlace

        console.log(`Procesando nueva noticia para Telegram: ${newsItem.id}`);

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.error('Configuración de Telegram faltante (BOT_TOKEN o CHAT_ID)');
            return;
        }

        try {
            const message = TelegramFormatter.formatMessage(newsItem);
            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

            await axios.post(url, {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: false
            });

            console.log(`Notificación de Telegram enviada con éxito para noticia ${newsItem.id}`);
        } catch (error: any) {
            console.error('Error al enviar mensaje a Telegram:', error.response?.data || error.message);

            // Reintentar si es un error temporal (opcional, GCF ya maneja reintentos si se configura)
            throw error;
        }
    });
