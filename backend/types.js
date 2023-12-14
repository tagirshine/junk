"use strict";
//
// interface InlineKeyboardMarkup {
//   inline_keyboard: InlineKeyboardButton[][];
// }
//
// interface InlineKeyboardButton {
//   text: string;
//   url?: string | undefined;
//   callback_data?: string | undefined;
//   web_app?: WebAppInfo;
//   login_url?: LoginUrl | undefined;
//   switch_inline_query?: string | undefined;
//   switch_inline_query_current_chat?: string | undefined;
//   callback_game?: CallbackGame | undefined;
//   pay?: boolean | undefined;
// }
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserState = void 0;
var UserState;
(function (UserState) {
    UserState[UserState["WELCOME"] = 0] = "WELCOME";
    UserState[UserState["AWAITING_NAME"] = 1] = "AWAITING_NAME";
    UserState[UserState["AWAITING_DESCRIPTION"] = 2] = "AWAITING_DESCRIPTION";
    UserState[UserState["AWAITING_PHOTO"] = 3] = "AWAITING_PHOTO";
    UserState[UserState["AWAITING_LOCATION"] = 4] = "AWAITING_LOCATION";
    UserState[UserState["COMPLETED"] = 5] = "COMPLETED";
})(UserState || (exports.UserState = UserState = {}));
