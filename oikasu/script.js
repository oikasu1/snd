const STORAGE_PREFIX = "hakkaLearning_" // 可以輕鬆修改這個前置名稱
// 全域變數
let sentences = []
let categories = {}
let currentUser = { id: "guest", name: "訪客", avatar: "U" }
let currentCategory = ""
let currentViewMode = "card"
let selectedCategories = new Set()
const selectedSentences = new Set()
let gameTimer = null
const gameStats = { correct: 0, total: 0, score: 0, steps: 0 }
let userSettings = {}
const starredCards = new Set()
let currentCardIndex = 0
let flashcardSentences = []
let autoPlayTimer = null
let currentAudio = null
let matchingGameState = {}
let sortingGameState = {}
let quizLayout = "horizontal"
let quizGameState = {}

// 慶祝表情符號
const celebrationEmojis = ["🌈", "🌟", "🎊", "🎉", "✨", "💖", "😍", "🥰"]

// 初始化
function init() {
  parseData()
  loadUserData()
  loadUserSettings()
  renderCategoryList()
  setupEventListeners()
  updateUserDisplay()
}

// 解析資料
function parseData() {
  const lines = myData
    .trim()
    .split("\n")
    .filter((line) => line.trim())
  const headers = lines[0].split("\t")
  sentences = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split("\t")
    const item = {}
    headers.forEach((header, index) => {
      item[header] = values[index] || ""
    })
    sentences.push(item)
  }

  // 按分類分組
  categories = {}
  sentences.forEach((sentence) => {
    const category = sentence["分類"]
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(sentence)
  })
}

// 用戶資料管理
function loadUserData() {
  const userData = localStorage.getItem("kasuUser")
  if (userData) {
    currentUser = JSON.parse(userData)
  }
}

function saveUserData() {
  localStorage.setItem("kasuUser", JSON.stringify(currentUser))
}

function loadUserSettings() {
  const settingsKey = `kasuSettings_${currentUser.id}`
  const settings = localStorage.getItem(settingsKey)
  if (settings) {
    userSettings = JSON.parse(settings)
  } else {
    userSettings = {
      fontSize: 20,
      flashcardFontSize: 24,
      lineSpacing: "loose",
      layout: "double",
      viewMode: "card",
      compactMode: false,
    }
  }
  currentViewMode = userSettings.viewMode || "card"

  // 載入選取的分類
  const selectedKey = `kasuSelected_${currentUser.id}`
  const selectedData = localStorage.getItem(selectedKey)
  if (selectedData) {
    selectedCategories = new Set(JSON.parse(selectedData))
  }
}

function saveSelectedCategories() {
  const selectedKey = `kasuSelected_${currentUser.id}`
  localStorage.setItem(selectedKey, JSON.stringify(Array.from(selectedCategories)))
}

function saveUserSettings() {
  const settingsKey = `kasuSettings_${currentUser.id}`
  localStorage.setItem(settingsKey, JSON.stringify(userSettings))
}

function updateUserDisplay() {
  // 首頁用戶顯示
  document.getElementById("userName").textContent = currentUser.name
  document.getElementById("userAvatar").textContent = currentUser.avatar
  document.getElementById("dropdownName").textContent = currentUser.name
  document.getElementById("dropdownId").textContent = `#${currentUser.id}`
  document.getElementById("dropdownAvatar").textContent = currentUser.avatar

  // 詳情頁用戶顯示
  const userNameDetail = document.getElementById("userNameDetail")
  const userAvatarDetail = document.getElementById("userAvatarDetail")
  const dropdownNameDetail = document.getElementById("dropdownNameDetail")
  const dropdownIdDetail = document.getElementById("dropdownIdDetail")
  const dropdownAvatarDetail = document.getElementById("dropdownAvatarDetail")

  if (userNameDetail) userNameDetail.textContent = currentUser.name
  if (userAvatarDetail) userAvatarDetail.textContent = currentUser.avatar
  if (dropdownNameDetail) dropdownNameDetail.textContent = currentUser.name
  if (dropdownIdDetail) dropdownIdDetail.textContent = `#${currentUser.id}`
  if (dropdownAvatarDetail) dropdownAvatarDetail.textContent = currentUser.avatar
}

// 搜尋功能
function setupSearch() {
  const searchInput = document.getElementById("searchInput")
  const searchResults = document.getElementById("searchResults")

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase()
    if (query.length < 1) {
      searchResults.classList.add("hidden")
      return
    }

    const results = []

    // 搜尋分類
    Object.keys(categories).forEach((category) => {
      if (category.toLowerCase().includes(query)) {
        results.push({
          type: "category",
          title: category,
          subtitle: `${categories[category].length} 個句子`,
          data: category,
        })
      }
    })

    // 搜尋句子內容
    Object.entries(categories).forEach(([category, sentences]) => {
      sentences.forEach((sentence, index) => {
        const searchText = `${sentence["客語"]} ${sentence["拼音"]} ${sentence["華語"]}`.toLowerCase()
        if (searchText.includes(query)) {
          results.push({
            type: "sentence",
            title: sentence["客語"],
            subtitle: `${category} - ${sentence["華語"]}`,
            data: { category, index },
          })
        }
      })
    })

    if (results.length > 0) {
      searchResults.innerHTML = results
        .slice(0, 10)
        .map(
          (result) => `
                <div class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0" 
                     onclick="selectSearchResult('${result.type}', '${JSON.stringify(result.data).replace(/'/g, "\\'")}')">
                    <div class="font-semibold text-gray-900">${result.title}</div>
                    <div class="text-sm text-gray-600">${result.subtitle}</div>
                </div>
            `,
        )
        .join("")
      searchResults.classList.remove("hidden")
    } else {
      searchResults.innerHTML = '<div class="p-3 text-gray-500 text-center">沒有找到相關結果</div>'
      searchResults.classList.remove("hidden")
    }
  })

  // 點擊外部關閉搜尋結果
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add("hidden")
    }
  })
}

function selectSearchResult(type, data) {
  const parsedData = JSON.parse(data)
  document.getElementById("searchResults").classList.add("hidden")
  document.getElementById("searchInput").value = ""

  if (type === "category") {
    showCategoryDetail(parsedData)
  } else if (type === "sentence") {
    showCategoryDetail(parsedData.category)
  }
}



// 表情符號對應表
const myEmoji = `
天氣	☀️
問好	👋
相遇	🤝
道別	👋
行禮	🙇
感謝	🙏
等候	⏳
問姓名	❓
問年紀	🎂
問生肖	🐭
問年級	📚
問身份	🧑‍💼
問星期	📅
問日期	🗓️
問幾點	⏰
趕時間	🏃
遲到	⏱️
問處所	📍
問去向	➡️
距離	📏
問路	🗺️
座位	🪑
問意願	🤔
問擁有	💰
問方式	❓
問原因	❓
事實確認	✅
認知確認	🧠
能力確認	💪
溝通確認	🗣️
就寢	😴
洗衣服	🧺
用餐	🍽️
味道	👃
感冒	🤧
視力檢查	👓
去廁所	🚽
剪頭髮	💇
看電影	🎬
音樂	🎶
打球	🏀
猜拳	✊
散步	🚶
拍照	📸
付錢	💳
換錢	💱
買車票	🎫
買門票	🎟️
加汽油	⛽
遺失	😟
找東西	👀
語言能力	🗣️
語言翻譯	🌐
數學加減	➕
數學數量	🔢
大小	↔️
點名	🙋
排隊	🚶
手動作	🖐️
腳動作	🦶
畢業	🎓
`;

const emojiMap = myEmoji.trim().split('\n').reduce((acc, line) => {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
        acc[parts[0]] = parts[parts.length - 1];
    }
    return acc;
}, {});

function getCategoryEmoji(categoryName) {
    const cleanName = categoryName.replace(/[0-9\s]+/g, '');
    return emojiMap[cleanName] || '📚';
}



// 渲染分類列表
// 渲染分類列表
function renderCategoryList() {
    const categoryList = document.getElementById("categoryList");
    categoryList.innerHTML = "";

    if (currentViewMode === "card") {
        categoryList.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";
        Object.keys(categories).forEach((category) => {
            const isSelected = selectedCategories.has(category);
            const emoji = getCategoryEmoji(category);
            const categoryCard = document.createElement("div");
            categoryCard.className = `category-card bg-white rounded-xl p-6 cursor-pointer shadow-sm hover:shadow-md ${isSelected ? "checkbox-selected" : ""}`;
            categoryCard.innerHTML = `
                <div class="flex items-start justify-between mb-4">
                    <div class="text-3xl">${emoji}</div>
                    <input type="checkbox" class="category-checkbox w-5 h-5 text-blue-600 rounded" 
                           ${isSelected ? "checked" : ""} 
                           onchange="toggleCategorySelection('${category}', this.checked)"
                           onclick="event.stopPropagation()">
                </div>
                <h3 class="text-lg font-bold mb-2">${category} (${categories[category].length})</h3>
            `;
            categoryCard.onclick = (e) => {
                if (!e.target.classList.contains("category-checkbox")) {
                    showCategoryDetail(category);
                }
            };
            categoryList.appendChild(categoryCard);
        });
    } else {
        categoryList.className = "space-y-2";
        Object.keys(categories).forEach((category) => {
            const isSelected = selectedCategories.has(category);
            const emoji = getCategoryEmoji(category);
            const categoryItem = document.createElement("div");
            categoryItem.className = `category-card bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-all flex items-center justify-between ${isSelected ? "checkbox-selected" : ""}`;
            categoryItem.innerHTML = `
                <div class="flex items-center">
                    <input type="checkbox" class="category-checkbox w-5 h-5 text-blue-600 rounded mr-4" 
                       ${isSelected ? "checked" : ""} 
                       onchange="toggleCategorySelection('${category}', this.checked)"
                       onclick="event.stopPropagation()">
                    <span class="text-2xl mr-4">${emoji}</span>
                    <div>
                        <h3 class="text-lg font-bold">${category} (${categories[category].length})</h3>
                    </div>
                </div>
            `;
            categoryItem.onclick = (e) => {
                if (!e.target.classList.contains("category-checkbox")) {
                    showCategoryDetail(category);
                }
            };
            categoryList.appendChild(categoryItem);
        });
    }

    updateSelectionToolbar();
}

// 清除所有勾選的分類
function clearAllSelections() {
  selectedCategories.clear();
  saveSelectedCategories();
  renderCategoryList();
}
// 切換分類選取
function toggleCategorySelection(category, checked) {
  if (checked) {
    selectedCategories.add(category)
  } else {
    selectedCategories.delete(category)
  }
  saveSelectedCategories()
  updateSelectionToolbar()
  renderCategoryList()
}



// 更新選取工具條
function updateSelectionToolbar() {
  const toolbar = document.getElementById("selectionToolbar")
  const count = selectedCategories.size
  const actions = document.getElementById("selectionActions")

  document.getElementById("learnSelectedText").textContent = `學習已勾選 ${count} 個`

  // 工具條本身保持顯示
  toolbar.classList.remove("hidden")
  toolbar.classList.add("show")

  // 只有有選取時顯示操作按鈕
  if (count > 0) {
    if (actions) actions.classList.remove("hidden")
  } else {
    if (actions) actions.classList.add("hidden")
  }
}

// 切換檢視模式
function setViewMode(mode) {
  currentViewMode = mode
  userSettings.viewMode = currentViewMode
  saveUserSettings()

  // 更新按鈕圖示
  const viewToggle = document.getElementById("viewToggle")
  const icon = viewToggle.querySelector(".material-icons")

  if (mode === "card") {
    icon.textContent = "grid_view"
    viewToggle.title = "格狀檢視"
  } else {
    icon.textContent = "view_list"
    viewToggle.title = "清單檢視"
  }

  renderCategoryList()
}

// 顯示分類詳情
function showCategoryDetail(category) {
  currentCategory = category

  // 停止任何正在進行的計時器
  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }

  // 初始化選中的句子（預設全選）
  selectedSentences.clear()
  categories[category].forEach((_, index) => {
    selectedSentences.add(index)
  })

  document.getElementById("mainMenu").classList.add("hidden")
  document.getElementById("categoryDetail").classList.remove("hidden")

  document.getElementById("categoryTitle").textContent = category

  // 預設顯示學習模式並重置選單文字
  showLearningView()
  updateCurrentMode("學習")
  window.scrollTo(0, 0);
}

// 更新當前模式顯示
function updateCurrentMode(modeName) {
  document.getElementById("currentMode").textContent = modeName
}

// 播放音檔
function playAudio(filename) {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  currentAudio = new Audio(`https://oikasu1.github.io/kasuexam/kasu/audio/${filename}`)
  currentAudio.play().catch((e) => console.log("音檔播放失敗:", e))
}

// 顯示慶祝特效
function showCelebration(element) {
  element.classList.add("celebration")
  setTimeout(() => element.classList.remove("celebration"), 800)

  // 隨機表情符號特效
  const emoji = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)]
  const emojiElement = document.createElement("div")
  emojiElement.className = "emoji-celebration"
  emojiElement.textContent = emoji
  emojiElement.style.left = Math.random() * window.innerWidth + "px"
  emojiElement.style.top = Math.random() * window.innerHeight + "px"
  document.body.appendChild(emojiElement)

  setTimeout(() => emojiElement.remove(), 2000)
}

// 學習模式
function showLearningView() {
  const contentArea = document.getElementById("contentArea")
  const sentences = categories[currentCategory]

  const isWideScreen = window.innerWidth >= 1024
  const showLayoutToggle = isWideScreen

  contentArea.innerHTML = `
        <div class="max-w-6xl mx-auto">
            <!-- 控制面板 -->
            <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-2">
                        <button id="learningSelectAll" class="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors text-sm">全選</button>
                        <button id="compactToggle" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm">精簡</button>
                        <button id="hideHakka" class="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors" title="客語顯示">
                            <span class="material-icons text-gray-600 text-sm">visibility</span> 客語
                        </button>
                        <button id="hidePinyin" class="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors" title="拼音顯示">
                            <span class="material-icons text-gray-600 text-sm">visibility</span> 拼音
                        </button>
                        <button id="hideChinese" class="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors" title="華語顯示">
                            <span class="material-icons text-gray-600 text-sm">visibility</span> 華語
                        </button>
                    </div>
                    <div class="flex items-center gap-2">
                        ${
                          showLayoutToggle
                            ? `<button id="layoutToggle" class="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors" title="${userSettings.layout === "single" ? "單欄" : "雙欄"}">
                            <span class="material-icons text-gray-600">${userSettings.layout === "single" ? "view_agenda" : "view_column"}</span>
                        </button>`
                            : ""
                        }
                        <button id="lineSpacingToggle" class="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors" title="行距">
                            <span class="material-icons text-gray-600">format_line_spacing</span>
                        </button>
                        <button onclick="adjustFontSize(-1, 'learning')" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                            ${userSettings.fontSize}-
                        </button>
                        <button onclick="adjustFontSize(1, 'learning')" class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                            A+
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 句子列表 -->
            <div id="sentenceContainer" class="${isWideScreen && userSettings.layout === "double" ? "grid grid-cols-1 lg:grid-cols-2" : "grid grid-cols-1"} gap-4"></div>
        </div>
    `

  renderSentences()
  setupLearningControls()
  updateCompactToggleButton()
}

// 添加更新精簡按鈕狀態的函數
function updateCompactToggleButton() {
  const button = document.getElementById("compactToggle")
  if (button) {
    if (userSettings.compactMode) {
      button.className = "px-3 py-2 bg-blue-100 text-blue-700 rounded transition-colors text-sm"
    } else {
      button.className = "px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm"
    }
  }
}

function renderSentences() {
  const container = document.getElementById("sentenceContainer")
  const sentences = categories[currentCategory]
  container.innerHTML = ""

  sentences.forEach((sentence, index) => {
    const isSelected = selectedSentences.has(index)
    const sentenceCard = document.createElement("div")
    sentenceCard.className = "sentence-card bg-white rounded-xl shadow-sm p-6"
    const isCompact = userSettings.compactMode || false

    if (isCompact) {
      sentenceCard.className = "sentence-card bg-white rounded-lg shadow-sm p-3 mb-2"
      sentenceCard.innerHTML = `
                <div class="flex items-center gap-3">
                    <button onclick="playAudio('${sentence["音檔"]}')" class="text-gray-800 hover:bg-gray-100 p-1 rounded transition-colors flex-shrink-0">
                        <span class="material-icons text-base">volume_up</span>
                    </button>
                    <span class="text-sm text-gray-500 font-mono flex-shrink-0">${index + 1}</span>
                    <div class="hakka-text font-bold text-blue-800 flex-1 truncate" 
                         style="font-size: ${userSettings.fontSize}px">${sentence["客語"]}</div>
                    <input type="checkbox" class="sentence-checkbox w-4 h-4 text-blue-600 rounded flex-shrink-0" 
                           ${isSelected ? "checked" : ""} 
                           onchange="toggleSentenceSelection(${index}, this.checked)">
                </div>
            `
    } else {
      sentenceCard.innerHTML = `
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <button onclick="playAudio('${sentence["音檔"]}')" class="text-gray-800 hover:bg-gray-100 p-1.5 rounded transition-colors">
                            <span class="material-icons text-lg">volume_up</span>
                        </button>
                        <span class="text-sm text-gray-500 font-mono">${index + 1}</span>
                    </div>
                    <input type="checkbox" class="sentence-checkbox w-4 h-4 text-blue-600 rounded" 
                           ${isSelected ? "checked" : ""} 
                           onchange="toggleSentenceSelection(${index}, this.checked)">
                </div>
                <div class="space-y-3">
                    <div class="hakka-text font-bold text-blue-800 ${userSettings.lineSpacing === "tight" ? "line-spacing-tight" : userSettings.lineSpacing === "normal" ? "line-spacing-normal" : "line-spacing-loose"}" 
                         style="font-size: ${userSettings.fontSize}px">${sentence["客語"]}</div>
                    <div class="pinyin-text text-gray-600 ${userSettings.lineSpacing === "tight" ? "line-spacing-tight" : userSettings.lineSpacing === "normal" ? "line-spacing-normal" : "line-spacing-loose"}" 
                         style="font-size: ${Math.floor(userSettings.fontSize * 0.8)}px">${sentence["拼音"]}</div>
                    <div class="chinese-text text-gray-800 ${userSettings.lineSpacing === "tight" ? "line-spacing-tight" : userSettings.lineSpacing === "normal" ? "line-spacing-normal" : "line-spacing-loose"}" 
                         style="font-size: ${Math.floor(userSettings.fontSize * 0.9)}px">${sentence["華語"]}</div>
                </div>
            `
    }
    container.appendChild(sentenceCard)
  })
}

function setupLearningControls() {
  const hideStates = { hakka: "show", pinyin: "show", chinese: "show" }

  // 全選句子
  document.getElementById("learningSelectAll").onclick = () => {
    selectedSentences.clear()
    categories[currentCategory].forEach((_, index) => selectedSentences.add(index))
    renderSentences()
  }

  // 精簡模式切換
  document.getElementById("compactToggle").onclick = () => {
    userSettings.compactMode = !userSettings.compactMode
    const button = document.getElementById("compactToggle")
    if (userSettings.compactMode) {
      button.className = "px-3 py-2 bg-blue-100 text-blue-700 rounded transition-colors text-sm"
    } else {
      button.className = "px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm"
    }
    saveUserSettings()
    renderSentences()
  }

  // 排版切換
  const layoutToggle = document.getElementById("layoutToggle")
  if (layoutToggle) {
    layoutToggle.onclick = () => {
      userSettings.layout = userSettings.layout === "single" ? "double" : "single"
      saveUserSettings()
      showLearningView()
    }
  }

  // 行距切換
  document.getElementById("lineSpacingToggle").onclick = () => {
    const spacings = ["tight", "normal", "loose"]
    const currentIndex = spacings.indexOf(userSettings.lineSpacing)
    userSettings.lineSpacing = spacings[(currentIndex + 1) % spacings.length]
    saveUserSettings()
    renderSentences()
  }

  // 隱藏控制
  const setupHideButton = (buttonId, textClass, type, label) => {
    document.getElementById(buttonId).onclick = () => {
      const states = ["show", "blur", "hide"]
      const currentIndex = states.indexOf(hideStates[type])
      hideStates[type] = states[(currentIndex + 1) % states.length]

      const elements = document.querySelectorAll(`.${textClass}`)
      const button = document.getElementById(buttonId)
      const icon = button.querySelector(".material-icons")

      elements.forEach((el) => {
        el.classList.remove("blur-text", "hidden-text")
      })

      switch (hideStates[type]) {
        case "show":
          button.className = "p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          button.title = `${label}顯示`
          icon.textContent = "visibility"
          icon.className = "material-icons text-gray-600 text-sm"
          break
        case "blur":
          elements.forEach((el) => el.classList.add("blur-text"))
          button.className = "p-2 bg-yellow-100 hover:bg-yellow-200 rounded transition-colors"
          button.title = `${label}模糊`
          icon.textContent = "blur_on"
          icon.className = "material-icons text-yellow-700 text-sm"
          break
        case "hide":
          elements.forEach((el) => el.classList.add("hidden-text"))
          button.className = "p-2 bg-red-100 hover:bg-red-200 rounded transition-colors"
          button.title = `${label}隱藏`
          icon.textContent = "visibility_off"
          icon.className = "material-icons text-red-700 text-sm"
          break
      }
    }
  }

  setupHideButton("hideHakka", "hakka-text", "hakka", "客語")
  setupHideButton("hidePinyin", "pinyin-text", "pinyin", "拼音")
  setupHideButton("hideChinese", "chinese-text", "chinese", "華語")
}

// 切換句子選取
function toggleSentenceSelection(index, checked) {
  if (checked) {
    selectedSentences.add(index)
  } else {
    selectedSentences.delete(index)
  }
}

// 字體大小調整
function adjustFontSize(change, mode = "learning") {
  const fontSizes =
    mode === "flashcard" ? [20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60] : [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40]

  const settingKey = mode === "flashcard" ? "flashcardFontSize" : "fontSize"
  const currentIndex = fontSizes.indexOf(userSettings[settingKey])
  const newIndex = Math.max(0, Math.min(fontSizes.length - 1, currentIndex + change))
  userSettings[settingKey] = fontSizes[newIndex]
  saveUserSettings()

  // 更新按鈕顯示
  const minusButton = document.querySelector(`button[onclick*="adjustFontSize(-1, '${mode}')"]`)
  const plusButton = document.querySelector(`button[onclick*="adjustFontSize(1, '${mode}')"]`)
  if (minusButton) minusButton.textContent = `${userSettings[settingKey]}-`
  if (plusButton) plusButton.textContent = "A+"

  // 重新渲染當前視圖
  if (mode === "learning") {
    renderSentences()
  } else if (mode === "flashcard") {
    updateFlashcard()
  } else if (mode === "matching" || mode === "quiz" || mode === "sorting") {
    // 對於遊戲模式，重新渲染當前題目
    if (mode === "matching" && matchingGameState.isPlaying) {
      renderMatchingItems()
    } else if (mode === "quiz" && quizGameState.isPlaying) {
      renderQuizQuestion()
    } else if (mode === "sorting" && sortingGameState.isPlaying) {
      renderSortingQuestion()
    }
  }
}

// 閃示卡模式
function showFlashcardView() {
  const contentArea = document.getElementById("contentArea")
  const sentences = getSelectedSentences()

  if (sentences.length === 0) {
    contentArea.innerHTML = '<div class="text-center py-12 text-gray-500">請先選擇要練習的句子</div>'
    return
  }

  contentArea.innerHTML = `
        <div class="max-w-5xl mx-auto">
            <!-- 控制面板 -->
            <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-2">
                        <input type="checkbox" id="autoPlay" class="w-4 h-4 text-purple-600 rounded">
                        <label for="autoPlay" class="text-sm">自動播放</label>
                        <select id="autoInterval" class="px-2 py-1 border border-gray-300 rounded text-sm">
                            <option value="1">1秒</option>
                            <option value="2">2秒</option>
                            <option value="3" selected>3秒</option>
                            <option value="4">4秒</option>
                            <option value="5">5秒</option>
                        </select>
                        <button id="hideHakkaFlash" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm" title="客語顯示">
						    <span class="material-icons text-gray-600 text-sm">visibility</span> 客語
						</button>
                        <button id="hidePinyinFlash" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm" title="拼音顯示">
						    <span class="material-icons text-gray-600 text-sm">visibility</span> 拼音						
						</button>
                        <button id="hideChineseFlash" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm" title="華語顯示">
						    <span class="material-icons text-gray-600 text-sm">visibility</span> 華語
						</button>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="adjustFontSize(-1, 'flashcard')" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">
                            ${userSettings.flashcardFontSize}-
                        </button>
                        <button onclick="adjustFontSize(1, 'flashcard')" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">
                            A+
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 卡片區域 -->
            <div class="bg-white rounded-xl shadow-sm p-8 mb-6">
                <div class="flex items-center justify-between mb-6">
                    <button id="prevCard" class="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg transition-colors">
                        ← 上一張
                    </button>
                    <div class="flex items-center gap-4">
                        <button id="playCardAudio" class="text-gray-800 hover:bg-gray-100 p-2 rounded transition-colors">
                            <span class="material-icons">volume_up</span>
                        </button>
                        <span id="cardCounter" class="text-lg font-bold text-gray-700"></span>
                        <button id="starCard" class="star-button text-2xl p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            ☆
                        </button>
                    </div>
                    <button id="nextCard" class="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg transition-colors">
                        下一張 →
                    </button>
                </div>
                
                <div id="flashcardContent" class="text-center space-y-6 min-h-48 flex flex-col justify-center">
                    <div id="hakkaText" class="hakka-text font-bold text-purple-800" style="font-size: ${userSettings.flashcardFontSize}px"></div>
                    <div id="pinyinText" class="pinyin-text text-gray-600" style="font-size: ${Math.floor(userSettings.flashcardFontSize * 0.8)}px"></div>
                    <div id="chineseText" class="chinese-text text-gray-800" style="font-size: ${Math.floor(userSettings.flashcardFontSize * 0.9)}px"></div>
                </div>
                
                <!-- 進度條 -->
                <div class="mt-8">
                    <div class="bg-gray-200 rounded-full h-2">
                        <div id="progressBar" class="bg-purple-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>
			            <select id="practiceMode" class="px-2 py-1 border border-gray-300 rounded text-sm">
                            <option value="all">練習全部</option>
                            <option value="starred">練習有星號</option>
                            <option value="unstarred">練習無星號</option>
                        </select>
                        <button id="clearStars" class="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors text-sm">清除星號</button>

            </div>
        </div>
    `

  setupFlashcardView()
}

function setupFlashcardView() {
  currentCardIndex = 0
  updateFlashcardSentences()
  updateFlashcard()
  setupFlashcardControls()
}

function updateFlashcardSentences() {
  const practiceMode = document.getElementById("practiceMode")?.value || "all"
  const allSentences = getSelectedSentences()

  // 使用絕對ID進行星號過濾
  switch (practiceMode) {
    case "starred":
      flashcardSentences = allSentences.filter((sentence) => {
        const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`
        return starredCards.has(sentenceId)
      })
      break
    case "unstarred":
      flashcardSentences = allSentences.filter((sentence) => {
        const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`
        return !starredCards.has(sentenceId)
      })
      break
    default:
      flashcardSentences = allSentences
  }

  if (currentCardIndex >= flashcardSentences.length) {
    currentCardIndex = 0
  }
}

function updateFlashcard() {
  if (flashcardSentences.length === 0) {
    document.getElementById("flashcardContent").innerHTML = '<div class="text-gray-500">沒有可練習的卡片</div>'
    return
  }

  // 使用句子的絕對ID檢查星號狀態
  const sentence = flashcardSentences[currentCardIndex]
  const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`
  //const globalIndex = getSelectedSentences().indexOf(sentence)

  document.getElementById("hakkaText").textContent = sentence["客語"]
  document.getElementById("pinyinText").textContent = sentence["拼音"]
  document.getElementById("chineseText").textContent = sentence["華語"]
  document.getElementById("cardCounter").textContent = `${currentCardIndex + 1} / ${flashcardSentences.length}`

  // 更新星號狀態
  const starButton = document.getElementById("starCard")
  if (starredCards.has(sentenceId)) {
    starButton.classList.add("starred")
    starButton.textContent = "★"
  } else {
    starButton.classList.remove("starred")
    starButton.textContent = "☆"
  }

  // 更新進度條
  const progress = ((currentCardIndex + 1) / flashcardSentences.length) * 100
  document.getElementById("progressBar").style.width = progress + "%"

  // 更新按鈕狀態
  document.getElementById("prevCard").disabled = currentCardIndex === 0
  document.getElementById("nextCard").disabled = currentCardIndex === flashcardSentences.length - 1

  // 更新字體大小
  document.getElementById("hakkaText").style.fontSize = userSettings.flashcardFontSize + "px"
  document.getElementById("pinyinText").style.fontSize = Math.floor(userSettings.flashcardFontSize * 0.8) + "px"
  document.getElementById("chineseText").style.fontSize = Math.floor(userSettings.flashcardFontSize * 0.9) + "px"
}

function setupFlashcardControls() {
  const hideStates = { hakka: "show", pinyin: "show", chinese: "show" }

  // 導航控制
  document.getElementById("prevCard").onclick = () => {
    if (currentCardIndex > 0) {
      currentCardIndex--
      updateFlashcard()
      playCurrentAudio()
    }
  }

  document.getElementById("nextCard").onclick = () => {
    if (currentCardIndex < flashcardSentences.length - 1) {
      currentCardIndex++
      updateFlashcard()
      playCurrentAudio()
    }
  }

  // 音檔播放
  document.getElementById("playCardAudio").onclick = playCurrentAudio

  // 星號標記
  document.getElementById("starCard").onclick = () => {
    const sentence = flashcardSentences[currentCardIndex]
    const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}` // 使用ID或組合唯一標識

    if (starredCards.has(sentenceId)) {
      starredCards.delete(sentenceId)
    } else {
      starredCards.add(sentenceId)
    }
    updateFlashcard()
  }

  // 練習模式切換
  document.getElementById("practiceMode").onchange = () => {
    currentCardIndex = 0
    updateFlashcardSentences()
    updateFlashcard()
  }

  // 清除星號
  document.getElementById("clearStars").onclick = () => {
    starredCards.clear()
    updateFlashcard()
  }

  // 自動播放
  document.getElementById("autoPlay").onchange = (e) => {
    if (e.target.checked) {
      startAutoPlay()
    } else {
      stopAutoPlay()
    }
  }

  document.getElementById("autoInterval").onchange = () => {
    if (document.getElementById("autoPlay").checked) {
      stopAutoPlay()
      startAutoPlay()
    }
  }

  // 隱藏控制
  const setupHideButton = (buttonId, textClass, type, label) => {
    document.getElementById(buttonId).onclick = () => {
      const states = ["show", "blur", "hide"]
      const currentIndex = states.indexOf(hideStates[type])
      hideStates[type] = states[(currentIndex + 1) % states.length]

      const element = document.getElementById(textClass.replace("-text", "Text"))
      const button = document.getElementById(buttonId)

      element.classList.remove("blur-text", "hidden-text")

      switch (hideStates[type]) {
        case "show":
          button.className = "px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm"
          button.textContent = `模糊${label}`
          break
        case "blur":
          element.classList.add("blur-text")
          button.className = "px-3 py-1 bg-yellow-100 text-yellow-700 rounded transition-colors text-sm"
          button.textContent = `隱藏${label}`
          break
        case "hide":
          element.classList.add("hidden-text")
          button.className = "px-3 py-1 bg-red-100 text-red-700 rounded transition-colors text-sm"
          button.textContent = `顯示${label}`
          break
      }
    }
  }

  setupHideButton("hideHakkaFlash", "hakka-text", "hakka", "客語")
  setupHideButton("hidePinyinFlash", "pinyin-text", "pinyin", "拼音")
  setupHideButton("hideChineseFlash", "chinese-text", "chinese", "華語")
}

function playCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }

  if (flashcardSentences.length > 0) {
    const sentence = flashcardSentences[currentCardIndex]
    currentAudio = new Audio(`https://oikasu1.github.io/kasuexam/kasu/audio/${sentence["音檔"]}`)
    currentAudio.play().catch((e) => console.log("音檔播放失敗:", e))
  }
}

function startAutoPlay() {
  const interval = Number.parseInt(document.getElementById("autoInterval").value) * 1000
  autoPlayTimer = setInterval(() => {
    if (currentCardIndex < flashcardSentences.length - 1) {
      currentCardIndex++
      updateFlashcard()
      playCurrentAudio()
    } else {
      document.getElementById("autoPlay").checked = false
      stopAutoPlay()
    }
  }, interval)
}

function stopAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
}

// 獲取選中的句子
function getSelectedSentences() {
  const allSentences = categories[currentCategory]
  return Array.from(selectedSentences).map((index) => allSentences[index])
}

// 配對遊戲
function showMatchingGame() {
  const contentArea = document.getElementById("contentArea")
  const sentences = getSelectedSentences()

  if (sentences.length < 2) {
    contentArea.innerHTML = '<div class="text-center py-12 text-gray-500">至少需要2個句子才能進行配對遊戲</div>'
    return
  }

  contentArea.innerHTML = `
        <div class="max-w-6xl mx-auto">
            <!-- 控制面板 -->
            <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-2">
                        <select id="matchingType" class="px-3 py-1 border border-gray-300 rounded text-sm">
                            <option value="hakka-chinese">客語 ↔ 華語</option>
                            <option value="pinyin-chinese">拼音 ↔ 華語</option>
                            <option value="hakka-pinyin">客語 ↔ 拼音</option>
                        </select>
                        <select id="matchingPairs" class="px-3 py-1 border border-gray-300 rounded text-sm">
                            <option value="2">2組</option>
                            <option value="3">3組</option>
                            <option value="4" selected>4組</option>
                            <option value="5">5組</option>
                            <option value="6">6組</option>
                        </select>
                        <select id="matchingCondition" class="px-3 py-1 border border-gray-300 rounded text-sm">
                            <option value="time60">限時60秒</option>
                            <option value="time100">限時100秒</option>
                            <option value="time180">限時180秒</option>
                            <option value="round1">1關計時</option>
                            <option value="round3">3關計時</option>
                            <option value="round5">5關計時</option>
                            <option value="round8">8關計時</option>
                            <option value="unlimited" selected>不限時間</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="adjustFontSize(-1, 'matching')" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">
                            ${userSettings.fontSize}-
                        </button>
                        <button onclick="adjustFontSize(1, 'matching')" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">
                            A+
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 遊戲狀態列 -->
            <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <button id="startMatching" class="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-semibold transition-colors">
                            開始配對
                        </button>
                        <div id="matchingTimer" class="text-lg font-bold text-gray-700">準備開始</div>
                        <div class="bg-gray-200 rounded-full h-2 w-32">
                            <div id="matchingTimerBar" class="timer-bar bg-orange-500 h-2 rounded-full" style="width: 100%"></div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-center">
                            <div class="text-sm text-gray-600">分數</div>
                            <div id="matchingScore" class="text-xl font-bold text-orange-600">0</div>
                        </div>
                        <div class="text-center">
                            <div class="text-sm text-gray-600">步數</div>
                            <div id="matchingSteps" class="text-xl font-bold text-gray-600">0</div>
                        </div>
                        <div class="text-center">
                            <div class="text-sm text-gray-600">關卡</div>
                            <div id="matchingRound" class="text-xl font-bold text-orange-600">1</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 配對區域 -->
            <div id="matchingArea" class="hidden grid grid-cols-2 gap-8">
                <div id="leftColumn" class="space-y-3"></div>
                <div id="rightColumn" class="space-y-3"></div>
            </div>
            
            <!-- 開始按鈕 -->
            <div id="matchingStartButton" class="text-center py-12">
                <button id="startMatchingCenter" class="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
                    開始配對遊戲
                </button>
            </div>
            
            <!-- 結果區域 -->
            <div id="matchingResults" class="hidden mt-6 bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-xl font-bold mb-4 text-center">配對結果</h3>
                <div id="matchingResultsList" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
            </div>
        </div>
    `

  setupMatchingGame()
}

function setupMatchingGame() {
  matchingGameState = {
    isPlaying: false,
    selectedItems: [],
    matchedPairs: [],
    currentRound: 1,
    totalRounds: 1,
    score: 0,
    steps: 0,
    timeLeft: 0,
    timerInterval: null,
    gameData: [],
  }

  document.getElementById("startMatching").onclick = startMatchingGame
  document.getElementById("startMatchingCenter").onclick = () => {
    document.getElementById("matchingStartButton").classList.add("hidden")
    document.getElementById("matchingArea").classList.remove("hidden")
    startMatchingGame()
  }

  // 設定變更時重新生成遊戲
  ;["matchingType", "matchingPairs", "matchingCondition"].forEach((id) => {
    document.getElementById(id).onchange = () => {
      if (!matchingGameState.isPlaying) {
        generateMatchingData()
      }
    }
  })

  generateMatchingData()
}

function generateMatchingData() {
  const sentences = getSelectedSentences()
  const type = document.getElementById("matchingType").value
  const pairs = Number.parseInt(document.getElementById("matchingPairs").value)
  const condition = document.getElementById("matchingCondition").value

  // 隨機選擇句子
  const shuffled = [...sentences].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, pairs)

  // 根據類型生成配對資料
  const leftItems = []
  const rightItems = []

  selected.forEach((sentence, index) => {
    switch (type) {
      case "hakka-chinese":
        leftItems.push({ id: index, text: sentence["客語"], type: "hakka" })
        rightItems.push({ id: index, text: sentence["華語"], type: "chinese" })
        break
      case "pinyin-chinese":
        leftItems.push({ id: index, text: sentence["拼音"], type: "pinyin" })
        rightItems.push({ id: index, text: sentence["華語"], type: "chinese" })
        break
      case "hakka-pinyin":
        leftItems.push({ id: index, text: sentence["客語"], type: "hakka" })
        rightItems.push({ id: index, text: sentence["拼音"], type: "pinyin" })
        break
    }
  })

  // 打亂右側項目
  rightItems.sort(() => Math.random() - 0.5)

  matchingGameState.gameData = { leftItems, rightItems, sentences: selected }

  // 設定關卡數
  if (condition.startsWith("round")) {
    matchingGameState.totalRounds = Number.parseInt(condition.replace("round", ""))
  } else {
    matchingGameState.totalRounds = 1
  }

  renderMatchingItems()
}

function renderMatchingItems() {
  const leftColumn = document.getElementById("leftColumn")
  const rightColumn = document.getElementById("rightColumn")
  const { leftItems, rightItems } = matchingGameState.gameData

  leftColumn.innerHTML = ""
  rightColumn.innerHTML = ""

  leftItems.forEach((item) => {
    const element = createMatchingItem(item, "left")
    leftColumn.appendChild(element)
  })

  rightItems.forEach((item) => {
    const element = createMatchingItem(item, "right")
    rightColumn.appendChild(element)
  })
}

function createMatchingItem(item, side) {
  const element = document.createElement("div")
  element.className = "matching-item bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-all relative"
  element.style.fontSize = userSettings.fontSize + "px"
  element.textContent = item.text
  element.dataset.id = item.id
  element.dataset.side = side

  element.onclick = () => selectMatchingItem(element, item)

  return element
}

function selectMatchingItem(element, item) {
  if (!matchingGameState.isPlaying) return
  if (element.classList.contains("matching-completed")) return

  // 取消選取同一個項目
  if (element.classList.contains("matching-selected")) {
    element.classList.remove("matching-selected")
    matchingGameState.selectedItems = matchingGameState.selectedItems.filter((selected) => selected.element !== element)
    return
  }

  // 清除同側的其他選取
  const side = element.dataset.side
  matchingGameState.selectedItems = matchingGameState.selectedItems.filter((selected) => {
    if (selected.element.dataset.side === side) {
      selected.element.classList.remove("matching-selected")
      return false
    }
    return true
  })

  // 選取當前項目
  element.classList.add("matching-selected")
  matchingGameState.selectedItems.push({ element, item })

  // 檢查是否有兩個選取的項目
  if (matchingGameState.selectedItems.length === 2) {
    checkMatch()
  }
}

function checkMatch() {
  const [first, second] = matchingGameState.selectedItems
  matchingGameState.steps++
  document.getElementById("matchingSteps").textContent = matchingGameState.steps

  if (first.item.id === second.item.id) {
    // 配對成功
    matchingGameState.score += 100
    document.getElementById("matchingScore").textContent = matchingGameState.score

    first.element.classList.remove("matching-selected")
    second.element.classList.remove("matching-selected")
    first.element.classList.add("matching-correct")
    second.element.classList.add("matching-correct")

    // 添加打勾標記
    first.element.innerHTML += '<div class="absolute top-2 right-2 text-green-600 font-bold">✓</div>'
    second.element.innerHTML += '<div class="absolute top-2 right-2 text-green-600 font-bold">✓</div>'

    // 慶祝特效
    showCelebration(first.element)
    showCelebration(second.element)

    matchingGameState.matchedPairs.push({ first: first.item, second: second.item })

    setTimeout(() => {
      first.element.classList.remove("matching-correct")
      second.element.classList.remove("matching-correct")
      first.element.classList.add("matching-completed")
      second.element.classList.add("matching-completed")
    }, 1500)

    // 檢查是否完成
    if (matchingGameState.matchedPairs.length === matchingGameState.gameData.leftItems.length) {
      setTimeout(() => checkRoundComplete(), 1500)
    }
  } else {
    // 配對錯誤
    matchingGameState.score = Math.max(0, matchingGameState.score - 50)
    document.getElementById("matchingScore").textContent = matchingGameState.score

    first.element.classList.remove("matching-selected")
    second.element.classList.remove("matching-selected")
    first.element.classList.add("matching-incorrect")
    second.element.classList.add("matching-incorrect")

    // 添加錯誤標記
    first.element.innerHTML += '<div class="absolute top-2 right-2 text-red-600 font-bold">✗</div>'
    second.element.innerHTML += '<div class="absolute top-2 right-2 text-red-600 font-bold">✗</div>'

    setTimeout(() => {
      first.element.classList.remove("matching-incorrect")
      second.element.classList.remove("matching-incorrect")
      // 移除錯誤標記
      first.element.querySelector(".absolute")?.remove()
      second.element.querySelector(".absolute")?.remove()
    }, 1500)
  }

  matchingGameState.selectedItems = []
}

function startMatchingGame() {
  const condition = document.getElementById("matchingCondition").value
  const button = document.getElementById("startMatching")

  matchingGameState.isPlaying = true
  matchingGameState.currentRound = 1
  matchingGameState.score = 0
  matchingGameState.steps = 0
  matchingGameState.matchedPairs = []

  button.textContent = "重新開始"
  button.onclick = restartMatchingGame

  document.getElementById("matchingScore").textContent = "0"
  document.getElementById("matchingSteps").textContent = "0"
  document.getElementById("matchingRound").textContent = "1"
  document.getElementById("matchingResults").classList.add("hidden")

  // 設定計時器
  if (condition.startsWith("time")) {
    const timeLimit = Number.parseInt(condition.replace("time", ""))
    matchingGameState.timeLeft = timeLimit
    startMatchingTimer()
  } else if (condition.startsWith("round")) {
    matchingGameState.timeLeft = 0
    document.getElementById("matchingTimer").textContent = "計時中..."
    matchingGameState.startTime = Date.now()
  } else {
    document.getElementById("matchingTimer").textContent = "不限時間"
  }

  generateMatchingData()
}

function restartMatchingGame() {
  if (matchingGameState.timerInterval) {
    clearInterval(matchingGameState.timerInterval)
  }
  startMatchingGame()
}

function startMatchingTimer() {
  const timerElement = document.getElementById("matchingTimer")
  const timerBar = document.getElementById("matchingTimerBar")
  const condition = document.getElementById("matchingCondition").value
  const timeLimit = Number.parseInt(condition.replace("time", ""))

  matchingGameState.timerInterval = setInterval(() => {
    matchingGameState.timeLeft--
    timerElement.textContent = `剩餘 ${matchingGameState.timeLeft} 秒`

    const percentage = (matchingGameState.timeLeft / timeLimit) * 100
    timerBar.style.width = percentage + "%"

    if (matchingGameState.timeLeft <= 0) {
      clearInterval(matchingGameState.timerInterval)
      endMatchingGame("時間到！")
    }
  }, 1000)
}

function checkRoundComplete() {
  const condition = document.getElementById("matchingCondition").value

  if (condition.startsWith("round")) {
    if (matchingGameState.currentRound < matchingGameState.totalRounds) {
      // 進入下一關
      matchingGameState.currentRound++
      matchingGameState.matchedPairs = []
      document.getElementById("matchingRound").textContent = matchingGameState.currentRound
      generateMatchingData()
    } else {
      // 完成所有關卡
      const totalTime = Math.floor((Date.now() - matchingGameState.startTime) / 1000)
      endMatchingGame(`恭喜完成 ${matchingGameState.totalRounds} 關！\n總用時：${totalTime} 秒`)
    }
  } else {
    // 單關完成
    endMatchingGame("恭喜完成配對！")
  }
}

function endMatchingGame(message) {
  matchingGameState.isPlaying = false

  if (matchingGameState.timerInterval) {
    clearInterval(matchingGameState.timerInterval)
  }

  // 顯示結果
  showMatchingResults()
  showResult(
    "🎉",
    "配對完成",
    `${message}\n\n最終分數：${matchingGameState.score}\n操作步數：${matchingGameState.steps}`,
  )
}

function showMatchingResults() {
  const resultsContainer = document.getElementById("matchingResultsList")
  const { sentences } = matchingGameState.gameData

  resultsContainer.innerHTML = sentences
    .map(
      (sentence) => `
        <div class="bg-gray-50 rounded-lg p-4">
            <div class="font-bold text-blue-800 mb-2">${sentence["客語"]}</div>
            <div class="text-gray-600 mb-1">${sentence["拼音"]}</div>
            <div class="text-gray-800">${sentence["華語"]}</div>
        </div>
    `,
    )
    .join("")

  document.getElementById("matchingResults").classList.remove("hidden")
}

// 測驗遊戲
function showQuizGame() {
  const contentArea = document.getElementById("contentArea")
  const sentences = getSelectedSentences()

  if (sentences.length < 2) {
    contentArea.innerHTML = '<div class="text-center py-12 text-gray-500">至少需要2個句子才能進行測驗</div>'
    return
  }

  // 根據螢幕寬度設定預設排版
  const isWideScreen = window.innerWidth >= 1024
  quizLayout = isWideScreen ? "horizontal" : "vertical"

  contentArea.innerHTML = `
        <div class="max-w-6xl mx-auto">
            <!-- 控制面板 -->
            <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-2">
                        <select id="quizType" class="px-3 py-1 border border-gray-300 rounded text-sm">
                            <option value="hakka-chinese">客語 → 華語</option>
                            <option value="chinese-hakka">華語 → 客語</option>
                            <option value="pinyin-chinese">拼音 → 華語</option>
                            <option value="chinese-pinyin">華語 → 拼音</option>
                            <option value="hakka-pinyin">客語 → 拼音</option>
                            <option value="pinyin-hakka">拼音 → 客語</option>
                        </select>
                        <select id="quizOptions" class="px-3 py-1 border border-gray-300 rounded text-sm">
                            <option value="2">2個選項</option>
                            <option value="3">3個選項</option>
                            <option value="4" selected>4個選項</option>
                            <option value="5">5個選項</option>
                            <option value="6">6個選項</option>
                        </select>
                        <select id="quizCondition" class="px-3 py-1 border border-gray-300 rounded text-sm">
                            <option value="time60">限時60秒</option>
                            <option value="time100">限時100秒</option>
                            <option value="time180">限時180秒</option>
                            <option value="unlimited" selected>不限時間</option>
                            <option value="correct10">答對10題</option>
                            <option value="correct20">答對20題</option>
                            <option value="correct30">答對30題</option>
                            <option value="correct100">答對100題</option>
                        </select>
                        <button id="quizLayoutToggle" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm">
                            ${quizLayout === "horizontal" ? "左右" : "垂直"}
                        </button>
                        <input type="checkbox" id="autoPlayAudio" class="w-4 h-4 text-red-600 rounded">
                        <label for="autoPlayAudio" class="text-sm">自動播放</label>
                        <button id="blurQuizText" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm">模糊題目</button>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="adjustFontSize(-1, 'quiz')" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">
                            ${userSettings.fontSize}-
                        </button>
                        <button onclick="adjustFontSize(1, 'quiz')" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">
                            A+
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 遊戲狀態列 -->
            <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <button id="startQuiz" class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                            開始測驗
                        </button>
                        <div id="quizTimer" class="text-lg font-bold text-gray-700">準備開始</div>
                        <div class="bg-gray-200 rounded-full h-2 w-32">
                            <div id="quizTimerBar" class="timer-bar bg-red-500 h-2 rounded-full" style="width: 100%"></div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-center">
                            <div class="text-sm text-gray-600">正確</div>
                            <div id="quizCorrect" class="text-xl font-bold text-green-600">0</div>
                        </div>
                        <div class="text-center">
                            <div class="text-sm text-gray-600">錯誤</div>
                            <div id="quizIncorrect" class="text-xl font-bold text-red-600">0</div>
                        </div>
                        <div class="text-center">
                            <div class="text-sm text-gray-600">題數</div>
                            <div id="quizTotal" class="text-xl font-bold text-gray-600">0</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 測驗區域 -->
            <div id="quizArea" class="bg-white rounded-xl shadow-sm p-8 hidden">
            </div>
            
            <!-- 開始按鈕 -->
            <div id="quizStartButton" class="text-center py-12">
                <button id="startQuizCenter" class="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
                    開始測驗遊戲
                </button>
            </div>
        </div>
    `

  setupQuizGame()
}

function setupQuizGame() {
  quizGameState = {
    isPlaying: false,
    currentQuestion: null,
    correctAnswer: null,
    options: [],
    correct: 0,
    incorrect: 0,
    total: 0,
    timeLeft: 0,
    timerInterval: null,
    questions: [],
    currentIndex: 0,
    isAnswered: false,
  }

  document.getElementById("startQuiz").onclick = startQuizGame
  document.getElementById("startQuizCenter").onclick = () => {
    document.getElementById("quizStartButton").classList.add("hidden")
    document.getElementById("quizArea").classList.remove("hidden")
    startQuizGame()
  }

  // 排版切換
  document.getElementById("quizLayoutToggle").onclick = () => {
    quizLayout = quizLayout === "horizontal" ? "vertical" : "horizontal"
    document.getElementById("quizLayoutToggle").textContent = quizLayout === "horizontal" ? "左右" : "垂直"
    if (quizGameState.isPlaying) {
      renderQuizQuestion()
    }
  }

  // 模糊題目
  let isBlurred = false
  document.getElementById("blurQuizText").onclick = () => {
    isBlurred = !isBlurred
    const questionElement = document.getElementById("quizQuestion")
    const button = document.getElementById("blurQuizText")

    if (questionElement) {
      if (isBlurred) {
        questionElement.classList.add("blur-text")
        button.className = "px-3 py-1 bg-red-100 text-red-700 rounded transition-colors text-sm"
      } else {
        questionElement.classList.remove("blur-text")
        button.className = "px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm"
      }
    }
  }
}

function startQuizGame() {
  const sentences = getSelectedSentences()
  const condition = document.getElementById("quizCondition").value
  const button = document.getElementById("startQuiz")

  quizGameState.isPlaying = true
  quizGameState.correct = 0
  quizGameState.incorrect = 0
  quizGameState.total = 0
  quizGameState.currentIndex = 0
  quizGameState.questions = [...sentences].sort(() => Math.random() - 0.5)

  button.textContent = "重新開始"
  button.onclick = restartQuizGame

  document.getElementById("quizCorrect").textContent = "0"
  document.getElementById("quizIncorrect").textContent = "0"
  document.getElementById("quizTotal").textContent = "0"

  // 設定計時器
  if (condition.startsWith("time")) {
    const timeLimit = Number.parseInt(condition.replace("time", ""))
    quizGameState.timeLeft = timeLimit
    startQuizTimer()
  } else {
    document.getElementById("quizTimer").textContent = "不限時間"
  }

  generateQuizQuestion()
}

function restartQuizGame() {
  if (quizGameState.timerInterval) {
    clearInterval(quizGameState.timerInterval)
  }
  startQuizGame()
}

function startQuizTimer() {
  const timerElement = document.getElementById("quizTimer")
  const timerBar = document.getElementById("quizTimerBar")
  const condition = document.getElementById("quizCondition").value
  const timeLimit = Number.parseInt(condition.replace("time", ""))

  quizGameState.timerInterval = setInterval(() => {
    quizGameState.timeLeft--
    timerElement.textContent = `剩餘 ${quizGameState.timeLeft} 秒`

    const percentage = (quizGameState.timeLeft / timeLimit) * 100
    timerBar.style.width = percentage + "%"

    if (quizGameState.timeLeft <= 0) {
      clearInterval(quizGameState.timerInterval)
      endQuizGame("時間到！")
    }
  }, 1000)
}

function generateQuizQuestion() {
  if (quizGameState.currentIndex >= quizGameState.questions.length) {
    quizGameState.questions = [...quizGameState.questions].sort(() => Math.random() - 0.5)
    quizGameState.currentIndex = 0
  }

  const currentSentence = quizGameState.questions[quizGameState.currentIndex]
  const type = document.getElementById("quizType").value
  const optionCount = Number.parseInt(document.getElementById("quizOptions").value)

  // 設定題目和正確答案
  let question, correctAnswer
  switch (type) {
    case "hakka-chinese":
      question = currentSentence["客語"]
      correctAnswer = currentSentence["華語"]
      break
    case "chinese-hakka":
      question = currentSentence["華語"]
      correctAnswer = currentSentence["客語"]
      break
    case "pinyin-chinese":
      question = currentSentence["拼音"]
      correctAnswer = currentSentence["華語"]
      break
    case "chinese-pinyin":
      question = currentSentence["華語"]
      correctAnswer = currentSentence["拼音"]
      break
    case "hakka-pinyin":
      question = currentSentence["客語"]
      correctAnswer = currentSentence["拼音"]
      break
    case "pinyin-hakka":
      question = currentSentence["拼音"]
      correctAnswer = currentSentence["客語"]
      break
  }

  // 生成選項
  const allSentences = getSelectedSentences()
  const wrongAnswers = allSentences
    .filter((s) => s !== currentSentence)
    .map((s) => {
      switch (type) {
        case "hakka-chinese":
        case "pinyin-chinese":
          return s["華語"]
        case "chinese-hakka":
        case "pinyin-hakka":
          return s["客語"]
        case "hakka-pinyin":
        case "chinese-pinyin":
          return s["拼音"]
        default:
          return s["華語"]
      }
    })
    .filter((answer, index, arr) => arr.indexOf(answer) === index) // 去重
    .sort(() => Math.random() - 0.5)
    .slice(0, optionCount - 1)

  const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)

  quizGameState.currentQuestion = question
  quizGameState.correctAnswer = correctAnswer
  quizGameState.options = options
  quizGameState.isAnswered = false

  renderQuizQuestion()

  // 自動播放音檔
  if (document.getElementById("autoPlayAudio").checked) {
    playAudio(currentSentence["音檔"])
  }
}

function renderQuizQuestion() {
  const quizArea = document.getElementById("quizArea")
  const isVertical = quizLayout === "vertical"

  quizArea.innerHTML = `
        <div class="text-center mb-8">
            <div class="flex items-center justify-center gap-4 mb-6">
                <button onclick="playAudio('${quizGameState.questions[quizGameState.currentIndex]["音檔"]}')" 
                        class="text-gray-800 hover:bg-gray-100 p-2 rounded transition-colors">
                    <span class="material-icons">volume_up</span>
                </button>
                <div id="quizQuestion" class="text-2xl font-bold text-red-800" style="font-size: ${userSettings.fontSize + 4}px">
                    ${quizGameState.currentQuestion}
                </div>
            </div>
        </div>
        
        <div class="quiz-${isVertical ? "vertical" : "horizontal"} ${isVertical ? "space-y-3" : "grid grid-cols-2 gap-4"}">
            ${quizGameState.options
              .map(
                (option, index) => `
                <button class="quiz-option bg-white rounded-lg p-4 text-left hover:shadow-md transition-all" 
                        style="font-size: ${userSettings.fontSize}px"
                        onclick="selectQuizOption('${option.replace(/'/g, "\\'")}', this)">
                    ${String.fromCharCode(65 + index)}. ${option}
                </button>
            `,
              )
              .join("")}
        </div>
    `
}

function selectQuizOption(selectedAnswer, element) {
  if (quizGameState.isAnswered) return

  quizGameState.isAnswered = true
  quizGameState.total++
  document.getElementById("quizTotal").textContent = quizGameState.total

  const isCorrect = selectedAnswer === quizGameState.correctAnswer

  // 標記所有選項為已回答
  document.querySelectorAll(".quiz-option").forEach((option) => {
    option.classList.add("quiz-answered")
    option.textContent = option.textContent.trim()

    if (option.textContent.substring(3) === quizGameState.correctAnswer) {
      option.classList.add("quiz-correct")
      if (isCorrect) {
        showCelebration(option)
      }
    } else if (option === element && !isCorrect) {
      option.classList.add("quiz-incorrect")
    }
  })

  if (isCorrect) {
    quizGameState.correct++
    document.getElementById("quizCorrect").textContent = quizGameState.correct
  } else {
    quizGameState.incorrect++
    document.getElementById("quizIncorrect").textContent = quizGameState.incorrect
  }

  // 檢查過關條件
  const condition = document.getElementById("quizCondition").value
  if (condition.startsWith("correct")) {
    const target = Number.parseInt(condition.replace("correct", ""))
    if (quizGameState.correct >= target) {
      setTimeout(() => endQuizGame(`恭喜達成目標！\n答對 ${target} 題`), 1500)
      return
    }
  }

  // 下一題
  setTimeout(() => {
    quizGameState.currentIndex++
    generateQuizQuestion()
  }, 1500)
}

function endQuizGame(message) {
  quizGameState.isPlaying = false

  if (quizGameState.timerInterval) {
    clearInterval(quizGameState.timerInterval)
  }

  const accuracy = quizGameState.total > 0 ? Math.round((quizGameState.correct / quizGameState.total) * 100) : 0

  showResult(
    "🎯",
    "測驗結束",
    `${message}\n\n` +
      `答對：${quizGameState.correct} 題\n` +
      `答錯：${quizGameState.incorrect} 題\n` +
      `總題數：${quizGameState.total} 題\n` +
      `正確率：${accuracy}%`,
  )
}

// 排序遊戲
function showSortingGame() {
  const contentArea = document.getElementById("contentArea")
  const sentences = getSelectedSentences()

  if (sentences.length < 1) {
    contentArea.innerHTML = '<div class="text-center py-12 text-gray-500">請先選擇要練習的句子</div>'
    return
  }

  contentArea.innerHTML = `
        <div class="max-w-6xl mx-auto">
            <!-- 控制面板 -->
            <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-2">
                        <select id="sortingType" class="px-3 py-1 border border-gray-300 rounded text-sm">
                            <option value="hakka-pinyin">客語 ↔ 拼音</option>
                            <option value="chinese-pinyin">華語 ↔ 拼音</option>
                            <option value="pinyin-hakka">拼音 ↔ 客語</option>
                            <option value="chinese-hakka">華語 ↔ 客語</option>
                        </select>
                        <select id="sortingCondition" class="px-3 py-1 border border-gray-300 rounded text-sm">
                            <option value="time60">限時60秒</option>
                            <option value="time100">限時100秒</option>
                            <option value="time180">限時180秒</option>
                            <option value="unlimited" selected>不限時間</option>
                            <option value="correct5">答對5題</option>
                            <option value="correct10">答對10題</option>
                            <option value="correct15">答對15題</option>
                            <option value="correct20">答對20題</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="adjustFontSize(-1, 'sorting')" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">
                            ${userSettings.fontSize}-
                        </button>
                        <button onclick="adjustFontSize(1, 'sorting')" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">
                            A+
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 遊戲狀態列 -->
            <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <button id="startSorting" class="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                            開始排序
                        </button>
                        <div id="sortingTimer" class="text-lg font-bold text-gray-700">準備開始</div>
                        <div class="bg-gray-200 rounded-full h-2 w-32">
                            <div id="sortingTimerBar" class="timer-bar bg-indigo-500 h-2 rounded-full" style="width: 100%"></div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-center">
                            <div class="text-sm text-gray-600">分數</div>
                            <div id="sortingScore" class="text-xl font-bold text-indigo-600">0</div>
                        </div>
                        <div class="text-center">
                            <div class="text-sm text-gray-600">正確</div>
                            <div id="sortingCorrect" class="text-xl font-bold text-green-600">0</div>
                        </div>
                        <div class="text-center">
                            <div class="text-sm text-gray-600">錯誤</div>
                            <div id="sortingIncorrect" class="text-xl font-bold text-red-600">0</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 排序區域 -->
            <div id="sortingArea" class="bg-white rounded-xl shadow-sm p-8 hidden">
            </div>
            
            <!-- 開始按鈕 -->
            <div id="sortingStartButton" class="text-center py-12">
                <button id="startSortingCenter" class="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
                    開始排序遊戲
                </button>
            </div>
        </div>
    `

  setupSortingGame()
}

function setupSortingGame() {
  sortingGameState = {
    isPlaying: false,
    currentSentence: null,
    questionText: "",
    originalWords: [],
    shuffledWords: [],
    userOrder: [],
    fixedWords: [],
    correct: 0,
    incorrect: 0,
    score: 0,
    timeLeft: 0,
    timerInterval: null,
    sentences: [],
    usedSentences: [],
    availableSentences: [],
  }

  document.getElementById("startSorting").onclick = startSortingGame
  document.getElementById("startSortingCenter").onclick = () => {
    document.getElementById("sortingStartButton").classList.add("hidden")
    document.getElementById("sortingArea").classList.remove("hidden")
    startSortingGame()
  }
}

function startSortingGame() {
  const sentences = getSelectedSentences()
  const condition = document.getElementById("sortingCondition").value
  const button = document.getElementById("startSorting")

  sortingGameState.isPlaying = true
  sortingGameState.correct = 0
  sortingGameState.incorrect = 0
  sortingGameState.score = 0
  sortingGameState.sentences = sentences
  sortingGameState.usedSentences = []
  sortingGameState.availableSentences = [...sentences].sort(() => Math.random() - 0.5)

  button.textContent = "重新開始"
  button.onclick = restartSortingGame

  document.getElementById("sortingScore").textContent = "0"
  document.getElementById("sortingCorrect").textContent = "0"
  document.getElementById("sortingIncorrect").textContent = "0"

  // 設定計時器
  if (condition.startsWith("time")) {
    const timeLimit = Number.parseInt(condition.replace("time", ""))
    sortingGameState.timeLeft = timeLimit
    startSortingTimer()
  } else {
    document.getElementById("sortingTimer").textContent = "不限時間"
  }

  generateSortingQuestion()
}

function restartSortingGame() {
  if (sortingGameState.timerInterval) {
    clearInterval(sortingGameState.timerInterval)
  }
  startSortingGame()
}

function startSortingTimer() {
  const timerElement = document.getElementById("sortingTimer")
  const timerBar = document.getElementById("sortingTimerBar")
  const condition = document.getElementById("sortingCondition").value
  const timeLimit = Number.parseInt(condition.replace("time", ""))

  sortingGameState.timerInterval = setInterval(() => {
    sortingGameState.timeLeft--
    timerElement.textContent = `剩餘 ${sortingGameState.timeLeft} 秒`

    const percentage = (sortingGameState.timeLeft / timeLimit) * 100
    timerBar.style.width = percentage + "%"

    if (sortingGameState.timeLeft <= 0) {
      clearInterval(sortingGameState.timerInterval)
      endSortingGame("時間到！")
    }
  }, 1000)
}

function generateSortingQuestion() {
  // 如果沒有可用題目，重新洗牌
  if (sortingGameState.availableSentences.length === 0) {
    sortingGameState.availableSentences = [...sortingGameState.sentences].sort(() => Math.random() - 0.5)
    sortingGameState.usedSentences = []
  }

  // 取出下一個題目
  const sentence = sortingGameState.availableSentences.shift()
  sortingGameState.usedSentences.push(sentence)
  const type = document.getElementById("sortingType").value

  let questionText, answerText
  switch (type) {
    case "hakka-pinyin":
      questionText = sentence["客語"]
      answerText = sentence["拼音"]
      break
    case "chinese-pinyin":
      questionText = sentence["華語"]
      answerText = sentence["拼音"]
      break
    case "pinyin-hakka":
      questionText = sentence["拼音"]
      answerText = sentence["客語"]
      break
    case "chinese-hakka":
      questionText = sentence["華語"]
      answerText = sentence["客語"]
      break
  }

  // 分割答案文字
  let words
  if (answerText.includes(" ")) {
    // 如果有空格，按空格分割
    words = answerText.split(" ").filter((word) => word.trim() !== "")
  } else if (type === "pinyin-hakka" || type === "chinese-hakka") {
    // 如果答案是客語，使用 Array.from 正確分割
    words = Array.from(answerText).filter((char) => char.trim() !== "")
  } else {
    // 其他情況按字符分割
    words = answerText.split("").filter((char) => char.trim() !== "")
  }

  // 如果超過6個字詞，前面的固定
  let fixedWords = []
  let shuffleWords = words
  if (words.length > 6) {
    const fixedCount = words.length - 6
    fixedWords = words.slice(0, fixedCount)
    shuffleWords = words.slice(fixedCount)
  }

  const shuffledWords = [...shuffleWords].sort(() => Math.random() - 0.5)

  sortingGameState.currentSentence = sentence
  sortingGameState.questionText = questionText
  sortingGameState.originalWords = words
  sortingGameState.fixedWords = fixedWords
  sortingGameState.shuffledWords = shuffledWords
  sortingGameState.userOrder = [...fixedWords] // 預填固定字詞

  renderSortingQuestion()
}

function renderSortingQuestion() {
  const sortingArea = document.getElementById("sortingArea")
  const canCheck = sortingGameState.userOrder.length === sortingGameState.originalWords.length

  sortingArea.innerHTML = `
        <div class="text-center mb-8">
            <div class="flex items-center justify-center gap-4 mb-6">
                <button onclick="playAudio('${sortingGameState.currentSentence["音檔"]}')" 
                        class="text-gray-800 hover:bg-gray-100 p-2 rounded transition-colors">
                    <span class="material-icons">volume_up</span>
                </button>
                <div class="text-2xl font-bold text-indigo-800" style="font-size: ${userSettings.fontSize + 4}px">
                    ${sortingGameState.questionText}
                </div>
            </div>
            
            <!-- 答案區域 -->
            <div class="bg-gray-100 rounded-lg p-4 mb-6 min-h-16">
                <div id="sortingTarget" class="flex gap-2 flex-wrap justify-center min-h-12">
                    ${sortingGameState.userOrder
                      .map((word, index) => {
                        const isFixed = index < sortingGameState.fixedWords.length
                        return `
                            <div class="sorting-word ${isFixed ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-500 cursor-pointer"} text-white px-4 py-2 rounded-lg" 
                                 style="font-size: ${userSettings.fontSize}px"
                                 ${!isFixed ? `onclick="removeFromTarget(${index})"` : ""}>
                                ${word}
                            </div>
                        `
                      })
                      .join("")}
                    ${sortingGameState.userOrder.length === sortingGameState.fixedWords.length ? '<div class="invisible-placeholder px-4 py-2">　</div>' : ""}
                </div>
            </div>
            
            <!-- 選項區域 -->
            <div class="flex gap-3 flex-wrap justify-center mb-6 min-h-16">
                <div class="min-h-12 flex gap-3 flex-wrap justify-center">
                    ${sortingGameState.shuffledWords
                      .map(
                        (word, index) => `
                        <div class="sorting-word bg-white border-2 border-gray-300 px-4 py-2 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors" 
                             style="font-size: ${userSettings.fontSize}px"
                             onclick="addToTarget('${word}', ${index})">
                            ${word}
                        </div>
                    `,
                      )
                      .join("")}
                    ${sortingGameState.shuffledWords.length === 0 ? '<div class="invisible-placeholder px-4 py-2">　</div>' : ""}
                </div>
            </div>
            
            <!-- 控制按鈕 -->
            <div class="flex gap-4 justify-center">
                <button onclick="checkSortingAnswer()" 
                        class="px-6 py-2 rounded-lg font-semibold transition-colors ${canCheck ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}"
                        ${!canCheck ? "disabled" : ""}>
                    檢查答案
                </button>
            </div>
        </div>
    `
}

function addToTarget(word, index) {
  sortingGameState.userOrder.push(word)
  sortingGameState.shuffledWords.splice(index, 1)
  renderSortingQuestion()
}

function removeFromTarget(index) {
  // 不能移除固定字詞
  if (index < sortingGameState.fixedWords.length) {
    return
  }

  const word = sortingGameState.userOrder[index]
  sortingGameState.userOrder.splice(index, 1)
  sortingGameState.shuffledWords.push(word)
  renderSortingQuestion()
}

function checkSortingAnswer() {
  if (sortingGameState.userOrder.length !== sortingGameState.originalWords.length) {
    showResult("⚠️", "提醒", "請完成所有字詞的排列")
    return
  }

  const userAnswer = sortingGameState.userOrder.join("")
  const correctAnswer = sortingGameState.originalWords.join("")

  if (userAnswer === correctAnswer) {
    // 答對
    sortingGameState.correct++
    sortingGameState.score += 100

    document.getElementById("sortingCorrect").textContent = sortingGameState.correct
    document.getElementById("sortingScore").textContent = sortingGameState.score

    showCelebration(document.getElementById("sortingTarget"))

    // 檢查過關條件
    const condition = document.getElementById("sortingCondition").value
    if (condition.startsWith("correct")) {
      const target = Number.parseInt(condition.replace("correct", ""))
      if (sortingGameState.correct >= target) {
        setTimeout(() => endSortingGame(`恭喜完成目標！\n答對 ${target} 題`), 1500)
        return
      }
    }

    // 下一題
    setTimeout(() => {
      generateSortingQuestion()
    }, 1500)
  } else {
    // 答錯 - 找出正確的部分並保留
    sortingGameState.incorrect++
    sortingGameState.score = Math.max(0, sortingGameState.score - 20)

    document.getElementById("sortingIncorrect").textContent = sortingGameState.incorrect
    document.getElementById("sortingScore").textContent = sortingGameState.score

    // 找出從前面開始正確的部分
    let correctCount = sortingGameState.fixedWords.length // 固定字詞一定正確
    for (let i = sortingGameState.fixedWords.length; i < sortingGameState.userOrder.length; i++) {
      if (sortingGameState.userOrder[i] === sortingGameState.originalWords[i]) {
        correctCount++
      } else {
        break
      }
    }

    // 保留正確的部分，錯誤的退回選項區
    const correctPart = sortingGameState.userOrder.slice(0, correctCount)
    const wrongPart = sortingGameState.userOrder.slice(correctCount)

    sortingGameState.userOrder = correctPart
    sortingGameState.shuffledWords.push(...wrongPart)

    renderSortingQuestion()
  }
}

function endSortingGame(message) {
  sortingGameState.isPlaying = false

  if (sortingGameState.timerInterval) {
    clearInterval(sortingGameState.timerInterval)
  }

  const totalQuestions = sortingGameState.correct + sortingGameState.incorrect
  const accuracy = totalQuestions > 0 ? Math.round((sortingGameState.correct / totalQuestions) * 100) : 0

  showResult(
    "🎯",
    "排序結束",
    `${message}\n\n` +
      `最終分數：${sortingGameState.score}\n` +
      `答對題數：${sortingGameState.correct}\n` +
      `答錯題數：${sortingGameState.incorrect}\n` +
      `正確率：${accuracy}%`,
  )
}

// 顯示結果視窗
function showResult(icon, title, message) {
  document.getElementById("resultIcon").textContent = icon
  document.getElementById("resultTitle").textContent = title
  document.getElementById("resultMessage").textContent = message
  document.getElementById("resultModal").classList.remove("hidden")
}

// 設置事件監聽器
function setupEventListeners() {
  // 搜尋功能
  setupSearch()

  // 手機搜尋框展開
  document.getElementById("searchToggle").onclick = () => {
    const mainTitle = document.getElementById("mainTitle")
    const mobileSearchBox = document.getElementById("mobileSearchBox")
    const searchToggle = document.getElementById("searchToggle")

    mainTitle.classList.add("hidden")
    mobileSearchBox.classList.remove("hidden")
    searchToggle.classList.add("hidden")
    document.getElementById("mobileSearchInput").focus()
  }

  // 關閉手機搜尋框
  document.getElementById("closeMobileSearch").onclick = () => {
    const mainTitle = document.getElementById("mainTitle")
    const mobileSearchBox = document.getElementById("mobileSearchBox")
    const searchToggle = document.getElementById("searchToggle")

    mainTitle.classList.remove("hidden")
    mobileSearchBox.classList.add("hidden")
    searchToggle.classList.remove("hidden")
    document.getElementById("mobileSearchInput").value = ""
    document.getElementById("searchResults").classList.add("hidden")
  }

  // 手機搜尋輸入
  document.getElementById("mobileSearchInput").addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase()
    if (query.length < 1) {
      document.getElementById("searchResults").classList.add("hidden")
      return
    }

    const results = []

    // 搜尋分類
    Object.keys(categories).forEach((category) => {
      if (category.toLowerCase().includes(query)) {
        results.push({
          type: "category",
          title: category,
          subtitle: `${categories[category].length} 個句子`,
          data: category,
        })
      }
    })

    // 搜尋句子內容
    Object.entries(categories).forEach(([category, sentences]) => {
      sentences.forEach((sentence, index) => {
        const searchText = `${sentence["客語"]} ${sentence["拼音"]} ${sentence["華語"]}`.toLowerCase()
        if (searchText.includes(query)) {
          results.push({
            type: "sentence",
            title: sentence["客語"],
            subtitle: `${category} - ${sentence["華語"]}`,
            data: { category, index },
          })
        }
      })
    })

    const searchResults = document.getElementById("searchResults")
    if (results.length > 0) {
      searchResults.innerHTML = results
        .slice(0, 10)
        .map(
          (result) => `
                <div class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0" 
                     onclick="selectSearchResult('${result.type}', '${JSON.stringify(result.data).replace(/'/g, "\\'")}')">
                    <div class="font-semibold text-gray-900">${result.title}</div>
                    <div class="text-sm text-gray-600">${result.subtitle}</div>
                </div>
            `,
        )
        .join("")
      searchResults.classList.remove("hidden")
    } else {
      searchResults.innerHTML = '<div class="p-3 text-gray-500 text-center">沒有找到相關結果</div>'
      searchResults.classList.remove("hidden")
    }
  })

  // 檢視切換
  document.getElementById("viewToggle").onclick = () => {
    const newMode = currentViewMode === "card" ? "list" : "card"
    setViewMode(newMode)
  }

  // 用戶下拉選單
  document.getElementById("userButton").onclick = (e) => {
    e.stopPropagation()
    document.getElementById("userDropdown").classList.toggle("hidden")
  }

  document.addEventListener("click", (e) => {
    if (!document.getElementById("userButton").contains(e.target)) {
      document.getElementById("userDropdown").classList.add("hidden")
    }
  })

  // 用戶功能
  document.getElementById("editProfile").onclick = () => {
    document.getElementById("userDropdown").classList.add("hidden")
    document.getElementById("editName").value = currentUser.name
    document.getElementById("editId").value = currentUser.id
    document.getElementById("editAvatar").value = currentUser.avatar
    document.getElementById("userModal").classList.remove("hidden")
  }

  document.getElementById("saveProfile").onclick = () => {
    const newName = document.getElementById("editName").value.trim()
    const newId = document.getElementById("editId").value.trim()
    const newAvatar = document.getElementById("editAvatar").value.trim()

    if (newName && newId && newAvatar) {
      currentUser.name = newName
      currentUser.id = newId
      currentUser.avatar = newAvatar
      saveUserData()
      updateUserDisplay()
      document.getElementById("userModal").classList.add("hidden")

      // 重新載入設定
      loadUserSettings()
    }
  }

  document.getElementById("cancelEdit").onclick = () => {
    document.getElementById("userModal").classList.add("hidden")
  }

  document.getElementById("clearData").onclick = () => {
    document.getElementById("userDropdown").classList.add("hidden")
    document.getElementById("clearModal").classList.remove("hidden")
  }

  document.getElementById("confirmClear").onclick = () => {
    const password = document.getElementById("clearPassword").value
    if (password === "kasu") {
      // 清除學習記錄
      const settingsKey = `${STORAGE_PREFIX}settings_${currentUser.id}`
      localStorage.removeItem(settingsKey)
      starredCards.clear()
      selectedCategories.clear()
      selectedSentences.clear()

      document.getElementById("clearModal").classList.add("hidden")
      document.getElementById("clearPassword").value = ""
      showResult("✅", "清除完成", "所有學習記錄已清除")
    } else {
      showResult("❌", "密碼錯誤", "請輸入正確的密碼")
    }
  }

  document.getElementById("cancelClear").onclick = () => {
    document.getElementById("clearModal").classList.add("hidden")
    document.getElementById("clearPassword").value = ""
  }

  document.getElementById("logout").onclick = () => {
    currentUser = { id: "guest", name: "訪客", avatar: "U" }
    saveUserData()
    updateUserDisplay()
    loadUserSettings()
    document.getElementById("userDropdown").classList.add("hidden")
    showResult("👋", "已登出", "已切換為訪客模式")
  }

  // 詳情頁用戶下拉選單
  const userButtonDetail = document.getElementById("userButtonDetail")
  const userDropdownDetail = document.getElementById("userDropdownDetail")

  if (userButtonDetail && userDropdownDetail) {
    userButtonDetail.onclick = (e) => {
      e.stopPropagation()
      userDropdownDetail.classList.toggle("hidden")
    }

    document.addEventListener("click", (e) => {
      if (!userButtonDetail.contains(e.target)) {
        userDropdownDetail.classList.add("hidden")
      }
    })

    // 詳情頁用戶功能
    document.getElementById("editProfileDetail").onclick = () => {
      userDropdownDetail.classList.add("hidden")
      document.getElementById("editName").value = currentUser.name
      document.getElementById("editId").value = currentUser.id
      document.getElementById("editAvatar").value = currentUser.avatar
      document.getElementById("userModal").classList.remove("hidden")
    }

    document.getElementById("clearDataDetail").onclick = () => {
      userDropdownDetail.classList.add("hidden")
      document.getElementById("clearModal").classList.remove("hidden")
    }

    document.getElementById("logoutDetail").onclick = () => {
      currentUser = { id: "guest", name: "訪客", avatar: "U" }
      saveUserData()
      updateUserDisplay()
      loadUserSettings()
      userDropdownDetail.classList.add("hidden")
      showResult("👋", "已登出", "已切換為訪客模式")
    }
  }

  // 選取工具條
  document.getElementById("selectAll").onclick = () => {
    Object.keys(categories).forEach((category) => {
      selectedCategories.add(category)
    })
    renderCategoryList()
  }

  document.getElementById("deselectAll").onclick = () => {
    selectedCategories.clear()
    renderCategoryList()
  }

  document.getElementById("learnSelected").onclick = () => {
    if (selectedCategories.size > 0) {
      // 合併選中分類的句子
      const combinedSentences = []
      selectedCategories.forEach((category) => {
        combinedSentences.push(...categories[category])
      })

      // 創建臨時分類
      const tempCategory = `已選取的 ${selectedCategories.size} 個主題`
      categories[tempCategory] = combinedSentences
      showCategoryDetail(tempCategory)
    }
  }

  // 選單下拉功能
  document.getElementById("menuToggle").onclick = (e) => {
    e.stopPropagation()
    document.getElementById("menuDropdown").classList.toggle("hidden")
  }

  document.addEventListener("click", (e) => {
    if (!document.getElementById("menuToggle").contains(e.target)) {
      document.getElementById("menuDropdown").classList.add("hidden")
    }
  })

  // 首頁按鈕點擊
  document.getElementById("goHome").onclick = () => {
    stopAllTimers()
    // 清理臨時分類
    Object.keys(categories).forEach((key) => {
      if (key.startsWith("已選取的")) {
        delete categories[key]
      }
    })
    document.getElementById("categoryDetail").classList.add("hidden")
    document.getElementById("mainMenu").classList.remove("hidden")
  }

  // 模式切換
  document.getElementById("viewSentences").onclick = () => {
    stopAllTimers()
    showLearningView()
    updateCurrentMode("學習")
    document.getElementById("menuDropdown").classList.add("hidden")
  }

  document.getElementById("flashcardMode").onclick = () => {
    if (selectedSentences.size === 0) {
      showResult("⚠️", "提醒", "請勾選句子後再進入「閃示卡」。")
      updateCurrentMode("學習")
      return
    }
    stopAllTimers()
    showFlashcardView()
    updateCurrentMode("閃示卡")
    document.getElementById("menuDropdown").classList.add("hidden")
  }

  document.getElementById("matchingGame").onclick = () => {
    if (selectedSentences.size === 0) {
      showResult("⚠️", "提醒", "請勾選句子後再進入「配對」。")
      updateCurrentMode("學習")
      return
    }
    stopAllTimers()
    showMatchingGame()
    updateCurrentMode("配對")
    document.getElementById("menuDropdown").classList.add("hidden")
  }

  document.getElementById("quizGame").onclick = () => {
    if (selectedSentences.size === 0) {
      showResult("⚠️", "提醒", "請勾選句子後再進入「測驗」。")
      updateCurrentMode("學習")
      return
    }
    stopAllTimers()
    showQuizGame()
    updateCurrentMode("測驗")
    document.getElementById("menuDropdown").classList.add("hidden")
  }

  document.getElementById("sortingGame").onclick = () => {
    if (selectedSentences.size === 0) {
      showResult("⚠️", "提醒", "請勾選句子後再進入「排序」。")
      updateCurrentMode("學習")
      return
    }
    stopAllTimers()
    showSortingGame()
    updateCurrentMode("排序")
    document.getElementById("menuDropdown").classList.add("hidden")
  }

  // 結果視窗關閉
  document.getElementById("closeResult").onclick = () => {
    document.getElementById("resultModal").classList.add("hidden")
  }
	document.getElementById("deselectAll").addEventListener("click", () => {
		clearAllSelections();
	});
}

// 停止所有計時器
function stopAllTimers() {
  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
  if (matchingGameState.timerInterval) {
    clearInterval(matchingGameState.timerInterval)
    matchingGameState.timerInterval = null
  }
  if (quizGameState.timerInterval) {
    clearInterval(quizGameState.timerInterval)
    quizGameState.timerInterval = null
  }
  if (sortingGameState.timerInterval) {
    clearInterval(sortingGameState.timerInterval)
    sortingGameState.timerInterval = null
  }
}

// 啟動應用
init()
