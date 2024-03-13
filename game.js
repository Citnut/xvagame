import uniqid from "uniqid"
import { existsSync, writeFileSync } from "fs"
class Manager {
  constructor(items = []) {
    this.items = items;
  }

  getLength() {
    return this.items.length;
  }

  top() {
    return this.items[0];
  }

  bottom() {
    return this.items[this.items.length - 1];
  }

  clear() {
    this.items.splice(0, this.items.length);
  }

  find(query, options) {
    const returnIndex = Boolean(
      ((typeof options == 'object') ? options.returnIndex : false) || false
    );

    const indexFind = this.items.findIndex(item => {
      for (const property in query) {
        if (query[property] != item[property]) {
          return false;
        }
      }
      return true;
    });
    if (returnIndex) return indexFind;
    return this.items[indexFind];
  }

  add(item, findQuery = {}) {
    // addingCondition is a condition for checking duplicate of the item before adding
    if (Object.keys(findQuery).length != 0) {
      const index = this.find(findQuery, {
        returnIndex: true
      });
      if (index == -1) {
        this.items.push(item);
        return this.bottom();
      }
      return this.items[index];
    }

    this.items.push(item);
    return this.bottom();
  }

  delete(queryObject) {
    const itemIndex = this.find(queryObject, {
      returnIndex: true
    });
    if (itemIndex != -1) this.items.splice(itemIndex, 1);
  }
};

class GameManager extends Manager {
  constructor(games = {}) {
    super();
    this.games = games;
  }

  import(games, clear = false) {
    if (clear) this.games = games;
    else Object.assign(this.games, games);
  }

  run(name, gameOptions) {
    if (!gameOptions) return
    for (const item of this.items) {
      if (!item.participants) continue
      if (item.threadID == gameOptions.threadID) {
        return gameOptions.send(`Xin lỗi, box của bạn đang chạy trò chơi ${item.name}!`, gameOptions.threadID);
      }
      if (item.participants && item.participants.includes(gameOptions.masterID)) {
        return gameOptions.send(`Xin lỗi, bạn đang chơi trò chơi ${item.name}!`, gameOptions.threadID);
      }
    }
    this.add(new this.games[name](gameOptions));

  }

  async clean(threadID) {
    const item = this.find({ threadID });
    if (item) {
      try {
        await item.clean();
      } finally {
        this.delete({ threadID });
      }
    }
  }

  findGameByName(name) {
    if (!name) return;
    const game = this.games[name];
    return game ? game : null;
  }

  isValid(name) {
    // check if the game exists
    if (!name) return false;
    const game = this.findGameByName(name);
    return game ? true : false;
  }

  isPlaying(threadID) {
    // check if threadID is already playing a game
    const item = this.find({ threadID });
    return item ? true : false;
  }

  playing(threadID) {
    // get current item that threadID is playing
    const item = this.find({ threadID });
    return item ? item : null;
  }

  getList() {
    const list = [];
    for (const name in this.games) {
      list.push(name);
    }
    return list;
  }
};

class State {
  constructor(states = []) {
    this.items = [].concat(states)
    this.index = 0
  }
  next() {
    this.index += this.index < this.items.length - 1 ? 1 : 0
    return this.getCurrent()
  }
  previous() {
    this.index -= this.index > 0 ? 1 : 0
    return this.getCurrent()
  }
  getCurrent() {
    return this.items[this.index]
  }
  reset() {
    this.index = 0
  }
  end() {
    this.index = this.items.length - 1
  }
  is(item) {
    // work only for text, if passing an array/object, will need reference
    return this.getCurrent() === item
  }
  isEnd() {
    return this.index === this.items.length - 1
  }
}
class GameSchema {
  constructor(options) {
    const {
      // // plugin,
      name = "Unknown game",
      masterID, // unique
      threadID, // unique
      param = "",
      isGroup = false,
      participants = [masterID],
      send = () => { },
      getLang = () => { }
    } = options
    this.id = uniqid()
    // this.plugin = plugin
    this.name = name
    this.masterID = masterID // ID người tạo game
    this.threadID = threadID // ID group để tương tác game
    this.participants = participants
    this.param = param
    this.isGroup = isGroup
    this.send = send
    this.getLang = getLang
    Object.assign(this, options)
  }
  async onMessage() { }
  async clean() { }
  addParticipant(id, duplicateCheck = true) {
    if (duplicateCheck && this.participants.includes(id)) return false
    this.participants.push(id)
    return true
  }
}
const _gameClass = {
  Manager,
  GameManager,
  State,
  GameSchema
}
global.gameClass = _gameClass
global.gameManager = new GameManager()
const config = {
  name: "game",
  aliases: ["gm"],
  description: "Chơi game\nHiện tại gồm các game: " + (global.gameManager?.getList().join(", ") ?? "..."),
  usage: "<game>",
  cooldown: 3,
  permissions: [0, 1, 2],
  credits: "Citnut convert kb2abotv3"
}

const langData = {
  "vi_VN": {
    "citnut.game.errLoadGame": "Không thể tạo game {gameName}\nLời nhắn: {estack}",
    "citnut.game.errFindGame": "Không tìm thấy game nào có tên {gameName}!\n\nList các game:\n- {list}"
  },
  "en_US": {
    "citnut.game.errLoadGame": "Cannot create game {gameName}\nmsg: {estack}",
    "citnut.game.errFindGame": "No game were found named {gameName}!\n\nList game:\n- {list}"
  }
}
/**
 * 
 * @type {TOnLoadCommand}
 */
function onLoad() {
  if (!existsSync(global.pluginsPath + "/onMessage/gameListener.js")) {
    writeFileSync(global.pluginsPath + "/onMessage/gameListener.js", 
`export default async function ({ message }) {
  if (global.gameManager.items.length == 0) return
  for (const game of global.gameManager.items) {
    if (game.threadID === message.threadID || !message.isGroup) {
      try { await game.onMessage(message, message.reply) } catch { console.log }
    }
  }
}`
    )
  }
}
async function onCall({ message, args, getLang }) {
  const gameName = message.args[1]
  if (global.gameManager.isValid(gameName)) {
    try {
      const thread = message.isGroup ? await global.controllers.Threads.get(message.threadID) || {} : {}
      global.gameManager.run(gameName, {
        masterID: message.senderID,
        threadID: message.threadID,
        param: args,
        isGroup: message.isGroup,
        send: message.send,
        getLang: (key, objdata) => global.getLang(key, objdata, gameName, thread?.data?.language || global.config.LANGUAGE || "en_US"
        )
      })
    } catch (e) {
      return message.reply(getLang("citnut.game.errLoadGame", {
        "gameName": gameName,
        "estack": e.stack
      }))
    }
  } else
    return message.reply(getLang("citnut.game.errFindGame", {
      "gameName": gameName,
      "list": global.gameManager.getList().join("\n- ")
    }))
}
export default {
  config,
  langData,
  onCall,
  onLoad
}