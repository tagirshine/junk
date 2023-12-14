import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { Schema, model, connect, Document } from 'mongoose';
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


// import {InlineKeyboardMarkup, InlineKeyboardButton} from './types';

const elem : InlineKeyboardButton = {
  text: localization.add,
  callback_data: 'edit'
}
const mark : InlineKeyboardMarkup = {
  inline_keyboard: [[ elem ]]
}


interface Point {
  type: 'Point';
  coordinates: [number, number];
}

interface Trash extends Document {
  name: string;
  description: string;
  image: string;
  gps: Point;
  report_by: string;
  date: string;
}

const pointSchema = new Schema<Point>({
  type: {
// @ts-ignore
    type: String,
    enum: ['Point'],
    required: true,
  },
// @ts-ignore

  coordinates: {
// @ts-ignore
    type: [Number],
    required: true,
  },
});


// @ts-ignore
const trashSchema = new Schema<Trash>({
// @ts-ignore
  name: String, description: String,   image: String,  gps: pointSchema,  report_by: String,  date: String,
});


async function createLocation(lat: number, lon: number) : Promise<void> {
  console.log('create location')
  await connect('mongodb://finalUser:password@127.0.0.1:27017/final');
  const TrashModel = model<Trash>('Trash', trashSchema);
  const trashDocument = new TrashModel({
    name: 'name',
    description: 'descr',
    image: 'image1',
    gps: { type: "Point", coordinates: [ lat, lon ] },
    report_by: 'alladin2',
    date: '2022-01-01'
  });

  await trashDocument.save();
}

async function getTrashes() {
  await  connect('mongodb://finalUser:password@127.0.0.1:27017/final');
  const Trash = model('Trash', trashSchema);
  return await Trash.find({}).exec();
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




bot.on('message', async (msg: any /*, match*/) : Promise<void>  => {
  const chatId = msg.chat.id;

  if (msg.text === localization.add) {
    console.log('measo')
  }

  if (msg?.location) {
    console.log(msg.location)
    await createLocation(msg.location.latitude, msg.location.longitude)
    console.log('локация добавленна')
    bot.sendMessage(chatId, `локация добавленна ${msg.location.latitude} ${msg.location.longitude}`);
  }

  const options : SendMessageOptions = { //ReplyKeyboardMarkup
    reply_markup: {
      resize_keyboard: true,
      one_time_keyboard: true,
      keyboard: [
        [elem],
        // [elem]
      ],
    },
    };
  // console.log('send mes');
  bot.sendMessage(chatId, "Спасибо за участие!", options);

});
console.log('Bot started');
bot.on('callback_query', function onCallbackQuery(callbackQuery : any) {

  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  // const opts = {
  //   chat_id: msg.chat.id,
  //   message_id: msg.message_id,
  // };
  console.log(msg)
  console.log('smtng')
  // if (action === '1') {
  //   text = 'You hit button 1';
  // }

  // bot.editMessageText(text, opts);
  // console.log
});




app.get('/', cors(), async (req: Request, res: Response) => {

  const trashes = await getTrashes();
  return res.send(trashes);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
