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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = require("mongoose");
const localization_1 = __importDefault(require("./localization"));
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const cors_1 = __importDefault(require("cors"));
const types_1 = require("./types");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const botToken = process.env.TELEGRAM_TOKEN;
const bot = new node_telegram_bot_api_1.default(botToken !== null && botToken !== void 0 ? botToken : '', { polling: true });
const userStates = {};
const userNewData = {};
function updateUserState(userId, newState) {
    userStates[userId] = newState;
}
function getUserState(userId) {
    return userStates[userId] || types_1.UserState.WELCOME;
}
const elem = {
    text: localization_1.default.add,
    callback_data: 'add_location'
};
const mark = {
    inline_keyboard: [[elem]]
};
const pointSchema = new mongoose_1.Schema({
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
const trashSchema = new mongoose_1.Schema({
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
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        // const msg = callbackQuery.message;
        console.log(callbackQuery.data);
        const chatId = callbackQuery.from.id;
        if (callbackQuery.data === 'add_location') {
            // set UserState to AWAITING NAME
            updateUserState(chatId, types_1.UserState.AWAITING_NAME);
            yield bot.sendMessage(chatId, localization_1.default.input_name);
        }
    });
});
bot.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = msg.chat.id; //TODO: check
    // Проверяем состояние пользователя
    const currentState = getUserState(chatId);
    // console.log(JSON.stringify(userStates));
    switch (currentState) {
        case types_1.UserState.WELCOME:
            // console.log('WELCOME')
            const options = {
                reply_markup: mark
            };
            // Приветствуем пользователя
            yield bot.sendMessage(chatId, localization_1.default.welcome);
            yield bot.sendMessage(chatId, localization_1.default.welcome2 + process.env.WEBSITE_URL, options);
            break;
        case types_1.UserState.AWAITING_NAME:
            console.log('AWAITING_NAME');
            if (!userNewData[chatId]) {
                userNewData[chatId] = {}; // Инициализация пустым объектом, если ранее не существовал
            }
            userNewData[chatId] = Object.assign(userNewData[chatId], { name: msg.text });
            // Сохраняем имя и переходим к следующему шагу
            updateUserState(chatId, types_1.UserState.AWAITING_DESCRIPTION);
            yield bot.sendMessage(chatId, localization_1.default.input_description);
            break;
        case types_1.UserState.AWAITING_DESCRIPTION:
            // Схожая логика для описания
            if (!userNewData[chatId]) {
                userNewData[chatId] = {}; // Инициализация пустым объектом, если ранее не существовал
            }
            userNewData[chatId] = Object.assign(userNewData[chatId], { description: msg.text });
            updateUserState(chatId, types_1.UserState.AWAITING_PHOTO);
            yield bot.sendMessage(chatId, localization_1.default.input_photo);
            break;
        case types_1.UserState.AWAITING_PHOTO:
            // Обработка фото
            if (!userNewData[chatId]) {
                userNewData[chatId] = {}; // Инициализация пустым объектом, если ранее не существовал
            }
            if (msg.photo) {
                const photoArray = msg.photo;
                const photo = photoArray[photoArray.length - 1]; // Берем самую большую версию
                const fileId = photo.file_id;
                userNewData[chatId] = Object.assign(userNewData[chatId], { photo: [fileId] });
                updateUserState(chatId, types_1.UserState.AWAITING_LOCATION); // TODO: добавить сообщение
            }
            else {
                yield bot.sendMessage(chatId, localization_1.default.photo_not_found);
            }
            // Сохраняем фото и переходим к следующему шагу
            break;
        case types_1.UserState.AWAITING_LOCATION:
            if (msg.location) {
                // Обрабатываем и сохраняем локацию
                updateUserState(chatId, types_1.UserState.COMPLETED);
            }
            if (msg.photo) {
                console.log('eщё одно фото c');
                const photoArray = msg.photo;
                const photo = photoArray[photoArray.length - 1]; // Берем самую большую версию
                const fileId = photo.file_id;
                userNewData[chatId] = Object.assign(userNewData[chatId], { photo: [fileId] });
            }
            console.log('ZAVERSHENO LETS LOOK');
            console.log(userNewData[chatId]);
            break;
        case types_1.UserState.COMPLETED:
            // bot.getFile(fileId).then(file => {
            //   const filePath = file.file_path;
            //   const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
            //
            //   // Теперь у вас есть URL файла, который можно использовать
            //   console.log(fileUrl);
            //
            // });
            // Процесс завершен
            break;
        default:
            // Начальное состояние или ошибка
            updateUserState(chatId, types_1.UserState.WELCOME);
            break;
    }
}));
console.log('Bot started');
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const msg = callbackQuery.message;
});
app.get('/', (0, cors_1.default)(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const trashes = yield getTrashes();
    return res.send(trashes);
}));
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
