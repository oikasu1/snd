/*!
 * PinyinAudio (revised) - reusable browser library for Hokkien/Hakka pinyin → audio URLs with sequential playback
 * - Exposes window.PinyinAudio for easy reuse.
 * - Provides resolve(), play(), preload(), holo(), kasu(), p().
 * - Reads large seeds from window.PinyinAudioSeeds (separate seeds.js).
 * - Fixes regex language detection, avoids global state, ensures safe array mapping, and cleans audio listeners.
 * - 為了能播放音檔，請在head插入 <script src="https://oikasu1.github.io/snd/snd.js"></script>
音檔播放，請使用app.js內的函數 zhaoan(this, url)，方式如 onclick = "holo(this, url)"，其中url就是 臺羅，如 holo(this, 'sún-ku')


 * - 為了能播放音檔，請在head插入 <script src="https://oikasu1.github.io/snd/app.js"></script>
音檔播放，請使用app.js內的函數 windows.PinyinAudio.kasu(this, url)，方式如 onclick = "windows.PinyinAudio.kasu(this, url)"，其中url就是 拼音，如 windows.PinyinAudio.kasu(this, 'tai') 或 windows.PinyinAudio.kasu(this, 'tai-gaˇ')
 */


window.holo = (...args) => PinyinAudio.holo(...args);
window.kasu = (...args) => PinyinAudio.kasu(...args);


;((root, factory) => {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root || globalThis)
  } else {
    root.PinyinAudio = factory(root)
  }
})(typeof self !== "undefined" ? self : this, (root) => {
  // --- Load initial seeds from window.PinyinAudioSeeds (provided by seeds.js) ---
  const initialSeeds = (root && root.PinyinAudioSeeds) || {}
  let holoSeed = typeof initialSeeds.holoSeed === "string" ? initialSeeds.holoSeed : ""
  let kasuSeed = typeof initialSeeds.kasuSeed === "string" ? initialSeeds.kasuSeed : ""

  // Hakka dialect seeds
  let sixianSeed = typeof initialSeeds.sixianSeed === "string" ? initialSeeds.sixianSeed : ""
  let hailuSeed = typeof initialSeeds.hailuSeed === "string" ? initialSeeds.hailuSeed : ""
  let dapuSeed = typeof initialSeeds.dapuSeed === "string" ? initialSeeds.dapuSeed : ""
  let raopingSeed = typeof initialSeeds.raopingSeed === "string" ? initialSeeds.raopingSeed : ""

  // --- Parsers for dictionaries ---
  function parseHoloData(data) {
    const dict = {}
    const arr = (data || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
    const pairs = [...new Set(arr)]
    for (const pair of pairs) {
      const [word, code] = pair.split(",")
      if (!word) continue
      const n = Number.parseInt(code, 10)
      if (!isNaN(n)) dict[word] = n
    }
    return dict
  }
  function parseKasuData(data) {
    const dict = {}
    const arr = (data || "").replace(/_/g, "-").replace(/-+/g, "-").trim().split(/\s+/).filter(Boolean)
    const unique = [...new Set(arr)]
    for (const w of unique) dict[w] = true
    return dict
  }

  // Internal dictionaries
  let dictionaryHolo = parseHoloData(holoSeed)
  let dictionaryKasu = parseKasuData(kasuSeed)
  let dictionarySixian = parseKasuData(sixianSeed)
  let dictionaryHailu = parseKasuData(hailuSeed)
  let dictionaryDapu = parseKasuData(dapuSeed)
  let dictionaryRaoping = parseKasuData(raopingSeed)

  // Dictionary versions for cache invalidation
  const dictVersion = { kasu: 0, holo: 0, sixian: 0, hailu: 0, dapu: 0, raoping: 0 }

  // --- Tone and format utilities ---
  // Unified normalizer; keepPunct decides whether to strip punctuation at the end
  function normalizeZVSXF(t, { keepPunct = true } = {}) {
    t = String(t || "")
    t = t.replace(/([ˉˊˇˋˆ^⁺])([a-z])/g, "$1 $2")
    t = t.replace(/([aeioumngbdr])(ˉ)/g, "$1 ")
    t = t.replace(/([aeioumngbdr])(ˊ)/g, "$1z")
    t = t.replace(/([aeioumngbdr])(ˇ)/g, "$1v")
    t = t.replace(/([aeioumngbdr])(ˋ)/g, "$1s")
    t = t.replace(/([aeioumngbdr])(ˆ)/g, "$1x")
    t = t.replace(/([aeioumngbdr])(\^)/g, "$1x")
    t = t.replace(/([aeioumngbdr])(\+)/g, "$1f")
    t = t.replace(/([aeioumngbdr])(⁺)/g, "$1f")
    t = t.replace(/oo/g, "o")
    t = t.replace(/(bb)([aeioumn])/g, "v$2")
    t = t.replace(/ji/g, "zi")
    t = t.replace(/qi/g, "ci")
    t = t.replace(/xi/g, "si")
    t = t.replace(/(shixcd)/g, "shid")
    t = t.replace(/(vuzcd)/g, "vud")
    t = t.replace(/(gixy ha)/g, "gia")
    t = t.replace(/(gixcy dov)/g, "giof")
    t = t.replace(/(gixy dov)/g, "giof")
    t = t.replace(/(gavy hensf)/g, "genf")
    t = t.replace(/(gavy nginsf)/g, "ginf")
    t = t.replace(/(gavy ngaisf)/g, "gaif")
    t = t.replace(/(dedzcy hensz)/g, "denz")
    t = t.replace(/(dedzcy hensf)/g, "denf")
    t = t.replace(/(dedzcy guisz)/g, "duiz")
    t = t.replace(/(dedzcy guisf)/g, "duif")
    t = t.replace(/(dedzcy ngaisz)/g, "daiz")
    t = t.replace(/(dedzcy ngaisf)/g, "daif")
    t = t.replace(/(dedzcy nginsz)/g, "dinz")
    t = t.replace(/(dedzcy nginsf)/g, "dinf")
    t = t.replace(/(vmoi)/g, "moi")
    t = t.replace(/(hmo)/g, "mo")
    t = t.replace(/(hmo)/g, "mo")
    t = t.replace(/([aeioumngbdr])([czvsxf])([czvsxf])(\b)/g, "$1$3$4")
    t = t.replace(/([aeioumngbdr])(c)(\b)/g, "$1$3")
    t = t.toLowerCase()
    if (!keepPunct) {
      t = t.replace(/[,?:;!'".]/g, "")
    }
    return t
  }
  // Backwards-compatible wrappers
  function replaceToneToZvsxf_stripPunct(t) {
    return normalizeZVSXF(t, { keepPunct: false })
  }
  function replaceToneToZvsxf_keepPunct(t) {
    return normalizeZVSXF(t, { keepPunct: true })
  }

  // 四縣變調
  const replaceSixianToneToBian = (() => (t) => {
    t = String(t || "")
    t = t.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi, "$1$2$3$4$5$6$7$8")
    t = t.replace(/([a-z]{1,6})(z)(-|_| )(\1)(z)(-|_| )(\1)(z)(\b)/gi, "$1ˊ$3$4ˊ$6$7ˊ$9")
    t = t.replace(/([a-z]{1,6})(v)(-|_| )(\1)(v)(-|_| )(\1)(v)(\b)/gi, "$1ˊ$3$4$5$6$7$8$9")
    t = t.replace(
      /([aeiouymng])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbd]{1,5})([z]{0,1})(\b)/gi,
      "$1ˇ$3$4$5$6$7",
    )
    t = t.replace(/([aeiouymngbd])(s)(-|_| )()(e)(s)(\b)/gi, "$1$2$3$4$5ˇ$7")
    return t
  })()

  // 海陸變調
  const replaceHailuToneToBian = (() => (t) => {
    t = String(t || "")
    t = t.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi, "$1$2$3$4$5$6$7$8")
    t = t.replace(/([a-z]{1,6})(z)(-|_| )(\1)(z)(-|_| )(\1)(z)(\b)/gi, "$1ˊ$3$4ˊ$6$7ˊ$9")
    t = t.replace(/([a-z]{1,6})([vsf]{0,1})(-|_| )(\1)(\2)(-|_| )(\1)(\2)(\b)/gi, "$1ˊ$3$4$5$6$7$8$9")
    t = t.replace(
      /([aeiouymng])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvsf]{0,1})(\b)/gi,
      "$1$3$4$5$6$7",
    )
    t = t.replace(
      /([aeiou])([bdg])(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvsf]{0,1})(\b)/gi,
      "$1$2ˋ$3$4$5$6$7",
    )
    t = t.replace(//gi, "")
    return t
  })()

  // 大埔變調
  const replaceDapuToneToBian = (() => (t) => {
    t = String(t || "")
    t = t.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi, "$1$2$3$4$5$6$7$8")
    t = t.replace(/([a-z]{1,6})([vxsf])(-|_| )(\1)([fs])(-|_| )(\1)(\2)(\b)/gi, "$1ˊ$3$4ˇ$6$7$8$9")
    t = t.replace(/([a-z]{1,6})([vxsf])(-|_| )(\1)([v])(-|_| )(\1)(\2)(\b)/gi, "$1ˊ$3$4⁺$6$7$8$9")
    t = t.replace(
      /([aeiouymng])(f)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([vx])(\b)/gi,
      "$1ˊ$3$4$5$6$7",
    )
    t = t.replace(
      /([aeiouymng])(v)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngr]{1,5})([v])(\b)/gi,
      "$1⁺$3$4$5$6$7",
    )
    t = t.replace(
      /([aeiouymng])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([xs])(\b)/gi,
      "$1$3$4$5$6$7",
    )
    t = t.replace(//gi, "")
    return t
  })()

  // 饒平變調（本需求的 fallback 指定用 Dapu）
  const replaceRaopingToneToBian = (() => (t) => {
    t = String(t || "")
    t = t.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi, "$1$2$3$4$5$6$7$8")
    t = t.replace(
      /([aeiouymng])()(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([vs])(\b)/gi,
      "$1ˋ$3$4$5$6$7",
    )
    t = t.replace(
      /([aeiouymng])()(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([z]{0,1})(\b)/gi,
      "$1⁺$3$4$5$6$7",
    )
    t = t.replace(
      /([aeiouymng])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})(ng|a|e|i|o|u|m|n|r{1,5})([vs])(\b)/gi,
      "$1⁺$3$4$5$6$7",
    )
    t = t.replace(
      /([aeiouymng])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdrr]{1,5})([zs]{0,1})(\b)/gi,
      "$1ˇ$3$4$5$6$7",
    )
    t = t.replace(
      /([aeiouymng])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvs]{0,1})(\b)/gi,
      "$1⁺$3$4$5$6$7",
    )
    t = t.replace(
      /(ag|eg|ig|og|ug|b|d)(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvs]{0,1})(\b)/gi,
      "$1$3$4$5$6$7",
    )
    t = t.replace(//gi, "")
    return t
  })()

  function replaceHoloToneToChange(item, index, array) {
    if (index === array.length - 1) return item
    return bianMemo(item)
  }
  const __bianMemo = new Map()
  function bianMemo(w) {
    const k = String(w || "").toLowerCase()
    if (__bianMemo.has(k)) return __bianMemo.get(k)
    const r = replaceHoloToneToBian(k)
    __bianMemo.set(k, r)
    return r
  }
  function replaceHoloToneToBian(w) {
    return String(w || "")
      .replace(/([aeiourmng])\b/gi, "$17")
      .replace(/([aeiourmng])(z)\b/gi, "$11")
      .replace(/([aeiourmng])(s)\b/gi, "$12")
      .replace(/([ptk])\b/gi, "$18")
      .replace(/(h)\b/gi, "1")
      .replace(/([aeiourmng])(x)\b/gi, "$17")
      .replace(/([aeiourmng])(f)\b/gi, "$13")
      .replace(/([ptk])l\b/gi, "$14")
      .replace(/(h)l\b/gi, "3")
      .replace(/([aeioumngptkhr])(1)/gi, "$1")
      .replace(/([aeioumngptkhr])(2)/gi, "$1z")
      .replace(/([aeioumngptkhr])(3)/gi, "$1s")
      .replace(/([aeioumngptkhr])(4)/gi, "$1")
      .replace(/([aeioumngptkhr])(5)/gi, "$1x")
      .replace(/([aeioumngptkhr])(6)/gi, "$1v")
      .replace(/([aeioumngptkhr])(7)/gi, "$1f")
      .replace(/([aeioumngptkhr])(8)/gi, "$1l")
  }

  function tailuoToZvsxfl_keepPunct(w) {
    w = String(w || "")
      .replace(/űn/gi, "unzz")
      .replace(/ű/gi, "uzz")
      .replace(/(a̍)([aeioumngptkhr]{0,5})/gi, "a$2l")
      .replace(/(á)([aeioumngptkhr]{0,5})/g, "a$2z")
      .replace(/(à)([aeioumngptkhr]{0,5})/gi, "a$2s")
      .replace(/(â)([aeioumngptkhr]{0,5})/gi, "a$2x")
      .replace(/(ǎ)([aeioumngptkhr]{0,5})/gi, "a$2v")
      .replace(/(ā)([aeioumngptkhr]{0,5})/gi, "a$2f")
      .replace(/(a̋)([aeioumngptkhr]{0,5})/gi, "a$2zz")
      .replace(/(o̍)([aeioumngptkhr]{0,5})/gi, "o$2l")
      .replace(/(ó)([aeioumngptkhr]{0,5})/gi, "o$2z")
      .replace(/(ò)([aeioumngptkhr]{0,5})/gi, "o$2s")
      .replace(/(ô)([aeioumngptkhr]{0,5})/gi, "o$2x")
      .replace(/(ǒ)([aeioumngptkhr]{0,5})/gi, "o$2v")
      .replace(/(ō)([aeioumngptkhr]{0,5})/gi, "o$2f")
      .replace(/(e̍)([aeioumngptkhr]{0,5})/gi, "e$2l")
      .replace(/(é)([aeioumngptkhr]{0,5})/gi, "e$2z")
      .replace(/(è)([aeioumngptkhr]{0,5})/gi, "e$2s")
      .replace(/(ê)([aeioumngptkhr]{0,5})/gi, "e$2x")
      .replace(/(ě)([aeioumngptkhr]{0,5})/gi, "e$2v")
      .replace(/(ē)([aeioumngptkhr]{0,5})/gi, "e$2f")
      .replace(/(e̋)([aeioumngptkhr]{0,5})/gi, "e$2zz")
      .replace(/(u̍)([aeioumngptkhr]{0,5})/gi, "u$2l")
      .replace(/(ú)([aeioumngptkhr]{0,5})/gi, "u$2z")
      .replace(/(ù)([aeioumngptkhr]{0,5})/gi, "u$2s")
      .replace(/(û)([aeioumngptkhr]{0,5})/gi, "u$2x")
      .replace(/(ǔ)([aeioumngptkhr]{0,5})/gi, "u$2v")
      .replace(/(ū)([aeioumngptkhr]{0,5})/gi, "u$2f")
      .replace(/(ű)([aeioumngptkhr]{0,5})/gi, "u$2zz")
      .replace(/(i̍)([aeioumngptkhr]{0,5})/gi, "i$2l")
      .replace(/(í)([aeioumngptkhr]{0,5})/gi, "i$2z")
      .replace(/(ì)([aeioumngptkhr]{0,5})/gi, "i$2s")
      .replace(/(î)([aeioumngptkhr]{0,5})/gi, "i$2x")
      .replace(/(ǐ)([aeioumngptkhr]{0,5})/gi, "i$2v")
      .replace(/(ī)([aeioumngptkhr]{0,5})/gi, "i$2f")
      .replace(/(i̋)([aeioumngptkhr]{0,5})/gi, "i$2zz")
      .replace(/(m̍)([aeioumngptkhr]{0,5})/gi, "m$2l")
      .replace(/(m̋)([aeioumngptkhr]{0,5})/gi, "m$2zz")
      .replace(/(ḿ)([aeioumngptkhr]{0,5})/gi, "m$2z")
      .replace(/(m̀)([aeioumngptkhr]{0,5})/gi, "m$2s")
      .replace(/(m̂)([aeioumngptkhr]{0,5})/gi, "m$2x")
      .replace(/(m̌)([aeioumngptkhr]{0,5})/gi, "m$2v")
      .replace(/(m̄)([aeioumngptkhr]{0,5})/gi, "m$2f")
      .replace(/(n̍)([aeioumngptkhr]{0,5})/gi, "n$2l")
      .replace(/(n̂)([aeioumngptkhr]{0,5})/gi, "n$2x")
      .replace(/(ň)([aeioumngptkhr]{0,5})/gi, "n$2v")
      .replace(/(n̄)([aeioumngptkhr]{0,5})/gi, "n$2f")
      .replace(/(n̋)([aeioumngptkhr]{0,5})/gi, "n$2zz")
      .replace(/(ń)([aeioumngptkhr]{0,5})/gi, "n$2z")
      .replace(/(ǹ)([aeioumngptkhr]{0,5})/gi, "n$2s")
      .replace(/([aeioumngptkhr]{0,5})(1)/gi, "$1")
      .replace(/([aeioumngptkhr]{0,5})(2)/gi, "$1z")
      .replace(/([aeioumngptkhr]{0,5})(3)/gi, "$1s")
      .replace(/([aeioumngptkhr]{0,5})(4)/gi, "$1")
      .replace(/([aeioumngptkhr]{0,5})(5)/gi, "$1x")
      .replace(/([aeioumngptkhr]{0,5})(6)/gi, "$1v")
      .replace(/([aeioumngptkhr]{0,5})(7)/gi, "$1f")
      .replace(/([aeioumngptkhr]{0,5})(8)/gi, "$1l")
    return w.toLowerCase()
  }

  const replaceKasuToneToBian = (() => {
    const R = [
    // 四字變調
    // x-x-x-x 用分隔成x-xx-x;
    [/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi,'$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15'],
    // w-x-x-x 用分隔成w-xx-x;
    [/([aeiouymng])([zvs]{0,1})(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi,'$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15'],
    // x-x-x-w 用分隔成x-xx-w;
    [/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvs]{0,1})(\b)/gi,'$1$3$4$5$6$7$8$9$10$11$12$13$14$15'],
    // w-x-x-w 用分隔成w-xx-w;
    [/([aeiouymng])([zvs]{0,1})(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvs]{0,1})(\b)/gi,'$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15'],

    // 三疊字 vsfc 變調
    [/([a-z]{1,6})([zvsx])(-|_| )(\1)(\2)(-|_| )(\1)(\2)(\b)/gi,'$1$3$4⁺$6$7$8$9'],
    [/([a-z]{1,6})()(-|_| )(\1)(\2)(-|_| )(\1)(\2)(\b)/gi,'$1$3$4⁺$6$7$8$9'],

    // 三字變調 x-x-x
    // x-x-x;
    [/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi,'$1ˇ$3$4$5$7$8$9$10$11'],

    // 再處理輕聲
    [/([aeiouymng])([zvsx]{0,1})(--|-|_| )(go)(x)(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4ˆ$6$7ˇ$9'],
    [/([aeiouymng])([zvsx]{0,1})(--|-|_| )(go)(x)(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4ˆ$6$7ˇ$9'],
    [/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ki)(x)(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4ˆ$6$7ˇ$9'],
    [/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ki)(x)(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4ˆ$6$7ˇ$9'],
    [/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ngib)(s)(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4⁺$6$7ˇ$9'],
    [/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ngib)(s)(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4⁺$6$7ˇ$9'],
    [/([aeiouymng])([zvsx]{0,1})(--|-|_| )(chid)(z)(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4ˊ$6$7ˇ$9'],
    [/([aeiouymng])([zvsx]{0,1})(--|-|_| )(chid)(z)(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4ˊ$6$7ˇ$9'],
    [/([aeiouymng])([zvsx]{0,1})(--|-|_| )(loo|lo)()(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4⁺$6$7ˇ$9'],
    [/([aeiouymng])([zvsx]{0,1})(--|-|_| )(loo|lo)()(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4⁺$6$7ˇ$9'],
    [/([aeiouymng])([zvsx]{0,1})(--|-|_| )(rhid|rid)(z)(-|_| )(ha)()(\b)/gi,'$1$2$3$4⁺$6$7⁺$9'],
    [/([aeiouymng])([zvsx]{0,1})(--|-|_| )(rhid|rid)(z)(-|_| )(baix)()(\b)/gi,'$1$2$3$4⁺$6$7$8$9'],
    [/([aeiouymng])([zvsx]{0,1})(--|-|_| )(rhid|rid)(z)(-|_| )(fue)(s)(\b)/gi,'$1$2$3$4⁺$6$7ˆ$9'],

    // 二字輕聲 --
    [/([aeiouymng])([zvsx]{0,1})(--)(loo|lo)()(\b)/gi,'$1$2$3$4⁺$6'],
    [/([aeiouymng])([zvsx]{0,1})(--)(choo|cho)()(\b)/gi,'$1$2$3$4⁺$6'],
    [/([aeiouymng])([zvsx]{0,1})(--)(loi)(s)(\b)/gi,'$1$2$3$4ˇ$6'],
    [/([aeiouymng])([zvsx]{0,1})(--)(ngib)(s)(\b)/gi,'$1$2$3$4⁺$6'],
    [/([aeiouymng])([zvsx]{0,1})(--)(kui)(x)(\b)/gi,'$1$2$3$4ˇ$6'],

    // 人變調
    [/(ngai|hen|gui)(s)(--|-| )(ngin)(s)(\b)/gi,'$1$2$3$4⁺$6'],
    [/(een)(v)(--|-| )(ngin)(s)(\b)/gi,'$1$2$3$4⁺$6'],

    // 月份變調; c-zvsx;
    [/(zhangx|beedz|samv|rhidz|liuz|cidz|qidz|giux|shibs|ridz|xix|ngi|six|mx)(--|-|_| )(ngied)(s)(\b)/gi,'$1$2$3ˇ$5'],

    // 二疊字變調
    [/([a-z]{1,6})([zvsx])(-|_| )(\1)(\2)(\b)/gi,'$1$3$4$5$6'],
    [/([a-z]{1,6})()(-|_| )(\1)(\2)(\b)/gi,'$1$3$4$5$6'],

    // 二字變調
    // c-zvsx;
    [/([aeiouymng])()(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvxs]{0,1})(\b)/gi,'$1⁺$3$4$5$6$7'],
    // x-zvs;
    [/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymngbd]{1,5})([zvs]{0,1})(\b)/gi,'$1ˇ$3$4$5$6$7'],
    // x-x;
    [/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi,'$1$3$4$5$6$7'],
    // z-zvsx;
    [/([aeiouymngbd])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvxs]{0,1})(\b)/gi,'$1$3$4$5$6$7'],
    // s-zvsx;
    [/([aeiouymngbd])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvxs]{0,1})(\b)/gi,'$1⁺$3$4$5$6$7'],
	// 移除;
	[//gi, ""],
    ]
    return function replaceKasuToneToBian(t) {
      if (t == null) return ""
      let s = String(t)
      for (const [re, rep] of R) {
        s = s.replace(re, rep)
      }
      return s
    }
  })()

  // Shared regex and helpers
  const RE = {
    multi: /\w+(?:-+\w+)+/,
    punctRemove: /[,?:;!'".]/g,
    splitSpacePunct: /[^a-z0-9_-]+/i,
    splitSymbolsZhao: /[^a-z0-9-]+/i,
  }

  // 共用：Kasu 系列 Sandhi 正規化＋快取（zhao/zhaoan）
  const __kasuSandhiMemo = new Map()
  function sandhiKasuNormalize(input) {
    const key = String(input || "").toLowerCase()
    if (__kasuSandhiMemo.has(key)) return __kasuSandhiMemo.get(key)
    const out = replaceKasuToneToBian(key)
      .replace(/ˇ/g, "v")
      .replace(/⁺/g, "f")
      .replace(/[_\s]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
    __kasuSandhiMemo.set(key, out)
    return out
  }

  // 共用：Kasu 系列 URL 映射（kasu / zhao / zhaoan）
  function toKasuUrls(tokens) {
    return (tokens || []).map((txt) => {
      return RE.multi.test(txt)
        ? `https://oikasu1.github.io/snd/mp3kasu/${txt}.mp3`
        : `https://oikasu1.github.io/snd/mp3all/${txt}.mp3`
    })
  }

  function convertNumber(num) {
    if (typeof num !== "number" || isNaN(num)) return null
    if (num < 1000) return `0/${num}`
    const thousands = Math.floor(num / 1000)
    return `${thousands}/${num}`
  }

  // --- Split helpers ---
  function splitBySpaceAndPunct(s) {
    return String(s || "")
      .split(RE.splitSpacePunct)
      .map((part) => part.replace(/^-+|-+$/g, "").toLowerCase())
      .filter(Boolean)
  }
  function splitBySymbolsForZhao(s) {
    return String(s || "")
      .split(RE.splitSymbolsZhao)
      .map((part) =>
        part
          .replace(/-+/g, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase(),
      )
      .filter(Boolean)
  }

  // 通用 memoizer（版本 + key）
  function memoizeByVersion(cache, getVersion, fn) {
    return (s) => {
      const key = getVersion() + "|" + String(s || "")
      if (cache.has(key)) return cache.get(key)
      const res = fn(s)
      cache.set(key, res)
      return res
    }
  }

  // zhao / zhaoan tokenization memo（依 kasu 字典版本）
  const __tokenizeMemo = {
    zhao: new Map(),
    zhaoan: new Map(),
    xiien: new Map(),
    sixian: new Map(),
    hoiliug: new Map(),
    hailu: new Map(),
    taipu: new Map(),
    dapu: new Map(),
    ngiaupin: new Map(),
    raoping: new Map(),
    // 新增：
    holo: new Map(),
    kasu: new Map(),
  }
  const getKasuVersion = () => dictVersion.kasu
  // 新增
  const getHoloVersion = () => dictVersion.holo
  // Hakka 版本 getters
  const getSixianVersion = () => dictVersion.sixian
  const getHailuVersion = () => dictVersion.hailu
  const getDapuVersion = () => dictVersion.dapu
  const getRaopingVersion = () => dictVersion.raoping

  // Hakka 工廠：支援 origins 與快取
  const ORIGIN_DIALECT = "dialect"
  const ORIGIN_HAKKA = "hakka"
  function makeHakkaConfig({
    match,
    dictGetter,
    toneToBian,
    dialectBase, // 'sixian' | 'hailu' | 'dapu' | 'raoping'
    splitMode, // 'symbols' | 'space'
    addHyphenOnSpace, // boolean
    getVersion,
    cache,
  }) {
    function preprocess(s) {
      let out = replaceToneToZvsxf_keepPunct(s || "")
      if (addHyphenOnSpace) {
        out = out
          .replace(/[_\s]+/g, "-")
          .replace(/-+/g, "-")
          .trim()
      }
      return out
    }
    function computeTokensWithOrigins(s) {
      const parts =
        splitMode === "symbols" ? splitBySymbolsForZhao((s || "").replace(/-+/g, "-")) : splitBySpaceAndPunct(s || "")
      const tokens = []
      const origins = []
      const dict = dictGetter()
      for (const part of parts) {
        const base = String(part)
          .replace(/_/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase()
        if (!base) continue

        if (dict[base] !== undefined) {
          tokens.push(base)
          origins.push(ORIGIN_DIALECT)
          continue
        }

        // fallback sandhi → single syllables
        let sandhi = toneToBian(base)
        sandhi = String(sandhi)
          .replace(/ˇ/g, "v")
          .replace(/⁺/g, "f")
          .replace(/[_\s]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase()
        if (!sandhi) continue

        if (RE.multi.test(sandhi)) {
          const parts = sandhi.split(/-+/).filter(Boolean)
          for (const p of parts) {
            tokens.push(p)
            origins.push(ORIGIN_HAKKA)
          }
        } else {
          tokens.push(sandhi)
          origins.push(ORIGIN_HAKKA)
        }
      }
      return { tokens, origins }
    }
    const tokenizeWithOrigins = memoizeByVersion(cache, getVersion, computeTokensWithOrigins)
    function tokenize(s) {
      const { tokens } = tokenizeWithOrigins(s)
      return tokens
    }
    function toUrls(tokens, _opts, origins) {
      const useOrigins = Array.isArray(origins) && origins.length === tokens.length
      return (tokens || []).map((txt, i) => {
        if (useOrigins) {
          return origins[i] === ORIGIN_DIALECT
            ? `https://oikasu1.github.io/snd/mp3${dialectBase}/${txt}.mp3`
            : `https://oikasu1.github.io/snd/mp3all/${txt}.mp3`  //`https://oikasu1.github.io/snd/mp3hakka/${txt}.mp3`
        }
        // 後備：若無 origins（理論上不會發生），以舊啟發式處理
        return RE.multi.test(txt)
          ? `https://oikasu1.github.io/snd/mp3${dialectBase}/${txt}.mp3`
          : `https://oikasu1.github.io/snd/mp3all/${txt}.mp3` //`https://oikasu1.github.io/snd/mp3hakka/${txt}.mp3`
      })
    }
    return {
      match,
      preprocess,
      tokenize,
      tokenizeWithOrigins,
      toUrls,
      defaults: { rate: 1, skipStart: 0, skipEnd: 0 },
    }
  }

  // zhao / zhaoan base tokenizers + memo
  function zhaoTokenizeBase(s) {
    const parts = splitBySymbolsForZhao((s || "").replace(/-+/g, "-"))
    const tokens = []
    for (const part of parts) {
      const sandhi = sandhiKasuNormalize(part)
      if (!sandhi) continue
      if (dictionaryKasu[sandhi] !== undefined) {
        tokens.push(sandhi)
        continue
      }
      if (RE.multi.test(sandhi)) {
        tokens.push(...sandhi.split(/-+/).filter(Boolean))
      } else {
        tokens.push(sandhi)
      }
    }
    return tokens
  }
  function zhaoanTokenizeBase(s) {
    const parts = splitBySpaceAndPunct(s)
    const tokens = []
    for (const part of parts) {
      const base = part
        .replace(/_/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase()
      if (!base) continue
      const sandhi = sandhiKasuNormalize(base)
      if (!sandhi) continue
      if (dictionaryKasu[sandhi] !== undefined) {
        tokens.push(sandhi)
        continue
      }
      if (RE.multi.test(sandhi)) {
        tokens.push(...sandhi.split(/-+/).filter(Boolean))
      } else {
        tokens.push(sandhi)
      }
    }
    return tokens
  }

  function holoTokenizeBase(s) {
    const words = splitBySpaceAndPunct(s)
    const single = words.map((element, index, array) => {
      const txtA = element
      const txtB = bianMemo(element)
      if (index === array.length - 1) return txtA
      return dictionaryHolo[txtB] === undefined ? txtA : txtB
    })
    const tokens = single.flatMap((el) => {
      if (RE.multi.test(el) && dictionaryHolo[el] === undefined) {
        const rawParts = el.split(/-+/)
        const converted = rawParts.map(replaceHoloToneToChange)
        for (let i = 0; i < converted.length; i++) {
          if (dictionaryHolo[converted[i]] === undefined) converted[i] = rawParts[i]
        }
        return converted
      }
      return [el]
    })
    return tokens
  }
  const tokenizeHoloMemo = memoizeByVersion(__tokenizeMemo.holo, getHoloVersion, holoTokenizeBase)

  function kasuTokenizeBase(s) {
    let tokens = splitBySpaceAndPunct(s).map((w) => w.replace(/_/g, "-").replace(/-+/g, "-"))
    tokens = tokens.flatMap((el) => {
      if (RE.multi.test(el) && dictionaryKasu[el] == undefined) {
        return el.split(/-+/)
      }
      return [el]
    })
    return tokens
  }
  const tokenizeKasuMemo = memoizeByVersion(__tokenizeMemo.kasu, getKasuVersion, kasuTokenizeBase)

  const tokenizeZhaoMemo = memoizeByVersion(__tokenizeMemo.zhao, getKasuVersion, zhaoTokenizeBase)
  const tokenizeZhaoanMemo = memoizeByVersion(__tokenizeMemo.zhaoan, getKasuVersion, zhaoanTokenizeBase)

  const LANG = {
    HOLO: /^(holo|ho|minnan|min|m)$/i,
    KASU: /^(kasu|ka|k)$/i,
    EN: /^(english|eng|en|e)$/i,
    NO: /^no$/i,
    ZHAO: /^(zhao)$/i,
    ZHAOAN: /^(zhaoan)$/i,

    XIIEN: /^(xiien)$/i,
    SIXIAN: /^(sixian)$/i,
    HOILIUG: /^(hoiliug)$/i,
    HAILU: /^(hailu)$/i,
    TAIPU: /^(taipu)$/i,
    DAPU: /^(dapu)$/i,
    NGIAUPIN: /^(ngiaupin)$/i,
    RAOPING: /^(raoping)$/i,
  }
  function toTokens(input) {
    return String(input || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
  }

  const LanguageConfigs = {
    holo: {
      match: LANG.HOLO,
      preprocess: (s) => tailuoToZvsxfl_keepPunct(s),
      tokenize: tokenizeHoloMemo,
      // origins 對 holo 無意義，忽略
      toUrls: (tokens, opts) => {
        const urls = []
        for (const txt of tokens) {
          const num = dictionaryHolo[txt]
          const folder = convertNumber(num)
          if (!folder) {
            if (opts && opts.skipUnknown) continue
            urls.push("https://oikasu1.github.io/snd/mp3all/no-snd.mp3")
          } else {
            urls.push(`https://sutian.moe.edu.tw/media/senn/mp3/imtong/subak/${folder}.mp3`)
          }
        }
        return urls
      },
      defaults: { rate: 1, skipStart: 0, skipEnd: 0 },
    },

    kasu: {
      match: LANG.KASU,
      preprocess: (s) => replaceToneToZvsxf_keepPunct(s),
      tokenize: tokenizeKasuMemo,
      toUrls: (tokens) => toKasuUrls(tokens),
      defaults: { rate: 1, skipStart: 0, skipEnd: 0 },
    },

    zhao: {
      match: LANG.ZHAO,
      preprocess: (s) => {
        let out = replaceToneToZvsxf_keepPunct(s || "")
        out = out
          .replace(/[_\s]+/g, "-")
          .replace(/-+/g, "-")
          .trim()
        return out
      },
      tokenize: tokenizeZhaoMemo,
      toUrls: (tokens) => toKasuUrls(tokens),
      defaults: { rate: 1, skipStart: 0, skipEnd: 0 },
    },

    zhaoan: {
      match: LANG.ZHAOAN,
      preprocess: (s) => replaceToneToZvsxf_keepPunct(s || ""),
      tokenize: tokenizeZhaoanMemo,
      toUrls: (tokens) => toKasuUrls(tokens),
      defaults: { rate: 1, skipStart: 0, skipEnd: 0 },
    },

    // Hakka：xiien/sixian、hoiliug/hailu、taipu/dapu、ngiaupin/raoping
    xiien: makeHakkaConfig({
      match: LANG.XIIEN,
      dictGetter: () => dictionarySixian,
      toneToBian: replaceSixianToneToBian,
      dialectBase: "sixian",
      splitMode: "symbols",
      addHyphenOnSpace: true,
      getVersion: getSixianVersion,
      cache: __tokenizeMemo.xiien,
    }),
    sixian: makeHakkaConfig({
      match: LANG.SIXIAN,
      dictGetter: () => dictionarySixian,
      toneToBian: replaceSixianToneToBian,
      dialectBase: "sixian",
      splitMode: "space",
      addHyphenOnSpace: false,
      getVersion: getSixianVersion,
      cache: __tokenizeMemo.sixian,
    }),
    hoiliug: makeHakkaConfig({
      match: LANG.HOILIUG,
      dictGetter: () => dictionaryHailu,
      toneToBian: replaceHailuToneToBian,
      dialectBase: "hailu",
      splitMode: "symbols",
      addHyphenOnSpace: true,
      getVersion: getHailuVersion,
      cache: __tokenizeMemo.hoiliug,
    }),
    hailu: makeHakkaConfig({
      match: LANG.HAILU,
      dictGetter: () => dictionaryHailu,
      toneToBian: replaceHailuToneToBian,
      dialectBase: "hailu",
      splitMode: "space",
      addHyphenOnSpace: false,
      getVersion: getHailuVersion,
      cache: __tokenizeMemo.hailu,
    }),
    taipu: makeHakkaConfig({
      match: LANG.TAIPU,
      dictGetter: () => dictionaryDapu,
      toneToBian: replaceDapuToneToBian,
      dialectBase: "dapu",
      splitMode: "symbols",
      addHyphenOnSpace: true,
      getVersion: getDapuVersion,
      cache: __tokenizeMemo.taipu,
    }),
    dapu: makeHakkaConfig({
      match: LANG.DAPU,
      dictGetter: () => dictionaryDapu,
      toneToBian: replaceDapuToneToBian,
      dialectBase: "dapu",
      splitMode: "space",
      addHyphenOnSpace: false,
      getVersion: getDapuVersion,
      cache: __tokenizeMemo.dapu,
    }),
    ngiaupin: makeHakkaConfig({
      match: LANG.NGIAUPIN,
      dictGetter: () => dictionaryRaoping,
      toneToBian: replaceDapuToneToBian, // 依需求：fallback 用 Dapu 變調
      dialectBase: "raoping",
      splitMode: "symbols",
      addHyphenOnSpace: true,
      getVersion: getRaopingVersion,
      cache: __tokenizeMemo.ngiaupin,
    }),
    raoping: makeHakkaConfig({
      match: LANG.RAOPING,
      dictGetter: () => dictionaryRaoping,
      toneToBian: replaceDapuToneToBian, // 依需求：fallback 用 Dapu 變調
      dialectBase: "raoping",
      splitMode: "space",
      addHyphenOnSpace: false,
      getVersion: getRaopingVersion,
      cache: __tokenizeMemo.raoping,
    }),

    en: {
      match: LANG.EN,
      preprocess: (s) => s,
      tokenize: toTokens,
      toUrls: (tokens) =>
        tokens.map(
          (t) => `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(t)}`,
        ),
      defaults: { rate: 1, skipStart: 0.01, skipEnd: 0.01 },
    },

    no: {
      match: LANG.NO,
      preprocess: (s) => s,
      tokenize: toTokens,
      toUrls: (tokens) => tokens,
      defaults: { rate: 1, skipStart: 0.1, skipEnd: 0.1 },
    },
  }
  function getLangConfig(lang) {
    const key = Object.keys(LanguageConfigs).find((k) => LanguageConfigs[k].match.test(lang))
    return key ? LanguageConfigs[key] : null
  }

  // --- Icon helpers (no auto-insert) ---
  const ICON_IDLE = "🔊"
  const ICON_PLAYING = "🔉"

  function ensureButtonIcon(el) {
    if (!el) return null
    const span = el.querySelector("[data-pa-icon]")
    if (span) return { type: "span", iconEl: span }
    let firstTextNode = null
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue && node.nodeValue.trim() !== "") {
        firstTextNode = node
        break
      }
    }
    if (!firstTextNode) return null
    const v = firstTextNode.nodeValue || ""
    if (v.startsWith(ICON_IDLE) || v.startsWith(ICON_PLAYING)) {
      return { type: "text", textNode: firstTextNode }
    }
    return null
  }
  function setButtonIcon(el, state) {
    const holder = ensureButtonIcon(el)
    if (!holder) return
    const nextIcon = state === "playing" ? ICON_PLAYING : ICON_IDLE
    if (holder.type === "span") {
      holder.iconEl.textContent = nextIcon
      return
    }
    const v = holder.textNode.nodeValue || ""
    const iconLen = ICON_IDLE.length
    if (v.startsWith(ICON_IDLE) || v.startsWith(ICON_PLAYING)) {
      const rest = v.slice(iconLen)
      holder.textNode.nodeValue = nextIcon + rest
    }
  }

  // --- Player ---
  class SequentialAudioPlayer {
    constructor({
      rate = 1,
      skipStart = 0,
      skipEnd = 0,
      fallbackUrl = "https://oikasu1.github.io/snd/mp3all/no-snd.mp3",
    } = {}) {
      this.rate = rate
      this.skipStart = skipStart
      this.skipEnd = skipEnd
      this.fallbackUrl = fallbackUrl
      this._audio = null
      this._queue = []
      this._iconEl = null
      this._onState = null
    }
    onStateChange(fn) {
      this._onState = fn
    }
    preload(urls) {
      ;[...new Set(urls || [])].forEach((u) => {
        const a = new Audio(u)
        a.preload = "auto"
      })
    }
    stop() {
      if (this._audio)
        try {
          this._audio.pause()
        } catch {}
      this._audio = null
      if (this._iconEl) setButtonIcon(this._iconEl, "idle")
    }
    play(urls, iconEl) {
      if (!Array.isArray(urls) || urls.length === 0) return
      const sameButton = this._iconEl && iconEl && this._iconEl === iconEl
      if (sameButton && this.isPlaying()) {
        this.stop()
        this._emit && this._emit("stopped")
        return
      }
      this.stop()
      this._iconEl = iconEl || null
      this._queue = urls.slice()
      this._next()
    }
    isPlaying() {
      return !!(this._audio && !this._audio.paused)
    }
    _emit(type, payload) {
      if (typeof this._onState === "function") this._onState(type, payload)
    }
    _next() {
      if (this._queue.length === 0) {
        if (this._iconEl) setButtonIcon(this._iconEl, "idle")
        this._emit("endedAll")
        return
      }
      const url = this._queue.shift()
      const audio = new Audio(url)
      audio.playbackRate = this.rate
      audio.currentTime = this.skipStart

      const cleanup = () => {
        audio.removeEventListener("ended", onEnded)
        audio.removeEventListener("timeupdate", onTimeUpdate)
        audio.removeEventListener("error", onError)
      }
      const onEnded = () => {
        cleanup()
        this._next()
      }
      const onTimeUpdate = () => {
        if (this.skipEnd > 0 && audio.duration && audio.duration - audio.currentTime <= this.skipEnd) {
          cleanup()
          this._next()
        }
      }
      const onError = () => {
        cleanup()
        const fb = new Audio(this.fallbackUrl)
        fb.onended = () => this._next()
        fb.onerror = () => this._next()
        fb.play().catch(() => this._next())
      }

      this._audio = audio
      if (this._iconEl) setButtonIcon(this._iconEl, "playing")
      this._emit("playing", url)

      audio.addEventListener("ended", onEnded)
      audio.addEventListener("timeupdate", onTimeUpdate)
      audio.addEventListener("error", onError)

      audio.play().catch(onError)
    }
  }

  let sharedPlayer = null

  const api = {
    // Dictionary setters/getters
    setHoloDictString(str) {
      holoSeed = String(str || "")
      dictionaryHolo = parseHoloData(holoSeed)
      dictVersion.holo++
      // 新增：清理 holo tokenize 快取
      __tokenizeMemo.holo.clear()
    },
    setKasuDictString(str) {
      kasuSeed = String(str || "")
      dictionaryKasu = parseKasuData(kasuSeed)
      dictVersion.kasu++
      // 既有
      __tokenizeMemo.zhao.clear()
      __tokenizeMemo.zhaoan.clear()
      __kasuSandhiMemo.clear()
      // 新增：清理 kasu tokenize 快取
      __tokenizeMemo.kasu.clear()
    },

    // Hakka seed setters + 版本遞增 + 快取清空
    setSixianDictString(str) {
      sixianSeed = String(str || "")
      dictionarySixian = parseKasuData(sixianSeed)
      dictVersion.sixian++
      __tokenizeMemo.xiien.clear()
      __tokenizeMemo.sixian.clear()
    },
    setHailuDictString(str) {
      hailuSeed = String(str || "")
      dictionaryHailu = parseKasuData(hailuSeed)
      dictVersion.hailu++
      __tokenizeMemo.hoiliug.clear()
      __tokenizeMemo.hailu.clear()
    },
    setDapuDictString(str) {
      dapuSeed = String(str || "")
      dictionaryDapu = parseKasuData(dapuSeed)
      dictVersion.dapu++
      __tokenizeMemo.taipu.clear()
      __tokenizeMemo.dapu.clear()
    },
    setRaopingDictString(str) {
      raopingSeed = String(str || "")
      dictionaryRaoping = parseKasuData(raopingSeed)
      dictVersion.raoping++
      __tokenizeMemo.ngiaupin.clear()
      __tokenizeMemo.raoping.clear()
    },

    getHoloDict() {
      return { ...dictionaryHolo }
    },
    getKasuDict() {
      return { ...dictionaryKasu }
    },
    getSixianDict() {
      return { ...dictionarySixian }
    },
    getHailuDict() {
      return { ...dictionaryHailu }
    },
    getDapuDict() {
      return { ...dictionaryDapu }
    },
    getRaopingDict() {
      return { ...dictionaryRaoping }
    },

    // Resolve to tokens/urls（支援 origins）
    resolve(lang, input, options = {}) {
      const cfg = getLangConfig(lang)
      if (!cfg) throw new Error("未知語言: " + lang)
      const pre = cfg.preprocess(input || "")

      let tokens, origins
      if (typeof cfg.tokenizeWithOrigins === "function") {
        const res = cfg.tokenizeWithOrigins(pre)
        tokens = res.tokens
        origins = res.origins
      } else {
        tokens = cfg.tokenize(pre)
      }

      const urls = cfg.toUrls(tokens, options, origins)
      return { tokens, urls, defaults: cfg.defaults }
    },

    resolveBatch(lang, inputs, options = {}) {
      if (!Array.isArray(inputs)) throw new Error("resolveBatch 需要 string[]")
      const cfg = getLangConfig(lang)
      if (!cfg) throw new Error("未知語言: " + lang)

      const groups = []
      let allTokens = []
      let allOrigins = null
      const hasOrigins = typeof cfg.tokenizeWithOrigins === "function"

      for (let i = 0; i < inputs.length; i++) {
        const pre = cfg.preprocess(inputs[i] || "")
        let localTokens, localOrigins
        if (hasOrigins) {
          const r = cfg.tokenizeWithOrigins(pre)
          localTokens = r.tokens
          localOrigins = r.origins
        } else {
          localTokens = cfg.tokenize(pre)
        }

        const start = allTokens.length
        allTokens = allTokens.concat(localTokens)
        const end = allTokens.length
        groups.push({ index: i, tokenRange: [start, end] })

        if (hasOrigins) {
          if (!allOrigins) allOrigins = []
          allOrigins = allOrigins.concat(localOrigins)
        }
      }

      const urls = cfg.toUrls(allTokens, options, allOrigins || undefined)

      let acc = 0
      const groupUrls = groups.map((g) => {
        const [s, e] = g.tokenRange
        const len = e - s
        const urlRange = [acc, acc + len]
        const urlsSlice = urls.slice(acc, acc + len)
        acc += len
        return { index: g.index, tokenRange: g.tokenRange, urlRange, urls: urlsSlice }
      })

      return { tokens: allTokens, urls, groups: groupUrls, defaults: cfg.defaults }
    },

    // Player
    createPlayer(params) {
      return new SequentialAudioPlayer(params)
    },
    preload(urls) {
      new SequentialAudioPlayer().preload(urls)
    },

    // High-level play
    stop() {
      if (sharedPlayer) sharedPlayer.stop()
    },
    play(element, lang, input, params = {}) {
      const { rate, skipStart, skipEnd, skipUnknown = true, onStateChange } = params
      const { tokens, urls, defaults } = api.resolve(lang, input, { skipUnknown })

      if (!sharedPlayer) {
        sharedPlayer = new SequentialAudioPlayer({
          rate: typeof rate === "number" ? rate : defaults.rate,
          skipStart: typeof skipStart === "number" ? skipStart : defaults.skipStart,
          skipEnd: typeof skipEnd === "number" ? skipEnd : defaults.skipEnd,
        })
      } else {
        sharedPlayer.rate = typeof rate === "number" ? rate : defaults.rate
        sharedPlayer.skipStart = typeof skipStart === "number" ? skipStart : defaults.skipStart
        sharedPlayer.skipEnd = typeof skipEnd === "number" ? skipEnd : defaults.skipEnd
      }

      if (typeof onStateChange === "function") sharedPlayer.onStateChange(onStateChange)

      sharedPlayer.preload(urls)
      sharedPlayer.play(urls, element || null)

      return { tokens, urls, player: sharedPlayer }
    },
    isPlaying() {
      return !!(sharedPlayer && sharedPlayer.isPlaying && sharedPlayer.isPlaying())
    },

    // Compatibility helpers
    holo(e, url, params = {}) {
      const pre = tailuoToZvsxfl_keepPunct(url)
      return api.play(e, "holo", pre, params)
    },
    kasu(e, url, params = {}) {
      const pre = replaceToneToZvsxf_keepPunct(url)
      return api.play(e, "kasu", pre, params)
    },
    p(e, lang, url, params = {}) {
      return api.play(e, lang, url, params)
    },
  }

  // Apply seeds if present
  if (root && root.PinyinAudioSeeds) {
    if (root.PinyinAudioSeeds.holoSeed) api.setHoloDictString(root.PinyinAudioSeeds.holoSeed)
    if (root.PinyinAudioSeeds.kasuSeed) api.setKasuDictString(root.PinyinAudioSeeds.kasuSeed)
    if (root.PinyinAudioSeeds.sixianSeed) api.setSixianDictString(root.PinyinAudioSeeds.sixianSeed)
    if (root.PinyinAudioSeeds.hailuSeed) api.setHailuDictString(root.PinyinAudioSeeds.hailuSeed)
    if (root.PinyinAudioSeeds.dapuSeed) api.setDapuDictString(root.PinyinAudioSeeds.dapuSeed)
    if (root.PinyinAudioSeeds.raopingSeed) api.setRaopingDictString(root.PinyinAudioSeeds.raopingSeed)
  }

  return api
})