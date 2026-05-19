# src/main.py
import telebot

# --- НАСТРОЙКИ БОТА ---
# ВНИМАНИЕ: Для реального запуска замените 'YOUR_BOT_TOKEN_HERE' 
# на настоящий токен, который выдаст @BotFather в Telegram.
TOKEN = 'YOUR_BOT_TOKEN_HERE'
bot = telebot.TeleBot(TOKEN)

# --- ОБРАБОТЧИК КОМАНД /start и /help ---
@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    welcome_text = (
        "🎓 Привет! Я умный ассистент проекта **SmartCampus**.\n\n"
        "Я могу помочь тебе найти нужную аудиторию или узнать расписание. "
        "Просто напиши мне свой вопрос в свободной форме!"
    )
    bot.reply_to(message, welcome_text)

# --- ОБРАБОТЧИК ТЕКСТОВЫХ СООБЩЕНИЙ (ПРОТОТИП LLM) ---
@bot.message_handler(func=lambda message: True)
def handle_message(message):
    user_text = message.text.lower()
    
    # Имитация работы LLM (в финальной версии здесь будет API запрос к нейросети)
    if "расписание" in user_text:
        answer = (
            "📅 **Расписание на сегодня:**\n"
            "1. 09:00 - Основы программирования (Ауд. 205)\n"
            "2. 10:40 - Высшая математика (Ауд. 301)\n"
            "3. 12:20 - Базы данных (Ауд. 210)"
        )
    elif "где" in user_text or "аудитори" in user_text:
        answer = (
            "🗺️ **Поиск аудитории:**\n"
            "Аудитории, начинающиеся на '2' (например, 205, 210), находятся на втором этаже Главного корпуса. "
            "Чтобы посмотреть маршрут, перейдите на наш сайт SmartCampus!"
        )
    elif "привет" in user_text:
        answer = "Здравствуйте! Чем могу помочь по кампусу сегодня?"
    else:
        answer = (
            "🤖 *Генерация ответа LLM...*\n"
            "Интересный вопрос! В данной демо-версии я настроен только на базовые вопросы по расписанию и аудиториям. "
            "В полной версии я проанализирую ваш запрос с помощью нейросети и выдам точный ответ!"
        )
    
    bot.reply_to(message, answer)

if __name__ == '__main__':
    print("🚀 Бот SmartCampus успешно запущен. Нажмите Ctrl+C для остановки.")
    # Запуск бесконечного цикла обработки сообщений
    bot.infinity_polling()