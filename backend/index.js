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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = require("mongoose");
const localization_1 = __importDefault(require("./localization"));
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const cors_1 = __importDefault(require("cors"));
const types_1 = require("./types");
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const mongoToken = (_a = process.env.MONGO_TOKEN) !== null && _a !== void 0 ? _a : '';
const botToken = process.env.TELEGRAM_TOKEN;
const bot = new node_telegram_bot_api_1.default(botToken !== null && botToken !== void 0 ? botToken : '', { polling: true });
const userStates = {};
const userNewData = {};
const imagesRootUrl = (_b = process.env.IMAGES_ROOT_URL) !== null && _b !== void 0 ? _b : './images/';
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
const options = {
    reply_markup: mark
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
    name: String, description: String, images: [String], gps: pointSchema, report_by: String, date: String,
});
function downloadFile(fileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const filePath = yield bot.getFile(fileId).then(file => {
            const filePath = file.file_path;
            const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
            //   // Теперь у вас есть URL файла, который можно использовать
            //   console.log(fileUrl);
            return fileUrl;
        });
        filePath && console.log(filePath, 'filePath');
        const result = yield (0, axios_1.default)({
            method: 'get',
            url: filePath,
            responseType: 'stream',
        }).then(response => {
            return new Promise((resolve, reject) => {
                const outputLocationPath = imagesRootUrl + fileId + '.jpg';
                const writer = fs_1.default.createWriteStream(outputLocationPath);
                response.data.pipe(writer);
                let error = null;
                writer.on('error', err => {
                    console.log('ошибка во время записи файла');
                    error = err;
                    writer.close();
                    reject(err);
                });
                writer.on('close', () => {
                    if (!error) {
                        console.log('файл записан ');
                        console.log(outputLocationPath);
                        resolve(true);
                    }
                });
            });
        });
        if (result) {
            return fileId + '.jpg';
        }
    });
}
function createLocation(chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('create location');
        // save pictures first
        const photos = userNewData[chatId].photo;
        const picturesPaths = yield Promise.all(photos.map((photoId) => __awaiter(this, void 0, void 0, function* () {
            return yield downloadFile(photoId);
        })));
        console.log(picturesPaths, 'picturesPaths');
        yield (0, mongoose_1.connect)(mongoToken);
        const TrashModel = (0, mongoose_1.model)('Trash', trashSchema);
        const data = userNewData[chatId];
        const trashDocument = new TrashModel({
            name: data.name,
            description: data.description,
            images: picturesPaths,
            gps: { type: "Point", coordinates: data.location },
            report_by: 'defaultUser',
            date: new Date().toISOString(),
        });
        yield trashDocument.save();
        updateUserState(chatId, types_1.UserState.COMPLETED);
    });
}
function deleteAllTrashes() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, mongoose_1.connect)(mongoToken);
            const TrashModel = (0, mongoose_1.model)('Trash', trashSchema);
            yield TrashModel.deleteMany({}); // Удаление всех документов
            console.log('Все документы успешно удалены');
        }
        catch (error) {
            console.error('Ошибка при удалении документов:', error);
        }
    });
}
function getTrashes() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, mongoose_1.connect)(mongoToken);
        const Trash = (0, mongoose_1.model)('Trash', trashSchema);
        return yield Trash.find({}).exec();
    });
}
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        // const msg = callbackQuery.message;
        // console.log(callbackQuery.data)
        const chatId = callbackQuery.from.id;
        if (callbackQuery.data === 'add_location') {
            // set UserState to AWAITING NAME
            updateUserState(chatId, types_1.UserState.AWAITING_NAME);
            yield bot.sendMessage(chatId, localization_1.default.input_name);
        }
    });
});
bot.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('any message --------------------!');
    const chatId = msg.chat.id; //TODO: check
    const currentState = getUserState(chatId);
    console.log('chatId', chatId);
    console.log(currentState, 'currentState');
    switch (currentState) {
        case types_1.UserState.WELCOME:
            // console.log('WELCOME')
            // Приветствуем пользователя
            yield bot.sendMessage(chatId, localization_1.default.welcome);
            yield bot.sendMessage(chatId, localization_1.default.welcome2 + process.env.WEBSITE_URL, options);
            break;
        case types_1.UserState.AWAITING_NAME:
            // console.log('AWAITING_NAME')
            if (!userNewData[chatId]) {
                userNewData[chatId] = { photo: [] }; // Инициализация пустым объектом, если ранее не существовал
            }
            userNewData[chatId] = Object.assign(userNewData[chatId], { name: msg.text });
            // Сохраняем имя и переходим к следующему шагу
            updateUserState(chatId, types_1.UserState.AWAITING_DESCRIPTION);
            yield bot.sendMessage(chatId, localization_1.default.input_description);
            break;
        case types_1.UserState.AWAITING_DESCRIPTION:
            if (!userNewData[chatId]) {
                userNewData[chatId] = { photo: [] }; // Инициализация пустым объектом, если ранее не существовал
            }
            userNewData[chatId] = Object.assign(userNewData[chatId], { description: msg.text });
            updateUserState(chatId, types_1.UserState.AWAITING_PHOTO);
            yield bot.sendMessage(chatId, localization_1.default.input_photo);
            break;
        case types_1.UserState.AWAITING_PHOTO:
            // Обработка фото
            if (!userNewData[chatId]) {
                userNewData[chatId] = { photo: [] };
            }
            if (msg.photo) {
                console.log('фото пришлО! ');
                const photoArray = msg.photo;
                const photo = photoArray[photoArray.length - 1]; // Берем самую большую версию
                const fileId = photo.file_id;
                userNewData[chatId] = Object.assign(userNewData[chatId], { photo: [fileId] });
                updateUserState(chatId, types_1.UserState.AWAITING_LOCATION);
                yield bot.sendMessage(chatId, localization_1.default.input_location);
            }
            else {
                yield bot.sendMessage(chatId, localization_1.default.photo_not_found);
            }
            // Сохраняем фото и переходим к следующему шагу
            break;
        case types_1.UserState.AWAITING_LOCATION:
            console.log('AWAITING_LOCATION');
            if (msg.location) {
                // Обрабатываем и сохраняем локацию
                userNewData[chatId] = Object.assign(userNewData[chatId], { location: [msg.location.latitude, msg.location.longitude] });
                yield bot.sendMessage(chatId, localization_1.default.final_message);
                yield bot.sendMessage(chatId, localization_1.default.final_message2 + process.env.WEBSITE_URL);
                yield createLocation(chatId);
            }
            if (msg.photo && userNewData[chatId] && userNewData[chatId].photo) {
                console.log('eщё одно фото c');
                const photoArray = msg.photo;
                const photo = photoArray[photoArray.length - 1]; // Берем самую большую версию
                const fileId = photo.file_id;
                userNewData[chatId].photo.push(fileId);
                // userNewData[chatId] = Object.assign( userNewData[chatId] , {photo: [fileId]} )
            }
            // console.log(userNewData[chatId])
            break;
        case types_1.UserState.COMPLETED:
            console.log('COMPLETED state messafge');
            userNewData[chatId] = { photo: [] };
            updateUserState(chatId, types_1.UserState.WELCOME);
            bot.sendMessage(chatId, localization_1.default.welcome, options);
            break;
        default:
            // catch errors?
            console.log('default state message');
            break;
    }
}));
console.log('Bot started');
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const msg = callbackQuery.message;
});
app.get('/', (0, cors_1.default)(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const trashes = yield getTrashes();
    res.header('Access-Control-Allow-Origin', '*'); // Change * to a specific origin if needed
    return res.send(trashes);
}));
app.get('/wkakwdkawkdkawkdkawkdkawkdkawd', (0, cors_1.default)(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const trashes = yield deleteAllTrashes();
    res.header('Access-Control-Allow-Origin', '*'); // Change * to a specific origin if needed
    return res.send(trashes);
}));
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
