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
let starredCards = new Set()
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
let flashcardBlurStates = { hakka: false, pinyin: false, chinese: false };
let quizIsBlurred = false;
let sortingIsBlurred = false;
let catalog = {};
let currentCatalogTab = "";
let learnSelectedText;


// 慶祝表情符號
const celebrationEmojis = ["🌈", "🌟", "🎊", "🎉", "✨", "💖", "😍", "🥰"]

// 初始化
function init() {
  parseData();
  parseCatalog();
  
  if (Object.keys(catalog).length > 0) {
    currentCatalogTab = Object.keys(catalog)[0];
  }

  loadUserData();
  loadUserSettings();
  renderCatalogTabs();
  renderCategoryList();
  setupEventListeners();
  updateUserDisplay();  

  learnSelectedText = document.getElementById("learnSelectedText");
  document.getElementById("learnSelected").addEventListener("click", startLearning);
  document.getElementById("currentTabSelectAll").addEventListener("change", toggleCurrentTabSelection);
  document.getElementById("clearAllSelections").addEventListener("click", clearAllSelections);
}

// 解析分類群組資料
function parseCatalog() {
  const lines = myCatalog.trim().split("\n");
  lines.forEach(line => {
    const parts = line.split("\t");
    if (parts.length === 2) {
      const key = parts[0].trim();
      const valueStr = parts[1].trim();

      // 檢查是否為新的章節格式
      if (valueStr.startsWith('{')) {
        const chapters = [];
        const regex = /\{([^:]+):([^}]+)\}/g;
        let match;
        while ((match = regex.exec(valueStr)) !== null) {
          chapters.push({
            title: match[1].trim(),
            // 將分類字串分割成陣列，並過濾掉因結尾逗號可能產生的空字串
            categories: match[2].split(',').map(item => item.trim()).filter(Boolean)
          });
        }
        catalog[key] = { type: 'chapters', data: chapters };
      } else {
        // 處理舊的、簡單的列表格式
        const categories = valueStr.split(',').map(item => item.trim());
        catalog[key] = { type: 'list', data: categories };
      }
    }
  });
}

// 使用新的函數來處理頁籤溢出
function renderCatalogTabs() {
    const tabsContainer = document.getElementById("catalogTabs");
    const moreTabsContainer = document.getElementById("moreTabsContainer");
    const moreTabsDropdown = document.getElementById("moreTabsDropdown");
    const container = document.getElementById("catalogTabsContainer");

    // 【新增的防護】如果容器是隱藏的(寬度為0)，則不執行後續程式碼
    if (!tabsContainer || !container || container.offsetWidth === 0) {
        return; 
    }

    // 暫時清空
    tabsContainer.innerHTML = "";
    moreTabsDropdown.innerHTML = "";
    moreTabsContainer.classList.add("hidden");

    const allTabs = Object.keys(catalog);
    let visibleTabs = [];
    let overflowTabs = [];

    // 先把所有按鈕都創建出來，但不顯示，以便測量寬度
    const tabElements = allTabs.map(tabName => {
        const button = document.createElement("button");
        const isActive = tabName === currentCatalogTab;
        button.textContent = tabName;
        button.className = `
            px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 flex-shrink-0
            ${isActive 
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:bg-gray-100'
            }
        `;
        button.onclick = () => selectCatalogTab(tabName);
        return button;
    });

    // 使用 requestAnimationFrame 確保元素已渲染以進行寬度計算
    requestAnimationFrame(() => {
        const viewToggleBtn = document.getElementById("viewToggle");
        // 計算可用空間 (容器寬度 - 切換檢視按鈕寬度 - 一些間距)
        const availableWidth = container.offsetWidth - viewToggleBtn.offsetWidth - 20;
        let currentWidth = 0;
        let hasOverflow = false;

        tabsContainer.append(...tabElements); // 先全部放入以便計算

        tabElements.forEach(button => {
            if (hasOverflow) {
                overflowTabs.push(button);
                return;
            }
            currentWidth += button.offsetWidth + 8; // 8是 gap-2 的大約值
            if (currentWidth < availableWidth) {
                visibleTabs.push(button);
            } else {
                hasOverflow = true;
                overflowTabs.push(button);
            }
        });
        
        // 重新渲染正確的 tabs
        tabsContainer.innerHTML = "";
        tabsContainer.append(...visibleTabs);

        if (hasOverflow) {
            moreTabsContainer.classList.remove("hidden");
            overflowTabs.forEach(button => {
                // 為了下拉選單的樣式，我們重新創建元素
                const dropdownItem = document.createElement("a");
                const isActive = button.textContent === currentCatalogTab;
                dropdownItem.textContent = button.textContent;
                dropdownItem.href = "#";
                dropdownItem.className = `block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isActive ? 'bg-blue-50' : ''}`;
                dropdownItem.onclick = (e) => {
                    e.preventDefault();
                    selectCatalogTab(button.textContent);
                    moreTabsDropdown.classList.add('hidden');
                };
                moreTabsDropdown.appendChild(dropdownItem);
            });
        }
    });
}



/**
 * 根據分類名稱和數量，建立一個卡片或列表項的 HTML 元素。
 * @param {string} categoryName - 分類名稱 (例如 "01天氣" 或 "星號").
 * @param {number} cardCount - 該分類下的句子數量.
 * @returns {HTMLElement} - 代表該分類的 div 元素.
 */
function createCategoryCardElement(categoryName, cardCount) {
    const isSelected = selectedCategories.has(categoryName);
    const emoji = getCategoryEmoji(categoryName);
    const categoryItem = document.createElement("div");

    const isStarredCategory = categoryName === "星號";
    const titleClickAction = isStarredCategory 
        ? `event.stopPropagation(); showStarredCategory()`
        : `event.stopPropagation(); showCategoryDetail('${categoryName.replace(/'/g, "\\'")}')`;
    
    categoryItem.onclick = () => toggleCategorySelection(categoryName);

    if (currentViewMode === "card") {
        // 僅透過 className 控制選取狀態
        categoryItem.className = `category-card bg-white rounded-xl shadow-sm cursor-pointer hover:shadow-md ${isSelected ? "checkbox-selected selected-border" : ""}`;
        categoryItem.innerHTML = `
            <div class="p-2">
                <div class="flex items-center space-x-2"> <div class="text-4xl">
                        ${emoji}
                    </div>
                    <div>
                        <h3 class="category-title-link text-lg text-gray-800" onclick="${titleClickAction}">
                            ${categoryName}
                        </h3>
                        <p class="text-sm text-gray-500">${cardCount} 句</p>
                    </div>
                </div>
            </div>
        `;
    } else { // list view (保持不變)
        categoryItem.className = `category-card p-3 flex items-center space-x-4 cursor-pointer border-b border-gray-200 last:border-b-0 hover:bg-gray-50 hover:transform-none hover:shadow-none ${isSelected ? "checkbox-selected" : ""}`;
        categoryItem.innerHTML = `
            <div class="selection-indicator !left-3 !top-1/2 !-translate-y-1/2">
                <span class="material-icons text-base">${isSelected ? 'check' : 'radio_button_unchecked'}</span>
            </div>
            <div class="pl-8 flex items-center space-x-4">
                <span class="text-2xl">${emoji}</span>
                <div class="flex items-baseline gap-x-3">
                    <h3 class="category-title-link text-lg text-gray-800" onclick="${titleClickAction}">
                        ${categoryName}
                    </h3>
                    <p class="text-sm text-gray-500 flex-shrink-0">${cardCount} 句</p>
                </div>
            </div>
        `;
    }
    return categoryItem;
}

function getCategoriesInCurrentTab() {
    const tabData = catalog[currentCatalogTab];
    if (!tabData) return [];

    if (tabData.type === 'list') {
        return tabData.data;
    } else { // type === 'chapters'
        // 使用 flatMap 將所有章節的分類合併成一個陣列
        return tabData.data.flatMap(chapter => chapter.categories);
    }
}


// 渲染分類列表
function renderCategoryList() {
    const categoryList = document.getElementById("categoryList");
    categoryList.innerHTML = "";
    // 主容器本身不帶有佈局樣式，佈局由其子元素決定
    categoryList.className = "";

    const currentTabData = catalog[currentCatalogTab];
    if (!currentTabData) return;

    let renderableSections = [];
    const firstTabName = Object.keys(catalog).length > 0 ? Object.keys(catalog)[0] : "";
    const isFirstTab = currentCatalogTab === firstTabName;
    const hasStarredCards = starredCards.size > 0;

    // 根據新邏輯處理「星號」卡片的顯示
    if (isFirstTab && hasStarredCards) {
        if (currentTabData.type === 'chapters') {
            // **情況1：首頁籤有分章節** -> 顯示「我的收藏」標題
            renderableSections.push({
                title: "我的收藏",
                categories: ["星號"]
            });
            renderableSections.push(...currentTabData.data);
        } else { // type === 'list'
            // **情況2：首頁籤沒有分章節** -> 將「星號」卡片直接放在最前面，不加標題
            const combinedCategories = ["星號", ...currentTabData.data];
            renderableSections.push({
                title: null, // 不顯示標題
                categories: combinedCategories
            });
        }
    } else {
        // 對於其他頁籤，或沒有星號卡片時，照常顯示
        if (currentTabData.type === 'chapters') {
            renderableSections.push(...currentTabData.data);
        } else { // type === 'list'
            renderableSections.push({
                title: null,
                categories: currentTabData.data
            });
        }
    }

    // --- 以下渲染邏輯保持不變 ---

    // 遍歷這個統一的結構並渲染畫面
    renderableSections.forEach(section => {
        // 如果有標題，則渲染標題元素
        if (section.title) {
            const titleEl = document.createElement("h2");
            titleEl.className = "text-xl font-bold text-gray-700 mt-6 mb-4 px-2";
            titleEl.textContent = section.title;
            categoryList.appendChild(titleEl);
        }

        // 為本區塊的卡片建立一個容器
        const container = document.createElement("div");
        container.className = currentViewMode === "card" 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
            : "bg-white rounded-xl shadow-sm border";
        
        section.categories.forEach(categoryName => {
            const isStarredCategory = categoryName === "星號";
            const cardCount = isStarredCategory ? starredCards.size : (categories[categoryName] ? categories[categoryName].length : 0);
            
            // 如果是一般分類但資料不存在，則不渲染
            if (!isStarredCategory && !categories[categoryName]) return;

            const cardElement = createCategoryCardElement(categoryName, cardCount);
            container.appendChild(cardElement);
        });

        // 只有當容器內有卡片時才將其加入到主列表
        if (container.hasChildNodes()) {
            categoryList.appendChild(container);
        }
    });
    
    updateSelectionToolbar();
    updateSelectionControlsState(); 
}

// 切換目前頁籤的全選/取消全選
function toggleCurrentTabSelection(event) {
    const isChecked = event.target.checked;
    const categoriesInCurrentTab = getCategoriesInCurrentTab();
    
    categoriesInCurrentTab.forEach(category => {
        if (categories[category]) { // 確保分類存在
            if (isChecked) {
                selectedCategories.add(category);
            } else {
                selectedCategories.delete(category);
            }
        }
    });
    renderCategoryList();
    updateSelectionToolbar();
}

// 清除所有選取
function clearAllSelections() {
    selectedCategories.clear();
    renderCategoryList();
    updateSelectionToolbar();
}

// 更新目前頁籤的全選核取方塊狀態
function updateSelectionControlsState() {
    const currentTabSelectAllCheckbox = document.getElementById("currentTabSelectAll");
    const categoriesInCurrentTab = getCategoriesInCurrentTab();

    if (categoriesInCurrentTab.length === 0) {
        currentTabSelectAllCheckbox.checked = false;
        currentTabSelectAllCheckbox.indeterminate = false;
        return;
    }

    const selectedCountInTab = categoriesInCurrentTab.filter(category => selectedCategories.has(category)).length;

    if (selectedCountInTab === 0) {
        currentTabSelectAllCheckbox.checked = false;
        currentTabSelectAllCheckbox.indeterminate = false;
    } else if (selectedCountInTab === categoriesInCurrentTab.length) {
        currentTabSelectAllCheckbox.checked = true;
        currentTabSelectAllCheckbox.indeterminate = false;
    } else {
        currentTabSelectAllCheckbox.checked = false;
        currentTabSelectAllCheckbox.indeterminate = true;
    }
}


// 處理頁籤選擇事件
function selectCatalogTab(tabName) {
    currentCatalogTab = tabName;
    renderCatalogTabs(); 
    renderCategoryList();
    updateSelectionControlsState();
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
  
  // --- 新增：載入星號紀錄 ---
  const starredKey = `kasuStarred_${currentUser.id}`;
  const starredData = localStorage.getItem(starredKey);
  if (starredData) {
    starredCards = new Set(JSON.parse(starredData));
  } else {
    starredCards = new Set(); // 如果沒有紀錄，確保是空的 Set
  }
  // --- 結束 ---
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
function handleSearchInput(e) {
  // 由於此函數現在由 `handleRealtimeTransform` 觸發，`e.target.value` 已是轉換後的值
  // 【修改】將查詢中的一個或多個 '-' 替換為空格
  const query = e.target.value.toLowerCase().replace(/-+/g, ' ');
  const searchResults = document.getElementById("searchResults");
  const clearSearchBtn = document.getElementById("clearSearch");

  if (clearSearchBtn) {
    clearSearchBtn.classList.toggle('hidden', query.length === 0);
  }

  if (query.length < 1) {
    searchResults.classList.add("hidden");
    return;
  }

  let results = [];
  
  // --- 規則 1: 彈性元音 (o/oo) 和聲調的正規表示式查詢 ---
  const createSearchRegex = (pattern, isToneInsensitive = false) => {
    // 將 'o' 轉換為 '(o|oo)' 以同時匹配 'o' 和 'oo'
    let regexPattern = pattern.replace(/o/g, '(o|oo)');
    if (isToneInsensitive) {
      // 移除所有聲調符號
      regexPattern = regexPattern.replace(/[ˊˇˋˆ]/g, '');
    }
    try {
      return new RegExp(regexPattern, 'i');
    } catch (error) {
      // 如果正則表達式錯誤，返回一個簡單的包含查詢
      console.error("Regex creation failed:", error);
      return null;
    }
  };
  
  const searchInSentences = (isToneInsensitive = false) => {
    const searchRegex = createSearchRegex(query, isToneInsensitive);
    if (!searchRegex) return []; // 如果正則表達式建立失敗，返回空

    const foundResults = [];
    Object.entries(categories).forEach(([category, sentences]) => {
      sentences.forEach((sentence, index) => {
        // 【修改】將資料庫文本中的一個或多個 '-' 替換為空格
        let searchText = `${sentence["客語"]} ${sentence["拼音"]} ${sentence["華語"]}`.toLowerCase().replace(/-+/g, ' ');
        if (isToneInsensitive) {
          searchText = searchText.replace(/[ˊˇˋˆ]/g, ''); // 移除資料中的聲調
        }

        if (searchRegex.test(searchText)) {
          foundResults.push({
            type: "sentence",
            title: sentence["客語"],
            chinese: sentence["華語"],
            category: category,
            data: { category, index },
          });
        }
      });
    });
    return foundResults;
  };

  // --- 主要搜尋流程 ---
  // 1. 先進行包含聲調的標準查詢
  const sentenceResults = searchInSentences(false);
  results.push(...sentenceResults);

  // 2. 如果沒有句子結果，且使用者有輸入內容，則進行無聲調的後援查詢
  if (sentenceResults.length === 0 && query.trim() !== '') {
    const fallbackResults = searchInSentences(true);
    results.push(...fallbackResults);
  }

  // 搜尋分類 (分類搜尋不受聲調影響)
  Object.keys(categories).forEach((category) => {
    if (category.toLowerCase().includes(query)) {
      results.push({
        type: "category",
        title: category,
        subtitle: `${categories[category].length} 句`,
        data: category,
      });
    }
  });
  
  // 去除重複的結果 (例如後援查詢可能找到與分類重疊的內容)
  const uniqueResults = results.filter((v,i,a)=>a.findIndex(t=>(JSON.stringify(t.data) === JSON.stringify(v.data)))===i);


  if (uniqueResults.length > 0) {
    searchResults.innerHTML = uniqueResults
      .slice(0, 10)
      .map(
        (result, index) => {
          let contentHtml;
          if (result.type === 'category') {
            const emoji = getCategoryEmoji(result.title);
            contentHtml = `
              <div class="flex items-baseline gap-2 flex-1 min-w-0">
                <span class="text-xl">${emoji}</span>
                <span class="font-semibold text-gray-900 truncate">${result.title}</span>
                <span class="text-sm text-gray-500 truncate flex-shrink-0">${result.subtitle}</span>
              </div>
            `;
          } else {
            contentHtml = `
              <div class="min-w-0">
                <div class="font-semibold text-gray-900 truncate">${result.title}</div>
                <div class="text-sm text-gray-600 truncate">
                  <span>${result.chinese}</span>
                  <span class="text-blue-600 font-medium ml-1">${result.category}</span>
                </div>
              </div>
            `;
          }
          return `
              <div class="search-result-item p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-start" 
                   onclick="selectSearchResult('${result.type}', '${JSON.stringify(result.data).replace(/"/g, "&quot;")}')">
                  <span class="mr-3 text-gray-500 font-medium pt-0.5">${index + 1}.</span>
                  ${contentHtml}
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

/**
 * 根據客語拼音輸入規則，轉換查詢字串。
 * @param {string} query - 使用者輸入的原始字串。
 * @returns {string} 轉換後的字串。
 */
function transformHakkaQuery(query) {
  // 將查詢字串按空格分割成單詞陣列
  const words = query.split(' ');
  const transformedWords = words.map(word => {
    let newWord = word;
    // 規則 1: 字尾聲調取代
    newWord = newWord.replace(/([aeioumngbdr])z$/i, '$1ˊ');
    newWord = newWord.replace(/([aeioumngbdr])v$/i, '$1ˇ');
    newWord = newWord.replace(/([aeioumngbdr])s$/i, '$1ˋ');
    newWord = newWord.replace(/([aeioumngbdr])(x|\^)$/i, '$1ˆ');

    // 規則 2: 開頭字母取代
    newWord = newWord.replace(/^v([aeiou])/i, 'bb$1');
    newWord = newWord.replace(/^r([aeiou])/i, 'rh$1');
    
    return newWord;
  });
  
  // 將處理過的單詞重新組合成一個字串
  return transformedWords.join(' ');
}


function selectSearchResult(type, data) {
  const parsedData = JSON.parse(data)
  document.getElementById("searchResults").classList.add("hidden")
  document.getElementById("searchInput").value = ""
  
  document.getElementById("closeMobileSearch").click();

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
    if (categoryName === "星號") {
        return '🌟';
    }
    const cleanName = categoryName.replace(/[0-9\s]+/g, '');
    return emojiMap[cleanName] || '📚';
}



// 開始學習選取的項目
function startLearning() {
  const selectedCount = selectedCategories.size;
  if (selectedCount === 0) {
    showResult("⚠️", "提醒", "請先勾選要學習的主題。");
    return;
  }

  let combinedSentences = [];
  const combinedSentenceIds = new Set(); // 用於防止句子重複

  // 優先處理特殊的 "星號" 分類
  if (selectedCategories.has("星號")) {
    const starredSentences = sentences.filter(sentence => {
      const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
      return starredCards.has(sentenceId);
    });
    
    starredSentences.forEach(sentence => {
      const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
      if (!combinedSentenceIds.has(sentenceId)) {
        combinedSentences.push(sentence);
        combinedSentenceIds.add(sentenceId);
      }
    });
  }

  // 處理其他常規分類
  selectedCategories.forEach(categoryName => {
    if (categoryName !== "星號" && categories[categoryName]) {
      categories[categoryName].forEach(sentence => {
        const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
        if (!combinedSentenceIds.has(sentenceId)) {
          combinedSentences.push(sentence);
          combinedSentenceIds.add(sentenceId);
        }
      });
    }
  });
  
  const tempCategoryName = `已選取的 ${selectedCount} 個主題`;
  
  // 為了避免重複的臨時分類，先檢查並刪除舊的
  Object.keys(categories).forEach(key => {
    if (key.startsWith("已選取的")) {
      delete categories[key];
    }
  });

  // 將合併後的句子加入到一個臨時的分類中
  categories[tempCategoryName] = combinedSentences;

  // 顯示這個臨時分類的詳情頁面
  showCategoryDetail(tempCategoryName);
}

// 清除所有勾選的分類
function clearAllSelections() {
  selectedCategories.clear();
  saveSelectedCategories();
  renderCategoryList();    
  updateSelectionToolbar(); 
}


// 切換分類選取狀態
function toggleCategorySelection(category) {
    if (selectedCategories.has(category)) {
        selectedCategories.delete(category);
    } else {
        selectedCategories.add(category);
    }
    renderCategoryList();
    updateSelectionToolbar();
    updateSelectionControlsState();
}



// 更新選取工具條
function updateSelectionToolbar() {
    const learnSelectedButton = document.getElementById("learnSelected");
    const selectionControls = document.getElementById("selectionControls");
    const count = selectedCategories.size;

    if (count > 0) {
        // 有選取項目：顯示浮動學習按鈕和頂部選取控制項
        learnSelectedText.textContent = `學習 ${count} 個選取`;
        learnSelectedButton.classList.remove("hidden");
        learnSelectedButton.disabled = false;
        learnSelectedButton.classList.remove("opacity-50", "cursor-not-allowed");

        selectionControls.classList.remove("hidden");
    } else {
        // 無選取項目：隱藏浮動學習按鈕和頂部選取控制項
        learnSelectedButton.classList.add("hidden");
        learnSelectedButton.disabled = true;
        learnSelectedButton.classList.add("opacity-50", "cursor-not-allowed");

        selectionControls.classList.add("hidden");
    }
}

function showStarredCategory() {
  const categoryName = "星號";
  
  // 從所有句子中，篩選出ID存在於 starredCards 中的句子
  const starredSentences = sentences.filter(sentence => {
    const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
    return starredCards.has(sentenceId);
  });

  // 為了安全起見，先刪除可能存在的舊暫存分類
  if (categories[categoryName]) {
      delete categories[categoryName];
  }

  // 建立一個暫時的 "星號" 分類
  categories[categoryName] = starredSentences;

  // 顯示這個暫存分類的詳情頁面
  showCategoryDetail(categoryName);
}

// 開始學習選取的項目
function startLearning() {
  const selectedCount = selectedCategories.size;
  if (selectedCount === 0) {
    showResult("⚠️", "提醒", "請先勾選要學習的主題。");
    return;
  }

  // 建立一個臨時的分類名稱，用於顯示在詳情頁標題
  const tempCategoryName = `已選取的 ${selectedCount} 個主題`;
  let combinedSentences = [];

  // 從所有選取的分類中收集句子
  selectedCategories.forEach(categoryName => {
    if (categories[categoryName]) {
      combinedSentences = combinedSentences.concat(categories[categoryName]);
    }
  });
  
  // 為了避免重複的臨時分類，先檢查並刪除舊的
  Object.keys(categories).forEach(key => {
    if (key.startsWith("已選取的")) {
      delete categories[key];
    }
  });

  // 將合併後的句子加入到一個臨時的分類中
  categories[tempCategoryName] = combinedSentences;

  // 顯示這個臨時分類的詳情頁面
  showCategoryDetail(tempCategoryName);
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
 * @returns {Promise<void>} - 一個在音檔播放完畢時解析的 Promise。
 */
function playAudio(filename, iconElement = null) {
    // 停止任何正在播放的音檔。這對於防止音檔重疊至關重要。
    if (currentAudio) {
        // 移除舊音檔的事件監聽器，避免舊的 Promise 意外地被解析
        currentAudio.onended = null;
        currentAudio.onpause = null;
        currentAudio.onerror = null;
        currentAudio.pause();
    }

    if (currentPlayingIcon) {
        currentPlayingIcon.textContent = originalIconContent;
        currentPlayingIcon = null;
    }

    return new Promise((resolve) => {
        if (!filename) {
            resolve();
            return;
        }

        const audio = new Audio(`https://oikasu1.github.io/snd/oikasu/${filename}`);
        currentAudio = audio; // 將當前音檔指定到全域變數

        if (iconElement) {
            currentPlayingIcon = iconElement;
            originalIconContent = iconElement.textContent;
            iconElement.textContent = 'graphic_eq';
        }

        const cleanupAndResolve = () => {
            // 確保只清理與此音檔相關的圖示
            if (iconElement && currentPlayingIcon === iconElement) {
                iconElement.textContent = originalIconContent;
                currentPlayingIcon = null;
            }
            // 清理事件監聽器以避免記憶體洩漏
            audio.onended = null;
            audio.onerror = null;
            resolve();
        };

        audio.onended = cleanupAndResolve;
        audio.onerror = () => {
            console.log("音檔播放失敗");
            cleanupAndResolve(); // 即使失敗也解析，以防自動播放循環中斷
        };

        audio.play().catch(e => {
            console.log("音檔播放命令失敗:", e);
            cleanupAndResolve(); // 同樣解析以防循環中斷
        });
    });
}

function playCurrentAudio() {
  if (flashcardSentences.length > 0 && currentCardIndex < flashcardSentences.length) {
    const sentence = flashcardSentences[currentCardIndex];
    // 獲取閃示卡主播放按鈕的圖示元素
    const playButton = document.getElementById('playCardAudio');
    const iconElement = playButton ? playButton.querySelector('.material-icons') : null;
    
    // 呼叫我們修改過的 playAudio 函數並回傳其 Promise
    return playAudio(sentence["音檔"], iconElement);
  } else {
    // 如果沒有可播放的卡片，也回傳一個已解析的 Promise
    return playAudio(null);
  }
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
            <div id="learningModeToolbar" class="sticky top-0 z-20 mode-toolbar bg-white rounded-lg shadow-sm px-3 py-1.5 mb-6 border border-gray-200">
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
  setStickyTopPosition();
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

function saveStarredCards() {
  const starredKey = `kasuStarred_${currentUser.id}`;
  localStorage.setItem(starredKey, JSON.stringify(Array.from(starredCards)));
}

function toggleStar(index) {
  const sentence = categories[currentCategory][index];
  if (!sentence) return;

  // 使用與閃示卡相同的ID邏輯以確保同步
  const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;

  if (starredCards.has(sentenceId)) {
    starredCards.delete(sentenceId);
  } else {
    starredCards.add(sentenceId);
  }
  
  saveStarredCards();
  renderSentences();
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
    // --- 新增：星號狀態判斷 ---
    const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
    const isStarred = starredCards.has(sentenceId);
    const starIcon = isStarred ? 'star' : 'star_border';
    // --- 結束 ---
    const sentenceItem = document.createElement("div");

    if (userSettings.layout === 'compact') {
        sentenceItem.className = "flex items-center gap-3 p-3 border-b last:border-b-0";
        sentenceItem.innerHTML = `
            <input type="checkbox" class="sentence-checkbox w-4 h-4 text-blue-600 rounded flex-shrink-0" 
                   ${isSelected ? "checked" : ""} 
                   onchange="toggleSentenceSelection(${index}, this.checked)">
            <button onclick="playAudio('${sentence["音檔"]}', this.querySelector('.material-icons'))" class="text-gray-500 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                <span class="material-icons text-lg">volume_up</span>
            </button>
            <span class="text-sm text-gray-500 font-mono flex-shrink-0">${index + 1}</span>
            <div class="flex-1 min-w-0 flex items-baseline gap-4">
                <span class="hakka-text  text-blue-800 flex-shrink-0" style="font-size: ${userSettings.fontSize}px">${sentence["客語"]}</span>
                <span class="pinyin-text text-gray-600 truncate" style="font-size: ${Math.floor(userSettings.fontSize * 0.8)}px">${sentence["拼音"]}</span>
                <span class="chinese-text text-gray-800 truncate" style="font-size: ${Math.floor(userSettings.fontSize * 0.9)}px">${sentence["華語"]}</span>
            </div>
            <button onclick="toggleStar(${index})" class="learning-star-btn ml-2" title="標示星號">
                <span class="material-icons ${isStarred ? 'text-yellow-400' : 'text-gray-400'}">${starIcon}</span>
            </button>
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
                <div class="flex items-center gap-2">
                    <input type="checkbox" class="sentence-checkbox w-4 h-4 text-blue-600 rounded" 
                           ${isSelected ? "checked" : ""} 
                           onchange="toggleSentenceSelection(${index}, this.checked)">
                    <button onclick="toggleStar(${index})" class="learning-star-btn" title="標示星號">
                        <span class="material-icons ${isStarred ? 'text-yellow-400' : 'text-gray-400'}">${starIcon}</span>
                    </button>
                </div>
            </div>
            <div class="space-y-3">
                <div class="hakka-text text-blue-800 line-spacing-tight" 
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
                <button id="starCard" class="control-btn !p-2" title="設為星號 (S)">
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
                <div id="hakkaText" class="hakka-text font-bold text-purple-800 cursor-pointer" style="font-size: ${userSettings.flashcardFontSize}px"></div>
                <div id="pinyinText" class="pinyin-text text-gray-600 cursor-pointer" style="font-size: ${Math.floor(userSettings.flashcardFontSize * 0.8)}px"></div>
                <div id="chineseText" class="chinese-text text-gray-800 cursor-pointer" style="font-size: ${Math.floor(userSettings.flashcardFontSize * 0.9)}px"></div>
            </div>

            <button id="goToFirstCard" class="card-nav-btn left-4" title="跳至首張 (Home)">
                <span class="material-icons">first_page</span>
            </button>
            <button id="goToLastCard" class="card-nav-btn right-4" title="跳至末張 (End)">
                <span class="material-icons">last_page</span>
            </button>
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
                <button id="repeatBtn" class="control-btn hidden" title="循環播放">
                    <span class="material-icons">repeat</span>
                </button>
            </div>

            <div class="flex items-center gap-4">
                <button id="prevCard" class="control-btn" title="上一張 (←)"><span class="material-icons">skip_previous</span></button>
                <button id="playCardAudio" class="control-btn-main" title="播放 (Space)"><span class="material-icons">volume_up</span></button>
                <button id="nextCard" class="control-btn" title="下一張 (→)"><span class="material-icons">skip_next</span></button>
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
    // 禁用所有按鈕
    const controls = ['prevCard', 'nextCard', 'playCardAudio', 'starCard', 'shuffleCards', 'autoPlayBtn', 'filterCardsBtn', 'goToFirstCard', 'goToLastCard', 'repeatBtn'];
    controls.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = true;
    });
    return;
  } else {
    // 啟用按鈕 (除了 repeatBtn，它由 autoplay 控制)
    const controls = ['prevCard', 'nextCard', 'playCardAudio', 'starCard', 'shuffleCards', 'autoPlayBtn', 'filterCardsBtn', 'goToFirstCard', 'goToLastCard'];
    controls.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = false;
    });
  }

  const sentence = flashcardSentences[currentCardIndex];
  const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
  
  const hakkaTextEl = document.getElementById("hakkaText");
  const pinyinTextEl = document.getElementById("pinyinText");
  const chineseTextEl = document.getElementById("chineseText");

  hakkaTextEl.textContent = sentence["客語"];
  pinyinTextEl.textContent = sentence["拼音"];
  chineseTextEl.textContent = sentence["華語"];
  document.getElementById("cardCounter").textContent = `${currentCardIndex + 1} / ${flashcardSentences.length}`;

  // 根據模糊狀態來切換 class
  hakkaTextEl.classList.toggle('blur-text', flashcardBlurStates.hakka);
  pinyinTextEl.classList.toggle('blur-text', flashcardBlurStates.pinyin);
  chineseTextEl.classList.toggle('blur-text', flashcardBlurStates.chinese);


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
  
  const isAtFirst = currentCardIndex === 0;
  const isAtLast = currentCardIndex === flashcardSentences.length - 1;

  document.getElementById("prevCard").disabled = isAtFirst;
  document.getElementById("nextCard").disabled = isAtLast;
  
  // 新增：更新卡片內部導航按鈕的禁用狀態
  document.getElementById("goToFirstCard").disabled = isAtFirst;
  document.getElementById("goToLastCard").disabled = isAtLast;

  hakkaTextEl.style.fontSize = userSettings.flashcardFontSize + "px";
  pinyinTextEl.style.fontSize = Math.floor(userSettings.flashcardFontSize * 0.8) + "px";
  chineseTextEl.style.fontSize = Math.floor(userSettings.flashcardFontSize * 0.9) + "px";
}


function setupFlashcardControls() {
    let currentInterval = 3;
    let isAutoplayLooping = false;

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
    
    const repeatButton = document.getElementById("repeatBtn");
    const goToFirstButton = document.getElementById("goToFirstCard");
    const goToLastButton = document.getElementById("goToLastCard");
    
    const autoPlayAudioCheckbox = document.getElementById("flashcardAutoPlayAudio");
    
    // --- 新增：取得句子元素並設定點擊事件 ---
    const hakkaTextEl = document.getElementById("hakkaText");
    const pinyinTextEl = document.getElementById("pinyinText");
    const chineseTextEl = document.getElementById("chineseText");

    if (hakkaTextEl) {
        hakkaTextEl.onclick = () => {
            flashcardBlurStates.hakka = !flashcardBlurStates.hakka;
            hakkaTextEl.classList.toggle('blur-text', flashcardBlurStates.hakka);
        };
    }
    if (pinyinTextEl) {
        pinyinTextEl.onclick = () => {
            flashcardBlurStates.pinyin = !flashcardBlurStates.pinyin;
            pinyinTextEl.classList.toggle('blur-text', flashcardBlurStates.pinyin);
        };
    }
    if (chineseTextEl) {
        chineseTextEl.onclick = () => {
            flashcardBlurStates.chinese = !flashcardBlurStates.chinese;
            chineseTextEl.classList.toggle('blur-text', flashcardBlurStates.chinese);
        };
    }
    // --- 新增結束 ---


    if (autoPlayAudioCheckbox) {
        autoPlayAudioCheckbox.checked = userSettings.flashcardAutoPlayAudio;
        autoPlayAudioCheckbox.onchange = () => {
            userSettings.flashcardAutoPlayAudio = autoPlayAudioCheckbox.checked;
            saveUserSettings();
        };
    }
    
    const popups = [
        { btn: autoPlayButton, menu: autoPlayPopup },
        { btn: filterButton, menu: filterPopup }
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
                    saveStarredCards(); // 新增：儲存變更
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
            autoPlayTimer = null;
            const autoPlayButton = document.getElementById("autoPlayBtn");
            const autoPlayIcon = document.getElementById("autoPlayIcon");
            
            if(autoPlayButton && autoPlayIcon){
                autoPlayIcon.textContent = "play_arrow";
                autoPlayButton.classList.remove("active");
                autoPlayButton.title = "自動播放";
            }
            
            if(repeatButton) {
                repeatButton.classList.add('hidden');
                repeatButton.classList.remove("active");
                isAutoplayLooping = false;
            }
            
            if (currentAudio) {
                currentAudio.pause();
            }
        }
    }
    
    function startAutoPlay() {
        stopAutoPlay(); 

        const autoPlayButton = document.getElementById("autoPlayBtn");
        const autoPlayIcon = document.getElementById("autoPlayIcon");
        autoPlayIcon.textContent = "pause";
        autoPlayButton.classList.add("active");
        autoPlayButton.title = "暫停播放";

        if(repeatButton) {
            repeatButton.classList.remove('hidden');
        }

        autoPlayTimer = true; 
        const intervalBtn = document.querySelector('.auto-interval-btn.bg-gray-200') || document.querySelector('.auto-interval-btn[data-interval="3"]');
        const interval = parseInt(intervalBtn.dataset.interval, 10) * 1000;
        
        const autoPlayLoop = async () => {
            if (!autoPlayTimer) {
                return;
            }

            if (currentCardIndex >= flashcardSentences.length - 1) {
                if (!isAutoplayLooping) {
                    stopAutoPlay();
                    return;
                }
                currentCardIndex = -1; 
            }

            currentCardIndex++;
            updateFlashcard();

            const delayPromise = new Promise(resolve => setTimeout(resolve, interval));
            const audioPromise = userSettings.flashcardAutoPlayAudio 
                ? playCurrentAudio() 
                : Promise.resolve();
            
            await Promise.all([delayPromise, audioPromise]);
            
            autoPlayLoop();
        };

        autoPlayLoop();
    }
    
    if(repeatButton) {
        repeatButton.onclick = () => {
            isAutoplayLooping = !isAutoplayLooping;
            if (isAutoplayLooping) {
                repeatButton.classList.add("active");
                repeatButton.title = "取消循環";
            } else {
                repeatButton.classList.remove("active");
                repeatButton.title = "循環播放";
            }
        };
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
        saveStarredCards(); // 新增：儲存變更
        updateFlashcard();
        updateFilterPopup();
    };
    
    if (goToFirstButton) {
      goToFirstButton.onclick = () => {
        if (currentCardIndex !== 0) {
          stopAutoPlay();
          currentCardIndex = 0;
          updateFlashcard();
        }
      };
    }
    if (goToLastButton) {
      goToLastButton.onclick = () => {
        if (currentCardIndex !== flashcardSentences.length - 1) {
          stopAutoPlay();
          currentCardIndex = flashcardSentences.length - 1;
          updateFlashcard();
        }
      };
    }

    if (flashcardKeyHandler) { document.removeEventListener('keydown', flashcardKeyHandler); }
    flashcardKeyHandler = (event) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
      const key = event.key.toLowerCase();
      switch(key) {
          case ' ': event.preventDefault(); playAudioButton.click(); break;
          case 'arrowright': case 'arrowdown': event.preventDefault(); if (!nextButton.disabled) nextButton.click(); break;
          case 'arrowleft': case 'arrowup': event.preventDefault(); if (!prevButton.disabled) prevButton.click(); break;
          case 'home':
          case 'h':
            event.preventDefault();
            if (goToFirstButton) goToFirstButton.click();
            break;
          case 'end':
          case 'e':
            event.preventDefault();
            if (goToLastButton) goToLastButton.click();
            break;
          case 's':
            event.preventDefault();
            if (starButton) starButton.click();
            break;
      }
    };
    document.addEventListener('keydown', flashcardKeyHandler);
    
    updateFilterPopup();
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

let flashcardPracticeMode = "all"

function setupFlashcardView() {
  currentCardIndex = 0
  flashcardPracticeMode = "all" // 每次進入都重設為 "練習全部"
  updateFlashcardSentences()
  updateFlashcard()
  setupFlashcardControls()
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

                <div class="mode-toolbar flex items-center justify-between flex-wrap gap-x-4 gap-y-3 p-4 md:p-5 border-b border-gray-200">
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
                                <option value="7">7組</option>
                                <option value="8">8組</option>
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
        </div>
    `;
  setupMatchingGame();
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
  
  // 遊戲開始時，移除禁用 class
  document.getElementById("matchingArea").classList.remove("game-area-disabled");

  button.innerHTML = `<span class="material-icons">close</span>`;
  button.title = "停止遊戲";
  button.className = "bg-gray-500 hover:bg-gray-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-colors";
  button.onclick = stopMatchingGame;

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

  // 如果是限時模式，完成一關就直接產生新題目繼續玩
  if (condition.startsWith("time")) {
    matchingGameState.matchedPairs = []; // 重置已配對計數
    generateMatchingData(); // 產生下一關的題目
    return; // 結束函數，不執行後面的結束邏輯
  }

  // 「不限時間」模式的邏輯
  if (condition === "unlimited") {
    matchingGameState.currentRound++;
    matchingGameState.matchedPairs = [];
    document.getElementById("matchingRound").textContent = matchingGameState.currentRound;
    generateMatchingData();
    return;
  }

  // 「n 關」模式的邏輯
  if (condition.startsWith("round")) {
    if (matchingGameState.currentRound < matchingGameState.totalRounds) {
      // 進入下一關
      matchingGameState.currentRound++;
      matchingGameState.matchedPairs = [];
      document.getElementById("matchingRound").textContent = matchingGameState.currentRound;
      
      const progress = ((matchingGameState.currentRound - 1) / matchingGameState.totalRounds) * 100;
      const timerBar = document.getElementById("matchingTimerBar");
      if (timerBar) {
        timerBar.style.width = progress + "%";
      }

      generateMatchingData();
    } else {
      // 完成所有關卡
      const totalTime = Math.floor((Date.now() - matchingGameState.startTime) / 1000);
      endMatchingGame(`恭喜完成 ${matchingGameState.totalRounds} 關！\n總用時：${totalTime} 秒`, totalTime);
    }
  }
}

function endMatchingGame(message, finalTime = null) {
  matchingGameState.isPlaying = false;
  const button = document.getElementById("startMatching");
  const optionsContainer = document.getElementById("matchingOptions");
  
  // 遊戲結束時，新增禁用 class
  document.getElementById("matchingArea").classList.add("game-area-disabled");

  if (matchingGameState.timerInterval) {
    clearInterval(matchingGameState.timerInterval);
  }
  
  if (button) {
    button.innerHTML = "重新開始";
    button.title = "重新開始";
    button.className = "bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-semibold transition-colors text-base";
    button.onclick = restartMatchingGame; 
  }

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
                
                <div class="mode-toolbar flex items-center justify-between flex-wrap gap-x-4 gap-y-3 p-4 md:p-5 border-b border-gray-200">
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
						<div id="quizTimer" class="text-lg font-mono text-gray-700 min-w-[5rem]"></div>
                    </div>

                    <div class="flex items-center gap-x-3 gap-y-2 flex-wrap justify-end">
                        <div class="flex items-center gap-1">
                            <label for="autoPlayAudio" class="flex items-center gap-1 p-1.5 rounded-md hover:bg-gray-100 cursor-pointer" title="自動播放題目音效">
                                <input type="checkbox" id="autoPlayAudio" class="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300">
                                <span class="material-icons text-gray-600 !text-xl align-middle">volume_up</span>
                            </label>
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
  if (!userSettings.quizLayout || !['horizontal', 'vertical', 'flow'].includes(userSettings.quizLayout)) {
      userSettings.quizLayout = isMobile ? 'vertical' : 'horizontal';
  }
  quizLayout = userSettings.quizLayout;

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
  
  function updateLayoutButton() {
    switch (quizLayout) {
      case 'horizontal':
        layoutIcon.textContent = 'view_agenda';
        layoutToggleButton.title = '切換為垂直列表';
        break;
      case 'vertical':
        layoutIcon.textContent = 'wrap_text';
        layoutToggleButton.title = '切換為置中排列';
        break;
      case 'flow':
        layoutIcon.textContent = 'view_column';
        layoutToggleButton.title = '切換為左右平分';
        break;
    }
  }
  
  updateLayoutButton();

  layoutToggleButton.onclick = () => {
    const layouts = ['horizontal', 'vertical', 'flow'];
    const currentIndex = layouts.indexOf(quizLayout);
    quizLayout = layouts[(currentIndex + 1) % layouts.length];
    
    userSettings.quizLayout = quizLayout;
    saveUserSettings();
    updateLayoutButton();

    if (quizGameState.isPlaying) {
      renderQuizQuestion();
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
  
  // 遊戲開始時，移除禁用 class
  document.getElementById("quizArea").classList.remove("game-area-disabled");

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
  const quizArea = document.getElementById("quizArea");
  const questionNumber = quizGameState.total + 1;
  
  let optionsHtml = '';
  let containerClass = '';

  switch (quizLayout) {
    case 'horizontal':
      containerClass = 'quiz-horizontal grid grid-cols-2 gap-4';
      optionsHtml = quizGameState.options.map((option, index) => `
        <button class="quiz-option bg-white rounded-lg text-left hover:shadow-md transition-all" 
                style="font-size: ${userSettings.fontSize}px"
                onclick="selectQuizOption('${option.replace(/'/g, "\\'")}', this)">
            ${String.fromCharCode(65 + index)}. ${option}
        </button>
      `).join("");
      break;

    case 'vertical':
      containerClass = 'quiz-vertical space-y-3';
      optionsHtml = quizGameState.options.map((option, index) => `
        <button class="quiz-option bg-white rounded-lg text-left hover:shadow-md transition-all" 
                style="font-size: ${userSettings.fontSize}px"
                onclick="selectQuizOption('${option.replace(/'/g, "\\'")}', this)">
            ${String.fromCharCode(65 + index)}. ${option}
        </button>
      `).join("");
      break;

    case 'flow':
      containerClass = 'flex flex-wrap justify-center gap-3';
      optionsHtml = quizGameState.options.map(option => `
        <button class="quiz-option bg-white rounded-lg px-4 py-2 text-center hover:shadow-md transition-all" 
                style="font-size: ${userSettings.fontSize}px"
                onclick="selectQuizOption('${option.replace(/'/g, "\\'")}', this)">
            ${option}
        </button>
      `).join("");
      break;
  }

  quizArea.innerHTML = `
    <div class="text-center mb-8">
        <div class="flex items-center justify-center gap-4 mb-6">
            <button onclick="playAudio('${quizGameState.questions[quizGameState.currentIndex]["音檔"]}', this.querySelector('.material-icons'))" 
                    class="text-gray-800 hover:bg-gray-100 p-2 rounded transition-colors">
                <span class="material-icons">volume_up</span>
            </button>
            <div id="quizQuestion" class="text-2xl text-red-800 cursor-pointer" style="font-size: ${userSettings.fontSize + 4}px">
                <span class="question-number">${questionNumber}. </span><span class="question-text">${quizGameState.currentQuestion}</span>
            </div>
        </div>
    </div>
    
    <div class="${containerClass}">
        ${optionsHtml}
    </div>
  `;

  const questionContainer = document.getElementById('quizQuestion');
  const questionTextEl = questionContainer?.querySelector('.question-text');

  if (questionContainer && questionTextEl) {
      questionTextEl.classList.toggle('blur-text', quizIsBlurred);

      questionContainer.onclick = () => {
          quizIsBlurred = !quizIsBlurred; 
          questionTextEl.classList.toggle('blur-text', quizIsBlurred);
      };
  }
}

function selectQuizOption(selectedAnswer, element) {
  if (quizGameState.isAnswered) return;

  quizGameState.isAnswered = true;
  quizGameState.total++;

  const isCorrect = selectedAnswer.trim() === quizGameState.correctAnswer.trim();

  document.querySelectorAll(".quiz-option").forEach((option) => {
    option.classList.add("quiz-answered");
    
    // 【修改】使用更穩健的方式來獲取選項的純文字內容，以進行比對
    let rawOptionText = option.textContent.trim();
    if (rawOptionText.match(/^[A-H]\.\s/)) { // 處理 "A. " 或 "B. " 這種前綴
        rawOptionText = rawOptionText.substring(3).trim();
    }

    if (rawOptionText === quizGameState.correctAnswer) {
      option.classList.add("quiz-correct");
      // 當使用者答對時，在正確的選項上觸發慶祝特效
      if (isCorrect) {
        showCelebration(option);
      }
    } else if (option === element && !isCorrect) {
      option.classList.add("quiz-incorrect");
    }
  });

  if (isCorrect) {
    quizGameState.correct++;
    document.getElementById("quizCorrect").textContent = quizGameState.correct;
  } else {
    quizGameState.incorrect++;
    document.getElementById("quizIncorrect").textContent = quizGameState.incorrect;
  }

  const condition = document.getElementById("quizCondition").value;
  if (condition.startsWith("correct")) {
    const target = Number.parseInt(condition.replace("correct", ""));
    if (quizGameState.correct >= target) {
      setTimeout(() => endQuizGame(`恭喜達成目標！\n答對 ${target} 題`), 1500);
      return;
    }
  }

  setTimeout(() => {
    quizGameState.currentIndex++;
    generateQuizQuestion();
  }, 1500);
}

function endQuizGame(message) {
  quizGameState.isPlaying = false;
  const button = document.getElementById("startQuiz");
  const optionsContainer = document.getElementById("quizOptionsContainer");
  
  // 遊戲結束時，新增禁用 class
  document.getElementById("quizArea").classList.add("game-area-disabled");

  if (quizGameState.timerInterval) {
    clearInterval(quizGameState.timerInterval);
  }
  
  if (button) {
    button.innerHTML = "重新開始";
    button.title = "重新開始";
    button.className = "bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors text-base";
    button.onclick = restartQuizGame;
  }

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
  const button = document.getElementById("startSorting");
  const optionsContainer = document.getElementById("sortingOptions");

  // 遊戲結束時，新增禁用 class
  document.getElementById("sortingArea").classList.add("game-area-disabled");

  if (sortingGameState.timerInterval) {
    clearInterval(sortingGameState.timerInterval);
  }

  if(button) {
      button.innerHTML = "重新開始";
      button.title = "重新開始";
      button.className = "bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors text-base";
      button.onclick = restartSortingGame;
  }

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

                <div class="mode-toolbar flex items-center justify-between flex-wrap gap-x-4 gap-y-3 p-4 md:p-5 border-b border-gray-200">
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
                        <div id="sortingTimer" class="text-lg font-mono text-gray-700 min-w-[5rem]"></div>
                    </div>

                    <div class="flex items-center gap-x-3 gap-y-2 flex-wrap justify-end">
                        <div class="flex items-center gap-1">
                            <label for="sortingPlaySound" class="flex items-center gap-1 p-1.5 rounded-md hover:bg-gray-100 cursor-pointer" title="自動播放題目音效">
                                <input type="checkbox" id="sortingPlaySound" class="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" checked>
                                <span class="material-icons text-gray-600 !text-xl align-middle">volume_up</span>
                            </label>
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
  sortingGameState.total = 0;
  sortingGameState.sentences = sentences
  sortingGameState.usedSentences = []
  sortingGameState.availableSentences = [...sentences].sort(() => Math.random() - 0.5)

  // 遊戲開始時，移除禁用 class
  document.getElementById("sortingArea").classList.remove("game-area-disabled");

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

  if (condition.startsWith("time")) {
    const timeLimit = Number.parseInt(condition.replace("time", ""))
    sortingGameState.timeLeft = timeLimit
    startSortingTimer()
  } else {
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
  const sortingArea = document.getElementById("sortingArea");
  const canCheck = sortingGameState.userOrder.length === sortingGameState.originalWords.length;
  const questionNumber = sortingGameState.total;

  sortingArea.innerHTML = `
        <div class="text-center mb-8">
            <div class="flex items-center justify-center gap-4 mb-6">
                <button onclick="playAudio('${sortingGameState.currentSentence["音檔"]}', this.querySelector('.material-icons'))" 
                        class="text-gray-800 hover:bg-gray-100 p-2 rounded transition-colors">
                    <span class="material-icons">volume_up</span>
                </button>
                <div id="sortingQuestion" class="text-2xl font-bold text-indigo-800 cursor-pointer" style="font-size: ${userSettings.fontSize + 4}px">
                    <span class="question-number">${questionNumber}. </span><span class="question-text">${sortingGameState.questionText}</span>
                </div>
            </div>
            
            <div class="bg-gray-100 rounded-lg p-4 mb-6 min-h-16">
                <div id="sortingTarget" class="flex gap-2 flex-wrap justify-center min-h-12">
                    ${sortingGameState.userOrder
                      .map((word, index) => {
                        const isFixed = index < sortingGameState.fixedWords.length;
                        return `
                            <div class="sorting-word ${isFixed ? "bg-green-600 cursor-not-allowed" : "bg-indigo-500 cursor-pointer"} text-white px-4 py-2 rounded-lg" 
                                 style="font-size: ${userSettings.fontSize}px"
                                 ${!isFixed ? `onclick="removeFromTarget(${index})"` : ""}>
                                ${word}
                            </div>
                        `;
                      })
                      .join("")}
                    ${sortingGameState.userOrder.length === sortingGameState.fixedWords.length ? '<div class="invisible-placeholder px-4 py-2">　</div>' : ""}
                </div>
            </div>
            
            <div id="sortingWordBankContainer" class="flex gap-3 flex-wrap justify-center mb-6 min-h-16">
                <div class="min-h-12 flex gap-3 flex-wrap justify-center">
                    ${sortingGameState.shuffledWords
                      .map(
                        (word, index) => `
                        <div class="sorting-word bg-white border-2 border-gray-300 px-4 py-2 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors" 
                             style="font-size: ${userSettings.fontSize}px"
                             onclick="addToTarget('${word.replace(/'/g, "\\'")}', ${index})">
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
                    檢查
                </button>
            </div>
        </div>
    `;

    const questionContainer = document.getElementById('sortingQuestion');
    const questionTextEl = questionContainer?.querySelector('.question-text');

    if (questionContainer && questionTextEl) {
        questionTextEl.classList.toggle('blur-text', sortingIsBlurred);

        questionContainer.onclick = () => {
            sortingIsBlurred = !sortingIsBlurred;
            questionTextEl.classList.toggle('blur-text', sortingIsBlurred);
        };
    }
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
    showResult("⚠️", "提醒", "請完成排列");
    return;
  }

  const userAnswer = sortingGameState.userOrder.join("");
  const correctAnswer = sortingGameState.originalWords.join("");

  if (userAnswer === correctAnswer) {
    // --- 答案正確的處理邏輯 ---
    sortingGameState.correct++;
    sortingGameState.score += 100;

    document.getElementById("sortingCorrect").textContent = sortingGameState.correct;
    document.getElementById("sortingScore").textContent = sortingGameState.score;

    const targetDiv = document.getElementById("sortingTarget");
    showCelebration(targetDiv);

    // 禁用檢查按鈕
    document.querySelector('#sortingArea button[onclick="checkSortingAnswer()"]').disabled = true;

    // 將使用者排好的答案變為綠色
    targetDiv.querySelectorAll('.sorting-word').forEach(wordEl => {
        wordEl.classList.remove('bg-indigo-500', 'cursor-pointer');
        wordEl.classList.add('bg-green-600', 'cursor-default');
        wordEl.onclick = null;
    });

    const wordBankContainer = document.getElementById('sortingWordBankContainer');
    const sentence = sortingGameState.currentSentence;
    const type = document.getElementById("sortingType").value;
    let revealedText = '';

    if (type.includes('hakka') && type.includes('pinyin')) {
        revealedText = sentence['華語'];
    } else if (type.includes('chinese') && type.includes('pinyin')) {
        revealedText = sentence['客語'];
    } else if (type.includes('chinese') && type.includes('hakka')) {
        revealedText = sentence['拼音'];
    }

    if (revealedText && wordBankContainer) {
        wordBankContainer.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-center transition-all duration-300 w-full animate-pulse">
                <p class="text-green-900 mt-1" style="font-size: ${userSettings.fontSize + 2}px">${revealedText}</p>
            </div>
        `;
    }

    // 檢查是否達成過關條件
    const condition = document.getElementById("sortingCondition").value;
    if (condition.startsWith("correct")) {
      const target = Number.parseInt(condition.replace("correct", ""));
      if (sortingGameState.correct >= target) {
        setTimeout(() => endSortingGame(`恭喜完成目標！\n答對 ${target} 題`), 2500);
        return;
      }
    }

    // 延遲 2.5 秒後進入下一題
    setTimeout(() => {
      generateSortingQuestion();
    }, 2500);

  } else {
    // --- 答案錯誤的處理邏輯 (維持不變) ---
    sortingGameState.incorrect++;
    sortingGameState.score = Math.max(0, sortingGameState.score - 20);

    document.getElementById("sortingIncorrect").textContent = sortingGameState.incorrect;
    document.getElementById("sortingScore").textContent = sortingGameState.score;

    let correctCount = sortingGameState.fixedWords.length;
    for (let i = sortingGameState.fixedWords.length; i < sortingGameState.userOrder.length; i++) {
      if (sortingGameState.userOrder[i] === sortingGameState.originalWords[i]) {
        correctCount++;
      } else {
        break;
      }
    }

    const correctPart = sortingGameState.userOrder.slice(0, correctCount);
    const wrongPart = sortingGameState.userOrder.slice(correctCount);

    sortingGameState.userOrder = correctPart;
    sortingGameState.shuffledWords.push(...wrongPart);

    renderSortingQuestion();
  }
}


// 顯示結果視窗
function showResult(icon, title, message) {
  document.getElementById("resultIcon").textContent = icon
  document.getElementById("resultTitle").textContent = title
  document.getElementById("resultMessage").textContent = message
  document.getElementById("resultModal").classList.remove("hidden")
}


function setStickyTopPosition() {
    const header = document.querySelector('#mainMenu > header');
    const tabBar = document.getElementById('tabBarStrip');
    if (header && tabBar) {
        const headerHeight = header.offsetHeight;
        tabBar.style.top = `${headerHeight}px`;
    }
}

// 設置事件監聽器
function setupEventListeners() {
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
  const searchOverlay = document.getElementById("searchOverlay");

	// 處理即時拼音轉換的函數
	const handleRealtimeTransform = (e) => {
		const input = e.target;
		const originalValue = input.value;
		const cursorPosition = input.selectionStart;
		const transformedValue = transformHakkaQuery(originalValue);

		if (originalValue !== transformedValue) {
			// 【修改】計算轉換前後的長度差
			const lengthDifference = transformedValue.length - originalValue.length;
			const newCursorPosition = cursorPosition + lengthDifference;

			input.value = transformedValue;
			
			// 【修改】恢復游標位置，並根據長度變化進行調整
			input.setSelectionRange(newCursorPosition, newCursorPosition);
		}
		
		// 觸發搜尋
		handleSearchInput(e);
	};

  // 將統一的處理函數綁定到電腦版和手機版兩個輸入框
  searchInput.addEventListener("input", handleRealtimeTransform);
  mobileSearchInput.addEventListener("input", handleRealtimeTransform);

  // 手機版搜尋 UI 優化
  searchToggle.onclick = () => {
    mainTitle.classList.add("hidden");
    viewToggle.classList.add("hidden");
    searchToggle.classList.add("hidden");
    
    mobileSearchBox.classList.remove("hidden");
    searchOverlay.classList.remove("hidden");
    mobileSearchInput.focus();
  };

  closeMobileSearch.onclick = () => {
    mainTitle.classList.remove("hidden");
    viewToggle.classList.remove("hidden");
    searchToggle.classList.remove("hidden");

    mobileSearchBox.classList.add("hidden");
    searchOverlay.classList.add("hidden");
    mobileSearchInput.value = "";
    searchResults.classList.add("hidden");
  };

  searchOverlay.onclick = () => {
    closeMobileSearch.click();
  };

  // 桌面版清除按鈕的點擊事件
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchResults.classList.add('hidden');
    clearSearchBtn.classList.add('hidden');
    searchInput.focus();
    handleSearchInput({ target: searchInput }); // 清除後重新觸發搜尋
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

    // 處理「更多頁籤」按鈕的點擊事件
    const moreTabsButton = document.getElementById("moreTabsButton");
    const moreTabsDropdown = document.getElementById("moreTabsDropdown");
    if (moreTabsButton && moreTabsDropdown) {
        moreTabsButton.addEventListener("click", (e) => {
            e.stopPropagation();
            moreTabsDropdown.classList.toggle("hidden");
        });
    }

    // 點擊頁面其他地方時，關閉下拉選單
    document.addEventListener("click", () => {
        if (moreTabsDropdown && !moreTabsDropdown.classList.contains("hidden")) {
            moreTabsDropdown.classList.add("hidden");
        }
    });

    // 當視窗大小改變時，重新計算頁籤是否溢出
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            renderCatalogTabs();
        }, 150);
    });

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
      const settingsKey = `${STORAGE_PREFIX}settings_${currentUser.id}`;
      const starredKey = `kasuStarred_${currentUser.id}`; // 新增：星號紀錄的 key
      localStorage.removeItem(settingsKey);
      localStorage.removeItem(starredKey); // 新增：移除星號紀錄
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

  // --- 【修改點】 ---
  // 首頁按鈕點擊
  document.getElementById("goHome").onclick = () => {
    stopAllTimers()
    // --- 修改：增加對 "星號" 分類的清理 ---
    Object.keys(categories).forEach((key) => {
      if (key.startsWith("已選取的") || key === "星號") {
        delete categories[key];
      }
    })
    document.getElementById("categoryDetail").classList.add("hidden")
    document.getElementById("mainMenu").classList.remove("hidden")
    
    // 【新增】重新渲染頁籤以解決溢位問題
    renderCatalogTabs();
    // 【新增，解決問題2】重新渲染分類列表，這樣才會根據最新的星號狀態，決定是否顯示「星號」卡片
    renderCategoryList();
    // 【新增，解決問題1】重新計算並設定頁籤工具列的黏貼(sticky)位置
    setStickyTopPosition();
    // 【新增】返回時將頁面捲動到最頂端
    window.scrollTo(0, 0);
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

	setStickyTopPosition();
	window.addEventListener('resize', setStickyTopPosition);
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
