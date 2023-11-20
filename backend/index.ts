import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { Schema, model, connect } from 'mongoose';
import {InlineKeyboardMarkup, InlineKeyboardButton} from "node-telegram-bot-api";
import localization from "./localization";
import TelegramBot, {
  CallbackGame, ForceReply,
  LoginUrl, ParseMode,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
  WebAppInfo
} from 'node-telegram-bot-api';
import cors from 'cors';
dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN??'' , {polling: true});

const elem : InlineKeyboardButton = {
  text: localization.add,
  callback_data: 'edit'
}
const mark : InlineKeyboardMarkup = {
  inline_keyboard: [[ elem ]]
}
interface IUser {
  name: string;
  email: string;
  avatar?: string;
}

// 2. Create a Schema corresponding to the document interface.
const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  avatar: String
});
const pointSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});

const trashSchemaI = new Schema({
  name: String,
  description: String,
  image: String,
  gps: pointSchema,
  report_by: String,
  date: String
});

const User = model<IUser>('User', userSchema);

async function getTrashes() {

  await connect(process.env.DB_PATH+'/final');
  const Trash = model('Trash', trashSchemaI);
  const trashes = await Trash.find({}).exec();
  return trashes

}

interface SendBasicOptions {
  message_thread_id?: number | undefined;
  disable_notification?: boolean | undefined;
  reply_to_message_id?: number | undefined;
  reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply | undefined;
  protect_content?: boolean | undefined;
  allow_sending_without_reply?: boolean | undefined;
}

interface SendMessageOptions extends SendBasicOptions {
  parse_mode?: ParseMode | undefined;
  disable_web_page_preview?: boolean | undefined;
}

bot.on('message', async (msg, match) => {
  const chatId = msg.chat.id;

  if (msg?.location) {
    console.log(msg.location)
    await createLocation(msg.location.latitude, msg.location.longitude)
    bot.sendMessage(chatId, `локация добавлена ${msg.location.latitude} ${msg.location.longitude}`);
  }

  const options : SendMessageOptions = {
    reply_markup: {
      resize_keyboard: true,
      one_time_keyboard: true,
      keyboard: [
        [elem],
      ],
    },
  };
  bot.sendMessage(chatId, "answer.", options);

});
console.log('Bot started');
bot.on('callback_query', function onCallbackQuery(callbackQuery) {

  const action = callbackQuery.data;
  const msg = callbackQuery.message;
});


app.get('/', cors(), async (req: Request, res: Response) => {

  const trashes = await getTrashes();
  return res.send(trashes);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
