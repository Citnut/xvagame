import { readdirSync } from "fs"
// const ekDir = process.cwd() + "/plugins/commands/cache/explodingKittens"
export default function ({ ekDir }) {
  const imgDir = ekDir + "/img"
  const imgList = readdirSync(imgDir)
  let wiki = readdirSync(ekDir + "/wiki")
  for (let index = 0; index < wiki.length; index++) { wiki[index] = ekDir + "/" + wiki[index] }
  return {
    setupGame: {
      join: "meplay",
      end: "end!",
      out: "out!"
    },
    help: "help",
    status: "status",
    pass: "pass",
    adList: global.config.MODERATORS.concat(global.config.ABSOLUTES),
    ExplodingKittens: "Exploding Kittens (Mèo Nổ)",
    Defuse: "Defuse (Gỡ bom)",
    Nope: "Nope (Không)",
    Attack: "Attack (Tấn công)",
    Skip: "Skip (Bỏ lượt)",
    Favor: "Favor (Thiện ý)",
    Shuffle: "Shuffle (Xáo bài)",
    See: "See The Future (Xem trước Tương lai)",
    Cats: " (Mèo cùi bắp)",
    sttInPlayerList: ["☄️", "🔥", "🎉", "🪦"],
    time: {
      reloadStatus: 3000,
      NopeNoti: 9000
    },
    wiki,
    imgDir,
    img: {
      d: imgList.slice(9, 15),
      ek: imgList.slice(15, 19),
      n: imgList.slice(23, 28),
      a: imgList.slice(0, 4),
      sk: imgList.slice(37, 41),
      f: imgList.slice(19, 23),
      sf: imgList.slice(33, 37),
      se: imgList.slice(28, 33),
      c: imgList.slice(4, 9),
    },
    dev: true
  }
}