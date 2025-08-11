/* --------- UI 介面綁定（localStorage 保存切換 + 清單播放/刪除/清空 + 圖示按鈕 + 去重 + 正確高亮 + URL 參數同步 + 分享連結） --------- */
;(function initPage() {
  const elInput = document.getElementById("input")
  const elLang = document.getElementById("lang")
  const elResults = document.getElementById("results")
  const btnParse = document.getElementById("btnResolve")
  const btnPlay = document.getElementById("btnPlay")
  const btnInputClear = document.getElementById("btnInputClear")
  const btnSaveAll = document.getElementById("saveAll")
  const btnClearAll = document.getElementById("clearAll")

  if (!elInput || !elLang || !elResults) return

  const STORAGE_SAVED_ENTRIES = "pinyin-audio-saved-entries-v1"

  // 條目資料（最新在最前面）
  let entrySeq = 0
  const entries = new Map() // id -> entry
  const order = [] // [id, ...] 最新在 0

  // 記錄解析歷史（用於檢查完整輸入是否重複）
  const parseHistory = new Set() // 存儲 "lang:input" 的組合

  // 已保存的條目
  const savedEntries = new Set() // 存儲已保存的條目 ID

  // 播放狀態
  let playSession = 0
  let active = null // { id, kind:'entry'|'single', entryId?, index, fromTop? }

  // ============ 摺疊功能 ============
  function initCollapsible() {
    const collapseBtns = document.querySelectorAll(".collapse-btn")

    collapseBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.target
        const card = document.getElementById(targetId)
        if (!card) return

        const isCollapsed = card.classList.contains("collapsed")
        const icon = btn.querySelector(".collapse-icon")

        if (isCollapsed) {
          card.classList.remove("collapsed")
          icon.textContent = "−"
          btn.setAttribute("aria-label", "摺疊此區塊")
        } else {
          card.classList.add("collapsed")
          icon.textContent = "+"
          btn.setAttribute("aria-label", "展開此區塊")
        }
      })
    })
  }

  function collapseCard(cardId) {
    const card = document.getElementById(cardId)
    const btn = document.querySelector(`[data-target="${cardId}"]`)
    if (!card || !btn) return

    card.classList.add("collapsed")
    const icon = btn.querySelector(".collapse-icon")
    if (icon) {
      icon.textContent = "+"
      btn.setAttribute("aria-label", "展開此區塊")
    }
  }

  // ============ URL 參數工具 ============

  function parseSearchParams() {
    try {
      let qs = location.search || ""
      if (qs.startsWith("?")) qs = qs.slice(1)
      // 容錯：把多餘的 '?' 轉成 '&'，如 '?lang=holo?data=...'
      qs = qs.replace(/\?/g, "&")
      return new URLSearchParams(qs)
    } catch {
      return new URLSearchParams()
    }
  }

  // 僅以 lang 參數更新網址（移除 input/data 等），不重載頁面（replaceState）[^1]
  function setUrlLangOnly(lang) {
    try {
      const params = new URLSearchParams()
      if (lang) params.set("lang", lang)
      const qs = params.toString()
      const next = qs ? `${location.pathname}?${qs}` : location.pathname
      window.history.replaceState(null, "", next) // 不重載頁面
    } catch {}
  }

  // 產生分享連結（含 lang 與 data）
  function buildShareUrl(lang, data) {
    const u = new URL(location.href)
    u.search = "" // 清空既有查詢
    const params = new URLSearchParams()
    if (lang) params.set("lang", lang)
    if (data != null) params.set("data", data)
    u.search = params.toString()
    return u.toString()
  }

  async function shareTextUrl(url) {
    try {
      await navigator.clipboard.writeText(url)
      alert("已複製分享連結到剪貼簿。")
    } catch (e) {
      alert("複製失敗，請手動複製此連結：\n" + url)
    }
  }

  // 初始化：讀取 ?lang / ?input / ?data
  function applyUrlParamsOnLoad() {
    try {
      const params = parseSearchParams()
      const urlLang = params.get("lang")
      const rawInput = params.get("input")
      const rawData = params.get("data")
      const urlInput = rawInput != null ? rawInput.replace(/\+/g, " ") : null
      const urlData = rawData != null ? rawData.replace(/\+/g, " ") : null

      if (urlLang && elLang.querySelector(`option[value="${urlLang}"]`)) {
        elLang.value = urlLang
      }

      // input：放入 textarea（舊需求）
      let usedAnyParam = false
      if (urlInput != null) {
        elInput.value = urlInput
        usedAnyParam = true
      }

      // data：不放 textarea，直接新增一筆解析結果
      if (urlData != null) {
        addEntryFromData(elLang.value, urlData)
        usedAnyParam = true
        // 當有 data 參數時，自動摺疊輸入區塊以凸顯解析結果
        setTimeout(() => collapseCard("input-card"), 100)
      }

      // 若使用了 input 或 data 參數，載入後把網址恢復成只保留 lang
      if (usedAnyParam) {
        setUrlLangOnly(elLang.value)
      }
    } catch {}
  }

  // 語言切換 → 立即把 lang 同步到網址（不重載頁面）[^1]
  elLang.addEventListener("change", () => {
    setUrlLangOnly(elLang.value)
  })

  // ============ 保存功能 ============
  function loadSavedEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_SAVED_ENTRIES)
      if (!raw) return
      const savedData = JSON.parse(raw)
      if (!Array.isArray(savedData)) return

      // 按保存時間倒序排列（最新保存的在最上面）
      savedData.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0))

      // 為每個已保存的項目創建解析結果
      for (const item of savedData) {
        if (!item || !item.lang || !item.tokens) continue

        const entry = createEntry({
          lang: item.lang,
          input: item.input || "",
          tokens: item.tokens,
          save: false,
        })

        if (entry) {
          // 插入到 DOM（最新的在最上面）
          elResults.prepend(entry.el)
          order.unshift(entry.id)

          // 標記為已保存
          savedEntries.add(entry.id)
          entry.saveBtn.disabled = true
          entry.saveBtn.textContent = "已存"
          entry.saveBtn.setAttribute("aria-label", "已存此解析結果")
        }
      }
    } catch (e) {
      console.warn("載入已保存項目失敗:", e)
    }
  }

  function saveEntry(entryId) {
    const entry = entries.get(entryId)
    if (!entry) return false

    try {
      // 讀取現有的已保存條目
      let savedData = []
      const raw = localStorage.getItem(STORAGE_SAVED_ENTRIES)
      if (raw) {
        savedData = JSON.parse(raw)
        if (!Array.isArray(savedData)) savedData = []
      }

      // 檢查是否已經保存過
      const existingIndex = savedData.findIndex((item) => item.lang === entry.lang && item.input === entry.input)

      const entryData = {
        lang: entry.lang,
        input: entry.input,
        tokens: entry.tokens,
        savedAt: new Date().toISOString(),
      }

      if (existingIndex >= 0) {
        // 更新現有條目
        savedData[existingIndex] = entryData
      } else {
        // 添加新條目
        savedData.push(entryData)
      }

      localStorage.setItem(STORAGE_SAVED_ENTRIES, JSON.stringify(savedData))
      savedEntries.add(entryId)

      // 更新按鈕狀態
      if (entry.saveBtn) {
        entry.saveBtn.disabled = true
        entry.saveBtn.textContent = "已存"
        entry.saveBtn.setAttribute("aria-label", "已存此解析結果")
      }

      return true
    } catch (e) {
      console.warn("保存條目失敗:", e)
      return false
    }
  }

  function saveAllEntries() {
    let savedCount = 0
    for (const id of order) {
      const entry = entries.get(id)
      if (entry && !savedEntries.has(id)) {
        if (saveEntry(id)) {
          savedCount++
        }
      }
    }

    if (savedCount > 0) {
      console.log(`已保存 ${savedCount} 個解析結果`)
    } else {
      console.log("所有解析結果都已經保存過了")
    }
  }

  // 從 localStorage 中移除特定的已保存項目
  function removeSavedEntry(lang, input) {
    try {
      const raw = localStorage.getItem(STORAGE_SAVED_ENTRIES)
      if (!raw) return false

      let savedData = JSON.parse(raw)
      if (!Array.isArray(savedData)) return false

      // 過濾掉要刪除的項目
      const originalLength = savedData.length
      savedData = savedData.filter((item) => !(item.lang === lang && item.input === (input || "").trim()))

      // 如果有項目被移除，更新 localStorage
      if (savedData.length < originalLength) {
        localStorage.setItem(STORAGE_SAVED_ENTRIES, JSON.stringify(savedData))
        return true
      }

      return false
    } catch (e) {
      console.warn("移除已保存項目失敗:", e)
      return false
    }
  }

  // 清空所有已保存項目
  function clearAllSavedEntries() {
    try {
      localStorage.removeItem(STORAGE_SAVED_ENTRIES)
      return true
    } catch (e) {
      console.warn("清空已保存項目失敗:", e)
      return false
    }
  }

  // 頂部播放圖示切換
  function setTopPlayState(isPlaying) {
    if (!btnPlay) return
    btnPlay.textContent = isPlaying ? "◼" : "▶"
    btnPlay.setAttribute("aria-label", isPlaying ? "停止" : "播放")
  }

  // 高亮控制
  function clearHighlights(entry) {
    ;(entry?.tokenSpans || []).forEach((s) => s.classList.remove("playing"))
  }
  function setHighlight(entry, idx) {
    ;(entry?.tokenSpans || []).forEach((s, i) => {
      if (i === idx) s.classList.add("playing")
      else s.classList.remove("playing")
    })
  }

  // 停止播放並復原 UI
  function stopActive(reason = "user") {
    if (active) {
      const prev = active
      if (prev.kind === "entry") {
        const e = entries.get(prev.entryId)
        if (e && e.playBtn) {
          e.playBtn.textContent = "▶"
          e.playBtn.setAttribute("aria-label", "播放此解析結果")
        }
        if (prev.fromTop) setTopPlayState(false)
        if (e) clearHighlights(e)
      } else if (prev.kind === "single") {
        const e = entries.get(prev.entryId)
        if (e) clearHighlights(e)
      }
      active = null
    }
    try {
      window.PinyinAudio.stop()
    } catch {}
  }

  function clearAllEntries() {
    stopActive("clear-all")

    // 清空 DOM 與資料
    elResults.innerHTML = ""
    entries.clear()
    order.length = 0
    parseHistory.clear() // 清空解析歷史
    savedEntries.clear() // 清空已保存記錄

    // 清空所有 localStorage 數據
    clearAllSavedEntries() // 清空已保存項目

    setTopPlayState(false)

    console.log("已清空所有解析結果和保存數據")
  }

  // 檢查完整輸入是否已經解析過
  function isInputAlreadyParsed(lang, input) {
    const key = `${lang}:${input.trim()}`
    return parseHistory.has(key)
  }

  // 記錄解析歷史
  function recordParseHistory(lang, input) {
    const key = `${lang}:${input.trim()}`
    parseHistory.add(key)
  }

  // 檢查條目是否已經保存過
  function isEntrySaved(lang, input) {
    try {
      const raw = localStorage.getItem(STORAGE_SAVED_ENTRIES)
      if (!raw) return false
      const savedData = JSON.parse(raw)
      if (!Array.isArray(savedData)) return false

      return savedData.some((item) => item.lang === lang && item.input === (input || "").trim())
    } catch {
      return false
    }
  }

  // 建立單筆解析結果 DOM
  function createEntry({ lang, input, tokens, save = false }) {
    const id = ++entrySeq

    const item = document.createElement("div")
    item.className = "result-item"
    item.dataset.entryId = String(id)

    const row = document.createElement("div")
    row.className = "entry-row"

    // 播放按鈕（圖示）
    const playBtn = document.createElement("button")
    playBtn.type = "button"
    playBtn.className = "btn mini entry-play"
    playBtn.textContent = "▶"
    playBtn.setAttribute("aria-label", "播放此解析結果")

    // Tokens 區塊
    const tokensBox = document.createElement("div")
    tokensBox.className = "entry-tokens"
    const tokenSpans = []
    tokens.forEach((t, i) => {
      const span = document.createElement("span")
      span.className = "token"
      span.textContent = t
      span.setAttribute("role", "button")
      span.setAttribute("tabindex", "0")
      span.addEventListener("click", () => {
        const entry = entries.get(id)
        if (entry && entry.isEditing) {
          enterTokenEditMode(span, id, i)
        } else {
          playSingleToken(id, i, t)
        }
      })
      span.addEventListener("keydown", (e) => {
        const entry = entries.get(id)
        if (entry && entry.isEditing) {
          if (e.key === "Enter") {
            e.preventDefault()
            exitTokenEditMode(span, id, i)
          } else if (e.key === "Escape") {
            e.preventDefault()
            cancelTokenEdit(span, id, i)
          }
        } else {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            playSingleToken(id, i, t)
          }
        }
      })
      tokenSpans.push(span)
      tokensBox.appendChild(span)
    })

    // 右側工具：編輯、分享、保存、刪除此條
    const tail = document.createElement("div")
    tail.className = "entry-tail"

    const editBtn = document.createElement("button")
    editBtn.type = "button"
    editBtn.className = "btn mini ghost entry-edit"
    editBtn.textContent = "編輯"
    editBtn.setAttribute("aria-label", "編輯此解析結果")

    const shareBtn = document.createElement("button")
    shareBtn.type = "button"
    shareBtn.className = "btn mini ghost entry-share"
    shareBtn.textContent = "分享"
    shareBtn.setAttribute("aria-label", "分享此解析結果")
    shareBtn.addEventListener("click", async () => {
      const entry = entries.get(id)
      if (entry && entry.isEditing) return // 編輯模式下不可點擊
      const url = buildShareUrl(lang, input)
      await shareTextUrl(url)
    })

    const saveBtn = document.createElement("button")
    saveBtn.type = "button"
    saveBtn.className = "btn mini ghost entry-save"
    saveBtn.textContent = "保存"
    saveBtn.setAttribute("aria-label", "保存此解析結果")

    const delBtn = document.createElement("button")
    delBtn.type = "button"
    delBtn.className = "btn mini ghost entry-del"
    delBtn.textContent = "✕"
    delBtn.setAttribute("aria-label", "刪除此解析結果")

    tail.appendChild(editBtn)
    tail.appendChild(shareBtn)
    tail.appendChild(saveBtn)
    tail.appendChild(delBtn)

    // 組裝 row
    row.appendChild(playBtn)
    row.appendChild(tokensBox)
    row.appendChild(tail)
    item.appendChild(row)

    // 資料結構
    const entry = {
      id,
      lang,
      input,
      tokens,
      el: item,
      playBtn,
      tokenSpans,
      editBtn,
      shareBtn,
      saveBtn,
      delBtn,
      isEditing: false,
    }
    entries.set(id, entry)

    // 檢查是否已經保存過
    if (isEntrySaved(lang, input)) {
      savedEntries.add(id)
      saveBtn.disabled = true
      saveBtn.textContent = "已存"
      saveBtn.setAttribute("aria-label", "已存此解析結果")
    }

    // 編輯功能
    editBtn.addEventListener("click", () => {
      toggleEditMode(id)
    })

    // 保存功能
    saveBtn.addEventListener("click", () => {
      if (!savedEntries.has(id)) {
        saveEntry(id)
      }
    })

    // 事件：播放/停止切換（只在非編輯模式下生效）
    playBtn.addEventListener("click", () => {
      if (entry.isEditing) return // 編輯模式下不可點擊
      const isThisPlaying = active && active.kind === "entry" && active.entryId === id
      if (isThisPlaying) {
        stopActive("entry-toggle-off")
        return
      }
      playEntry(id)
    })

    // 刪除此條
    delBtn.addEventListener("click", () => {
      if (entry.isEditing) return // 編輯模式下不可點擊

      // 若正在播放此條，先停
      if (active && active.kind === "entry" && active.entryId === id) {
        stopActive("delete-entry")
      } else if (active && active.kind === "single" && active.entryId === id) {
        stopActive("delete-entry-single")
      }

      // 如果這個項目已經保存過，從 localStorage 中移除
      if (savedEntries.has(id)) {
        removeSavedEntry(entry.lang, entry.input)
      }

      // 從 UI 和內存中移除
      if (entry.el && entry.el.parentElement) entry.el.parentElement.removeChild(entry.el)
      entries.delete(id)
      savedEntries.delete(id) // 從已保存記錄中移除
      const idx = order.indexOf(id)
      if (idx >= 0) order.splice(idx, 1)
    })

    return entry
  }

  // 批次插入解析結果到 DOM（按順序）
  function insertEntriesInOrder(createdEntries) {
    if (createdEntries.length === 0) return

    // 按順序插入 DOM（第一個條目在最上面）
    const firstChild = elResults.firstChild
    createdEntries.forEach((entry) => {
      if (firstChild) {
        elResults.insertBefore(entry.el, firstChild)
      } else {
        elResults.appendChild(entry.el)
      }
    })

    // 更新 order 數組（批次內按順序，但整個批次在最前面）
    const newIds = createdEntries.map((entry) => entry.id)
    order.unshift(...newIds)
  }

  // 解析目前輸入並新增一筆（若與上一筆相同，回傳 null）
  function parseInputToEntry() {
    const lang = elLang.value
    const input = (elInput.value || "").trim()
    if (!input) return null

    // 檢查完整輸入是否已經解析過
    if (isInputAlreadyParsed(lang, input)) {
      console.log("完整輸入內容已經解析過，跳過重複解析")
      return null
    }

    // 按換行分割段落，過濾空行
    const paragraphs = input
      .split(/\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    if (paragraphs.length === 0) return null

    const createdEntries = []

    // 批次處理每個段落（不檢查個別段落重複，因為整體輸入已經是新的）
    for (const paragraph of paragraphs) {
      try {
        const { tokens } = window.PinyinAudio.resolve(lang, paragraph, { skipUnknown: true })
        const entry = createEntry({ lang, input: paragraph, tokens, save: false })
        if (entry) {
          createdEntries.push(entry)
        }
      } catch (e) {
        console.warn(`解析段落 "${paragraph}" 時發生錯誤:`, e?.message || e)
      }
    }

    // 批次插入 DOM（按行的順序）
    if (createdEntries.length > 0) {
      insertEntriesInOrder(createdEntries)
      recordParseHistory(lang, input)
    }

    // 返回第一個創建的條目（第一行）
    return createdEntries.length > 0 ? createdEntries[0] : null
  }

  // 直接以 data 字串新增一筆解析結果（不寫入 textarea）
  function addEntryFromData(lang, dataStr) {
    const s = (dataStr || "").trim()
    if (!s) return null

    try {
      const { tokens } = window.PinyinAudio.resolve(lang, s, { skipUnknown: true })
      const entry = createEntry({ lang, input: s, tokens })
      // 單筆解析結果使用 prepend
      elResults.prepend(entry.el)
      order.unshift(entry.id)
      return entry
    } catch (e) {
      console.warn("resolve-from-data error:", e?.message || e)
      return null
    }
  }

  // 播放指定 entry 的整段（正確高亮；▶/◼ 切換）
  function playEntry(entryId, { fromTop = false } = {}) {
    const entry = entries.get(entryId)
    if (!entry) return

    stopActive("switch")

    const session = ++playSession
    active = { id: session, kind: "entry", entryId, index: -1, fromTop }
    entry.playBtn.textContent = "◼"
    entry.playBtn.setAttribute("aria-label", "停止此解析結果")
    if (fromTop) setTopPlayState(true)
    clearHighlights(entry)

    // 使用虛擬的 speaker 元素進行播放
    const virtualSpeaker = document.createElement("div")
    window.PinyinAudio.play(virtualSpeaker, entry.lang, entry.input, {
      skipUnknown: true,
      onStateChange: (type) => {
        if (!active || active.id !== session) return
        if (type === "playing") {
          active.index += 1
          setHighlight(entry, active.index)
        } else if (type === "endedAll" || type === "stopped") {
          entry.playBtn.textContent = "▶"
          entry.playBtn.setAttribute("aria-label", "播放此解析結果")
          if (fromTop) setTopPlayState(false)
          clearHighlights(entry)
          active = null
        }
      },
    })
  }

  // 播放指定 entry 中的單一 token
  function playSingleToken(entryId, index, tokenText) {
    const entry = entries.get(entryId)
    if (!entry) return

    stopActive("single")

    const session = ++playSession
    active = { id: session, kind: "single", entryId, index }

    // 使用虛擬的 speaker 元素進行播放
    const virtualSpeaker = document.createElement("div")
    window.PinyinAudio.play(virtualSpeaker, entry.lang, tokenText, {
      skipUnknown: true,
      onStateChange: (type) => {
        if (!active || active.id !== session) return
        if (type === "playing") {
          setHighlight(entry, index)
        } else if (type === "endedAll" || type === "stopped") {
          clearHighlights(entry)
          active = null
        }
      },
    })
  }

  // 綁定：解析、播放、清空（頂部）
  btnParse?.addEventListener("click", () => {
    parseInputToEntry()
  })

  btnPlay?.addEventListener("click", () => {
    // 若當前是由頂部觸發的播放，再按一次即停止
    if (active && active.kind === "entry" && active.fromTop) {
      stopActive("top-toggle-off")
      return
    }

    const lang = elLang.value
    const input = (elInput.value || "").trim()

    // 檢查是否為空
    if (!input) {
      if (order.length > 0) {
        playEntry(order[0], { fromTop: true })
      }
      return
    }

    // 檢查完整輸入是否已經解析過
    if (isInputAlreadyParsed(lang, input)) {
      console.log("完整輸入內容已經解析過，直接播放最新的解析結果")
      if (order.length > 0) {
        playEntry(order[0], { fromTop: true })
      }
      return
    }

    // 按換行分割段落，過濾空行
    const paragraphs = input
      .split(/\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    if (paragraphs.length === 0) {
      if (order.length > 0) {
        playEntry(order[0], { fromTop: true })
      }
      return
    }

    // 批次處理所有段落（不檢查個別段落重複）
    const createdEntries = []
    for (const paragraph of paragraphs) {
      try {
        const { tokens } = window.PinyinAudio.resolve(lang, paragraph, { skipUnknown: true })
        const entry = createEntry({ lang, input: paragraph, tokens, save: false })
        if (entry) {
          createdEntries.push(entry)
        }
      } catch (e) {
        console.warn(`解析段落 "${paragraph}" 時發生錯誤:`, e?.message || e)
      }
    }

    // 批次插入 DOM（按行的順序）
    if (createdEntries.length > 0) {
      insertEntriesInOrder(createdEntries)
      recordParseHistory(lang, input)
    }

    // 播放第一個創建的條目（第一行）
    if (createdEntries.length > 0) {
      playEntry(createdEntries[0].id, { fromTop: true })
    } else if (order.length > 0) {
      // 如果沒有創建新條目，播放最新的解析結果
      playEntry(order[0], { fromTop: true })
    }
  })

  // textarea 清空按鈕
  btnInputClear?.addEventListener("click", () => {
    elInput.value = ""
    elInput.focus()
  })

  // 標題列：全部保存與全部清除
  btnSaveAll?.addEventListener("click", () => {
    saveAllEntries()
  })

  btnClearAll?.addEventListener("click", () => {
    clearAllEntries()
  })

  // 初始化：
  // 1) 摺疊功能
  initCollapsible()
  // 2) 讀取 URL 參數：lang / input / data
  applyUrlParamsOnLoad()
  // 3) 載入已保存的條目
  loadSavedEntries()

  // 預設輸入值（不自動解析；若 URL 已填過則不覆寫）
  if (!elLang.value) elLang.value = "holo"
  if (!elInput.value) {
    elInput.value = "a e i ah ai ak am an"
  }

  // ============ 編輯功能 ============
  function toggleEditMode(entryId) {
    const entry = entries.get(entryId)
    if (!entry) return

    entry.isEditing = !entry.isEditing

    if (entry.isEditing) {
      // 進入編輯模式
      entry.editBtn.textContent = "完成"
      entry.editBtn.setAttribute("aria-label", "完成編輯")
      entry.el.classList.add("edit-mode")

      // 禁用其他按鈕
      entry.playBtn.disabled = true
      entry.shareBtn.disabled = true
      entry.saveBtn.disabled = true
      entry.delBtn.disabled = true

      // 停止當前播放
      if (active && active.entryId === entryId) {
        stopActive("enter-edit-mode")
      }
    } else {
      // 退出編輯模式
      entry.editBtn.textContent = "編輯"
      entry.editBtn.setAttribute("aria-label", "編輯此解析結果")
      entry.el.classList.remove("edit-mode")

      // 恢復其他按鈕
      entry.playBtn.disabled = false
      entry.shareBtn.disabled = false
      entry.delBtn.disabled = false

      // 保存按鈕的狀態取決於是否已經保存過
      if (!savedEntries.has(entryId)) {
        entry.saveBtn.disabled = false
      }

      // 確保所有 token 都退出編輯狀態
      entry.tokenSpans.forEach((span, idx) => {
        if (span.classList.contains("editing")) {
          exitTokenEditMode(span, entryId, idx)
        }
      })

      // 更新 tokens 數組和 input
      updateEntryFromTokens(entryId)
    }
  }

  function enterTokenEditMode(tokenSpan, entryId, tokenIndex) {
    const entry = entries.get(entryId)
    if (!entry || !entry.isEditing) return

    // 先退出其他正在編輯的 token
    entry.tokenSpans.forEach((span, idx) => {
      if (span !== tokenSpan && span.classList.contains("editing")) {
        exitTokenEditMode(span, entryId, idx)
      }
    })

    tokenSpan.classList.add("editing")
    tokenSpan.contentEditable = true
    tokenSpan.focus()

    // 選中所有文字
    const range = document.createRange()
    range.selectNodeContents(tokenSpan)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)

    // 添加點擊外部確定編輯的事件監聽
    const handleClickOutside = (e) => {
      if (!tokenSpan.contains(e.target)) {
        exitTokenEditMode(tokenSpan, entryId, tokenIndex)
        document.removeEventListener("click", handleClickOutside)
      }
    }

    // 延遲添加事件監聽，避免立即觸發
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside)
    }, 0)

    // 保存原始值以便取消時恢復
    tokenSpan.dataset.originalValue = tokenSpan.textContent
  }

  function exitTokenEditMode(tokenSpan, entryId, tokenIndex) {
    tokenSpan.classList.remove("editing")
    tokenSpan.contentEditable = false

    // 更新 token 內容
    const newText = tokenSpan.textContent.trim()
    if (newText) {
      const entry = entries.get(entryId)
      if (entry && entry.tokens[tokenIndex] !== undefined) {
        entry.tokens[tokenIndex] = newText
      }
    }

    // 清除原始值
    delete tokenSpan.dataset.originalValue
  }

  function cancelTokenEdit(tokenSpan, entryId, tokenIndex) {
    tokenSpan.classList.remove("editing")
    tokenSpan.contentEditable = false

    // 恢復原始文字
    if (tokenSpan.dataset.originalValue) {
      tokenSpan.textContent = tokenSpan.dataset.originalValue
      delete tokenSpan.dataset.originalValue
    }
  }

  function updateEntryFromTokens(entryId) {
    const entry = entries.get(entryId)
    if (!entry) return

    // 從 tokenSpans 更新 tokens 數組
    entry.tokens = entry.tokenSpans.map((span) => span.textContent.trim()).filter(Boolean)

    // 更新 input（用空格連接 tokens）
    entry.input = entry.tokens.join(" ")
  }
})()
