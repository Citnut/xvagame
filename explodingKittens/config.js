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
      reloadStatus: 3000,
      NopeNoti: 10000
    },
    wiki: getArrDir({ dir: wikiDir, prefix: "", suffixes: ".jpg", len: 2 }),
    img: {
      d: getArrDir({ dir: ekDir, prefix: "d", len: 6 }),
      ek: getArrDir({ dir: ekDir, prefix: "ek" }),
      n: getArrDir({ dir: ekDir, prefix: "n", len: 5 }),
      a: getArrDir({ dir: ekDir, prefix: "a" }),
      sk: getArrDir({ dir: ekDir, prefix: "sk" }),
      f: getArrDir({ dir: ekDir, prefix: "f" }),
      sf: getArrDir({ dir: ekDir, prefix: "sf" }),
      se: getArrDir({ dir: ekDir, prefix: "s", len: 5 }),
      c: getArrDir({ dir: ekDir, prefix: "c", len: 5 })
    },
    dev: false,
    getUserName: (uid) => global.data.users.get(uid).info.name,
    // api: global.api
  }
}
