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

// create tupe with this elements
//    AWAITING_NAME:
//   AWAITING_DESCRIPTION:
//   AWAITING_PHOTO
//   AWAITING_LOCATION
//   COMPLETED

export interface UserStates {
  [key: number]: UserState;
}
interface Location {
  name?: string;
  description?: string;
  photo: string[];//TODO: array could be empty
  location?: [number, number];
}

export interface UserNewData {
  [key: number]: Location;
}
export enum UserState {
  WELCOME,
  AWAITING_NAME,
  AWAITING_DESCRIPTION,
  AWAITING_PHOTO,
  AWAITING_LOCATION,
  COMPLETED,
}
