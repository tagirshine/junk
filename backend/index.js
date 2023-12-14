"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = require("mongoose");
const localization_1 = __importDefault(require("./localization"));
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const bot = new node_telegram_bot_api_1.default((_a = process.env.TELEGRAM_TOKEN) !== null && _a !== void 0 ? _a : '', { polling: true });
// import {InlineKeyboardMarkup, InlineKeyboardButton} from './types';
const elem = {
    text: localization_1.default.add,
    callback_data: 'edit'
};
const mark = {
    inline_keyboard: [[elem]]
};
const pointSchema = new mongoose_1.Schema({
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
const trashSchema = new mongoose_1.Schema({
    // @ts-ignore
    name: String, description: String, image: String, gps: pointSchema, report_by: String, date: String,
});
function createLocation(lat, lon) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('create location');
        yield (0, mongoose_1.connect)('mongodb://finalUser:password@127.0.0.1:27017/final');
        const TrashModel = (0, mongoose_1.model)('Trash', trashSchema);
        const trashDocument = new TrashModel({
            name: 'name',
            description: 'descr',
            image: 'image1',
            gps: { type: "Point", coordinates: [lat, lon] },
            report_by: 'alladin2',
            date: '2022-01-01'
        });
        yield trashDocument.save();
    });
}
function getTrashes() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, mongoose_1.connect)('mongodb://finalUser:password@127.0.0.1:27017/final');
        const Trash = (0, mongoose_1.model)('Trash', trashSchema);
        return yield Trash.find({}).exec();
    });
}
bot.on('message', (msg /*, match*/) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = msg.chat.id;
    if (msg.text === localization_1.default.add) {
        console.log('measo');
    }
    if (msg === null || msg === void 0 ? void 0 : msg.location) {
        console.log(msg.location);
        yield createLocation(msg.location.latitude, msg.location.longitude);
        console.log('локация добавленна');
        bot.sendMessage(chatId, `локация добавленна ${msg.location.latitude} ${msg.location.longitude}`);
    }
    const options = {
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
}));
console.log('Bot started');
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    // const opts = {
    //   chat_id: msg.chat.id,
    //   message_id: msg.message_id,
    // };
    console.log(msg);
    console.log('smtng');
    // if (action === '1') {
    //   text = 'You hit button 1';
    // }
    // bot.editMessageText(text, opts);
    // console.log
});
app.get('/', (0, cors_1.default)(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const trashes = yield getTrashes();
    return res.send(trashes);
}));
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
