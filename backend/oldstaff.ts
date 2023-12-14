/*
import localization from "./localization";


bot.on('message', async (msg: any ) : Promise<void>  => { ///*, match
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
      ],
    },
  };
  bot.sendMessage(chatId, "Спасибо за участие!", options);

});

*/
