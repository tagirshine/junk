import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { Schema, model, connect, Document } from 'mongoose';
import {InlineKeyboardMarkup, InlineKeyboardButton} from "node-telegram-bot-api";
import localization from "./localization";
import TelegramBot, {
   ForceReply,
   ParseMode,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from 'node-telegram-bot-api';
import cors from 'cors';
import { UserState, UserStates , UserNewData} from './types';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN??'' , {polling: true});



const userStates : UserStates = {};
const userNewData : UserNewData = {};

function updateUserState(userId: number, newState: UserState): void {
  userStates[userId] = newState;
}

function getUserState(userId: number): UserState {
  return userStates[userId] || UserState.WELCOME;
}




const elem : InlineKeyboardButton = {
  text: localization.add,
  callback_data: 'add_location'
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
    type: String,
    enum: ['Point'],
    required: true,
  },

  coordinates: {
    type: [Number],
    required: true,
  },
});


const trashSchema = new Schema<Trash>({
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

bot.on('callback_query', async function onCallbackQuery(callbackQuery : any) {
  // const msg = callbackQuery.message;
  console.log(callbackQuery.data)
  const chatId = callbackQuery.from.id;
  if (callbackQuery.data==='add_location') {
    // set UserState to AWAITING NAME
    updateUserState(chatId, UserState.AWAITING_NAME);
    await bot.sendMessage(chatId, localization.input_name);
  }
});

bot.on('message', async (msg: TelegramBot.Message) => {
  const chatId: number  = msg.chat.id; //TODO: check

  // console.log(msg)


  // Проверяем состояние пользователя
  const currentState = getUserState(chatId);
  // console.log(JSON.stringify(userStates));
  switch (currentState) {
    case UserState.WELCOME:
      // console.log('WELCOME')

      const options : SendMessageOptions = { //ReplyKeyboardMarkup
        reply_markup: mark
      };
      // Приветствуем пользователя
      await bot.sendMessage(chatId, localization.welcome);
      await bot.sendMessage(chatId, localization.welcome2+process.env.WEBSITE_URL, options);
      break;
    case UserState.AWAITING_NAME:
      console.log('AWAITING_NAME')

      if (!userNewData[chatId]) {
        userNewData[chatId] = {}; // Инициализация пустым объектом, если ранее не существовал
      }
      userNewData[chatId] = Object.assign( userNewData[chatId] , {name: msg.text} )


      // Сохраняем имя и переходим к следующему шагу
      updateUserState(chatId, UserState.AWAITING_DESCRIPTION);
      await bot.sendMessage(chatId, localization.input_description);
      break;
    case UserState.AWAITING_DESCRIPTION:

      // Схожая логика для описания
      if (!userNewData[chatId]) {
        userNewData[chatId] = {}; // Инициализация пустым объектом, если ранее не существовал
      }
      userNewData[chatId] = Object.assign( userNewData[chatId] , {description: msg.text} )
      updateUserState(chatId, UserState.AWAITING_PHOTO);
      await bot.sendMessage(chatId, localization.input_photo);

      break;
    case UserState.AWAITING_PHOTO:
      // Обработка фото
      if (!userNewData[chatId]) {
        userNewData[chatId] = {}; // Инициализация пустым объектом, если ранее не существовал
      }

      if (msg.photo) {
        const photoArray = msg.photo;
        const photo = photoArray[photoArray.length - 1]; // Берем самую большую версию
        const fileId = photo.file_id;

        console.log(photo)
        // Теперь fileId можно использовать для получения файла фотографии
      } else {
        await bot.sendMessage(chatId, localization.photo_not_found);
      }

      // Сохраняем фото и переходим к следующему шагу
      break;
    case UserState.AWAITING_LOCATION:
      if (msg.location) {
        // Обрабатываем и сохраняем локацию
        updateUserState(chatId, UserState.COMPLETED);
      }
      break;
    case UserState.COMPLETED:
      // Процесс завершен
      break;
    default:
      // Начальное состояние или ошибка
      updateUserState(chatId, UserState.AWAITING_NAME);
      break;
  }
});



console.log('Bot started');
bot.on('callback_query', function onCallbackQuery(callbackQuery : any) {

  const msg = callbackQuery.message;
});


app.get('/', cors(), async (req: Request, res: Response) => {
  const trashes = await getTrashes();
  return res.send(trashes);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
