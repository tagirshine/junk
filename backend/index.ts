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
import axios from 'axios';
import fs from 'fs';
dotenv.config();
const app: Express = express();
const port = process.env.PORT;
const mongoToken: string = process.env.MONGO_TOKEN ?? '';

const botToken = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(botToken??'' , {polling: true});

const userStates : UserStates = {};
const userNewData : UserNewData = {}
const imagesRootUrl = process.env.IMAGES_ROOT_URL ?? './images/';
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

const options : SendMessageOptions = { //ReplyKeyboardMarkup
  reply_markup: mark
};

interface Point {
  type: 'Point';
  coordinates: [number, number];
}

interface Trash extends Document {
  name: string;
  description: string;
  images: string[];
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
  name: String, description: String,   images: [String],  gps: pointSchema,  report_by: String,  date: String,
});

async function downloadFile (fileId: string) : Promise<any> {
  const filePath = await bot.getFile(fileId).then(file => {
    const filePath = file.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;


    //   // Теперь у вас есть URL файла, который можно использовать
    //   console.log(fileUrl);
    return fileUrl;
  });

  filePath && console.log(filePath, 'filePath')

  const result = await axios({
    method: 'get',
    url: filePath,
    responseType: 'stream',
  }).then(response => {
    return new Promise<boolean>((resolve, reject) => {

      const outputLocationPath = imagesRootUrl+fileId+'.jpg';
      const writer = fs.createWriteStream(outputLocationPath);

      response.data.pipe(writer);


      let error: any = null;
      writer.on('error', err => {
        console.log('ошибка во время записи файла')

        error = err;

        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) {
          console.log('файл записан ')
          console.log(outputLocationPath)
          resolve(true);

        }
      });
    })
  })


  if (result) {
    return fileId+'.jpg';
  }
}


async function createLocation(chatId: number) :  Promise<void> {//  Promise<void> {
  console.log('create location')

  // save pictures first
  const photos = userNewData[chatId].photo

  const picturesPaths = await Promise.all(photos.map(async (photoId: string) => {
    return await downloadFile(photoId);
  }));



  console.log(picturesPaths, 'picturesPaths')

  await connect(mongoToken);
  const TrashModel = model<Trash>('Trash', trashSchema);


  const data = userNewData[chatId];
  const trashDocument = new TrashModel({
    name: data.name,
    description: data.description,

    images: picturesPaths,

    gps: { type: "Point", coordinates: data.location },
    report_by: 'defaultUser', // TODO: add user
    date: new Date().toISOString(),
  });
  await trashDocument.save();

  updateUserState(chatId, UserState.COMPLETED);
}


async function deleteAllTrashes() {
  try {
    await connect(mongoToken);
    const TrashModel = model<Trash>('Trash', trashSchema);

    await TrashModel.deleteMany({}); // Удаление всех документов

    console.log('Все документы успешно удалены');
  } catch (error) {
    console.error('Ошибка при удалении документов:', error);
  }
}

async function getTrashes() {
  await  connect(mongoToken);
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
  // console.log(callbackQuery.data)
  const chatId = callbackQuery.from.id;
  if (callbackQuery.data==='add_location') {
    // set UserState to AWAITING NAME
    updateUserState(chatId, UserState.AWAITING_NAME);
    await bot.sendMessage(chatId, localization.input_name);
  }
});

bot.on('message', async (msg: TelegramBot.Message) => {

  console.log('any message --------------------!')
  const chatId: number  = msg.chat.id; //TODO: check

  const currentState = getUserState(chatId);
  console.log('chatId', chatId)
  console.log(currentState, 'currentState')
  switch (currentState) {
    case UserState.WELCOME:
      // console.log('WELCOME')
      // Приветствуем пользователя
      await bot.sendMessage(chatId, localization.welcome);
      await bot.sendMessage(chatId, localization.welcome2+process.env.WEBSITE_URL, options);
      break;
    case UserState.AWAITING_NAME:
      // console.log('AWAITING_NAME')

      if (!userNewData[chatId]) {
        userNewData[chatId] = {photo: []}; // Инициализация пустым объектом, если ранее не существовал
      }
      userNewData[chatId] = Object.assign( userNewData[chatId] , {name: msg.text} )


      // Сохраняем имя и переходим к следующему шагу
      updateUserState(chatId, UserState.AWAITING_DESCRIPTION);
      await bot.sendMessage(chatId, localization.input_description);
      break;
    case UserState.AWAITING_DESCRIPTION:
      if (!userNewData[chatId]) {
        userNewData[chatId] = {photo: []}; // Инициализация пустым объектом, если ранее не существовал
      }
      userNewData[chatId] = Object.assign( userNewData[chatId] , {description: msg.text} )
      updateUserState(chatId, UserState.AWAITING_PHOTO);
      await bot.sendMessage(chatId, localization.input_photo);

      break;
    case UserState.AWAITING_PHOTO:
      // Обработка фото
      if (!userNewData[chatId]) {
        userNewData[chatId] = {photo:[]};
      }

      if (msg.photo) {

        console.log('фото пришлО! ')
        const photoArray = msg.photo;
        const photo = photoArray[photoArray.length - 1]; // Берем самую большую версию
        const fileId = photo.file_id;

        userNewData[chatId] = Object.assign( userNewData[chatId] , {photo: [fileId]} )

        updateUserState(chatId, UserState.AWAITING_LOCATION);
        await bot.sendMessage(chatId, localization.input_location);
      } else {
        await bot.sendMessage(chatId, localization.photo_not_found);
      }

      // Сохраняем фото и переходим к следующему шагу
      break;
    case UserState.AWAITING_LOCATION:

      console.log('AWAITING_LOCATION')
      if (msg.location) {

        // Обрабатываем и сохраняем локацию
        userNewData[chatId] = Object.assign( userNewData[chatId] , {location: [msg.location.latitude, msg.location.longitude]} );
        await bot.sendMessage(chatId, localization.final_message);
        await bot.sendMessage(chatId, localization.final_message2+process.env.WEBSITE_URL);
        await createLocation(chatId);


      }
      if (msg.photo && userNewData[chatId] && userNewData[chatId].photo) {
        console.log('eщё одно фото c')
        const photoArray = msg.photo;
        const photo = photoArray[photoArray.length - 1]; // Берем самую большую версию
        const fileId = photo.file_id;
        userNewData[chatId].photo.push(fileId)
        // userNewData[chatId] = Object.assign( userNewData[chatId] , {photo: [fileId]} )
      }

      // console.log(userNewData[chatId])

      break;
    case UserState.COMPLETED:

      console.log('COMPLETED state messafge')
      userNewData[chatId] = {photo: []};

      updateUserState(chatId, UserState.WELCOME);
      bot.sendMessage(chatId, localization.welcome, options);
      break;
    default:
      // catch errors?
      console.log('default state message')
      break;
  }
});



console.log('Bot started');
bot.on('callback_query', function onCallbackQuery(callbackQuery : any) {

  const msg = callbackQuery.message;
});


app.get('/', cors(), async (req: Request, res: Response) => {
  const trashes = await getTrashes();

  res.header('Access-Control-Allow-Origin', '*'); // Change * to a specific origin if needed
  return res.send(trashes);
});

app.get('/wkakwdkawkdkawkdkawkdkawkdkawd', cors(), async (req: Request, res: Response) => {
  const trashes = await deleteAllTrashes();
  res.header('Access-Control-Allow-Origin', '*'); // Change * to a specific origin if needed
  return res.send(trashes);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
