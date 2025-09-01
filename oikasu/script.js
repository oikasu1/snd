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
let currentPlayingIcon = null
let originalIconContent = ''
let matchingGameState = {}
let sortingGameState = {}
let quizLayout = "horizontal"
let quizGameState = {}
let isFlashcardShuffled = false
let originalFlashcardOrder = []
let flashcardKeyHandler = null

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
  
  // 確保 matchingLayout 屬性存在
  if (!userSettings.matchingLayout) {
    userSettings.matchingLayout = '1col';
  }
  
  // 新增：確保 quizLayout 屬性存在，若不存在則根據螢幕寬度設定預設值
  if (!userSettings.quizLayout) {
    userSettings.quizLayout = window.innerWidth >= 1024 ? 'horizontal' : 'vertical';
  }

  // 【新增】確保閃示卡自動播音設定存在，預設為開啟
  if (userSettings.flashcardAutoPlayAudio === undefined) {
    userSettings.flashcardAutoPlayAudio = true;
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
// 搜尋功能
function handleSearchInput(e) {
  const query = e.target.value.trim().toLowerCase();
  const searchResults = document.getElementById("searchResults");
  const clearSearchBtn = document.getElementById("clearSearch"); // 桌面版清除按鈕

  // 根據輸入框是否有文字，顯示或隱藏桌面版的清除按鈕
  if (clearSearchBtn) {
    if (query.length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
  }

  if (query.length < 1) {
    searchResults.classList.add("hidden");
    return;
  }

  const results = [];

  // 搜尋分類
  Object.keys(categories).forEach((category) => {
    if (category.toLowerCase().includes(query)) {
      results.push({
        type: "category",
        title: category,
        subtitle: `${categories[category].length} 個句子`,
        data: category,
      });
    }
  });

  // 搜尋句子內容
  Object.entries(categories).forEach(([category, sentences]) => {
    sentences.forEach((sentence, index) => {
      const searchText = `${sentence["客語"]} ${sentence["拼音"]} ${sentence["華語"]}`.toLowerCase();
      if (searchText.includes(query)) {
        results.push({
          type: "sentence",
          title: sentence["客語"],
          subtitle: `${category} - ${sentence["華語"]}`,
          data: { category, index },
        });
      }
    });
  });

  if (results.length > 0) {
    searchResults.innerHTML = results
      .slice(0, 10)
      .map(
        (result, index) => { // 【修改】增加了 index 參數
          const emoji = result.type === 'category' ? `<span class="text-xl mr-3">${getCategoryEmoji(result.title)}</span>` : '';
          return `
              <div class="search-result-item p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-start" 
                   onclick="selectSearchResult('${result.type}', '${JSON.stringify(result.data).replace(/"/g, "&quot;")}')">
                  <span class="mr-3 text-gray-500 font-medium pt-0.5">${index + 1}.</span>
                  <div class="flex items-center flex-1 min-w-0">
                      ${emoji}
                      <div class="min-w-0">
                        <div class="font-semibold text-gray-900 truncate">${result.title}</div>
                        <div class="text-sm text-gray-600 truncate">${result.subtitle}</div>
                      </div>
                  </div>
              </div>
          `;
        }
      )
      .join("");
    searchResults.classList.remove("hidden");
  } else {
    searchResults.innerHTML = '<div class="p-3 text-gray-500 text-center">沒有找到相關結果</div>';
    searchResults.classList.remove("hidden");
  }
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
function renderCategoryList() {
    const categoryList = document.getElementById("categoryList");
    categoryList.innerHTML = "";

    // 【核心修改】調整格線系統的欄位數，讓卡片變窄
    const viewModeClass = currentViewMode === "card" 
        ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
        : "space-y-2";
    categoryList.className = viewModeClass;

    Object.keys(categories).forEach((category) => {
        const isSelected = selectedCategories.has(category);
        const emoji = getCategoryEmoji(category);
        const categoryItem = document.createElement("div");

        categoryItem.className = `category-card bg-white rounded-xl shadow-sm cursor-pointer hover:shadow-md ${isSelected ? "checkbox-selected" : ""}`;
        
        categoryItem.onclick = () => toggleCategorySelection(category);

        const safeCategory = category.replace(/'/g, "\\'");

        if (currentViewMode === "card") {
            // 卡片內部樣式
            categoryItem.innerHTML = `
                <div class="p-2">
                    <div class="selection-indicator">
                        <span class="material-icons text-base">${isSelected ? 'check' : 'radio_button_unchecked'}</span>
                    </div>
                    <div class="flex items-center space-x-2 pl-8">
                        <div class="text-4xl">
                            ${emoji}
                        </div>
                        <div>
                            <h3 class="category-title-link text-lg text-gray-800" onclick="event.stopPropagation(); showCategoryDetail('${safeCategory}')">
                                ${category}
                            </h3>
                            <p class="text-sm text-gray-500">${categories[category].length} 句</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // List view (清單檢視) 樣式
            categoryItem.className += " p-3 flex items-center space-x-4";
            categoryItem.innerHTML = `
                <div class="selection-indicator !left-3 !top-1/2 !-translate-y-1/2">
                    <span class="material-icons text-base">${isSelected ? 'check' : 'radio_button_unchecked'}</span>
                </div>
                <div class="pl-8 flex items-center space-x-4">
                    <span class="text-2xl">${emoji}</span>
                    <div class="flex items-baseline gap-x-3">
                        <h3 class="category-title-link text-lg font-bold text-gray-800" onclick="event.stopPropagation(); showCategoryDetail('${safeCategory}')">
                            ${category}
                        </h3>
                        <p class="text-sm text-gray-500 flex-shrink-0">${categories[category].length} 句</p>
                    </div>
                </div>
            `;
        }
        categoryList.appendChild(categoryItem);
    });

    updateSelectionToolbar();
}


// 清除所有勾選的分類
function clearAllSelections() {
  selectedCategories.clear();
  saveSelectedCategories();
  renderCategoryList();    
  updateSelectionToolbar(); 
}
// 切換分類選取

function toggleCategorySelection(category) {
  if (selectedCategories.has(category)) {
    selectedCategories.delete(category);
  } else {
    selectedCategories.add(category);
  }
  saveSelectedCategories();
  renderCategoryList();    
  updateSelectionToolbar();
}



// 更新選取工具條
function updateSelectionToolbar() {
    const selectionContent = document.getElementById("selectionContent"); // 改為控制內容容器
    const count = selectedCategories.size;
    const selectionCount = document.getElementById("selectionCount");

    if (count > 0) {
        selectionCount.textContent = `已選 ${count} 個`;
        if(selectionContent) selectionContent.classList.remove("hidden");
    } else {
        if(selectionContent) selectionContent.classList.add("hidden");
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

  // 【核心變更】圖示顯示的是你將要切換到的模式
  if (mode === "card") {
    icon.textContent = "view_list"; // 在卡片模式下，顯示 "列表" 圖示
    viewToggle.title = "切換為清單檢視";
  } else {
    icon.textContent = "grid_view"; // 在列表模式下，顯示 "網格" 圖示
    viewToggle.title = "切換為格狀檢視";
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

/**
 * 播放音檔，並可選擇性地更新按鈕圖示。
 * @param {string} filename - 要播放的音檔名稱。
 * @param {HTMLElement} [iconElement=null] - (可選) 要更新的 Material Icons 元素。
 */
function playAudio(filename, iconElement = null) {
  // 1. 如果有正在播放的音檔，先暫停它。
  //    onpause 事件會自動處理圖示的重置。
  if (currentAudio) {
    currentAudio.pause();
  }

  // 2. 如果之前有正在播放的圖示，也立即將它恢復原狀。
  //    這可以處理快速連續點擊不同按鈕的情況。
  if (currentPlayingIcon) {
    currentPlayingIcon.textContent = originalIconContent;
    currentPlayingIcon = null;
  }

  // 如果沒有傳入檔名，就到此為止 (純粹停止播放)。
  if (!filename) return;

  // 3. 建立新的 Audio 物件
  currentAudio = new Audio(`https://oikasu1.github.io/snd/oikasu/${filename}`);

  // 4. 如果有傳入圖示元素，就更新它的狀態
  if (iconElement) {
    currentPlayingIcon = iconElement;
    originalIconContent = iconElement.textContent; // 儲存原始圖示
    iconElement.textContent = 'graphic_eq';       // 切換為播放中圖示
  }

  // 5. 當音檔自然播放結束時，恢復圖示
  currentAudio.onended = () => {
    if (currentPlayingIcon) {
      currentPlayingIcon.textContent = originalIconContent;
    }
    currentPlayingIcon = null;
    currentAudio = null;
  };

  // 6. 當音檔被暫停時 (例如被新的音檔中斷)，恢復圖示
  currentAudio.onpause = () => {
    if (currentPlayingIcon) {
      currentPlayingIcon.textContent = originalIconContent;
    }
    // 注意：這裡不要重置 currentPlayingIcon 和 currentAudio，
    // 因為 onended 也會觸發，避免重複處理。
  };

  // 7. 開始播放，並處理可能發生的錯誤
  currentAudio.play().catch(e => {
    console.log("音檔播放失敗:", e);
    // 如果播放失敗，也要恢復圖示
    if (currentPlayingIcon) {
      currentPlayingIcon.textContent = originalIconContent;
    }
    currentPlayingIcon = null;
    currentAudio = null;
  });
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


// 新增此函式
function updateSelectAllButtonState() {
    const button = document.getElementById("learningSelectAll");
    if (!button) return;
    
    const icon = button.querySelector(".material-icons");
    const totalCount = categories[currentCategory]?.length || 0;
    const selectedCount = selectedSentences.size;

    if (totalCount === 0) { // 處理沒有句子的情況
        icon.textContent = "check_box_outline_blank";
        button.title = "全選";
        button.disabled = true;
    } else if (selectedCount === 0) {
        icon.textContent = "check_box_outline_blank";
        button.title = "全選";
        button.disabled = false;
    } else if (selectedCount === totalCount) {
        icon.textContent = "check_box";
        button.title = "取消全選";
        button.disabled = false;
    } else {
        icon.textContent = "indeterminate_check_box";
        button.title = "全選";
        button.disabled = false;
    }
}

// 學習模式
function showLearningView() {
  const contentArea = document.getElementById("contentArea")

  // 確保 layout 屬性存在，並處理舊的 compactMode 設定
  if (userSettings.compactMode) {
      userSettings.layout = 'compact';
      delete userSettings.compactMode; // 刪除舊屬性
      saveUserSettings();
  } else if (!userSettings.layout) {
      userSettings.layout = 'double';
  }
  
  contentArea.innerHTML = `
        <div class="max-w-6xl mx-auto">
            <div class="bg-white rounded-lg shadow-sm px-3 py-1.5 mb-6 border border-gray-200">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    
                    <div class="flex items-center gap-1">
                        <button id="learningSelectAll" title="全選/取消全選" class="p-2 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2">
                            <span class="material-icons text-gray-600 !text-xl align-middle">check_box</span>
                        </button>
                        <div class="w-px h-5 bg-gray-300 mx-1"></div>
                        <button id="hideHakka" title="客語顯示/隱藏" class="px-3 py-1.5 text-sm rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                            <span class="material-icons text-gray-600 !text-xl align-middle">visibility</span>
                            <span>客語</span>
                        </button>
                        <button id="hidePinyin" title="拼音顯示/隱藏" class="px-3 py-1.5 text-sm rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                            <span class="material-icons text-gray-600 !text-xl align-middle">visibility</span>
                            <span>拼音</span>
                        </button>
                        <button id="hideChinese" title="華語顯示/隱藏" class="px-3 py-1.5 text-sm rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                            <span class="material-icons text-gray-600 !text-xl align-middle">visibility</span>
                            <span>華語</span>
                        </button>
                    </div>

                    <div class="flex items-center gap-1">
                        <button id="layoutToggle" class="p-2 rounded-md hover:bg-gray-200 transition-colors" title="切換版面">
                            <span class="material-icons text-gray-600 !text-xl align-middle">view_agenda</span>
                        </button>
                        <div class="w-px h-5 bg-gray-300 mx-1"></div>
                        <button onclick="adjustFontSize(-1, 'learning')" title="縮小字體" class="p-2 rounded-md hover:bg-gray-200 transition-colors">
                            <span class="material-icons text-gray-600 !text-xl align-middle">text_decrease</span>
                        </button>
                        <button onclick="adjustFontSize(1, 'learning')" title="放大字體" class="p-2 rounded-md hover:bg-gray-200 transition-colors">
                            <span class="material-icons text-gray-600 !text-xl align-middle">text_increase</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="sentenceContainer"></div>
        </div>
    `

  renderSentences()
  setupLearningControls()
}





// 精簡按鈕狀態的函數
function updateCompactToggleButton() {
  const button = document.getElementById("compactToggle")
  if (button) {
    if (userSettings.compactMode) {
      button.classList.add("bg-blue-100", "text-blue-700")
    } else {
      button.classList.remove("bg-blue-100", "text-blue-700")
    }
  }
}

function renderSentences() {
  const container = document.getElementById("sentenceContainer");
  const sentences = categories[currentCategory];
  
  // 根據版面模式設定容器的樣式
  if (userSettings.layout === "double" && window.innerWidth >= 1024) {
      container.className = "grid grid-cols-1 lg:grid-cols-2 gap-4";
  } else if (userSettings.layout === "single" || (userSettings.layout === "double" && window.innerWidth < 1024)) {
      container.className = "grid grid-cols-1 gap-4";
  } else { // compact layout
      container.className = "bg-white rounded-xl shadow-sm border";
  }

  container.innerHTML = ""; // 清除舊內容

  sentences.forEach((sentence, index) => {
    const isSelected = selectedSentences.has(index);
    const sentenceItem = document.createElement("div");

    if (userSettings.layout === 'compact') {
        sentenceItem.className = "flex items-center gap-3 p-3 border-b last:border-b-0";
        // 【修改重點】下方的 <div> 結構移除了 flex-basis，讓文字內容能自然緊靠
        sentenceItem.innerHTML = `
            <input type="checkbox" class="sentence-checkbox w-4 h-4 text-blue-600 rounded flex-shrink-0" 
                   ${isSelected ? "checked" : ""} 
                   onchange="toggleSentenceSelection(${index}, this.checked)">
            <button onclick="playAudio('${sentence["音檔"]}', this.querySelector('.material-icons'))" class="text-gray-500 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                <span class="material-icons text-lg">volume_up</span>
            </button>
            <span class="text-sm text-gray-500 font-mono flex-shrink-0">${index + 1}</span>
            <div class="flex-1 min-w-0 flex items-baseline gap-4">
                <span class="hakka-text font-bold text-blue-800 flex-shrink-0" style="font-size: ${userSettings.fontSize}px">${sentence["客語"]}</span>
                <span class="pinyin-text text-gray-600 truncate" style="font-size: ${Math.floor(userSettings.fontSize * 0.8)}px">${sentence["拼音"]}</span>
                <span class="chinese-text text-gray-800 truncate" style="font-size: ${Math.floor(userSettings.fontSize * 0.9)}px">${sentence["華語"]}</span>
            </div>
        `;
    } else { // Card view (single or double)
        sentenceItem.className = "sentence-card bg-white rounded-xl shadow-sm p-6";
        sentenceItem.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <button onclick="playAudio('${sentence["音檔"]}', this.querySelector('.material-icons'))" class="text-gray-800 hover:bg-gray-100 p-1.5 rounded transition-colors">
                        <span class="material-icons text-lg">volume_up</span>
                    </button>
                    <span class="text-sm text-gray-500 font-mono">${index + 1}</span>
                </div>
                <input type="checkbox" class="sentence-checkbox w-4 h-4 text-blue-600 rounded" 
                       ${isSelected ? "checked" : ""} 
                       onchange="toggleSentenceSelection(${index}, this.checked)">
            </div>
            <div class="space-y-3">
                <div class="hakka-text font-bold text-blue-800 line-spacing-tight" 
                     style="font-size: ${userSettings.fontSize}px">${sentence["客語"]}</div>
                <div class="pinyin-text text-gray-600 line-spacing-tight" 
                     style="font-size: ${Math.floor(userSettings.fontSize * 0.8)}px">${sentence["拼音"]}</div>
                <div class="chinese-text text-gray-800 line-spacing-tight" 
                     style="font-size: ${Math.floor(userSettings.fontSize * 0.9)}px">${sentence["華語"]}</div>
            </div>
        `;
    }
    container.appendChild(sentenceItem);
  });
  
  // 渲染完畢後，更新「全選」按鈕的狀態
  updateSelectAllButtonState();
}


function setupLearningControls() {
  const hideStates = { hakka: "show", pinyin: "show", chinese: "show" }

  // 全選句子
  document.getElementById("learningSelectAll").onclick = () => {
    const totalCount = categories[currentCategory].length;
    const selectedCount = selectedSentences.size;
    
    // 如果已選的小於總數（部分選取或零選取），則全選。否則（已全選），則取消全選。
    if (selectedCount < totalCount) {
        selectedSentences.clear();
        categories[currentCategory].forEach((_, index) => selectedSentences.add(index));
    } else {
        selectedSentences.clear();
    }
    renderSentences(); // 重新渲染會自動更新勾選狀態和「全選」按鈕
  };

  // 排版切換 (三段循環)
  const layoutToggle = document.getElementById("layoutToggle");
  if (layoutToggle) {
    const layouts = ["double", "single", "compact"];
    const icon = layoutToggle.querySelector(".material-icons");
    // 根據當前版面，設定下一個版面的圖示與提示文字
    switch (userSettings.layout) {
        case "double":
            icon.textContent = "view_agenda"; // 下一個是 single
            layoutToggle.title = "切換為單欄";
            break;
        case "single":
            icon.textContent = "view_list"; // 下一個是 compact
            layoutToggle.title = "切換為精簡列表";
            break;
        case "compact":
            icon.textContent = "view_column"; // 下一個是 double
            layoutToggle.title = "切換為雙欄";
            break;
    }

    layoutToggle.onclick = () => {
      const currentIndex = layouts.indexOf(userSettings.layout);
      const nextIndex = (currentIndex + 1) % layouts.length;
      userSettings.layout = layouts[nextIndex];
      saveUserSettings();
      showLearningView(); // 重新渲染整個學習介面
    };
  }


  // 隱藏控制
  const setupHideButton = (buttonId, textClass, type, label) => {
    const button = document.getElementById(buttonId);
    if (!button) return;

    const icon = button.querySelector(".material-icons");
    
    button.onclick = () => {
      const states = ["show", "blur", "hide"];
      const currentIndex = states.indexOf(hideStates[type]);
      hideStates[type] = states[(currentIndex + 1) % states.length];

      const elements = document.querySelectorAll(`.${textClass}`);
      
      elements.forEach((el) => {
        el.classList.remove("blur-text", "hidden-text");
      });

      // 清除舊的顏色樣式
      button.classList.remove("bg-yellow-100", "text-yellow-700", "bg-red-100", "text-red-700");
      
      switch (hideStates[type]) {
        case "show":
          button.title = `${label}顯示`;
          icon.textContent = "visibility";
          break;
        case "blur":
          elements.forEach((el) => el.classList.add("blur-text"));
          button.classList.add("bg-yellow-100", "text-yellow-700");
          button.title = `${label}模糊`;
          icon.textContent = "blur_on";
          break;
        case "hide":
          elements.forEach((el) => el.classList.add("hidden-text"));
          button.classList.add("bg-red-100", "text-red-700");
          button.title = `${label}隱藏`;
          icon.textContent = "visibility_off";
          break;
      }
    }
  }

  setupHideButton("hideHakka", "hakka-text", "hakka", "客語");
  setupHideButton("hidePinyin", "pinyin-text", "pinyin", "拼音");
  setupHideButton("hideChinese", "chinese-text", "chinese", "華語");
}


// 切換句子選取
function toggleSentenceSelection(index, checked) {
  if (checked) {
    selectedSentences.add(index)
  } else {
    selectedSentences.delete(index)
  }
  // 在每次勾選後，更新「全選」按鈕的狀態
  updateSelectAllButtonState();
}

// 字體大小調整
function adjustFontSize(change, mode = "learning") {
  const fontSizes =
    mode === "flashcard" ? [24, 28, 32, 36, 40, 44, 48, 52, 56, 60] : [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40]

  const settingKey = mode === "flashcard" ? "flashcardFontSize" : "fontSize"
  const currentIndex = fontSizes.indexOf(userSettings[settingKey])
  const newIndex = Math.max(0, Math.min(fontSizes.length - 1, currentIndex + change))
  userSettings[settingKey] = fontSizes[newIndex]
  saveUserSettings()

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
  const contentArea = document.getElementById("contentArea");
  const sentences = getSelectedSentences();

  if (sentences.length === 0) {
    contentArea.innerHTML = '<div class="text-center py-12 text-gray-500">請先在學習頁面勾選要練習的句子</div>';
    return;
  }

  contentArea.innerHTML = `
    <div class="max-w-5xl mx-auto pt-8">
        <div id="flashcardContainer" class="bg-white rounded-xl shadow-lg p-8 mb-4 relative overflow-hidden">
            <div class="absolute top-4 left-4 z-10">
                <div class="flex items-center gap-1">
                    <div class="relative">
                        <button id="allSettingsBtn" class="control-btn !p-2" title="設定">
                            <span class="material-icons">settings</span>
                        </button>
                        <div id="allSettingsPopup" class="hidden absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-20 py-1">
                            <button id="hideHakkaFlash" class="setting-menu-item"><span class="material-icons text-base mr-2">visibility</span>客語</button>
                            <button id="hidePinyinFlash" class="setting-menu-item"><span class="material-icons text-base mr-2">visibility</span>拼音</button>
                            <button id="hideChineseFlash" class="setting-menu-item"><span class="material-icons text-base mr-2">visibility</span>華語</button>
                        </div>
                    </div>
                     <label for="flashcardAutoPlayAudio" class="flex items-center gap-1 p-1.5 rounded-md hover:bg-gray-200 cursor-pointer" title="自動播音">
                        <input type="checkbox" id="flashcardAutoPlayAudio" class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300">
                        <span class="material-icons text-gray-600 !text-xl align-middle">volume_up</span>
                    </label>
                </div>
            </div>

            <div id="progressBarContainer" class="absolute top-0 left-0 w-full h-1.5">
                <div id="progressBar" class="bg-purple-500 h-full transition-all duration-300" style="width: 0%"></div>
            </div>

            <div class="absolute top-4 right-4 flex items-center gap-1 z-10">
                 <button onclick="adjustFontSize(-1, 'flashcard')" class="setting-btn" title="縮小字體">
                    <span class="material-icons">text_decrease</span>
                </button>
                <button onclick="adjustFontSize(1, 'flashcard')" class="setting-btn" title="放大字體">
                    <span class="material-icons">text_increase</span>
                </button>
                <div class="w-px h-4 bg-gray-300 mx-1"></div>
                <button id="starCard" class="control-btn !p-2" title="設為星號">
                    <span id="starIcon" class="material-icons text-3xl text-gray-400">star_border</span>
                </button>
                <div class="relative">
                    <button id="filterCardsBtn" class="control-btn !p-2" title="篩選卡片">
                        <span class="material-icons">filter_list</span>
                    </button>
                    <div id="filterCardsPopup" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10 py-1">
                        </div>
                </div>
            </div>

            <div id="flashcardContent" class="text-center space-y-6 min-h-[250px] flex flex-col justify-center items-center pt-8">
                <div id="hakkaText" class="hakka-text font-bold text-purple-800" style="font-size: ${userSettings.flashcardFontSize}px"></div>
                <div id="pinyinText" class="pinyin-text text-gray-600" style="font-size: ${Math.floor(userSettings.flashcardFontSize * 0.8)}px"></div>
                <div id="chineseText" class="chinese-text text-gray-800" style="font-size: ${Math.floor(userSettings.flashcardFontSize * 0.9)}px"></div>
            </div>
        </div>

        <div class="flex items-center justify-between gap-4 px-2">
            <div class="flex items-center gap-1 w-32 justify-start">
                <button id="shuffleCards" class="control-btn" title="亂數排序">
                    <span class="material-icons">shuffle</span>
                </button>
                <div class="relative">
                    <button id="autoPlayBtn" class="control-btn" title="自動播放">
                        <span id="autoPlayIcon" class="material-icons">play_arrow</span>
                    </button>
                    <div id="autoPlayPopup" class="hidden absolute bottom-full left-0 mb-2 w-32 bg-white rounded-md shadow-lg border z-10 py-1">
                        <div class="px-3 py-1 text-xs text-gray-500">播放間隔</div>
                        <button data-interval="2" class="auto-interval-btn w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm">2 秒</button>
                        <button data-interval="3" class="auto-interval-btn w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm">3 秒</button>
                        <button data-interval="4" class="auto-interval-btn w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm">4 秒</button>
                        <button data-interval="5" class="auto-interval-btn w-full text-left px-3 py-1.5 hover:bg-gray-100 text-sm">5 秒</button>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-4">
                <button id="prevCard" class="control-btn"><span class="material-icons">skip_previous</span></button>
                <button id="playCardAudio" class="control-btn-main"><span class="material-icons">volume_up</span></button>
                <button id="nextCard" class="control-btn"><span class="material-icons">skip_next</span></button>
            </div>

            <div class="w-32 justify-end flex">
                 <div id="cardCounter" class="text-base font-semibold text-gray-600 self-center"></div>
            </div>
        </div>
    </div>
    `;
  setupFlashcardView();
}

function updateFlashcard() {
  if (flashcardSentences.length === 0) {
    document.getElementById("flashcardContent").innerHTML = '<div class="text-gray-500">沒有可練習的卡片</div>';
    document.getElementById("cardCounter").textContent = "0 / 0";
    // 禁用所有按鈕 (移除 fullscreenBtn)
    const controls = ['prevCard', 'nextCard', 'playCardAudio', 'starCard', 'shuffleCards', 'autoPlayBtn', 'filterCardsBtn', 'allSettingsBtn'];
    controls.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = true;
    });
    return;
  } else {
    // 啟用按鈕
    const controls = ['prevCard', 'nextCard', 'playCardAudio', 'starCard', 'shuffleCards', 'autoPlayBtn', 'filterCardsBtn', 'allSettingsBtn'];
    controls.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = false;
    });
  }

  const sentence = flashcardSentences[currentCardIndex];
  const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
  
  document.getElementById("hakkaText").textContent = sentence["客語"];
  document.getElementById("pinyinText").textContent = sentence["拼音"];
  document.getElementById("chineseText").textContent = sentence["華語"];
  document.getElementById("cardCounter").textContent = `${currentCardIndex + 1} / ${flashcardSentences.length}`;

  const starIcon = document.getElementById("starIcon");
  if (starredCards.has(sentenceId)) {
    starIcon.textContent = "star";
    starIcon.classList.remove("text-gray-400");
    starIcon.classList.add("text-yellow-400");
  } else {
    starIcon.textContent = "star_border";
    starIcon.classList.add("text-gray-400");
    starIcon.classList.remove("text-yellow-400");
  }

  const progress = ((currentCardIndex + 1) / flashcardSentences.length) * 100;
  document.getElementById("progressBar").style.width = progress + "%";

  document.getElementById("prevCard").disabled = currentCardIndex === 0;
  document.getElementById("nextCard").disabled = currentCardIndex === flashcardSentences.length - 1;

  document.getElementById("hakkaText").style.fontSize = userSettings.flashcardFontSize + "px";
  document.getElementById("pinyinText").style.fontSize = Math.floor(userSettings.flashcardFontSize * 0.8) + "px";
  document.getElementById("chineseText").style.fontSize = Math.floor(userSettings.flashcardFontSize * 0.9) + "px";
}


function setupFlashcardControls() {
    const hideStates = { "客語": "show", "拼音": "show", "華語": "show" };
    let currentInterval = 3;

    const shuffleButton = document.getElementById("shuffleCards");
    const starButton = document.getElementById("starCard");
    const prevButton = document.getElementById("prevCard");
    const nextButton = document.getElementById("nextCard");
    const playAudioButton = document.getElementById("playCardAudio");
    const autoPlayButton = document.getElementById("autoPlayBtn");
    const autoPlayIcon = document.getElementById("autoPlayIcon");
    const autoPlayPopup = document.getElementById("autoPlayPopup");
    const filterButton = document.getElementById("filterCardsBtn");
    const filterPopup = document.getElementById("filterCardsPopup");
    const allSettingsButton = document.getElementById("allSettingsBtn");
    const allSettingsPopup = document.getElementById("allSettingsPopup");
    
    // 【修改】獲取新的核取方塊元素
    const autoPlayAudioCheckbox = document.getElementById("flashcardAutoPlayAudio");

    // 【修改】自動播音核取方塊的邏輯
    if (autoPlayAudioCheckbox) {
        // 根據使用者設定初始化核取方塊的狀態
        autoPlayAudioCheckbox.checked = userSettings.flashcardAutoPlayAudio;
        // 監聽變更事件
        autoPlayAudioCheckbox.onchange = () => {
            userSettings.flashcardAutoPlayAudio = autoPlayAudioCheckbox.checked;
            saveUserSettings();
        };
    }
    
    const popups = [
        { btn: autoPlayButton, menu: autoPlayPopup },
        { btn: filterButton, menu: filterPopup },
        { btn: allSettingsButton, menu: allSettingsPopup }
    ];

    popups.forEach(popup => {
        if(!popup.btn) return;
        popup.btn.addEventListener('click', (e) => {
            e.stopPropagation();
            popups.forEach(p => { if (p.menu !== popup.menu) p.menu.classList.add('hidden'); });
            popup.menu.classList.toggle('hidden');
        });
    });

    document.addEventListener('click', (e) => {
        popups.forEach(p => {
            if (p.btn && p.menu && !p.btn.contains(e.target) && !p.menu.contains(e.target)) {
                p.menu.classList.add('hidden');
            }
        });
    });

    function updateFilterPopup() {
        if (!filterPopup) return;
        const allSentences = getSelectedSentences();
        const allCount = allSentences.length;
        const starredCount = allSentences.filter(s => starredCards.has(s["ID"] || `${s["分類"]}_${s["華語"]}`)).length;
        const unstarredCount = allCount - starredCount;
        
        filterPopup.innerHTML = `
            <button data-mode="all" class="practice-mode-btn w-full text-left px-3 py-2 flex justify-between items-center hover:bg-gray-100 ${flashcardPracticeMode === 'all' ? 'active' : ''}">
                <span class="flex items-center"><span class="material-icons text-base mr-2">apps</span>全部</span> 
                <span>${allCount}</span>
            </button>
            <button data-mode="starred" class="practice-mode-btn w-full text-left px-3 py-2 flex justify-between items-center hover:bg-gray-100 ${flashcardPracticeMode === 'starred' ? 'active' : ''}" ${starredCount === 0 ? 'disabled' : ''}>
                <span class="flex items-center"><span class="material-icons text-base mr-2">star</span>星號</span> 
                <span>${starredCount}</span>
            </button>
            <button data-mode="unstarred" class="practice-mode-btn w-full text-left px-3 py-2 flex justify-between items-center hover:bg-gray-100 ${flashcardPracticeMode === 'unstarred' ? 'active' : ''}" ${unstarredCount === 0 ? 'disabled' : ''}>
                <span class="flex items-center"><span class="material-icons text-base mr-2">star_border</span>無星號</span> 
                <span>${unstarredCount}</span>
            </button>
            <div class="border-t my-1"></div>
            <button id="clearStarsBtn" class="practice-mode-btn w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center" ${starredCount === 0 ? 'disabled' : ''}>
                <span class="material-icons text-base mr-2">delete_sweep</span>清除全部星號
            </button>
        `;

        filterPopup.querySelectorAll('.practice-mode-btn[data-mode]').forEach(btn => {
            btn.onclick = () => {
                flashcardPracticeMode = btn.dataset.mode;
                currentCardIndex = 0;
                updateFlashcardSentences();
                updateFlashcard();
                updateFilterPopup();
                filterPopup.classList.add('hidden');
            };
        });
        
        const clearStarsBtn = document.getElementById('clearStarsBtn');
        if(clearStarsBtn) {
            clearStarsBtn.onclick = () => {
                 if (starredCards.size > 0) {
                    starredCards.clear();
                    if (flashcardPracticeMode === 'starred') {
                        flashcardPracticeMode = 'all';
                    }
                    updateFlashcardSentences();
                    updateFlashcard();
                    updateFilterPopup();
                    filterPopup.classList.add('hidden');
                }
            };
        }
    }

    function stopAutoPlay() {
        if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
            autoPlayIcon.textContent = "play_arrow";
            autoPlayButton.classList.remove("active");
            autoPlayButton.title = "自動播放";
        }
    }
    
    function startAutoPlay() {
        stopAutoPlay();
        autoPlayIcon.textContent = "pause";
        autoPlayButton.classList.add("active");
        autoPlayButton.title = "暫停播放";
        autoPlayTimer = setInterval(() => {
            if (currentCardIndex < flashcardSentences.length - 1) {
                nextButton.click();
            } else {
                stopAutoPlay();
            }
        }, currentInterval * 1000);
    }

    autoPlayButton.onclick = (e) => {
        e.stopPropagation();
        if (autoPlayTimer) {
            stopAutoPlay();
        } else {
            startAutoPlay();
        }
    };
    
    document.querySelectorAll('.auto-interval-btn').forEach(btn => {
        btn.onclick = () => {
            currentInterval = parseInt(btn.dataset.interval, 10);
            document.querySelectorAll('.auto-interval-btn').forEach(b => b.classList.remove('bg-gray-200'));
            btn.classList.add('bg-gray-200');
            if (autoPlayTimer) {
                startAutoPlay();
            }
            autoPlayPopup.classList.add('hidden');
        };
    });
    const defaultIntervalBtn = autoPlayPopup.querySelector(`[data-interval="3"]`);
    if(defaultIntervalBtn) defaultIntervalBtn.classList.add('bg-gray-200');

    shuffleButton.onclick = () => {
        isFlashcardShuffled = !isFlashcardShuffled;
        const icon = shuffleButton.querySelector('.material-icons');
        if (isFlashcardShuffled) {
            flashcardSentences.sort(() => Math.random() - 0.5);
            shuffleButton.classList.add('active');
            shuffleButton.title = "恢復依序排序";
            icon.textContent = 'shuffle_on';
        } else {
            flashcardSentences = [...originalFlashcardOrder];
            shuffleButton.classList.remove('active');
            shuffleButton.title = "亂數排序";
            icon.textContent = 'shuffle';
        }
        currentCardIndex = 0;
        updateFlashcard();
    };
    
    playAudioButton.onclick = playCurrentAudio;

    prevButton.onclick = () => {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            updateFlashcard();
            if (userSettings.flashcardAutoPlayAudio) {
                playCurrentAudio();
            }
        }
    };
    nextButton.onclick = () => {
        if (currentCardIndex < flashcardSentences.length - 1) {
            currentCardIndex++;
            updateFlashcard();
            if (userSettings.flashcardAutoPlayAudio) {
                playCurrentAudio();
            }
        }
    };

    starButton.onclick = () => {
        const sentence = flashcardSentences[currentCardIndex];
        if (!sentence) return;
        const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
        if (starredCards.has(sentenceId)) { starredCards.delete(sentenceId); } else { starredCards.add(sentenceId); }
        updateFlashcard();
        updateFilterPopup();
    };

    if (flashcardKeyHandler) { document.removeEventListener('keydown', flashcardKeyHandler); }
    flashcardKeyHandler = (event) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
      switch(event.key) {
          case ' ': event.preventDefault(); playAudioButton.click(); break;
          case 'ArrowRight': case 'ArrowDown': event.preventDefault(); if (!nextButton.disabled) nextButton.click(); break;
          case 'ArrowLeft': case 'ArrowUp': event.preventDefault(); if (!prevButton.disabled) prevButton.click(); break;
      }
    };
    document.addEventListener('keydown', flashcardKeyHandler);

    const setupHideButton = (buttonId, textId, type) => {
        const button = document.getElementById(buttonId);
        if(!button) return;
        const icon = button.querySelector('.material-icons');
        button.onclick = (e) => {
            e.stopPropagation(); 
            const states = ["show", "blur", "hide"];
            hideStates[type] = states[(states.indexOf(hideStates[type]) + 1) % states.length];
            const element = document.getElementById(textId);
            element.classList.remove("blur-text", "hidden-text");
            button.classList.remove('active');
            icon.textContent = 'visibility';
            if (hideStates[type] === "blur") {
                element.classList.add("blur-text");
                icon.textContent = 'blur_on';
                button.classList.add('active');
            } else if (hideStates[type] === "hide") {
                element.classList.add("hidden-text");
                icon.textContent = 'visibility_off';
                button.classList.add('active');
            }
        };
    };
    setupHideButton("hideHakkaFlash", "hakkaText", "客語");
    setupHideButton("hidePinyinFlash", "pinyinText", "拼音");
    setupHideButton("hideChineseFlash", "chineseText", "華語");
    
    updateFilterPopup();
}


let flashcardPracticeMode = "all"

function setupFlashcardView() {
  currentCardIndex = 0
  flashcardPracticeMode = "all" // 每次進入都重設為 "練習全部"
  updateFlashcardSentences()
  updateFlashcard()
  setupFlashcardControls()
}


function updateFlashcardSentences() {
  const allSentences = getSelectedSentences()

  // 使用句子的絕對ID進行星號過濾
  switch (flashcardPracticeMode) {
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
    default: // all
      flashcardSentences = allSentences
  }
  
  // 備份原始順序並重設亂數狀態
  originalFlashcardOrder = [...flashcardSentences]
  isFlashcardShuffled = false
  const shuffleButton = document.getElementById("shuffleCards")
  if (shuffleButton) {
      shuffleButton.querySelector(".material-icons").textContent = "shuffle"
      shuffleButton.title = "亂數排序"
      shuffleButton.classList.remove("bg-purple-200")
  }


  if (currentCardIndex >= flashcardSentences.length) {
    currentCardIndex = 0
  }
}



function playCurrentAudio() {
  if (flashcardSentences.length > 0 && currentCardIndex < flashcardSentences.length) {
    const sentence = flashcardSentences[currentCardIndex];
    // 獲取閃示卡主播放按鈕的圖示元素
    const playButton = document.getElementById('playCardAudio');
    const iconElement = playButton ? playButton.querySelector('.material-icons') : null;
    
    // 呼叫我們修改過的 playAudio 函數
    playAudio(sentence["音檔"], iconElement);
  } else {
    // 如果沒有可播放的卡片，確保停止所有音效
    playAudio(null);
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


function showMatchingGame() {
  const contentArea = document.getElementById("contentArea");
  const sentences = getSelectedSentences();

  if (sentences.length < 2) {
    contentArea.innerHTML = '<div class="text-center py-12 text-gray-500">至少需要2個句子才能進行配對遊戲</div>';
    return;
  }

  contentArea.innerHTML = `
        <div class="max-w-6xl mx-auto">
            <div class="bg-white rounded-xl shadow-lg relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1.5 bg-gray-200">
                    <div id="matchingTimerBar" class="timer-bar bg-orange-500 h-full rounded-full" style="width: 100%"></div>
                </div>

                <div class="flex items-center justify-between flex-wrap gap-x-4 gap-y-3 p-4 md:p-5 border-b border-gray-200">
                    <div class="flex items-center flex-wrap gap-2">
                        <button id="startMatching" class="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-semibold transition-colors text-base flex-shrink-0">
                            開始配對
                        </button>
                        
                        <div id="matchingOptions" class="flex items-center flex-wrap gap-2">
                             <div class="w-px h-5 bg-gray-300 mx-1 hidden sm:block"></div>
                             <select id="matchingType" class="bg-gray-100 border-gray-300 focus:ring-orange-500 focus:border-orange-500 text-sm rounded-md p-1.5 transition-colors">
                                <option value="hakka-chinese">客語 ↔ 華語</option>
                                <option value="pinyin-chinese" selected>拼音 ↔ 華語</option>
                                <option value="hakka-pinyin">客語 ↔ 拼音</option>
                                <option value="audio-hakka">音檔 ↔ 客語</option>
                                <option value="audio-pinyin">音檔 ↔ 拼音</option>
                                <option value="audio-chinese">音檔 ↔ 華語</option>
                            </select>
                            <select id="matchingPairs" class="bg-gray-100 border-gray-300 focus:ring-orange-500 focus:border-orange-500 text-sm rounded-md p-1.5 transition-colors">
                                <option value="2">2組</option>
                                <option value="3">3組</option>
                                <option value="4" selected>4組</option>
                                <option value="5">5組</option>
                                <option value="6">6組</option>
                            </select>
                            <select id="matchingCondition" class="bg-gray-100 border-gray-300 focus:ring-orange-500 focus:border-orange-500 text-sm rounded-md p-1.5 transition-colors">
                                <option value="time60">60秒</option>
                                <option value="time100" selected>100秒</option>
                                <option value="time180">180秒</option>
                                <option value="round1">1關</option>
                                <option value="round2">2關</option>
                                <option value="round3">3關</option>
                                <option value="round5">5關</option>
                                <option value="round8">8關</option>
                                <option value="unlimited">無限</option>
                            </select>
                            <div id="matchingTimer" class="text-lg font-mono text-gray-700 min-w-[5rem] text-center">00:00</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-x-3 gap-y-2 flex-wrap justify-end">
                        <div class="flex items-center gap-1">
                            <label for="matchingPlaySound" class="flex items-center gap-1 p-1.5 rounded-md hover:bg-gray-100 cursor-pointer" title="配對成功時播放音效">
                                <input type="checkbox" id="matchingPlaySound" class="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-gray-300" checked>
                                <span class="material-icons text-gray-600 !text-xl align-middle">volume_up</span>
                            </label>
                            <button id="matchingLayoutToggle" class="p-2 rounded-md hover:bg-gray-100 transition-colors" title="切換排版">
                                <span class="material-icons text-gray-600 !text-xl align-middle">view_agenda</span>
                            </button>
                            <button onclick="adjustFontSize(-1, 'matching')" title="縮小字體" class="p-2 rounded-md hover:bg-gray-100 transition-colors">
                                <span class="material-icons text-gray-600 !text-xl align-middle">text_decrease</span>
                            </button>
                            <button onclick="adjustFontSize(1, 'matching')" title="放大字體" class="p-2 rounded-md hover:bg-gray-100 transition-colors">
                                <span class="material-icons text-gray-600 !text-xl align-middle">text_increase</span>
                            </button>
                        </div>
                        <div class="w-px h-5 bg-gray-300 mx-1"></div>
                        <div class="flex items-center gap-4 md:gap-6">
                            <div class="text-center" title="分數">
                                <div id="matchingScore" class="text-xl font-bold text-blue-600">0</div>
                            </div>
                            <div class="text-center" title="步數">
                                <div id="matchingSteps" class="text-xl font-bold text-gray-600">0</div>
                            </div>
                            <div class="text-center" title="關卡">
                                <div id="matchingRound" class="text-xl font-bold text-gray-600">1</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="matchingArea" class="p-4 md:p-8 hidden grid grid-cols-2 gap-4 md:gap-8 min-h-[300px]">
                    <div id="leftColumnContainer" class="grid grid-cols-1 gap-3"></div>
                    <div id="rightColumnContainer" class="grid grid-cols-1 gap-3"></div>
                </div>
                <div id="matchingStartNotice" class="text-center py-20 text-gray-500">
                    <p>請點擊按鈕開始遊戲</p>
                </div>
            </div>
            <div id="matchingResults" class="hidden mt-6 bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-xl font-bold mb-4 text-center">配對結果</h3>
                <div id="matchingResultsList" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
            </div>
        </div>
    `;
  setupMatchingGame();
}

function showQuizGame() {
  stopAllTimers()
  updateCurrentMode("測驗")

  const total = selectedSentences.size
  const sentencesArray = Array.from(selectedSentences).map(
    (index) => categories[currentCategory][index]
  )
  const isRandom = document.getElementById("quizRandom").checked
  const isPinyin = document.getElementById("quizShowPinyin").checked
  const maxOptions = 4 // 固定為4個選項
  const quizMode = document.getElementById("quizModeSelect").value
  const showHakka = document.getElementById("quizShowHakka").checked

  quizGameState = {
    originalSentences: sentencesArray,
    currentQuestions: [],
    questionIndex: 0,
    correctCount: 0,
    totalQuestions: total,
    mode: quizMode,
    isPinyin: isPinyin,
    showHakka: showHakka,
    timerInterval: null,
    time: 0,
  }

  // 根據選擇模式準備題目
  if (quizGameState.mode === "chooseMeaning") {
    // 華語找客語
    quizGameState.currentQuestions = quizGameState.originalSentences.map(
      (s, index) => ({
        ...s,
        index,
        options: generateQuizOptions(s, sentencesArray, "華語", maxOptions),
      })
    )
  } else {
    // 客語找華語
    quizGameState.currentQuestions = quizGameState.originalSentences.map(
      (s, index) => ({
        ...s,
        index,
        options: generateQuizOptions(s, sentencesArray, "客語", maxOptions),
      })
    )
  }

  if (isRandom) {
    quizGameState.currentQuestions = shuffleArray(
      quizGameState.currentQuestions
    )
  }

  const contentArea = document.getElementById("contentArea")
  contentArea.innerHTML = `
        <div class="max-w-4xl mx-auto">
            <div class="bg-white rounded-lg shadow-sm px-4 py-3 mb-6 border border-gray-200">
                <div class="flex flex-wrap items-center justify-between gap-3 md:gap-4">
                    <div class="flex items-center gap-2 text-sm text-gray-500 font-semibold">
                        <span class="material-icons !text-lg text-green-600">check_circle</span>
                        <div id="quizScore">0 / ${quizGameState.totalQuestions}</div>
                    </div>
                    <div class="flex-1 text-center font-semibold text-blue-600">
                        <span id="quizModeDisplay"></span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-gray-500 font-semibold">
                        <span class="material-icons !text-lg text-blue-600">timer</span>
                        <div id="quizTimer">00:00</div>
                    </div>
                </div>
            </div>

            <div id="quizQuestionContainer"></div>
        </div>
    `

  // 渲染第一道題目
  renderQuizQuestion()
  // 開始計時
  startQuizTimer()
}

function showSortingGame() {
  stopAllTimers()
  updateCurrentMode("排序")

  const sentencesArray = shuffleArray(
    Array.from(selectedSentences).map(
      (index) => categories[currentCategory][index]
    )
  )
  const isRandom = document.getElementById("sortingRandom").checked
  const showPinyin = document.getElementById("sortingShowPinyin").checked
  const showChinese = document.getElementById("sortingShowChinese").checked

  sortingGameState = {
    originalSentences: sentencesArray,
    currentQuestionIndex: 0,
    currentWords: [],
    correctCount: 0,
    totalQuestions: sentencesArray.length,
    isRandom: isRandom,
    showPinyin: showPinyin,
    showChinese: showChinese,
    timerInterval: null,
    time: 0,
  }

  const contentArea = document.getElementById("contentArea")
  contentArea.innerHTML = `
        <div class="max-w-4xl mx-auto">
            <div class="bg-white rounded-lg shadow-sm px-4 py-3 mb-6 border border-gray-200">
                <div class="flex flex-wrap items-center justify-between gap-3 md:gap-4">
                    <div class="flex items-center gap-2 text-sm text-gray-500 font-semibold">
                        <span class="material-icons !text-lg text-green-600">check_circle</span>
                        <div id="sortingScore">0 / ${sortingGameState.totalQuestions}</div>
                    </div>
                    <div class="flex-1 text-center font-semibold text-blue-600">
                        句子排序
                    </div>
                    <div class="flex items-center gap-2 text-sm text-gray-500 font-semibold">
                        <span class="material-icons !text-lg text-blue-600">timer</span>
                        <div id="sortingTimer">00:00</div>
                    </div>
                </div>
            </div>

            <div id="sortingQuestionContainer" class="space-y-4"></div>
        </div>
    `
  renderSortingQuestion()
  startSortingTimer()
}

function setupMatchingGame() {
  const isMobile = window.innerWidth < 768;
  
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
    // 【修改】根據螢幕寬度設定預設欄數，手機版為1，電腦版為2
    columnsPerSide: isMobile ? 1 : (userSettings.matchingColumns || 2),
  }

  const layoutToggleButton = document.getElementById("matchingLayoutToggle");
  if (layoutToggleButton) {
      // 【修改】統一圖示邏輯
      const icon = layoutToggleButton.querySelector(".material-icons");
      icon.textContent = matchingGameState.columnsPerSide === 1 ? 'view_column' : 'view_agenda';
  }

  document.getElementById("startMatching").onclick = startMatchingGame;
  
  layoutToggleButton.onclick = () => {
      matchingGameState.columnsPerSide = matchingGameState.columnsPerSide === 1 ? 2 : 1;
      
      const icon = layoutToggleButton.querySelector(".material-icons");
      // 【修改】統一圖示邏輯
      icon.textContent = matchingGameState.columnsPerSide === 1 ? 'view_column' : 'view_agenda';

      userSettings.matchingColumns = matchingGameState.columnsPerSide;
      saveUserSettings();
      
      if (matchingGameState.isPlaying) {
          renderMatchingItems(); 
      }
  }

  ;["matchingType", "matchingPairs", "matchingCondition"].forEach((id) => {
    document.getElementById(id).onchange = () => {
      if (!matchingGameState.isPlaying) {
        generateMatchingData();
      }
    }
  });

  generateMatchingData();
}

function stopMatchingGame() {
    if (matchingGameState.timerInterval) {
        clearInterval(matchingGameState.timerInterval);
    }
    endMatchingGame("遊戲已中止");
}

function generateMatchingData() {
  const sentences = getSelectedSentences()
  const type = document.getElementById("matchingType").value
  const pairs = Number.parseInt(document.getElementById("matchingPairs").value)
  const condition = document.getElementById("matchingCondition").value

  // 隨機選擇句子
  const shuffled = [...sentences].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, Math.min(pairs, shuffled.length)) // 確保不會超出範圍

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
      // --- 新增的音檔模式 ---
      case "audio-hakka":
        leftItems.push({ id: index, audioFile: sentence["音檔"], type: "audio" });
        rightItems.push({ id: index, text: sentence["客語"], type: "hakka" });
        break;
      case "audio-pinyin":
        leftItems.push({ id: index, audioFile: sentence["音檔"], type: "audio" });
        rightItems.push({ id: index, text: sentence["拼音"], type: "pinyin" });
        break;
      case "audio-chinese":
        leftItems.push({ id: index, audioFile: sentence["音檔"], type: "audio" });
        rightItems.push({ id: index, text: sentence["華語"], type: "chinese" });
        break;
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
  const leftContainer = document.getElementById("leftColumnContainer");
  const rightContainer = document.getElementById("rightColumnContainer");
  const { leftItems, rightItems } = matchingGameState.gameData;

  leftContainer.innerHTML = "";
  rightContainer.innerHTML = "";

  // 根據 columnsPerSide 狀態設定 CSS class
  const columnClass = matchingGameState.columnsPerSide === 2 ? 'grid-cols-2' : 'grid-cols-1';
  leftContainer.className = `grid ${columnClass} gap-3`;
  rightContainer.className = `grid ${columnClass} gap-3`;

  leftItems.forEach((item) => {
    const element = createMatchingItem(item, "left");
    leftContainer.appendChild(element);
  });

  rightItems.forEach((item) => {
    const element = createMatchingItem(item, "right");
    rightContainer.appendChild(element);
  });
}

function createMatchingItem(item, side) {
  const element = document.createElement("div")
  // 增加 flex 相關 class 以便置中內容
  element.className = "matching-item bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-all relative flex items-center justify-center min-h-[80px]"
  element.style.fontSize = userSettings.fontSize + "px"
  element.dataset.id = item.id
  element.dataset.side = side

  if (item.type === 'audio') {
      // 如果項目類型是 'audio'，顯示喇叭圖示
      element.innerHTML = `<span class="material-icons text-4xl text-orange-600">volume_up</span>`;
      
      // 【修改點】修改 onclick 事件處理
      element.onclick = () => {
          // 在點擊時，找到這個元素內部的圖示
          const iconElement = element.querySelector('.material-icons');
          // 將音檔和圖示元素一起傳給 playAudio 函數
          playAudio(item.audioFile, iconElement); 
          selectMatchingItem(element, item);
      }
  } else {
      // 如果是文字項目，則照常顯示文字
      element.textContent = item.text;
      element.onclick = () => selectMatchingItem(element, item);
  }

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
    
    // 新增：檢查是否要播放音效
    if (document.getElementById('matchingPlaySound').checked) {
        // 從遊戲資料中找到完整的句子物件
        const matchedSentence = matchingGameState.gameData.sentences.find((s, index) => index === first.item.id);
        if (matchedSentence) {
            playAudio(matchedSentence["音檔"]);
        }
    }

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
  const optionsContainer = document.getElementById("matchingOptions");

  if (matchingGameState.timerInterval) {
    clearInterval(matchingGameState.timerInterval)
  }

  matchingGameState.isPlaying = true
  matchingGameState.currentRound = 1
  matchingGameState.score = 0
  matchingGameState.steps = 0
  matchingGameState.matchedPairs = []

  button.innerHTML = `<span class="material-icons">close</span>`;
  button.title = "停止遊戲";
  button.className = "bg-gray-500 hover:bg-gray-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-colors";
  button.onclick = stopMatchingGame;

  // 【修改】只禁用 select 元素
  optionsContainer.querySelectorAll('select').forEach(el => {
      el.classList.add('opacity-50', 'pointer-events-none');
      el.disabled = true;
  });
  if (window.innerWidth < 768) {
      optionsContainer.classList.add('hidden');
  }


  document.getElementById("matchingScore").textContent = "0"
  document.getElementById("matchingSteps").textContent = "0"
  document.getElementById("matchingRound").textContent = "1"
  document.getElementById("matchingResults").classList.add("hidden")
  
  document.getElementById("matchingArea").classList.remove("hidden");
  document.getElementById("matchingStartNotice").classList.add("hidden");

  if (condition.startsWith("time")) {
    const timeLimit = Number.parseInt(condition.replace("time", ""))
    matchingGameState.timeLeft = timeLimit
    startMatchingTimer()
  } else if (condition.startsWith("round") || condition === "unlimited") {
    const timerElement = document.getElementById("matchingTimer");
    matchingGameState.startTime = Date.now();
    
    timerElement.textContent = "00:00";

    matchingGameState.timerInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - matchingGameState.startTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
        const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
        timerElement.textContent = `${minutes}:${seconds}`;
    }, 1000);
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
    const minutes = Math.floor(matchingGameState.timeLeft / 60).toString().padStart(2, '0');
    const seconds = (matchingGameState.timeLeft % 60).toString().padStart(2, '0');
    timerElement.textContent = `${minutes}:${seconds}`;

    const percentage = (matchingGameState.timeLeft / timeLimit) * 100
    timerBar.style.width = percentage + "%"

    if (matchingGameState.timeLeft <= 0) {
      clearInterval(matchingGameState.timerInterval)
      endMatchingGame("時間到！")
    }
  }, 1000)
}

function startQuizTimer() {
  const timerElement = document.getElementById("quizTimer")
  const timerBar = document.getElementById("quizTimerBar")
  const condition = document.getElementById("quizCondition").value
  const timeLimit = Number.parseInt(condition.replace("time", ""))

  quizGameState.timerInterval = setInterval(() => {
    quizGameState.timeLeft--
    const minutes = Math.floor(quizGameState.timeLeft / 60).toString().padStart(2, '0');
    const seconds = (quizGameState.timeLeft % 60).toString().padStart(2, '0');
    timerElement.textContent = `${minutes}:${seconds}`;

    const percentage = (quizGameState.timeLeft / timeLimit) * 100
    timerBar.style.width = percentage + "%"

    if (quizGameState.timeLeft <= 0) {
      clearInterval(quizGameState.timerInterval)
      endQuizGame("時間到！")
    }
  }, 1000)
}

function startSortingTimer() {
  const timerElement = document.getElementById("sortingTimer")
  const timerBar = document.getElementById("sortingTimerBar")
  const condition = document.getElementById("sortingCondition").value
  const timeLimit = Number.parseInt(condition.replace("time", ""))

  sortingGameState.timerInterval = setInterval(() => {
    sortingGameState.timeLeft--
    const minutes = Math.floor(sortingGameState.timeLeft / 60).toString().padStart(2, '0');
    const seconds = (sortingGameState.timeLeft % 60).toString().padStart(2, '0');
    timerElement.textContent = `${minutes}:${seconds}`;

    const percentage = (sortingGameState.timeLeft / timeLimit) * 100
    timerBar.style.width = percentage + "%"

    if (sortingGameState.timeLeft <= 0) {
      clearInterval(sortingGameState.timerInterval)
      endSortingGame("時間到！")
    }
  }, 1000)
}

function checkRoundComplete() {
  const condition = document.getElementById("matchingCondition").value;

  // --- 針對「不限時間」模式的新增邏輯 ---
  if (condition === "unlimited") {
    // 在「不限時間」模式下，完成後直接進入下一關
    matchingGameState.currentRound++;
    matchingGameState.matchedPairs = [];
    document.getElementById("matchingRound").textContent = matchingGameState.currentRound;
    generateMatchingData(); // 產生新題目
    return; // 結束此函數，不執行後續的結束遊戲邏輯
  }

  if (condition.startsWith("round")) {
    if (matchingGameState.currentRound < matchingGameState.totalRounds) {
      // 進入下一關
      matchingGameState.currentRound++;
      matchingGameState.matchedPairs = [];
      document.getElementById("matchingRound").textContent = matchingGameState.currentRound;
      
      // 【新增】根據完成的關卡數，更新進度條
      const progress = ((matchingGameState.currentRound - 1) / matchingGameState.totalRounds) * 100;
      const timerBar = document.getElementById("matchingTimerBar");
      if (timerBar) {
        timerBar.style.width = progress + "%";
      }

      generateMatchingData();
    } else {
      // 完成所有關卡
      const totalTime = Math.floor((Date.now() - matchingGameState.startTime) / 1000);
      // 【修改】將 totalTime 傳遞給 endMatchingGame 函式
      endMatchingGame(`恭喜完成 ${matchingGameState.totalRounds} 關！\n總用時：${totalTime} 秒`, totalTime);
    }
  } else {
    // 單關完成 (此處現在只處理限時模式)
    endMatchingGame("恭喜完成配對！");
  }
}

function endMatchingGame(message, finalTime = null) {
  matchingGameState.isPlaying = false;
  const button = document.getElementById("startMatching");
  const optionsContainer = document.getElementById("matchingOptions");

  if (matchingGameState.timerInterval) {
    clearInterval(matchingGameState.timerInterval);
  }
  
  if (button) {
    button.innerHTML = "重新開始";
    button.title = "重新開始";
    button.className = "bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-semibold transition-colors text-base";
    button.onclick = restartMatchingGame; 
  }

  // 【修改】只啟用 select 元素
  optionsContainer.querySelectorAll('select').forEach(el => {
      el.classList.remove('opacity-50', 'pointer-events-none');
      el.disabled = false;
  });
  if (window.innerWidth < 768) {
      optionsContainer.classList.remove('hidden');
  }

  const timerElement = document.getElementById("matchingTimer");
  if (timerElement && finalTime !== null) {
    timerElement.textContent = ` ${finalTime}`;
  }
  
  const timerBar = document.getElementById("matchingTimerBar");
  if (timerBar) {
    timerBar.style.width = "100%";
  }

  showMatchingResults();
  showResult(
    "🎉",
    "配對完成",
    `${message}\n\n最終分數：${matchingGameState.score}\n操作步數：${matchingGameState.steps}`
  );
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
  const contentArea = document.getElementById("contentArea");
  const sentences = getSelectedSentences();

  if (sentences.length < 2) {
    contentArea.innerHTML = '<div class="text-center py-12 text-gray-500">至少需要2個句子才能進行測驗</div>';
    return;
  }
  
  const isWideScreen = window.innerWidth >= 1024;
  quizLayout = isWideScreen ? "horizontal" : "vertical";

  contentArea.innerHTML = `
        <div class="max-w-6xl mx-auto">
            <div class="bg-white rounded-xl shadow-lg relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1.5 bg-gray-200">
                    <div id="quizTimerBar" class="timer-bar bg-red-500 h-full rounded-full" style="width: 100%"></div>
                </div>
                
                <div class="flex items-center justify-between flex-wrap gap-x-4 gap-y-3 p-4 md:p-5 border-b border-gray-200">
                     <div class="flex items-center flex-wrap gap-2">
                        <button id="startQuiz" class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors text-base flex-shrink-0">
                            開始測驗
                        </button>
                        

                        <div id="quizOptionsContainer" class="flex items-center flex-wrap gap-2">
                            
                            <select id="quizType" class="bg-gray-100 border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm rounded-md p-1.5 transition-colors">
                                <option value="hakka-chinese">客語 → 華語</option>
                                <option value="chinese-hakka">華語 → 客語</option>
                                <option value="pinyin-chinese" selected>拼音 → 華語</option>
                                <option value="chinese-pinyin">華語 → 拼音</option>
                                <option value="hakka-pinyin">客語 → 拼音</option>
                                <option value="pinyin-hakka">拼音 → 客語</option>
                            </select>
                            <select id="quizOptions" class="bg-gray-100 border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm rounded-md p-1.5 transition-colors">
                                <option value="2">2項</option>
                                <option value="3">3項</option>
                                <option value="4" selected>4項</option>
                                <option value="5">5項</option>
                                <option value="6">6項</option>
                                <option value="7">7項</option>
                                <option value="8">8項</option>
                            </select>
                            <select id="quizCondition" class="bg-gray-100 border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm rounded-md p-1.5 transition-colors">
                                <option value="time60">60秒</option>
                                <option value="time100" selected>100秒</option>
                                <option value="time180">180秒</option>
                                <option value="unlimited">無限</option>
                                <option value="correct5">5題</option>
                                <option value="correct10">10題</option>
                                <option value="correct15">15題</option>
                                <option value="correct20">20題</option>
                                <option value="correct30">30題</option>
                            </select>
                        </div>
						<div id="quizTimer" class="text-lg font-mono font-bold text-gray-700 min-w-[5rem]"></div>
                    </div>

                    <div class="flex items-center gap-x-3 gap-y-2 flex-wrap justify-end">
                        <div class="flex items-center gap-1">
                            <label for="autoPlayAudio" class="flex items-center gap-1 p-1.5 rounded-md hover:bg-gray-100 cursor-pointer" title="自動播放題目音效">
                                <input type="checkbox" id="autoPlayAudio" class="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300">
                                <span class="material-icons text-gray-600 !text-xl align-middle">volume_up</span>
                            </label>
                            <button id="blurQuizText" class="p-2 rounded-md hover:bg-gray-100 transition-colors" title="模糊題目文字">
                                <span class="material-icons text-gray-600 !text-xl align-middle">blur_on</span>
                            </button>
                            <button id="quizLayoutToggle" class="p-2 rounded-md hover:bg-gray-100 transition-colors" title="切換排版">
                                <span class="material-icons text-gray-600 !text-xl align-middle">view_agenda</span>
                            </button>
                            <button onclick="adjustFontSize(-1, 'quiz')" title="縮小字體" class="p-2 rounded-md hover:bg-gray-100 transition-colors">
                                <span class="material-icons text-gray-600 !text-xl align-middle">text_decrease</span>
                            </button>
                            <button onclick="adjustFontSize(1, 'quiz')" title="放大字體" class="p-2 rounded-md hover:bg-gray-100 transition-colors">
                                <span class="material-icons text-gray-600 !text-xl align-middle">text_increase</span>
                            </button>
                        </div>
                        <div class="w-px h-5 bg-gray-300 mx-1"></div>
                        <div class="flex items-center gap-4 md:gap-6">
                            <div class="text-center" title="正確">
                                <div id="quizCorrect" class="text-xl font-bold text-green-600">0</div>
                            </div>
                            <div class="text-center" title="錯誤">
                                <div id="quizIncorrect" class="text-xl font-bold text-red-600">0</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="quizArea" class="p-4 md:p-8 hidden min-h-[300px]"></div>

                <div id="quizStartNotice" class="text-center py-20 text-gray-500">
                    <p>請點擊按鈕開始遊戲</p>
                </div>
            </div>
        </div>
    `;
  setupQuizGame();
}

function setupQuizGame() {
  const isMobile = window.innerWidth < 768;
  quizLayout = userSettings.quizLayout || (isMobile ? 'vertical' : 'horizontal');

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

  document.getElementById("startQuiz").onclick = startQuizGame;

  const layoutToggleButton = document.getElementById("quizLayoutToggle");
  const layoutIcon = layoutToggleButton.querySelector('.material-icons');
  
  layoutIcon.textContent = quizLayout === 'vertical' ? 'view_column' : 'view_agenda';

  layoutToggleButton.onclick = () => {
    quizLayout = quizLayout === "horizontal" ? "vertical" : "horizontal";
    
    layoutIcon.textContent = quizLayout === 'vertical' ? 'view_column' : 'view_agenda';

    userSettings.quizLayout = quizLayout;
    saveUserSettings();

    if (quizGameState.isPlaying) {
      renderQuizQuestion();
    }
  }

  let isBlurred = false
  const blurButton = document.getElementById("blurQuizText")
  blurButton.onclick = () => {
    isBlurred = !isBlurred
    // 【修改】只選取題目文字的 span
    const questionElement = document.querySelector("#quizArea .question-text")
    
    if (questionElement) {
      if (isBlurred) {
        questionElement.classList.add("blur-text")
        blurButton.classList.add("bg-blue-100", "text-blue-700")
      } else {
        questionElement.classList.remove("blur-text")
        blurButton.classList.remove("bg-blue-100", "text-blue-700")
      }
    }
  }
}


function startQuizGame() {
  const sentences = getSelectedSentences()
  const condition = document.getElementById("quizCondition").value
  const button = document.getElementById("startQuiz")
  const optionsContainer = document.getElementById("quizOptionsContainer");

  quizGameState.isPlaying = true
  quizGameState.correct = 0
  quizGameState.incorrect = 0
  quizGameState.total = 0
  quizGameState.currentIndex = 0
  quizGameState.questions = [...sentences].sort(() => Math.random() - 0.5)

  button.innerHTML = `<span class="material-icons">close</span>`;
  button.title = "停止遊戲";
  button.className = "bg-gray-500 hover:bg-gray-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-colors";
  button.onclick = stopQuizGame;

  optionsContainer.querySelectorAll('select').forEach(el => {
      el.classList.add('opacity-50', 'pointer-events-none');
      el.disabled = true;
  });
  if (window.innerWidth < 768) {
      optionsContainer.classList.add('hidden');
  }

  document.getElementById("quizCorrect").textContent = "0"
  document.getElementById("quizIncorrect").textContent = "0"
  // 【移除】下面這一行程式碼
  // document.getElementById("quizTotal").textContent = "0" 

  document.getElementById("quizArea").classList.remove("hidden");
  document.getElementById("quizStartNotice").classList.add("hidden");

  if (condition.startsWith("time")) {
    const timeLimit = Number.parseInt(condition.replace("time", ""))
    quizGameState.timeLeft = timeLimit
    startQuizTimer()
  } else {
    const timerElement = document.getElementById("quizTimer");
    quizGameState.startTime = Date.now();
    
    timerElement.textContent = "00:00";

    quizGameState.timerInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - quizGameState.startTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
        const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
        timerElement.textContent = `${minutes}:${seconds}`;
    }, 1000);
  }

  generateQuizQuestion()
}



function stopQuizGame() {
    if (quizGameState.timerInterval) {
        clearInterval(quizGameState.timerInterval);
    }
    endQuizGame("遊戲已中止");
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
    timerElement.textContent = ` ${quizGameState.timeLeft}`

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
  const questionNumber = quizGameState.currentIndex + 1;

  quizArea.innerHTML = `
        <div class="text-center mb-8">
            <div class="flex items-center justify-center gap-4 mb-6">
                <button onclick="playAudio('${quizGameState.questions[quizGameState.currentIndex]["音檔"]}', this.querySelector('.material-icons'))" 
                        class="text-gray-800 hover:bg-gray-100 p-2 rounded transition-colors">
                    <span class="material-icons">volume_up</span>
                </button>
                <div id="quizQuestion" class="text-2xl font-bold text-red-800" style="font-size: ${userSettings.fontSize + 4}px">
                    <span class="question-number">${questionNumber}. </span><span class="question-text">${quizGameState.currentQuestion}</span>
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
  // 【移除】下面這一行程式碼
  // document.getElementById("quizTotal").textContent = quizGameState.total

  const isCorrect = selectedAnswer === quizGameState.correctAnswer

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

  const condition = document.getElementById("quizCondition").value
  if (condition.startsWith("correct")) {
    const target = Number.parseInt(condition.replace("correct", ""))
    if (quizGameState.correct >= target) {
      setTimeout(() => endQuizGame(`恭喜達成目標！\n答對 ${target} 題`), 1500)
      return
    }
  }

  setTimeout(() => {
    quizGameState.currentIndex++
    generateQuizQuestion()
  }, 1500)
}

function endQuizGame(message) {
  quizGameState.isPlaying = false;
  const button = document.getElementById("startQuiz");
  const optionsContainer = document.getElementById("quizOptionsContainer");

  if (quizGameState.timerInterval) {
    clearInterval(quizGameState.timerInterval);
  }
  
  if (button) {
    button.innerHTML = "重新開始";
    button.title = "重新開始";
    button.className = "bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors text-base";
    button.onclick = restartQuizGame;
  }

  // 【修改】只啟用 select 元素
  optionsContainer.querySelectorAll('select').forEach(el => {
      el.classList.remove('opacity-50', 'pointer-events-none');
      el.disabled = false;
  });
  if (window.innerWidth < 768) {
      optionsContainer.classList.remove('hidden');
  }

  const accuracy = quizGameState.total > 0 ? Math.round((quizGameState.correct / quizGameState.total) * 100) : 0;

  showResult(
    "🎯",
    "測驗結束",
    `${message}\n\n` +
      `答對：${quizGameState.correct} 題\n` +
      `答錯：${quizGameState.incorrect} 題\n` +
      `總題數：${quizGameState.total} 題\n` +
      `正確率：${accuracy}%`
  );
}

// 替換 endSortingGame()
function endSortingGame(message) {
  sortingGameState.isPlaying = false;

  if (sortingGameState.timerInterval) {
    clearInterval(sortingGameState.timerInterval);
  }

  // 【新增】遊戲結束後，將重玩圖示按鈕恢復為文字按鈕
  const button = document.getElementById("startSorting");
  if(button) {
      button.innerHTML = "重新開始";
      button.title = "";
      button.className = "bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors text-base";
  }

  const totalQuestions = sortingGameState.correct + sortingGameState.incorrect;
  const accuracy = totalQuestions > 0 ? Math.round((sortingGameState.correct / totalQuestions) * 100) : 0;

  showResult(
    "🎯",
    "排序結束",
    `${message}\n\n` +
      `最終分數：${sortingGameState.score}\n` +
      `答對題數：${sortingGameState.correct}\n` +
      `答錯題數：${sortingGameState.incorrect}\n` +
      `正確率：${accuracy}%`
  );
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
            <div class="bg-white rounded-xl shadow-lg relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1.5 bg-gray-200">
                     <div id="sortingTimerBar" class="timer-bar bg-indigo-500 h-full rounded-full" style="width: 100%"></div>
                </div>

                <div class="flex items-center justify-between flex-wrap gap-x-4 gap-y-3 p-4 md:p-5 border-b border-gray-200">
                    <div class="flex items-center flex-wrap gap-2">
                        <button id="startSorting" class="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors text-base flex-shrink-0">
                            開始排序
                        </button>
                        
                        
                        <div id="sortingOptions" class="flex items-center flex-wrap gap-2">
       
                            <select id="sortingType" class="bg-gray-100 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm rounded-md p-1.5 transition-colors">
                                <option value="hakka-pinyin">客語 ↔ 拼音</option>
                                <option value="chinese-pinyin">華語 ↔ 拼音</option>
                                <option value="pinyin-hakka" selected>拼音 ↔ 客語</option>
                                <option value="chinese-hakka">華語 ↔ 客語</option>
                            </select>
                            <select id="sortingCondition" class="bg-gray-100 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm rounded-md p-1.5 transition-colors">
                                <option value="time60">60秒</option>
                                <option value="time100" selected>100秒</option>
                                <option value="time180">180秒</option>
                                <option value="unlimited">無限</option>
                                <option value="correct5">5題</option>
                                <option value="correct10">10題</option>
                                <option value="correct15">15題</option>
                                <option value="correct20">20題</option>
                                <option value="correct30">30題</option>
                            </select>
                        </div>
                        <div id="sortingTimer" class="text-lg font-mono font-bold text-gray-700 min-w-[5rem]"></div>
                    </div>

                    <div class="flex items-center gap-x-3 gap-y-2 flex-wrap justify-end">
                        <div class="flex items-center gap-1">
                            <label for="sortingPlaySound" class="flex items-center gap-1 p-1.5 rounded-md hover:bg-gray-100 cursor-pointer" title="自動播放題目音效">
                                <input type="checkbox" id="sortingPlaySound" class="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" checked>
                                <span class="material-icons text-gray-600 !text-xl align-middle">volume_up</span>
                            </label>
                            <button id="blurSortingText" class="p-2 rounded-md hover:bg-gray-100 transition-colors" title="模糊題目文字">
                                <span class="material-icons text-gray-600 !text-xl align-middle">blur_on</span>
                            </button>
                            <button onclick="adjustFontSize(-1, 'sorting')" title="縮小字體" class="p-2 rounded-md hover:bg-gray-100 transition-colors">
                                <span class="material-icons text-gray-600 !text-xl align-middle">text_decrease</span>
                            </button>
                            <button onclick="adjustFontSize(1, 'sorting')" title="放大字體" class="p-2 rounded-md hover:bg-gray-100 transition-colors">
                                <span class="material-icons text-gray-600 !text-xl align-middle">text_increase</span>
                            </button>
                        </div>
                        <div class="w-px h-5 bg-gray-300 mx-1"></div>
                        <div class="flex items-center gap-4 md:gap-6">
                            <div class="text-center" title="分數">
                                <div id="sortingScore" class="text-xl font-bold text-indigo-600">0</div>
                            </div>
                            <div class="text-center" title="正確">
                                <div id="sortingCorrect" class="text-xl font-bold text-green-600">0</div>
                            </div>
                            <div class="text-center" title="錯誤">
                                <div id="sortingIncorrect" class="text-xl font-bold text-red-600">0</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="sortingArea" class="p-4 md:p-8 hidden min-h-[300px]"></div>
                <div id="sortingStartNotice" class="text-center py-20 text-gray-500">
                    <p>請點擊按鈕開始遊戲</p>
                </div>
            </div>
        </div>
    `;
  setupSortingGame();
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
    total: 0 
  }
  
  document.getElementById("startSorting").onclick = startSortingGame;

  // 【新增】模糊題目按鈕的邏輯
  let isBlurred = false;
  const blurButton = document.getElementById("blurSortingText");
  blurButton.onclick = () => {
    isBlurred = !isBlurred;
    const questionElement = document.querySelector("#sortingArea .question-text");
    
    if (questionElement) {
      if (isBlurred) {
        questionElement.classList.add("blur-text");
        blurButton.classList.add("bg-blue-100", "text-blue-700");
      } else {
        questionElement.classList.remove("blur-text");
        blurButton.classList.remove("bg-blue-100", "text-blue-700");
      }
    }
  };
}


function stopSortingGame() {
    if (sortingGameState.timerInterval) {
        clearInterval(sortingGameState.timerInterval);
    }
    endSortingGame("遊戲已中止");
}

function startSortingGame() {
  const sentences = getSelectedSentences()
  const condition = document.getElementById("sortingCondition").value
  const button = document.getElementById("startSorting")
  const optionsContainer = document.getElementById("sortingOptions");

  sortingGameState.isPlaying = true
  sortingGameState.correct = 0
  sortingGameState.incorrect = 0
  sortingGameState.score = 0
  sortingGameState.total = 0; // 【修改】重設題號
  sortingGameState.sentences = sentences
  sortingGameState.usedSentences = []
  sortingGameState.availableSentences = [...sentences].sort(() => Math.random() - 0.5)

  button.innerHTML = `<span class="material-icons">close</span>`;
  button.title = "停止遊戲";
  button.className = "bg-gray-500 hover:bg-gray-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-colors";
  button.onclick = stopSortingGame

  optionsContainer.querySelectorAll('select').forEach(el => {
      el.classList.add('opacity-50', 'pointer-events-none');
      el.disabled = true;
  });
  if (window.innerWidth < 768) {
      optionsContainer.classList.add('hidden');
  }

  document.getElementById("sortingScore").textContent = "0"
  document.getElementById("sortingCorrect").textContent = "0"
  document.getElementById("sortingIncorrect").textContent = "0"
  
  document.getElementById("sortingArea").classList.remove("hidden");
  document.getElementById("sortingStartNotice").classList.add("hidden");

  // 【修改】設定計時器
  if (condition.startsWith("time")) {
    const timeLimit = Number.parseInt(condition.replace("time", ""))
    sortingGameState.timeLeft = timeLimit
    startSortingTimer()
  } else {
    // 對於「n關計時」和「不限時間」模式，都啟用一個累加計時器
    const timerElement = document.getElementById("sortingTimer");
    sortingGameState.startTime = Date.now();
    
    timerElement.textContent = "00:00";

    sortingGameState.timerInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - sortingGameState.startTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
        const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
        timerElement.textContent = `${minutes}:${seconds}`;
    }, 1000);
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
    timerElement.textContent = ` ${sortingGameState.timeLeft}`

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

  sortingGameState.total++; // 【新增】累加題號

  // 取出下一個題目
  const sentence = sortingGameState.availableSentences.shift()
  sortingGameState.usedSentences.push(sentence)
  const type = document.getElementById("sortingType").value

  let questionText, answerText
  let isPinyinAnswer = false; 

  switch (type) {
    case "hakka-pinyin":
      questionText = sentence["客語"]
      answerText = sentence["拼音"]
      isPinyinAnswer = true;
      break
    case "chinese-pinyin":
      questionText = sentence["華語"]
      answerText = sentence["拼音"]
      isPinyinAnswer = true;
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

  let words
  
  if (isPinyinAnswer) {
    let tempWords = answerText.split(/\s+/).filter((w) => w.trim() !== "")

    if (tempWords.length === 1 && tempWords[0].includes('-')) {
        let hyphenSplitWords = tempWords[0].split(/-+/).filter((w) => w.trim() !== "");
        
        if (hyphenSplitWords.length > 1) {
            words = hyphenSplitWords;
        } else {
            words = tempWords;
        }
    } else {
        words = tempWords;
    }
  } else {
    words = Array.from(answerText).filter((char) => char.trim() !== "")
  }

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
  sortingGameState.userOrder = [...fixedWords] 

  renderSortingQuestion()
  
  if (document.getElementById('sortingPlaySound').checked) {
      playAudio(sentence["音檔"]);
  }
}

function renderSortingQuestion() {
  const sortingArea = document.getElementById("sortingArea")
  const canCheck = sortingGameState.userOrder.length === sortingGameState.originalWords.length
  const questionNumber = sortingGameState.total + 1;

  sortingArea.innerHTML = `
        <div class="text-center mb-8">
            <div class="flex items-center justify-center gap-4 mb-6">
                <button onclick="playAudio('${sortingGameState.currentSentence["音檔"]}', this.querySelector('.material-icons'))" 
                        class="text-gray-800 hover:bg-gray-100 p-2 rounded transition-colors">
                    <span class="material-icons">volume_up</span>
                </button>
                <div class="text-2xl font-bold text-indigo-800" style="font-size: ${userSettings.fontSize + 4}px">
                    <span class="question-number">${questionNumber}. </span><span class="question-text">${sortingGameState.questionText}</span>
                </div>
            </div>
            
            <div class="bg-gray-100 rounded-lg p-4 mb-6 min-h-16">
                <div id="sortingTarget" class="flex gap-2 flex-wrap justify-center min-h-12">
                    ${sortingGameState.userOrder
                      .map((word, index) => {
                        const isFixed = index < sortingGameState.fixedWords.length
                        return `
                            <div class="sorting-word ${isFixed ? "bg-green-600 cursor-not-allowed" : "bg-indigo-500 cursor-pointer"} text-white px-4 py-2 rounded-lg" 
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
  sortingGameState.isPlaying = false;
  const button = document.getElementById("startSorting");
  const optionsContainer = document.getElementById("sortingOptions");

  if (sortingGameState.timerInterval) {
    clearInterval(sortingGameState.timerInterval);
  }

  if(button) {
      button.innerHTML = "重新開始";
      button.title = "重新開始";
      button.className = "bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors text-base";
      button.onclick = restartSortingGame;
  }

  // 【修改】只啟用 select 元素
  optionsContainer.querySelectorAll('select').forEach(el => {
      el.classList.remove('opacity-50', 'pointer-events-none');
      el.disabled = false;
  });
  if (window.innerWidth < 768) {
      optionsContainer.classList.remove('hidden');
  }

  const totalQuestions = sortingGameState.correct + sortingGameState.incorrect;
  const accuracy = totalQuestions > 0 ? Math.round((sortingGameState.correct / totalQuestions) * 100) : 0;

  showResult(
    "🎯",
    "排序結束",
    `${message}\n\n` +
      `最終分數：${sortingGameState.score}\n` +
      `答對題數：${sortingGameState.correct}\n` +
      `答錯題數：${sortingGameState.incorrect}\n` +
      `正確率：${accuracy}%`
  );
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
  // ---【修改後】整合的搜尋功能設定 ---
  const mainTitle = document.getElementById("mainTitle");
  const mobileSearchBox = document.getElementById("mobileSearchBox");
  const searchToggle = document.getElementById("searchToggle");
  const viewToggle = document.getElementById("viewToggle");
  const searchResults = document.getElementById("searchResults");
  const searchBox = document.getElementById("searchBox");
  const searchInput = document.getElementById("searchInput");
  const mobileSearchInput = document.getElementById("mobileSearchInput");
  const closeMobileSearch = document.getElementById("closeMobileSearch");
  const clearSearchBtn = document.getElementById("clearSearch");
  const searchOverlay = document.getElementById("searchOverlay"); // 【新增】獲取遮罩元素

  // 將統一的處理函數綁定到電腦版和手機版兩個輸入框
  searchInput.addEventListener("input", handleSearchInput);
  mobileSearchInput.addEventListener("input", handleSearchInput);

  // 手機版搜尋 UI 優化
  // 點擊放大鏡圖示，展開手機搜尋框
  searchToggle.onclick = () => {
    mainTitle.classList.add("hidden");
    viewToggle.classList.add("hidden");
    searchToggle.classList.add("hidden");
    
    mobileSearchBox.classList.remove("hidden");
    searchOverlay.classList.remove("hidden"); // 【新增】顯示遮罩
    mobileSearchInput.focus();
  };

  // 點擊關閉按鈕，收回手機搜尋框
  closeMobileSearch.onclick = () => {
    mainTitle.classList.remove("hidden");
    viewToggle.classList.remove("hidden");
    searchToggle.classList.remove("hidden");

    mobileSearchBox.classList.add("hidden");
    searchOverlay.classList.add("hidden"); // 【新增】隱藏遮罩
    mobileSearchInput.value = "";
    searchResults.classList.add("hidden");
  };

  // 【新增】點擊遮罩層時，觸發關閉按鈕的功能
  searchOverlay.onclick = () => {
    closeMobileSearch.click();
  };


  // 桌面版清除按鈕的點擊事件
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchResults.classList.add('hidden');
    clearSearchBtn.classList.add('hidden');
    searchInput.focus();
  });

  // 點擊頁面其他地方，關閉搜尋結果
  document.addEventListener("click", (e) => {
    const isClickInsideSearch = searchBox.contains(e.target) || 
                                mobileSearchBox.contains(e.target) || 
                                searchResults.contains(e.target);
    if (!isClickInsideSearch) {
      searchResults.classList.add("hidden");
    }
  });

  // --- 以下保留原有的其他事件監聽器 ---

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
  // 移除閃示卡鍵盤監聽
  if (flashcardKeyHandler) {
    document.removeEventListener('keydown', flashcardKeyHandler)
    flashcardKeyHandler = null
  }
}

// 啟動應用
init()
