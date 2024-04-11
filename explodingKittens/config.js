// import { readdirSync } from "fs"
// const ekDir = process.cwd() + "/plugins/commands/cache/explodingKittens"
function getArrDir({ dir, prefix, suffixes = ".png", len = 4 }) {
  let rs = []
  for (let i = 1; i <= len; i++) {
    rs.push(`${dir}/${prefix}${i}${suffixes}`)
  }
  return rs
}
export default function ({ ekDir }) {
  const imgDir = ekDir + "/img"
  // const imgList = readdirSync(imgDir)
  const wikiDir = ekDir + "/wiki"
  // for (let index = 0; index < wiki.length; index++) { wiki[index] = ekDir + "/" + wiki[index] }
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
      reloadStatus: 5 * 1000,
      NopeNoti: 15 * 1000,
      nextTurn: 2 * 60 * 1000
    },
    wiki: getArrDir({ dir: wikiDir, prefix: "", suffixes: ".jpg", len: 2 }),
    img: {
      d: getArrDir({ dir: imgDir, prefix: "d", len: 6 }),
      ek: getArrDir({ dir: imgDir, prefix: "ek" }),
      n: getArrDir({ dir: imgDir, prefix: "n", len: 5 }),
      a: getArrDir({ dir: imgDir, prefix: "a" }),
      sk: getArrDir({ dir: imgDir, prefix: "sk" }),
      f: getArrDir({ dir: imgDir, prefix: "f" }),
      sf: getArrDir({ dir: imgDir, prefix: "sf" }),
      se: getArrDir({ dir: imgDir, prefix: "s", len: 5 }),
      c: getArrDir({ dir: imgDir, prefix: "c", len: 5 })
    },
    dev: false,
    getUserName: (uid) => global.data.users.get(uid).info.name,
    // api: global.api
  }
}

