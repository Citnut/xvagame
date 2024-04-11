const { GameSchema } = global.gameClass
const { timer } = global.gameUtil
import { createReadStream } from "fs"
import _config from "./config.js"
const config = _config({ ekDir: global.assetsPath + "/games/ek" })
const state = {
  SETUP: 0b0,
  PLAY: 0b1,
  ALIVE: 0b0,
  DEAD: 0b1
}
const _enum = {
  ExplodingKittens: 0b0,
  Defuse: 0b1,
  Nope: 0b10,
  Attack: 0b11,
  Skip: 0b100,
  Favor: 0b101,
  Shuffle: 0b110,
  See: 0b111,
  Cats: 0b1000,
  tacocat: 0b0,
  ranbow: 0b1,
  catermellon: 0b10,
  potato: 0b11,
  bearded: 0b100
}
function shuffle(arr) {
  let j = 0;
  for (let i = arr.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
function getChose(t) { return isNaN(Number(t)) ? false : Number(t) }
let cache = {
  get: function (img) {
    if (this[img]) return this[img]
    this[img] = createReadStream(img, { autoClose: true })
    return this[img]
  }
}
if (config.dev) console.table(config.img)
class Card {
  static init(obj, quantity = 1, a) {
    let res = []
    let tmp = obj
    const dk = Array.isArray(a)
    for (let i = 0; i < quantity; i++) {
      tmp.a = dk ? a[i] : a
      res.push(tmp)
    }
    return res
  }
  static async ek(game, ID) {
    const { name, cards } = game.getCurrentPlayer()
    const gek = cards.find(x => x.id === _enum.ExplodingKittens)
    const d = game.that.funMsg[Math.floor(Math.random() * (game.that.funMsg.length - 1))]
    await game.that.sendMessage({
      body: game.that.getLang("citnut.ek.gameOver", { name, d }),
      attachment: cache.get(gek.a)
    }, ID)
    return !game.getCurrentPlayer().cards.find(x => x.id === _enum.Defuse) ? game.theCurrentPlayerHasLost(d, gek) : await this.d({ game, ID })
  }
  static async ekf({ game, message }) {
    return !game.getCurrentPlayer().cards.find(x => x.id === _enum.Defuse) ? message.reply(game.that.getLang("citnut.ek.noDefuseCard")) : this.d({ game, ID: message.senderID })
  }
  static async d({ game, ID }) {
    const { cards } = game.getCurrentPlayer()
    const ioek = cards.findIndex(x => x.id === _enum.ExplodingKittens)
    const iod = cards.findIndex(x => x.id === _enum.Defuse)
    const gek = game.players[game.alive[game.index]].cards.splice(ioek, 1)
    game.players[game.alive[game.index]].cards.splice(iod, 1)
    game.that.sendMessage({
      body: game.that.getLang("citnut.ek.Defuse", { min: 1, max: game.desk.length }),
      attachment: cache.get(gek.a)
    }, ID).then(
      e => e.addReplyEvent({
        callback: ({ message }) => {
          if (!game.that.participants.includes(message.senderID)) return
          let chose = getChose(message.body)
          if (chose) return
          if (chose <= 0 || chose > game.desk.length) return
          chose--
          e.unsend().then(() => game.desk.splice(chose, 0, gek))
        }
      }))
  }
  static async nf({ game, name, card, end }) {
    game.that.sendMessage(game.that.getLang("citnut.ek.NopeNoti", { name, card })).then(async e => {
      let m = "",
        d = false,
        nc
      e.addReplyEvent({
        callback: ({ message }) => {
          if (d) return
          if (!game.that.participants.includes(message.senderID)) return
          if (message.body.toLowerCase() != "n") return
          const i = game.players.findIndex(x => x.ID == message.senderID)
          if (!i) return
          if (!game.alive.includes(i)) return
          nc = game.players[i].cards.findIndex(cc => cc.id === _enum.Nope)
          if (!nc) return
          m = message
          d = !d
          game.that.sendMessage(game.that.getLang("citnut.ek.block", { name, card, p: game.players[i].name }))
        }
      })
      await timer(config.time.NopeNoti)
      e.unsend()
      m ? Card.n({ game, message: m, ci: nc }) : end()
    })
  }
  static callbackON({game, usedCard, name}){
    game.that.sendMessage({
      body: game.that.getLang("citnut.ek.usta") + game.that.getLang("citnut.ek.Noti", { name, card: config.Nope }),
      attachment: cache.get(usedCard.a)
    })
  }
  static async n({ game, message, c = true, call = false, ci }) {
    if (call) return message.reply(game.that.getLang("citnut.ek.cnu"))
    const usedCard = game.players[i].cards.splice(ci, 1)
    const i = game.findPlayerByID({ ID: message.senderID, i: true })
    const { name, status } = game.players[i]
    if (status === state.DEAD) return
    if (game.checkNope() && c) await Card.nf({ game, name, card: config.Nope, end: async () => { this.callbackON({game, usedCard, name}) } })
    else {
      this.callbackON({game, usedCard, name})
    }
  }
  static async a({ game, message, c = true, ci }) {
    const { name } = game.getCurrentPlayer()
    const usedCard = c ? game.players[game.alive[game.index]].cards.splice(ci, 1) : ci
    if (game.checkNope() && c) await Card.nf({ game, name, card: config.Attack, end: async () => await Card.a({ game, message, c: !c, ci: usedCard }) })
    else {
      if (game.victim.ID === message.senderID && game.victim.turn === 1) {
        game.clearVT()
        await game.that.sendMessage({
          body: game.that.getLang("citnut.ek.Noti", { name, card: config.Attack }) + " " + game.that.getLang("citnut.ek.blockAtk"),
          attachment: cache.get(usedCard.a)
        })
      } else {
        const { name: victim, ID } = game.players[game.alive[game.index + 1 === game.alive.length ? 0 : game.index + 1]]
        game.victim = { name: victim, ID, by: message.senderID, turn: 1 }
        await game.that.sendMessage({
          body: game.that.getLang("citnut.ek.Attack", { name, victim }),
          attachment: cache.get(usedCard.a)
        })
      }
      return
    }
  }
  static async sk({ game, message, c = true, ci }) {
    const { name } = game.getCurrentPlayer()
    const usedCard = c ? game.players[game.alive[game.index]].cards.splice(ci, 1) : ci
    if (game.checkNope() && c) await Card.nf({ game, name, card: config.Skip, end: async () => await Card.sk({ game, message, c: !c, ci: usedCard }) })
    else {
      if (game.getCurrentPlayer().cards.find(c => c.id === _enum.ExplodingKittens)) await message.reply(game.that.getLang("citnut.ek.cnu"))
      else {
        game.e.unsend()
        await game.that.sendMessage({
          body: game.that.getLang("citnut.ek.Skip", { name }),
          attachment: cache.get(usedCard.a)
        })
        game.next()
      }
    }
  }
  static async callbackAOF({ message: m, eventData }) {
    let chose = getChose(m.body)
    if (!chose) return
    let { _l } = eventData.ek
    if (chose > _l.length || chose < 1) return
    let { name, game, e } = eventData.ek
    const ID = _l[chose - 1]
    const cl = game.getCardsListOfPlayers(ID)
    e.unsend()
    const ib = await game.that.send(game.that.getLang("citnut.ek.FavorIb", { name, l: cl }), ID)
    ib.addReplyEvent({ callback: Card.callbackBOF, ek: { m, cl, ib, ID, name, game } })
  }
  static callbackBOF({ message, eventData }) {
    chose = getChose(message.body)
    if (!chose) return
    if (chose > eventData.ek.cl.length || chose < 1) return
    chose--
    let { game, ID, name, ib, m } = eventData.ek
    const i = game.players.findIndex(p => p.ID === ID)
    const c = game.players[i].cards.splice(chose, 1)
    game.players[game.alive[game.index]].cards.concat(c)
    ib.unsend()
    m.reply(({
      body: game.that.getLang("citnut.ek.FavorIbReply2", { name: game.players[i].name, card: c.name }),
      attachment: cache.get(c.a)
    }))
    message.reply({
      body: game.that.getLang("citnut.ek.FavorIbReply", { name, card: c.name }),
      attachment: cache.get(c.a)
    })
  }
  static async f({ game, message, c = true, ci }) {
    const { name } = game.getCurrentPlayer()
    const usedCard = c ? game.players[game.alive[game.index]].cards.splice(ci, 1) : ci
    if (game.checkNope() && c) await Card.nf({ game, name, card: config.Favor, end: async () => await Card.f({ game, message, c: !c, ci: usedCard }) })
    else {
      let l = ""
      let _l = []
      for (let i = 0; i < game.alive.length; i++) {
        _l.push(game.players[i].ID)
        l += `[${i + 1}] ${game.players[i].name} <${game.players[i].cards.length}>\n`
      }
      game.that.sendMessage({
        body: game.that.getLang("citnut.ek.Noti", { name, card: config.Favor }),
        attachment: cache.get(usedCard.a)
      })
      const e = await message.reply(game.that.getLang("citnut.ek.Favor", { l }))
      e.addReplyEvent({ callback: Card.callbackAOF, ek: { name, game, e, _l } })
    }
  }
  static async sf({ game, message, c = true, ci }) {
    const { name } = game.getCurrentPlayer()
    const usedCard = c ? game.players[game.alive[game.index]].cards.splice(ci, 1) : ci
    if (game.checkNope() && c) await Card.nf({ game, name, card: config.Shuffle, end: async () => await Card.sf({ game, message, c: !c, ci: usedCard }) })
    else {
      game.shuffleCards()
      await game.that.sendMessage({
        body: game.that.getLang("citnut.ek.Shuffle", { name }),
        attachment: cache.get(usedCard.a)
      })
    }
  }
  static async se({ game, message, c = true, ci }) {
    const { name } = game.getCurrentPlayer()
    const usedCard = c ? game.players[game.alive[game.index]].cards.splice(ci, 1) : ci
    if (game.checkNope() && c) await Card.nf({ game, name, card: config.See, end: async () => await Card.se({ game, message, c: !c, ci: usedCard }) })
    else {
      await game.that.sendMessage({
        body: game.that.getLang("citnut.ek.Noti", { name, card: config.See }),
        attachment: cache.get(usedCard.a)
      })
      await message.reply(game.that.getLang("citnut.ek.seeTF", { list: `[1] ${game.desk[0].name}\n[2] ${game.desk[1].name}\n[3] ${game.desk[2].name}` }))
    }
  }
  static async callbackAOC({ message, eventData }) {
    let chose = getChose(message.body)
    if (!chose) return
    if (chose > eventData.ek._l.length || chose < 1) return
    const ID = _l[chose - 1]
    let { game, e } = eventData.ek
    const p = game.findPlayerByID(ID)
    const cl = shuffle(p.cards)
    let lms = []
    let ms = []
    for (let i = 1; i <= cl.length; i++) { lms.push(`[${i}]`) }
    for (let i = 0; i < lms.length; i += 4) { ms.push(lms.slice(i, i + 4).join(" ")) }
    e.unsend()
    const r = await m.reply(game.that.getLang("citnut.ek.CatChoseCard", { name: p.name, l: ms.join("\n") }))
    r.addReplyEvent({ callback: Card.callbackBOC, ek: { lms, r, game } })
  }
  static async callbackBOC({ message, eventData }) {
    chose = getChose(message.body)
    if (!chose) return
    let { lms, r, game } = eventData.ek
    if (chose > lms.length || chose < 1) return
    const c = game.players[ID].cards.splice(chose - 1, 1)
    game.players[game.alive[game.index]].cards.concat(c)
    r.unsend()
    await message.reply({
      body: game.that.getLang("citnut.ek.CatReply", { card: c.name, name: p.name }),
      attachment: cache.get(c.a)
    })
  }
  static async c({ game, message, c = true, cit = false, ci }) {
    const { name, cards, ID } = game.getCurrentPlayer()
    const usedCard = c ? game.players[game.alive[game.index]].cards.splice(ci, 1) : ci
    if (!cit) {
      let card = cards
      card.splice(ci, 1)
      cit = card.findIndex(i => i.bid === cards[ci].bid)
    }
    if (cit === -1) await message.reply(game.that.getLang("citnut.ek.CatNguErr", { card: cards[ci].name }))
    else if (game.checkNope() && c) await Card.nf({ game, name, card: config.Cats, end: async () => await Card.c({ game, message, c: !c, cit, ci: usedCard }) })
    else {
      let l = "", _l = []
      for (let i = 0; i < game.alive.length; i++) {
        if (game.players[i].ID === ID) continue
        _l.push(game.players[i].ID)
        l += `[${i + 1}] ${game.players[i].name} <${game.players[i].cards.length}>\n`
      }
      game.that.sendMessage({
        body: game.that.getLang("citnut.ek.Noti", { name, card: config.Cats }),
        attachment: cache.get(usedCard.a)
      })
      const e = await message.reply(game.that.getLang("citntu.ek.CatChosePlayer", { l }))
      e.addReplyEvent({ callback: Card.callbackAOC, ek: { _l, game, e } })
    }
  }
}
const deskOfCards = (e, d) => [
  ...Card.init({ name: config.Defuse, id: _enum.Defuse, f: Card.d }, d, config.img.d.slice(config.img.d.length - d, config.img.d.length)),
  ...Card.init({ name: config.ExplodingKittens, id: _enum.ExplodingKittens, f: Card.ekf }, e, config.img.ek),
  ...Card.init({ name: config.Defuse, id: _enum.Defuse, f: Card.d }, 6 - d, config.img.d.slice(0, config.img.d.length - d)),
  ...Card.init({ name: config.Nope, id: _enum.Nope, f: Card.n }, 5, config.img.n),
  ...Card.init({ name: config.Attack, id: _enum.Attack, f: Card.a }, 4, config.img.a),
  ...Card.init({ name: config.Skip, id: _enum.Skip, f: Card.sk }, 4, config.img.sk),
  ...Card.init({ name: config.Favor, id: _enum.Favor, f: Card.f }, 4, config.img.f),
  ...Card.init({ name: config.Shuffle, id: _enum.Shuffle, f: Card.sf }, 4, config.img.sf),
  ...Card.init({ name: config.See, id: _enum.See, f: Card.se }, 4, config.img.se),
  ...Card.init({ name: "TACOCAT" + config.Cats, id: _enum.Cats, bid: _enum.tacocat, f: Card.c }, 4, config.img.c[4]),
  ...Card.init({ name: "RAINBOW VOMIT" + config.Cats, id: _enum.Cats, bid: _enum.ranbow, f: Card.c }, 4, config.img.c[0]),
  ...Card.init({ name: "CATERMELLON" + config.Cats, id: _enum.Cats, bid: _enum.catermellon, f: Card.c }, 4, config.img.c[3]),
  ...Card.init({ name: "HAIRY POTATO CAT" + config.Cats, id: _enum.Cats, bid: _enum.potato, f: Card.c }, 4, config.img.c[1]),
  ...Card.init({ name: "BEARDED CAT" + config.Cats, id: _enum.Cats, bid: _enum.bearded, f: Card.c }, 4, config.img.c[2])
]
class Game {
  constructor(desk = []) {
    this.players = []
    this.index = 0
    this.alive = []
    this.desk = desk
    this.isEnd = false
    this.task = false
    this.victim = { name: "", ID: "", by: "", turn: 0 }// name, ID, turn
    this.timeStamp = 0
  }
  async init(that) {
    this.that = that
    for (let i = 0; i < this.players.length; i++) {
      this.alive.push(i)
      await this.that.sendMessage(this.that.getLang("citnut.ek.yourCards", { cards: this.createCardsList(this.players[i].cards) }), this.players[i].ID)
    }
  }
  getCurrentPlayer() { return this.players[this.alive[this.index]] }
  theCurrentPlayerHasLost(d, gek) {
    this.desk.splice(Math.floor(Math.random() * this.desk.length), 0, gek)
    this.players[this.alive[this.index]].status = state.DEAD
    this.players[this.alive[this.index]].cards = []
    this.players[this.alive[this.index]].d = d
    if (this.victim.ID === this.players[this.alive[this.index]].ID) this.clearVT()
    this.alive.splice(this.index, 1)
    if (this.index === this.alive.length) this.index = 0
    if (this.alive.length != 1) return this.next({ a: true })
    this.isEnd = true
    return
  }
  findPlayerByID({ ID, i = false }) { return i ? this.players.findIndex(p => p.ID === ID) : this.players.find(p => p.ID === ID) }
  next(n = false, a = false) {
    if (!a) this.index + 1 >= this.alive.length ? this.index = 0 : this.index++
    let c
    if (n) {
      c = this.getCard(n)
      this.players[this.alive[this.index]].cards.concat(c)
    }
    this.task = !this.task
    return c.name ?? false
  }
  createCardsList(cards) {
    let msg = "", i = 0
    for (const c of cards) {
      i++
      msg += `[${i}] ${c.name}\n`
    }
    return msg
  }
  getCardsListOfPlayers(ID) { return this.createCardsList(this.findPlayerByID({ ID }).cards) }
  getPlayersList() {
    let msg = "", msgd = ""
    for (const p of this.players) {
      p.status === state.ALIVE ? msg += `[${config.sttInPlayerList[0]}] ${p.name} <${p.cards.length}>\n` : msgd += `[${config.sttInPlayerList[1]}] ${p.name} <dead>\n`
    }
    return msg + msgd
  }
  getCard(i = 1) { return this.desk.splice(0, i) }
  shuffleCards() { this.desk = shuffle(this.desk) }
  clearVT() { this.victim = { name: "", ID: "", by: "", turn: 0 } }
  passTurn() {
    const { ID, cards } = this.getCurrentPlayer()
    if (cards.find(c => c.id === _enum.ExplodingKittens)) Card.ek({ game: this, ID })
    let a = this.next({ n: 1 })
    this.e.unsend()
    if (a) this.that.sendMessage(this.that.getLang("citnut.ek.drawCards", { name: a.name }), ID)
  }
  async onMessage(message) {
    const { ID } = this.getCurrentPlayer()
    if (ID !== message.senderID) return
    if (message.body == config.pass) { this.passTurn() }
    else {
      let chose = getChose(message.args[0])
      if (!chose) return
      chose--
      if (this.players[this.alive[this.index]].cards.length > chose && chose > 0) await this.players[this.alive[this.index]].cards[chose].f({ game: this, message, call: true, ci: chose })
    }
  }
  async startLoop() {
    while (!this.isEnd) {
      await timer(config.time.reloadStatus)
      if (this.task) {
        if (Date.now() - this.timeStamp >= config.time.nextTurn) this.passTurn()
        continue
      }
      try {
        let { ID, cards, name } = this.getCurrentPlayer()
        this.players[this.alive[this.index]].cards = cards.sort((a, b) => a.id - b.id)
        this.players[this.alive[this.index]].cards = cards.sort((a, b) => a.id === b.id ? a.name.localeCompare(b.name) : 0)
        this.e = await this.that.sendMessage(this.that.getLang("citnut.ek.yourTurn", { cards: this.getCardsListOfPlayers(ID), pass: config.pass }), ID)
        this.task = !this.task
        this.that.sendMessage(this.that.getLang("citnut.ek.pushTurn2Box", { name }))
        this.timeStamp = Date.now()
      } catch { console.log }
    }
    const { name } = this.players.splice(this.index, 1)
    let list = ""
    for (const p of this.players) { list += ` ${config.sttInPlayerList[3]} ${p.name} (${p.d})` }
    await this.that.sendMessage(this.that.getLang("citnut.ek.end", { name: name + config.sttInPlayerList[2], list }))
  }
  newPlayer({ name = "<unknow>", ID = 0, cards = [] }) { this.players.push({ name, ID, cards, status: state.ALIVE }) }
  checkNope() {
    for (const c of this.players) {
      if (c.status === state.DEAD) continue
      if (c.cards.some(e => e.id === _enum.Nope)) return true
    }
    return false
  }
}
class ExplodingKitten extends GameSchema {
  constructor(options = {}) {
    super({ ...options, name: "explodingKitten" })
    if (!this.isGroup) return
    this.prefix = options.prefix
    if (!options.param[1]) return this.sendMessage(this.getLang("citnut.ek.createGame", { "p": this.prefix }))
    const num = getChose(options.param[1])
    if (!num) return this.sendMessage(this.getLang("citnut.ek.createGame", { "p": this.prefix }))
    if (num < 2 || num > 5) return this.sendMessage(this.getLang("citnut.ek.createGame", { "p": this.prefix }))
    this.state = state.SETUP
    this.sendMessage(this.getLang("citnut.ek.setup", { "players": num, ...config.setupGame }))
    this.size = num
    this.funMsg = this.getLang("citnut.ek.funMsg").split("\n")
    for (let ind = 0; ind < this.funMsg.length; ind++) { this.funMsg[ind] = this.funMsg[ind].split(/\s+/).filter(w => w !== "").join(" ") }
  }
  async sendMessage(message, threadID = this.threadID) {
    const result = await this.send(message, threadID)
    return result
  }
  async clean() { await this.sendMessage(this.getLang("citnut.ek.clean")) }
  async onMessage(message, reply) {
    const { senderID } = message
    const body = message.body.toLowerCase()
    if (config.dev) console.log("ek dev:", body)
    if (body === config.setupGame.end && (senderID === this.masterID || config.adList.includes(senderID))) await global.gameManager.clean(this.threadID)
    else if (this.state === state.PLAY) {
      if (!this.participants.includes(senderID)) return
      if (body === config.help) {
        for (const once of config.wiki) { message.send({ attachment: cache.get(once) }) }
      } else body === config.status ? await this.sendMessage(this.getLang("citnut.ek.stt", { l: this.game.getPlayersList() })) : await this.game.onMessage(message)
    } else {
      if (body === config.setupGame.join) {
        if (this.size === this.participants.length) return
        if (!this.addParticipant(senderID)) return reply(this.getLang("citnut.ek.participatedBefore", { now: this.participants.length, max: this.size }))
        if (this.size === this.participants.length) {
          this.game = new Game(deskOfCards(4, this.size))
          let d = this.game.desk.splice(0, this.size + 1)
          this.game.shuffleCards()
          for (const p of this.participants) {
            this.game.newPlayer({
              name: config.getUserName(p),
              ID: p,
              cards: d.splice(0, 1).concat(this.game.getCard(4))
            })
          }
          this.state = state.PLAY
          await this.game.init(this)
          await this.sendMessage(this.getLang("citnut.ek.start", { n: this.size, help: config.help, status: config.status }))
          await this.sendMessage(this.getLang("citnut.ek.stt", { l: this.game.getPlayersList() }))
          this.game.startLoop()
        } else reply(this.getLang("citnut.ek.join", { now: this.participants.length, max: this.size }))
      } else if (body === config.setupGame.out) {
        if (this.masterID === senderID) return reply(this.getLang("citnut.ek.theOwnerCannotLeave"))
        if (!this.participants.includes(senderID)) return
        this.participants.splice(this.participants.findIndex(i => i === senderID), 1)
        reply(this.getLang("citnut.ek.out", { now: this.participants.length, max: this.size }))
      }
    }
  }
}
export default ExplodingKitten
// var devdevdev;
// if (config.dev) devdevdev = deskOfCards(4, 5)
// export async function test({ message }) {
//   if (!config.dev) return
//   for (const i of devdevdev) {
//     global.api.sendMessage({
//       body: i.name,
//       attachment: cache.get(i.a)
//     }, message.threadID)
//     await timer(1000)
//   }
// }
//Chinh dep trai
