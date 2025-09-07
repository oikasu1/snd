// =================================================================
// 全域設定 (Global Configuration)
// =================================================================
const config = {
    // Local Storage 的獨特前綴，避免與其他應用程式衝突
    STORAGE_PREFIX: "hakkaLearningApp_v3_",

    // 清除學習記錄時需要輸入的密碼
    CLEAR_DATA_PASSWORD: "kasu",

    // 慶祝動畫中隨機顯示的表情符號
    CELEBRATION_EMOJIS: ["🌈", "🌟", "🎊", "🎉", "✨", "💖", "😍", "🥰"],

    // 新使用者的預設設定
    DEFAULT_USER_SETTINGS: {
        fontSize: 20,
        flashcardFontSize: 24,
        lineSpacing: "loose",
        layout: "double",
        viewMode: "card",
        matchingLayout: '1col',
        quizLayout: 'horizontal', // 將在初次載入時根據螢幕寬度動態調整
        flashcardAutoPlayAudio: true,
        matchingColumns: 2, // 配對遊戲在電腦版的預設欄數
        pinyinAnnotation: false,
        phoneticSystem: 'pinyin',
		playPinyinOnClick: false
    },

    // 不同模式下的字體大小級距
    FONT_SIZES: {
        learning: [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40],
        flashcard: [24, 28, 32, 36, 40, 44, 48, 52, 56, 60]
    },

    // 音檔存放的基礎路徑
    AUDIO_BASE_PATH: "https://oikasu1.github.io/snd/oikasu/",
};
// =================================================================


// 全域變數
let sentences = []
let categories = {}
let orderedCategories = [];
let currentUser = {
    id: "guest",
    name: "訪客",
    avatar: "U"
}
let currentCategory = ""
let currentViewMode = "card"
let selectedCategories = new Set()
const selectedSentences = new Set()
let gameTimer = null
const gameStats = {
    correct: 0,
    total: 0,
    score: 0,
    steps: 0
}
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
let flashcardBlurStates = {
    hakka: false,
    pinyin: false,
    chinese: false
};
let quizIsBlurred = false;
let sortingIsBlurred = false;
let catalog = {};
let currentCatalogTab = "";
let isMultiSelectMode = false;
let isLearningSelectMode = false;
let lastVisitedTab = "";
let collectedCategories = new Set();



/**
 * 解析 URL 中的 no 參數字串 (例如 "1-3,8") 為數字陣列 [1, 2, 3, 8]
 * @param {string} noString - 從 URL 獲取的 no 參數值
 * @returns {number[]|null} 解析後的數字陣列，若格式錯誤則返回 null
 */
function parseCategoryNumbers(noString) {
    const numbers = new Set();
    if (!noString) return [];

    const parts = noString.split(',');
    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= end; i++) {
                    numbers.add(i);
                }
            } else {
                return null; // 範圍格式錯誤
            }
        } else {
            const num = Number(part);
            if (!isNaN(num)) {
                numbers.add(num);
            } else {
                return null; // 數字格式錯誤
            }
        }
    }
    return Array.from(numbers);
}




/**
 * 將排序過的數字陣列壓縮成範圍字串 (例如 [1,2,3,5] -> "1-3,5")
 * @param {number[]} numbers - 經過排序的數字陣列
 * @returns {string} 壓縮後的字串
 */
function compressNumberArray(numbers) {
    if (numbers.length === 0) {
        return "";
    }

    const ranges = [];
    let start = numbers[0];
    let end = numbers[0];

    for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] === end + 1) {
            end = numbers[i];
        } else {
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            start = numbers[i];
            end = numbers[i];
        }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);

    return ranges.join(',');
}


/**
 * 根據當前模式和選取的分類，更新瀏覽器 URL
 * @param {string} mode - 當前模式 (例如 'learning', 'matching')
 * @param {string[]} categoryNames - 選取的分類名稱陣列
 */
function updateUrl(mode, categoryNames) {
    if (!history.pushState) {
        return;
    }

    const reverseModeMap = {
        'learning': 'l', //學習
        'matching': 'm', //配對
        'quiz': 'q', //測驗
        'sorting': 's', //排序
        'flashcard': 'f' //閃卡
    };

    const typeParam = reverseModeMap[mode];
    if (!typeParam) return;

    const categoryIndexes = categoryNames
        .map(name => orderedCategories.indexOf(name) + 1)
        .filter(index => index > 0)
        .sort((a, b) => a - b);

    if (categoryIndexes.length === 0) return;

    const noParam = compressNumberArray(categoryIndexes);

    const newUrl = `${window.location.pathname}?type=${typeParam}&no=${noParam}`;
    const newSearchParams = `?type=${typeParam}&no=${noParam}`;

    if (window.location.search !== newSearchParams) {
        history.pushState({
            mode,
            categoryNames
        }, '', newUrl);
    }
}




/**
 * 頁面載入時檢查並處理 URL 參數
 * @returns {boolean} 如果成功處理了 URL 參數則返回 true，否則返回 false
 */
function handleUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type');
    const noParam = params.get('no');

    if (!typeParam || !noParam) {
        return false; // 沒有參數，正常載入頁面
    }

    const modeMap = {
        'l': 'learning', //學習
        'm': 'matching',//配對
        'q': 'quiz',//測驗
        's': 'sorting',//排序
        'f': 'flashcard'//閃卡
    };

    const targetMode = modeMap[typeParam];
    if (!targetMode) {
        console.error("URL 中的 'type' 參數無效。");
        return false; // 模式無效，正常載入
    }

    const categoryIndexes = parseCategoryNumbers(noParam);
    if (categoryIndexes === null || categoryIndexes.length === 0) {
        console.error("URL 中的 'no' 參數格式錯誤。");
        return false; // 編號無效，正常載入
    }

    const categoriesToSelect = [];
    for (const index of categoryIndexes) {
        const categoryName = orderedCategories[index - 1]; // 轉換為 0-based 索引
        if (categoryName) {
            categoriesToSelect.push(categoryName);
        } else {
            console.error(`分類索引 ${index} 超出範圍。`);
            return false; // 索引超出範圍，正常載入
        }
    }

    // --- 參數驗證通過，開始啟動指定模式 ---

    // 1. 設定選取的分類
    selectedCategories.clear();
    categoriesToSelect.forEach(name => selectedCategories.add(name));

    // 2. 【修改處】根據選取的主題數量，決定顯示方式
    if (categoriesToSelect.length === 1) {
        // 如果只有一個主題，直接顯示該主題的詳情頁
        const singleCategoryName = categoriesToSelect[0];
        showCategoryDetail(singleCategoryName);
    } else {
        // 如果有多個主題，才組合句子並顯示 "n主題" 的互動式標題
        const tempCategoryName = `${selectedCategories.size}主題`;
        let combinedSentences = [];
        selectedCategories.forEach(categoryName => {
            if (categories[categoryName]) {
                combinedSentences = combinedSentences.concat(categories[categoryName]);
            }
        });
        categories[tempCategoryName] = combinedSentences;
        showCategoryDetail(tempCategoryName);
    }


    // 3. 切換到 URL 指定的模式
    if (selectedSentences.size === 0 && targetMode !== 'learning') {
        showResult("⚠️", "提醒", "所選主題內沒有可供練習的句子。");
        return true; 
    }

    switch (targetMode) {
        case 'flashcard':
            showFlashcardView();
            updateCurrentMode("閃卡");
            break;
        case 'matching':
            showMatchingGame();
            updateCurrentMode("配對");
            break;
        case 'quiz':
            showQuizGame();
            updateCurrentMode("測驗");
            break;
        case 'sorting':
            showSortingGame();
            updateCurrentMode("排序");
            break;
        default:
            updateCurrentMode("學習");
            break;
    }

    return true; 
}

function startSingleCategoryLearning(categoryName) {
    lastVisitedTab = currentCatalogTab;
    selectedCategories.clear();
    selectedCategories.add(categoryName);
    updateUrl('learning', [categoryName]);
    showCategoryDetail(categoryName);
}




/**
 * 啟用多選模式
 */
function enableMultiSelectMode() {
    isMultiSelectMode = true;
    updateMultiSelectControlsUI();
    renderCategoryList();
}

/**
 * 停用多選模式並清除選取
 */
function disableMultiSelectMode() {
    isMultiSelectMode = false;
    selectedCategories.clear();
    updateSelectionToolbar();
    updateMultiSelectControlsUI();
    renderCategoryList();
}

/**
 * 更新多選模式控制按鈕的 UI
 */
function updateMultiSelectControlsUI() {
    const controlsContainer = document.getElementById("multiSelectControls");
    if (!controlsContainer) return;

    if (isMultiSelectMode) {
        const categoriesInCurrentTab = getCategoriesInCurrentTab();
        const selectedCountInTab = categoriesInCurrentTab.filter(category => selectedCategories.has(category)).length;
        let isChecked = false;
        let isIndeterminate = false;

        if (categoriesInCurrentTab.length > 0) {
            if (selectedCountInTab === categoriesInCurrentTab.length) {
                isChecked = true;
            } else if (selectedCountInTab > 0) {
                isIndeterminate = true;
            }
        }

        controlsContainer.innerHTML = `
            <button onclick="disableMultiSelectMode()" class="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-600" title="關閉多選模式">
                <span class="material-icons text-base">close</span>
            </button>
            <input type="checkbox" id="currentTabSelectAll" class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                   title="${isChecked ? '取消全選' : '全選本頁'}">
        `;
        const checkbox = document.getElementById("currentTabSelectAll");
        checkbox.checked = isChecked;
        checkbox.indeterminate = isIndeterminate;
        checkbox.addEventListener("change", toggleCurrentTabSelection);

    } else {
        controlsContainer.innerHTML = `
            <button onclick="enableMultiSelectMode()" class="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600" title="啟用多選">
                <span class="material-icons text-xl">check_box_outline_blank</span>
            </button>
        `;
    }
}

// 初始化
function init() {
    loadUserData(); 
    parseData();
    parseCatalog(); 

    const defaultTabName = Object.keys(catalog).find(tab => tab !== '收藏') || (Object.keys(catalog).length > 0 ? Object.keys(catalog)[0] : "");

    loadUserSettings();

    currentCatalogTab = defaultTabName;

    const paramsHandled = handleUrlParameters();
    if (paramsHandled) {
        setupEventListeners();
        updateUserDisplay();
        return;
    }

    renderCatalogTabs();
    renderCategoryList();
    setupEventListeners();
    updateUserDisplay();

    document.getElementById("learnSelected").addEventListener("click", startLearning);
}

// 解析分類群組資料
function parseCatalog() {
    catalog = {};
    const lines = myCatalog.trim().split("\n");
    lines.forEach(line => {
        const parts = line.split("\t");
        if (parts.length === 2) {
            const key = parts[0].trim();
            const valueStr = parts[1].trim();

            if (valueStr.startsWith('{')) {
                const chapters = [];
                const regex = /\{([^:]+):([^}]+)\}/g;
                let match;
                while ((match = regex.exec(valueStr)) !== null) {
                    chapters.push({
                        title: match[1].trim(),
                        categories: match[2].split(',').map(item => item.trim()).filter(Boolean)
                    });
                }
                catalog[key] = {
                    type: 'chapters',
                    data: chapters
                };
            } else {
                const categories = valueStr.split(',').map(item => item.trim());
                catalog[key] = {
                    type: 'list',
                    data: categories
                };
            }
        }
    });

    // 【新增】動態建立「收藏」頁籤
    const hasStarred = starredCards.size > 0;
    const hasCollected = collectedCategories.size > 0;

    if (hasStarred || hasCollected) {
        let collectionItems = [];
        if (hasStarred) {
            collectionItems.push("星號");
        }
        if (hasCollected) {
            // 排序確保順序一致
            const sortedCollected = Array.from(collectedCategories).sort();
            collectionItems.push(...sortedCollected);
        }

        const newCatalog = {
            '收藏': {
                type: 'list',
                data: collectionItems
            }
        };
        Object.assign(newCatalog, catalog);
        catalog = newCatalog;
    }
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

    // *** 修改點：根據是否為多選模式，決定點擊行為 ***
    if (isMultiSelectMode) {
        categoryItem.onclick = () => toggleCategorySelection(categoryName);
    } else {
        if (isStarredCategory) {
            categoryItem.onclick = () => showStarredCategory();
        } else {
            // 將單引號轉義，以避免 HTML 屬性錯誤
            const safeCategoryName = categoryName.replace(/'/g, "\\'");
            categoryItem.onclick = () => startSingleCategoryLearning(safeCategoryName);
        }
    }

    // 根據檢視模式設定不同的 class
    if (currentViewMode === "card") {
        categoryItem.className = `category-card bg-white rounded-xl shadow-sm cursor-pointer hover:shadow-md ${isSelected && isMultiSelectMode ? "checkbox-selected selected-border" : ""}`;
        categoryItem.innerHTML = `
            <div class="p-2">
                <div class="flex items-center space-x-2">
                    <div class="text-4xl">${emoji}</div>
                    <div>
                        <h3 class="text-lg text-gray-800">${categoryName}</h3>
                        <p class="text-sm text-gray-500 hidden sm:block">${cardCount} 句</p>
                    </div>
                </div>
            </div>
            ${isMultiSelectMode ? `
            <div class="selection-indicator !left-3 !top-3">
                <span class="material-icons text-base">${isSelected ? 'check' : 'radio_button_unchecked'}</span>
            </div>` : ''}
        `;
    } else {
        categoryItem.className = `category-card p-3 flex items-center justify-between space-x-4 cursor-pointer border-b border-gray-200 last:border-b-0 hover:bg-gray-50 hover:transform-none hover:shadow-none ${isSelected && isMultiSelectMode ? "checkbox-selected" : ""}`;
        categoryItem.innerHTML = `
            ${isMultiSelectMode ? `
            <div class="selection-indicator !left-3 !top-1/2 !-translate-y-1/2">
                <span class="material-icons text-base">${isSelected ? 'check' : 'radio_button_unchecked'}</span>
            </div>` : ''}
            <div class="${isMultiSelectMode ? 'pl-8' : ''} flex items-center space-x-4">
                <span class="text-2xl">${emoji}</span>
                <h3 class="text-lg text-gray-800">${categoryName}</h3>
            </div>
            <p class="text-sm text-gray-500 flex-shrink-0">${cardCount} 句</p>
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
    categoryList.className = isMultiSelectMode ? "multi-select-active" : "";

    const currentTabData = catalog[currentCatalogTab];
    if (!currentTabData) return;

    let renderableSections = [];

    // 根據頁籤資料的類型（章節或列表）來準備要渲染的區塊
    if (currentTabData.type === 'chapters') {
        renderableSections.push(...currentTabData.data);
    } else { // type === 'list'
        renderableSections.push({
            title: null, // 列表模式沒有章節標題
            categories: currentTabData.data
        });
    }

    renderableSections.forEach(section => {
        if (section.title) {
            const titleEl = document.createElement("h2");
            titleEl.className = "text-xl font-bold text-gray-700 mt-6 mb-4 px-2";
            titleEl.textContent = section.title;
            categoryList.appendChild(titleEl);
        }

        const container = document.createElement("div");
        container.className = currentViewMode === "card" ?
            "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4" :
            "bg-white rounded-xl shadow-sm border";

        section.categories.forEach(categoryName => {
            const isStarredCategory = categoryName === "星號";
            const cardCount = isStarredCategory ? starredCards.size : (categories[categoryName] ? categories[categoryName].length : 0);

            // 如果分類不存在（除了星號），則不渲染
            if (!isStarredCategory && !categories[categoryName]) return;

            // 如果是星號分類，但沒有任何星號卡，也不渲染
            if (isStarredCategory && cardCount === 0) return;

            const cardElement = createCategoryCardElement(categoryName, cardCount);
            container.appendChild(cardElement);
        });

        if (container.hasChildNodes()) {
            categoryList.appendChild(container);
        }
    });

    updateSelectionToolbar();
    updateMultiSelectControlsUI();
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
    disableMultiSelectMode();
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
    });

    // 排序分類鍵值以確保順序一致性，供給 URL 參數使用
    orderedCategories = Object.keys(categories).sort();
}

function loadUserData() {
    const userData = localStorage.getItem(`${config.STORAGE_PREFIX}user`);
    if (userData) {
        currentUser = JSON.parse(userData)
    }

    // 【新增】載入收藏的分類
    const collectedKey = `${config.STORAGE_PREFIX}collected_${currentUser.id}`;
    const collectedData = localStorage.getItem(collectedKey);
    if (collectedData) {
        collectedCategories = new Set(JSON.parse(collectedData));
    } else {
        collectedCategories = new Set();
    }
}

function saveCollectedCategories() {
    const collectedKey = `${config.STORAGE_PREFIX}collected_${currentUser.id}`;
    localStorage.setItem(collectedKey, JSON.stringify(Array.from(collectedCategories)));
}

function saveUserData() {
    localStorage.setItem(`${config.STORAGE_PREFIX}user`, JSON.stringify(currentUser))
}

// 請替換此函數
function loadUserSettings() {
    const settingsKey = `${config.STORAGE_PREFIX}settings_${currentUser.id}`
    const settings = localStorage.getItem(settingsKey)
    if (settings) {
        userSettings = JSON.parse(settings)
    } else {
        // 從 config 載入預設設定 (使用深拷貝以避免修改原始設定)
        userSettings = JSON.parse(JSON.stringify(config.DEFAULT_USER_SETTINGS));
    }

    if (!userSettings.matchingLayout) {
        userSettings.matchingLayout = '1col';
    }

    if (!userSettings.quizLayout) {
        userSettings.quizLayout = window.innerWidth >= 1024 ? 'horizontal' : 'vertical';
    }

    if (userSettings.flashcardAutoPlayAudio === undefined) {
        userSettings.flashcardAutoPlayAudio = true;
    }

    if (userSettings.flashcardLoop === undefined) {
        userSettings.flashcardLoop = false;
    }

    if (userSettings.pinyinAnnotation === undefined) {
        userSettings.pinyinAnnotation = false;
    }

    // --- 新增開始 ---
    if (userSettings.phoneticSystem === undefined) {
        userSettings.phoneticSystem = 'pinyin';
    }
    // --- 新增結束 ---

    currentViewMode = userSettings.viewMode || "card"

    // 載入選取的分類
    const selectedKey = `${config.STORAGE_PREFIX}selected_${currentUser.id}`
    const selectedData = localStorage.getItem(selectedKey)
    if (selectedData) {
        selectedCategories = new Set(JSON.parse(selectedData))
    }

    // --- 新增：載入星號紀錄 ---
    const starredKey = `${config.STORAGE_PREFIX}starred_${currentUser.id}`;
    const starredData = localStorage.getItem(starredKey);
    if (starredData) {
        starredCards = new Set(JSON.parse(starredData));
    } else {
        starredCards = new Set();
    }
}


function saveSelectedCategories() {
    const selectedKey = `${config.STORAGE_PREFIX}selected_${currentUser.id}`
    localStorage.setItem(selectedKey, JSON.stringify(Array.from(selectedCategories)))
}

function saveUserSettings() {
    const settingsKey = `${config.STORAGE_PREFIX}settings_${currentUser.id}`
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
                        data: {
                            category,
                            index
                        },
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
    const uniqueResults = results.filter((v, i, a) => a.findIndex(t => (JSON.stringify(t.data) === JSON.stringify(v.data))) === i);


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

/**
 * 將選取的卡片加入收藏
 */
function addToCollection() {
    const selectedCount = selectedCategories.size;
    if (selectedCount === 0) return;

    // 【新增】檢查在加入前，「收藏」頁籤是否存在
    const collectionTabExisted = catalog.hasOwnProperty('收藏');

    selectedCategories.forEach(categoryName => {
        collectedCategories.add(categoryName);
    });

    saveCollectedCategories();
    showResult("💖", `收藏 ${selectedCount} 個主題。`);

    parseCatalog();

    if (!collectionTabExisted) {
        renderCatalogTabs();
    }

    disableMultiSelectMode();
}

/**
 * 從收藏中移除選取的卡片
 */
function removeFromCollection() {
    const selectedCount = selectedCategories.size;
    if (selectedCount === 0) return;

    let removedCount = 0;
    selectedCategories.forEach(categoryName => {
        if (categoryName !== "星號") {
            collectedCategories.delete(categoryName);
            removedCount++;
        }
    });

    if (removedCount > 0) {
        saveCollectedCategories();
        showResult("🗑️", `移除 ${removedCount} 個主題。`);
    } else {
        showResult("ℹ️", "提醒", "「星號」為系統預設項目，無法移除。");
    }

    disableMultiSelectMode();

    // 【新增】檢查「收藏」頁籤在移除後是否應被刪除
    const isCollectionNowEmpty = collectedCategories.size === 0 && starredCards.size === 0;

    // 【修改】重新解析目錄，這會移除空的「收藏」頁籤
    parseCatalog();

    if (isCollectionNowEmpty && currentCatalogTab === '收藏') {
        // 【新增】如果收藏已空且當前就在該頁籤，則跳轉到預設頁籤
        const defaultTabName = Object.keys(catalog).find(tab => tab !== '收藏') || (Object.keys(catalog).length > 0 ? Object.keys(catalog)[0] : "");

        if (defaultTabName) {
            selectCatalogTab(defaultTabName); // selectCatalogTab 會自動處理畫面渲染
        } else {
            // 備用：如果沒有其他頁籤，就只渲染空的畫面
            renderCategoryList();
            renderCatalogTabs();
        }
    } else {
        // 【修改】如果收藏未空，或使用者不在收藏頁籤，則正常刷新當前畫面即可
        renderCategoryList();
        renderCatalogTabs();
    }
}

// 開始學習選取的項目
function startLearning() {
  const selectedCount = selectedCategories.size;
  if (selectedCount === 0) {
    showResult("⚠️", "提醒", "請先勾選要學習的主題。");
    return;
  }
  
  lastVisitedTab = currentCatalogTab;

  if (selectedCount === 1) {
    const singleCategoryName = selectedCategories.values().next().value;
    
    if (singleCategoryName === "星號") {
        showStarredCategory();
    } else {
        startSingleCategoryLearning(singleCategoryName);
    }
    return;
  }

  updateUrl('learning', Array.from(selectedCategories));

  let combinedSentences = [];
  const combinedSentenceIds = new Set(); 

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
  
  const tempCategoryName = `${selectedCount}主題`;
  
  // 【修改】使用更通用的方式來清除舊的暫存分類
  Object.keys(categories).forEach(key => {
    if (key.endsWith("主題")) {
      delete categories[key];
    }
  });

  categories[tempCategoryName] = combinedSentences;

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
}


// 更新選取工具條
function updateSelectionToolbar() {
    const learnSelectedButton = document.getElementById("learnSelected");
    const addToCollectionBtn = document.getElementById("addToCollectionBtn");
    const removeFromCollectionBtn = document.getElementById("removeFromCollectionBtn");
    
    // 直接在函數內獲取要修改文字的 span 元素
    const learnSelectedTextSpan = document.getElementById("learnSelectedText");
    const addToCollectionTextSpan = document.getElementById("addToCollectionText");
    const removeFromCollectionTextSpan = document.getElementById("removeFromCollectionText");

    // 加上一道防護，確保所有元素都存在
    if (!learnSelectedButton || !addToCollectionBtn || !removeFromCollectionBtn || !learnSelectedTextSpan || !addToCollectionTextSpan || !removeFromCollectionTextSpan) {
        return; // 如果有任何一個元素找不到，就直接退出，避免錯誤
    }

    const count = selectedCategories.size;

    // 先隱藏所有按鈕
    learnSelectedButton.classList.add("hidden");
    addToCollectionBtn.classList.add("hidden");
    removeFromCollectionBtn.classList.add("hidden");

    if (count > 0 && isMultiSelectMode) {
        // 無論在哪個頁籤，只要有選取，「學習」按鈕都顯示
        learnSelectedTextSpan.textContent = `學習 ${count} 個`;
        learnSelectedButton.classList.remove("hidden");
        learnSelectedButton.disabled = false;
        learnSelectedButton.classList.remove("opacity-50", "cursor-not-allowed");

        // 根據當前頁籤決定顯示「加入」還是「取消」收藏按鈕
        if (currentCatalogTab === '收藏') {
            removeFromCollectionTextSpan.textContent = `移除 ${count} 個`;
            removeFromCollectionBtn.classList.remove("hidden");
        } else {
            addToCollectionTextSpan.textContent = `收藏 ${count} 個`;
            addToCollectionBtn.classList.remove("hidden");
        }
    } else {
        learnSelectedButton.disabled = true;
        learnSelectedButton.classList.add("opacity-50", "cursor-not-allowed");
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
// 請替換此函數
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
  if (categories[category]) {
      categories[category].forEach((_, index) => {
        selectedSentences.add(index)
      })
  }


  document.getElementById("mainMenu").classList.add("hidden")
  document.getElementById("categoryDetail").classList.remove("hidden")

  const categoryTitleContainer = document.getElementById("categoryTitleContainer");
  
  // 【修改】放寬判斷條件，只要以「主題」結尾就渲染互動式標題
  if (category.endsWith("主題")) {
      renderInteractiveTitle(category);
  } else {
      categoryTitleContainer.innerHTML = `<span>${category}</span>`;
  }


  // 預設顯示學習模式並重置選單文字
  showLearningView()
  updateCurrentMode("學習")
  window.scrollTo(0, 0);
}


/**
 * 渲染可互動的標題和下拉選單（用於多選模式）
 * @param {string} initialCategoryName - 初始的分類名稱, e.g., "4 個主題"
 */
function renderInteractiveTitle(initialCategoryName) {
    const container = document.getElementById("categoryTitleContainer");
    if (!container) return;

    // 【新增】解析初始的主題總數
    const initialCount = parseInt(initialCategoryName, 10);

    let dropdownItemsHtml = Array.from(selectedCategories).sort().map(catName => `
        <div class="category-dropdown-item">
            <label>
                <input type="checkbox" class="category-select-checkbox" value="${catName.replace(/"/g, '&quot;')}" checked>
                <span>${catName}</span>
            </label>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="category-dropdown-container">
            <button id="categoryDropdownBtn" class="category-dropdown-button" data-initial-count="${initialCount}">
                <span id="interactiveTitleText">${initialCategoryName}</span>
                <span class="material-icons">expand_more</span>
            </button>
            <div id="categoryDropdownContent" class="category-dropdown-content">
                ${dropdownItemsHtml}
            </div>
        </div>
    `;

    const dropdownBtn = document.getElementById("categoryDropdownBtn");
    const dropdownContent = document.getElementById("categoryDropdownContent");
    const checkboxes = dropdownContent.querySelectorAll('.category-select-checkbox');

    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownContent.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
            dropdownContent.classList.remove('show');
        }
    });

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
             updateCombinedSentencesAndRender();
        });
    });
}



/**
 * 根據下拉選單的勾選狀態，更新句子內容並重新渲染畫面
 */
function updateCombinedSentencesAndRender() {
    const dropdownContent = document.getElementById("categoryDropdownContent");
    if (!dropdownContent) return;

    const checkedBoxes = dropdownContent.querySelectorAll('.category-select-checkbox:checked');
    
    if (checkedBoxes.length === 0) {
        showResult("⚠️", "提醒", "至少需要保留一個主題。");
        const lastChangedCheckbox = event.target; 
        if(lastChangedCheckbox) lastChangedCheckbox.checked = true;
        return;
    }

    const newSelectedCategories = new Set();
    checkedBoxes.forEach(box => newSelectedCategories.add(box.value));
    selectedCategories = newSelectedCategories;

    let combinedSentences = [];
    const combinedSentenceIds = new Set();

    selectedCategories.forEach(categoryName => {
        const sourceCategory = categoryName === "星號" 
            ? sentences.filter(s => starredCards.has(s["ID"] || `${s["分類"]}_${s["華語"]}`))
            : categories[categoryName];
            
        if (sourceCategory) {
            sourceCategory.forEach(sentence => {
                const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
                if (!combinedSentenceIds.has(sentenceId)) {
                    combinedSentences.push(sentence);
                    combinedSentenceIds.add(sentenceId);
                }
            });
        }
    });

    // 【修改】讀取初始總數，並產生新的標題格式
    const dropdownBtn = document.getElementById("categoryDropdownBtn");
    const initialCount = dropdownBtn.dataset.initialCount;
    const newCount = selectedCategories.size;

    const newTempCategoryName = (newCount == initialCount)
        ? `${initialCount}主題`
        : `${newCount}/${initialCount}主題`;


    Object.keys(categories).forEach(key => {
        if (key.endsWith("主題")) delete categories[key];
    });

    categories[newTempCategoryName] = combinedSentences;
    currentCategory = newTempCategoryName; 

    selectedSentences.clear();
    categories[currentCategory].forEach((_, index) => {
        selectedSentences.add(index);
    });

    document.getElementById("interactiveTitleText").textContent = newTempCategoryName;
    
    const currentModeText = document.getElementById("currentMode").textContent;
    const categoryNames = Array.from(selectedCategories);

    switch (currentModeText) {
        case "閃卡":
            updateUrl('flashcard', categoryNames);
            showFlashcardView();
            break;
        case "配對":
            updateUrl('matching', categoryNames);
            showMatchingGame();
            break;
        case "測驗":
            updateUrl('quiz', categoryNames);
            showQuizGame();
            break;
        case "排序":
            updateUrl('sorting', categoryNames);
            showSortingGame();
            break;
        case "學習":
        default:
            updateUrl('learning', categoryNames);
            showLearningView();
            break;
    }
}

/**
 * 根據原始拼音字串，生成帶有 window.PinyinAudio.kasu 播放功能的可點擊 HTML。
 * @param {string} originalPinyin - 未經轉換的原始拼音字串。
 * @returns {string} - 處理過的 HTML 字串。
 */
function createClickablePhoneticHtml(originalPinyin) {
    if (!userSettings.playPinyinOnClick) {
        // 如果功能未啟用，直接回傳轉換後的文字
        return userSettings.phoneticSystem === 'zhuyin' ? convertPinyinToZhuyin(originalPinyin) : originalPinyin;
    }

    // 處理包含連字號和空格的複雜情況
    const segments = originalPinyin.split(/(\s+)/); // 按空格分割並保留空格
    let finalHtml = '';

    segments.forEach(segment => {
        if (segment.trim() === '') {
            finalHtml += segment; // 保留原始的空格
        } else {
            // 處理多音節詞 (用連字號連接)
            const isMultiSyllable = segment.includes('-');
            let displayPart = userSettings.phoneticSystem === 'zhuyin' ? convertPinyinToZhuyin(segment) : segment;
            
            // 對於多音節詞，整個詞一個點擊事件
            if (isMultiSyllable) {
                const safeSegment = segment.replace(/'/g, "\\'");
                finalHtml += `<span class="pinyin-word" onclick="window.PinyinAudio.kasu(this, '${safeSegment}')">${displayPart}</span>`;
            } else {
                 // 對於單音節詞，直接處理
                 const safeSegment = segment.replace(/'/g, "\\'");
                 finalHtml += `<span class="pinyin-word" onclick="window.PinyinAudio.kasu(this, '${safeSegment}')">${displayPart}</span>`;
            }
        }
    });

    return finalHtml;
}



// 更新當前模式顯示
function updateCurrentMode(modeName) {
  const modeIconEl = document.getElementById("currentModeIcon");
  const modeTextEl = document.getElementById("currentMode");

  // 建立一個模式資訊的對照表，方便管理圖示和顏色
  const modeInfo = {
      "學習": { icon: "book", color: "text-blue-600" },
      "閃卡": { icon: "style", color: "text-purple-600" },
      "配對": { icon: "extension", color: "text-orange-600" },
      "測驗": { icon: "quiz", color: "text-red-600" },
      "排序": { icon: "sort", color: "text-indigo-600" }
  };
  
  // 根據傳入的模式名稱，取得對應的圖示和顏色，若找不到則預設為「學習」
  const info = modeInfo[modeName] || modeInfo["學習"];

  // 更新圖示元素的內容和 CSS class
  if (modeIconEl) {
      modeIconEl.textContent = info.icon;
      // 重設 class 以確保只有當前的顏色生效
      modeIconEl.className = `material-icons ${info.color}`;
  }

  // 更新文字元素的內容
  if (modeTextEl) {
      modeTextEl.textContent = modeName;
  }
}


/**
 * 根據客語漢字和拼音字串，生成帶有上方標註的 HTML。
 * @param {string} hakkaText - 客語漢字字串。
 * @param {string} pinyinText - 拼音字串。
 * @param {boolean} isAnnotated - 是否啟用標註模式。
 * @returns {string} - 處理過的 HTML 或原始文字。
 */
function annotateHakkaText(hakkaText, pinyinText, isAnnotated) {
    if (!isAnnotated || !hakkaText || !pinyinText) {
        return hakkaText;
    }

    const processedPinyin = pinyinText.replace(/([,.?!;:。！？，、：；()（）])/g, ' $1 ');
    const pinyinSegments = processedPinyin.split(/[\s-]+/).filter(p => p.trim() !== "");
    const hakkaChars = Array.from(hakkaText);
    const punctuationMap = {
        ".": "。",
        ",": "，",
        "?": "？",
        "!": "！",
        ";": "；",
        ":": "：",
        "(": "（",
        ")": "）"
    };

    let resultHtml = '';
    let pinyinIndex = 0;

    hakkaChars.forEach(char => {
        const currentPinyin = pinyinSegments[pinyinIndex];
        let pinyinForDisplay = currentPinyin;

        // 【修改】如果啟用注音，轉換顯示文字
        if (userSettings.phoneticSystem === 'zhuyin' && pinyinForDisplay) {
            pinyinForDisplay = convertPinyinToZhuyin(pinyinForDisplay);
        }

        // 【修改】如果啟用點擊播放，建立可點擊的 span
        let pinyinContent = pinyinForDisplay;
        if (userSettings.playPinyinOnClick && currentPinyin) {
            const safePinyin = currentPinyin.replace(/'/g, "\\'");
            pinyinContent = `<span class="pinyin-word" onclick="event.stopPropagation(); window.PinyinAudio.kasu(this, '${safePinyin}')">${pinyinForDisplay}</span>`;
        }

        if (/[，。？！；：、（）]/.test(char)) {
            if (pinyinIndex < pinyinSegments.length && (currentPinyin === char || punctuationMap[currentPinyin] === char)) {
                resultHtml += `<ruby><rb>${char}</rb><rt>${pinyinContent}</rt></ruby>`;
                pinyinIndex++;
            } else {
                resultHtml += `<span>${char}</span>`;
            }
        } else if (pinyinIndex < pinyinSegments.length) {
            resultHtml += `<ruby><rb>${char}</rb><rt>${pinyinContent}</rt></ruby>`;
            pinyinIndex++;
        } else {
            resultHtml += `<span>${char}</span>`;
        }
    });

    return resultHtml;
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

        const audio = new Audio(`${config.AUDIO_BASE_PATH}${filename}`);
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
        // 獲取閃卡主播放按鈕的圖示元素
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
    const emoji = config.CELEBRATION_EMOJIS[Math.floor(Math.random() * config.CELEBRATION_EMOJIS.length)]
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
    const contentArea = document.getElementById("contentArea");

    if (userSettings.compactMode) {
        userSettings.layout = 'compact';
        delete userSettings.compactMode;
        saveUserSettings();
    } else if (!userSettings.layout) {
        userSettings.layout = 'double';
    }

    // 新的佈局：工具列和句子容器是同層級的兄弟元素
    contentArea.innerHTML = `
        <div id="learningModeToolbar" class="sticky top-0 z-20 bg-gray-50/80 backdrop-blur-sm border-b border-gray-200 mb-6 py-2 px-3">
            <div class="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2">

                <div class="flex items-center gap-2">
                    <button id="enableLearningSelect" title="啟用選取模式" class="control-button">
                        <span class="material-icons !text-xl">check_box_outline_blank</span>
                    </button>
                    <div id="learningSelectActions" class="hidden items-center gap-2">
                        <button id="disableLearningSelect" title="關閉選取模式" class="control-button active">
                            <span class="material-icons !text-xl">close</span>
                        </button>
                        <div class="w-px h-5 bg-gray-300"></div>
                        <button id="learningSelectAll" title="全選/取消全選" class="control-button">
                            <span class="material-icons !text-xl">select_all</span>
                        </button>
                        <div class="relative">
                            <button id="starMenuToggle" title="星號操作" class="control-button">
                                <span class="material-icons !text-xl">star_outline</span>
                            </button>
                            <div id="starMenu" class="hidden absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10 py-1">
                                <button id="starSelected" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700">
                                    <span class="material-icons text-yellow-400 mr-3">star</span>
                                    <span>全部加星號</span>
                                </button>
                                <button id="unstarSelected" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700">
                                    <span class="material-icons text-gray-400 mr-3">star_border</span>
                                    <span>全部移除星號</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-1">
                        <div class="relative">
                            <button id="pinyinAnnotationMenuToggle" class="control-button" title="標音設定">
                                <span class="material-icons !text-xl">translate</span>
                            </button>
                            <div id="pinyinAnnotationMenu" class="hidden absolute top-full right-0 mt-2 w-40 bg-white rounded-md shadow-lg border z-10 py-1">
                                <button id="togglePinyinAnnotation" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700 control-button">
                                    <span class="material-icons text-base mr-2">vertical_align_top</span>
                                    <span>拼音標字上</span>
                                </button>
                            </div>
                        </div>
                        <button id="togglePhoneticSystem" class="control-button" title="切換拼音/注音">
                            <span class="material-icons !text-xl">font_download</span>
                        </button>
                        <button id="togglePlayPinyinOnClick" class="control-button" title="啟用點擊拼音播放">
                            <span class="material-icons !text-xl">mic</span>
                        </button>
                         <div class="relative">
                            <button id="displayMenuToggle" class="control-button" title="顯示設定">
                                <span class="material-icons !text-xl">visibility</span>
                            </button>
                            <div id="displayMenu" class="hidden absolute top-full right-0 mt-2 w-28 bg-white rounded-md shadow-lg border z-10 p-1">
                                <button id="hideHakka" title="客語" class="control-button w-full justify-start"><span class="material-icons !text-xl">visibility</span><span>客語</span></button>
                                <button id="hidePinyin" title="拼音" class="control-button w-full justify-start"><span class="material-icons !text-xl">visibility</span><span>拼音</span></button>
                                <button id="hideChinese" title="華語" class="control-button w-full justify-start"><span class="material-icons !text-xl">visibility</span><span>華語</span></button>
                            </div>
                        </div>
                    </div>
                    <div class="w-px h-6 bg-gray-300 hidden md:block"></div>
                    <div class="flex items-center gap-1">
                        <button id="layoutToggle" class="control-button" title="切換版面">
                            <span class="material-icons !text-xl">view_agenda</span>
                        </button>
                        <button onclick="adjustFontSize(-1, 'learning')" title="縮小字體" class="control-button">
                            <span class="material-icons !text-xl">text_decrease</span>
                        </button>
                        <button onclick="adjustFontSize(1, 'learning')" title="放大字體" class="control-button">
                            <span class="material-icons !text-xl">text_increase</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>

        <div class="max-w-6xl mx-auto">
            <div id="sentenceContainer"></div>
        </div>
    `;

    renderSentences();
    setupLearningControls();
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
    const starredKey = `${config.STORAGE_PREFIX}starred_${currentUser.id}`;
    localStorage.setItem(starredKey, JSON.stringify(Array.from(starredCards)));
}

function toggleStar(index) {
    const sentence = categories[currentCategory][index];
    if (!sentence) return;

    // 使用與閃卡相同的ID邏輯以確保同步
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
    if (!container) return;
    const sentences = categories[currentCategory];

    let containerClasses = [];
    if (isLearningSelectMode) {
        containerClasses.push("learning-select-active");
    }
    if (userSettings.pinyinAnnotation) {
        containerClasses.push("pinyin-annotated");
    }

    if (userSettings.layout === "double" && window.innerWidth >= 1024) {
        containerClasses.push("grid grid-cols-1 lg:grid-cols-2 gap-4");
    } else if (userSettings.layout === "single" || (userSettings.layout === "double" && window.innerWidth < 1024)) {
        containerClasses.push("grid grid-cols-1 gap-4");
    } else {
        containerClasses.push("bg-white rounded-xl shadow-sm border");
    }
    container.className = containerClasses.join(" ");

    container.innerHTML = "";
    if (!sentences) return;

    sentences.forEach((sentence, index) => {
        const isSelected = selectedSentences.has(index);
        const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
        const isStarred = starredCards.has(sentenceId);
        const starIcon = isStarred ? 'star' : 'star_border';
        const sentenceItem = document.createElement("div");

        if (isLearningSelectMode) {
            sentenceItem.classList.add('cursor-pointer');
            sentenceItem.onclick = (e) => {
                if (e.target.closest('button, input, .pinyin-word')) return; // 避免點擊拼音時觸發整行選取
                toggleSentenceSelection(index, !isSelected);
                renderSentences();
            };
        }

        // --- 【修改】使用新邏輯 ---
        const originalPinyin = sentence["拼音"];
        const pinyinDisplayHtml = createClickablePhoneticHtml(originalPinyin);
        const annotatedHakka = annotateHakkaText(sentence["客語"], originalPinyin, userSettings.pinyinAnnotation);
        // --- 修改結束 ---


        if (userSettings.layout === 'compact') {
            sentenceItem.className += " flex items-center gap-3 p-3 border-b last:border-b-0";
            sentenceItem.innerHTML = `
            <input type="checkbox" class="sentence-checkbox w-4 h-4 text-blue-600 rounded flex-shrink-0" 
                   ${isSelected ? "checked" : ""} 
                   onchange="toggleSentenceSelection(${index}, this.checked)">
            <button onclick="playAudio('${sentence["音檔"]}', this.querySelector('.material-icons'))" class="text-gray-500 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                <span class="material-icons text-lg">volume_up</span>
            </button>
            <span class="text-sm text-gray-500 font-mono flex-shrink-0">${index + 1}</span>
            <div class="flex-1 min-w-0 flex items-baseline gap-4">
                <span class="hakka-text text-blue-800 flex-shrink-0" style="font-size: ${userSettings.fontSize}px">${annotatedHakka}</span>
                <span class="pinyin-text text-gray-600 truncate" style="font-size: ${Math.floor(userSettings.fontSize * 0.8)}px">${pinyinDisplayHtml}</span>
                <span class="chinese-text text-gray-800 truncate" style="font-size: ${Math.floor(userSettings.fontSize * 0.9)}px">${sentence["華語"]}</span>
            </div>
            <button onclick="toggleStar(${index})" class="learning-star-btn ml-2" title="標示星號">
                <span class="material-icons ${isStarred ? 'text-yellow-400' : 'text-gray-400'}">${starIcon}</span>
            </button>
        `;
        } else {
            sentenceItem.className += " sentence-card bg-white rounded-xl shadow-sm p-6";
            sentenceItem.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <input type="checkbox" class="sentence-checkbox w-4 h-4 text-blue-600 rounded" 
                           ${isSelected ? "checked" : ""} 
                           onchange="toggleSentenceSelection(${index}, this.checked)">
                    <button onclick="playAudio('${sentence["音檔"]}', this.querySelector('.material-icons'))" class="text-gray-800 hover:bg-gray-100 p-1.5 rounded transition-colors">
                        <span class="material-icons text-lg">volume_up</span>
                    </button>
                    <span class="text-sm text-gray-500 font-mono">${index + 1}</span>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="toggleStar(${index})" class="learning-star-btn" title="標示星號">
                        <span class="material-icons ${isStarred ? 'text-yellow-400' : 'text-gray-400'}">${starIcon}</span>
                    </button>
                </div>
            </div>
            <div class="space-y-3">
                <div class="hakka-text text-blue-800 line-spacing-tight" 
                     style="font-size: ${userSettings.fontSize}px">${annotatedHakka}</div>
                <div class="pinyin-text text-gray-600 line-spacing-tight" 
                     style="font-size: ${Math.floor(userSettings.fontSize * 0.8)}px">${pinyinDisplayHtml}</div>
                <div class="chinese-text text-gray-800 line-spacing-tight" 
                     style="font-size: ${Math.floor(userSettings.fontSize * 0.9)}px">${sentence["華語"]}</div>
            </div>
        `;
        }
        container.appendChild(sentenceItem);
    });

    const toggleAnnotationBtn = document.getElementById("togglePinyinAnnotation");
    if (toggleAnnotationBtn) {
        toggleAnnotationBtn.classList.toggle("annotation-active", userSettings.pinyinAnnotation);
    }

    updateSelectAllButtonState();
}



function setupLearningControls() {
    const hideStates = {
        hakka: "show",
        pinyin: "show",
        chinese: "show"
    };

    const enableBtn = document.getElementById("enableLearningSelect");
    const disableBtn = document.getElementById("disableLearningSelect");
    const actionsContainer = document.getElementById("learningSelectActions");

    // 模式切換
    const toggleLearningSelectMode = (enable) => {
        isLearningSelectMode = enable;
        if (enable) {
            enableBtn.classList.add("hidden");
            actionsContainer.classList.remove("hidden");
            actionsContainer.classList.add("flex");
            // 預設全選
            selectedSentences.clear();
            categories[currentCategory].forEach((_, index) => selectedSentences.add(index));
        } else {
            // 【修改】關閉選取模式前，若無選取則自動全選
            if (selectedSentences.size === 0) {
                categories[currentCategory].forEach((_, index) => selectedSentences.add(index));
            }
            enableBtn.classList.remove("hidden");
            actionsContainer.classList.add("hidden");
            actionsContainer.classList.remove("flex");
            // 注意：此處不清空 selectedSentences，以便其他模式能接收到選取狀態
        }
        renderSentences();
        updateSelectAllButtonState(); // 更新按鈕狀態
    };

    enableBtn.onclick = () => toggleLearningSelectMode(true);
    disableBtn.onclick = () => toggleLearningSelectMode(false);

    // 全選/取消全選
    document.getElementById("learningSelectAll").onclick = () => {
        const totalCount = categories[currentCategory].length;
        const selectedCount = selectedSentences.size;

        if (selectedCount < totalCount) {
            selectedSentences.clear();
            categories[currentCategory].forEach((_, index) => selectedSentences.add(index));
        } else {
            selectedSentences.clear();
        }
        renderSentences();
        updateSelectAllButtonState(); // 更新按鈕狀態
    };

    // START: New Display Dropdown Logic
    const displayMenuToggle = document.getElementById("displayMenuToggle");
    const displayMenu = document.getElementById("displayMenu");

    if (displayMenuToggle && displayMenu) {
        displayMenuToggle.onclick = (e) => {
            e.stopPropagation();
            displayMenu.classList.toggle("hidden");
        };

        // 監聽整個頁面的點擊，如果點擊位置不在選單和觸發按鈕內，就關閉選單
        document.addEventListener('click', (e) => {
            if (!displayMenu.classList.contains('hidden') && !displayMenu.contains(e.target) && !displayMenuToggle.contains(e.target)) {
                displayMenu.classList.add('hidden');
            }
        }, true);
    }
    // END: New Display Dropdown Logic

    // 星號下拉選單的控制邏輯
    const starMenuToggle = document.getElementById("starMenuToggle");
    const starMenu = document.getElementById("starMenu");

    if (starMenuToggle && starMenu) {
        starMenuToggle.onclick = (e) => {
            e.stopPropagation();
            starMenu.classList.toggle("hidden");
        };
        starMenu.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                starMenu.classList.add('hidden');
            });
        });
        document.addEventListener('click', (e) => {
            if (!starMenu.classList.contains('hidden') && !starMenu.contains(e.target) && !starMenuToggle.contains(e.target)) {
                starMenu.classList.add('hidden');
            }
        }, true);
    }

    // 【修改】加入星號 -> 全部加星號
    document.getElementById("starSelected").onclick = () => {
        categories[currentCategory].forEach(sentence => {
            if (!sentence) return;
            const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
            starredCards.add(sentenceId);
        });
        saveStarredCards();
        renderSentences();
    };

    // 【修改】取消星號 -> 全部移除星號
    document.getElementById("unstarSelected").onclick = () => {
        categories[currentCategory].forEach(sentence => {
            if (!sentence) return;
            const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
            starredCards.delete(sentenceId);
        });
        saveStarredCards();
        renderSentences();
    };

    // 排版切換 (三段循環)
    const layoutToggle = document.getElementById("layoutToggle");
    if (layoutToggle) {
        const layouts = ["double", "single", "compact"];
        const icon = layoutToggle.querySelector(".material-icons");
        switch (userSettings.layout) {
            case "double":
                icon.textContent = "view_agenda";
                layoutToggle.title = "切換為單欄";
                break;
            case "single":
                icon.textContent = "view_list";
                layoutToggle.title = "切換為精簡列表";
                break;
            case "compact":
                icon.textContent = "view_column";
                layoutToggle.title = "切換為雙欄";
                break;
        }
        layoutToggle.onclick = () => {
            const currentIndex = layouts.indexOf(userSettings.layout);
            const nextIndex = (currentIndex + 1) % layouts.length;
            userSettings.layout = layouts[nextIndex];
            saveUserSettings();
            showLearningView();
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

    // 【新增以下程式碼】
    const annotationMenuToggle = document.getElementById("pinyinAnnotationMenuToggle");
    const annotationMenu = document.getElementById("pinyinAnnotationMenu");

    if (annotationMenuToggle && annotationMenu) {
        annotationMenuToggle.onclick = (e) => {
            e.stopPropagation();
            annotationMenu.classList.toggle("hidden");
        };
        document.addEventListener('click', (e) => {
            if (!annotationMenu.classList.contains('hidden') && !annotationMenu.contains(e.target) && !annotationMenuToggle.contains(e.target)) {
                annotationMenu.classList.add('hidden');
            }
        }, true);
    }

    const toggleAnnotationBtn = document.getElementById("togglePinyinAnnotation");
    if (toggleAnnotationBtn) {
        toggleAnnotationBtn.onclick = () => {
            userSettings.pinyinAnnotation = !userSettings.pinyinAnnotation;
            saveUserSettings();
            renderSentences();
            annotationMenu.classList.add('hidden');
        };
    }

    // --- 新增開始 ---
    const togglePhoneticBtn = document.getElementById("togglePhoneticSystem");
    if (togglePhoneticBtn) {
        // 根據目前設定，初始化按鈕樣式
        togglePhoneticBtn.classList.toggle('active', userSettings.phoneticSystem === 'zhuyin');
        togglePhoneticBtn.title = userSettings.phoneticSystem === 'pinyin' ? '切換為注音' : '切換為拼音';

        togglePhoneticBtn.onclick = () => {
            // 切換設定
            userSettings.phoneticSystem = userSettings.phoneticSystem === 'pinyin' ? 'zhuyin' : 'pinyin';
            saveUserSettings();
            // 更新按鈕樣式與標題
            togglePhoneticBtn.classList.toggle('active', userSettings.phoneticSystem === 'zhuyin');
            togglePhoneticBtn.title = userSettings.phoneticSystem === 'pinyin' ? '切換為注音' : '切換為拼音';
            // 重新渲染句子列表以顯示變更
            renderSentences();
        };
    }
    // --- 新增開始 ---
    const togglePlayPinyinBtn = document.getElementById("togglePlayPinyinOnClick");
    if (togglePlayPinyinBtn) {
        const updateBtnState = () => {
            togglePlayPinyinBtn.classList.toggle('active', userSettings.playPinyinOnClick);
            togglePlayPinyinBtn.title = userSettings.playPinyinOnClick ? '停用點擊拼音播放' : '啟用點擊拼音播放';
        };
        updateBtnState(); // 初始化按鈕狀態

        togglePlayPinyinBtn.onclick = () => {
            userSettings.playPinyinOnClick = !userSettings.playPinyinOnClick;
            saveUserSettings();
            updateBtnState();
            renderSentences(); // 重新渲染以應用點擊功能
        };
    }
    // --- 新增結束 ---
}

// 切換句子選取
function toggleSentenceSelection(index, checked) {
    if (checked) {
        selectedSentences.add(index)
    } else {
        selectedSentences.delete(index)
    }
    updateSelectAllButtonState();
}


// 切換句子選取
function updateSelectAllButtonState() {
    const selectAllButton = document.getElementById("learningSelectAll");
    if (!selectAllButton) return;

    const icon = selectAllButton.querySelector('.material-icons');
    const totalCount = categories[currentCategory]?.length || 0;
    const selectedCount = selectedSentences.size;

    if (selectedCount === totalCount && totalCount > 0) {
        icon.textContent = 'check_box'; // 圖示：已全選，可點擊取消
        selectAllButton.title = '取消全選';
    } else {
        icon.textContent = 'select_all'; // 圖示：未全選，可點擊全選
        selectAllButton.title = '全選';
    }
}




// 字體大小調整
function adjustFontSize(change, mode = "learning") {
    const fontSizes = mode === "flashcard" ? config.FONT_SIZES.flashcard : config.FONT_SIZES.learning;

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


// 閃卡模式
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
                <div class="relative">
                     <button id="flashcardAnnotationBtn" class="control-btn !p-2" title="標音設定">
                        <span class="material-icons">translate</span>
                    </button>
                    <div id="flashcardAnnotationPopup" class="hidden absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border z-10 py-1">
                        <button id="toggleFlashcardAnnotation" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700 control-button">
                            <span class="material-icons text-base mr-2">vertical_align_top</span>
                            <span>拼音標字上</span>
                        </button>
                    </div>
                </div>
                <button id="toggleFlashcardPhoneticSystem" class="control-btn !p-2" title="切換拼音/注音">
                    <span class="material-icons">font_download</span>
                </button>
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

    // --- 修改開始 ---
    let pinyinDisplay = sentence["拼音"];
    if (userSettings.phoneticSystem === 'zhuyin') {
        pinyinDisplay = convertPinyinToZhuyin(pinyinDisplay);
    }
    const annotatedHakka = annotateHakkaText(sentence["客語"], pinyinDisplay, userSettings.pinyinAnnotation);
    // --- 修改結束 ---

    hakkaTextEl.innerHTML = annotatedHakka;
    pinyinTextEl.textContent = pinyinDisplay;
    chineseTextEl.textContent = sentence["華語"];
    document.getElementById("cardCounter").textContent = `${currentCardIndex + 1} / ${flashcardSentences.length}`;

    // 【新增】根據標音狀態，切換容器的 class
    document.getElementById('flashcardContainer').classList.toggle('pinyin-annotated', userSettings.pinyinAnnotation);

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
    let isAutoplayLooping = userSettings.flashcardLoop || false;

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
    const flashcardAnnotationBtn = document.getElementById("flashcardAnnotationBtn");
    const flashcardAnnotationPopup = document.getElementById("flashcardAnnotationPopup");

    const repeatButton = document.getElementById("repeatBtn");
    const goToFirstButton = document.getElementById("goToFirstCard");
    const goToLastButton = document.getElementById("goToLastCard");

    const autoPlayAudioCheckbox = document.getElementById("flashcardAutoPlayAudio");

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

    if (autoPlayAudioCheckbox) {
        autoPlayAudioCheckbox.checked = userSettings.flashcardAutoPlayAudio;
        autoPlayAudioCheckbox.onchange = () => {
            userSettings.flashcardAutoPlayAudio = autoPlayAudioCheckbox.checked;
            saveUserSettings();
        };
    }

    // --- 新增開始 ---
    const togglePhoneticBtn = document.getElementById("toggleFlashcardPhoneticSystem");
    if (togglePhoneticBtn) {
        togglePhoneticBtn.classList.toggle('active', userSettings.phoneticSystem === 'zhuyin');
        togglePhoneticBtn.title = userSettings.phoneticSystem === 'pinyin' ? '切換為注音' : '切換為拼音';

        togglePhoneticBtn.onclick = () => {
            userSettings.phoneticSystem = userSettings.phoneticSystem === 'pinyin' ? 'zhuyin' : 'pinyin';
            saveUserSettings();
            togglePhoneticBtn.classList.toggle('active', userSettings.phoneticSystem === 'zhuyin');
            togglePhoneticBtn.title = userSettings.phoneticSystem === 'pinyin' ? '切換為注音' : '切換為拼音';
            updateFlashcard(); // 重新渲染卡片
        };
    }
    // --- 新增結束 ---

    const popups = [{
            btn: autoPlayButton,
            menu: autoPlayPopup
        },
        {
            btn: filterButton,
            menu: filterPopup
        },
        {
            btn: flashcardAnnotationBtn,
            menu: flashcardAnnotationPopup
        }
    ];

    popups.forEach(popup => {
        if (!popup.btn) return;
        popup.btn.addEventListener('click', (e) => {
            e.stopPropagation();
            popups.forEach(p => {
                if (p.menu !== popup.menu) p.menu.classList.add('hidden');
            });
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
        if (clearStarsBtn) {
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

            if (autoPlayButton && autoPlayIcon) {
                autoPlayIcon.textContent = "play_arrow";
                autoPlayButton.classList.remove("active");
                autoPlayButton.title = "自動播放";
            }

            if (repeatButton) {
                repeatButton.classList.add('hidden');
            }

            if (currentAudio) {
                currentAudio.pause();
            }
        }
    }

    function startAutoPlay() {
        stopAutoPlay();

        if (currentCardIndex >= flashcardSentences.length - 1) {
            currentCardIndex = -1;
        }

        const autoPlayButton = document.getElementById("autoPlayBtn");
        const autoPlayIcon = document.getElementById("autoPlayIcon");
        autoPlayIcon.textContent = "pause";
        autoPlayButton.classList.add("active");
        autoPlayButton.title = "暫停播放";

        if (repeatButton) {
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
            const audioPromise = userSettings.flashcardAutoPlayAudio ?
                playCurrentAudio() :
                Promise.resolve();

            await Promise.all([delayPromise, audioPromise]);

            autoPlayLoop();
        };

        autoPlayLoop();
    }

    if (repeatButton) {
        // 根據讀取的設定，初始化按鈕外觀
        if (isAutoplayLooping) {
            repeatButton.classList.add("active");
            repeatButton.title = "取消循環";
        } else {
            repeatButton.classList.remove("active");
            repeatButton.title = "循環播放";
        }

        repeatButton.onclick = () => {
            isAutoplayLooping = !isAutoplayLooping;
            // 將新設定儲存起來
            userSettings.flashcardLoop = isAutoplayLooping;
            saveUserSettings();

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
    if (defaultIntervalBtn) defaultIntervalBtn.classList.add('bg-gray-200');

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
        if (starredCards.has(sentenceId)) {
            starredCards.delete(sentenceId);
        } else {
            starredCards.add(sentenceId);
        }
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

    if (flashcardKeyHandler) {
        document.removeEventListener('keydown', flashcardKeyHandler);
    }
    flashcardKeyHandler = (event) => {
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
        const key = event.key.toLowerCase();
        switch (key) {
            case ' ':
                event.preventDefault();
                playAudioButton.click();
                break;
            case 'arrowright':
            case 'arrowdown':
                event.preventDefault();
                if (!nextButton.disabled) nextButton.click();
                break;
            case 'arrowleft':
            case 'arrowup':
                event.preventDefault();
                if (!prevButton.disabled) prevButton.click();
                break;
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
    const toggleFlashcardAnnotationBtn = document.getElementById("toggleFlashcardAnnotation");
    if (toggleFlashcardAnnotationBtn) {
        toggleFlashcardAnnotationBtn.onclick = () => {
            userSettings.pinyinAnnotation = !userSettings.pinyinAnnotation;
            saveUserSettings();
            updateFlashcard();
            if (flashcardAnnotationPopup) flashcardAnnotationPopup.classList.add('hidden');
        };
    }

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

// 請替換此函數
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
                            <button id="togglePhoneticSystem" class="p-2 rounded-md hover:bg-gray-100 transition-colors" title="切換拼音/注音">
                                <span class="material-icons text-gray-600 !text-xl align-middle">font_download</span>
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

    ;
    ["matchingType", "matchingPairs", "matchingCondition"].forEach((id) => {
        document.getElementById(id).onchange = () => {
            if (!matchingGameState.isPlaying) {
                generateMatchingData();
            }
        }
    });

    // --- 新增開始 ---
    const togglePhoneticBtn = document.getElementById("togglePhoneticSystem");
    if (togglePhoneticBtn) {
        togglePhoneticBtn.classList.toggle('bg-blue-100', userSettings.phoneticSystem === 'zhuyin');
        togglePhoneticBtn.title = userSettings.phoneticSystem === 'pinyin' ? '切換為注音' : '切換為拼音';

        togglePhoneticBtn.onclick = () => {
            userSettings.phoneticSystem = userSettings.phoneticSystem === 'pinyin' ? 'zhuyin' : 'pinyin';
            saveUserSettings();
            togglePhoneticBtn.classList.toggle('bg-blue-100', userSettings.phoneticSystem === 'zhuyin');
            togglePhoneticBtn.title = userSettings.phoneticSystem === 'pinyin' ? '切換為注音' : '切換為拼音';

            // 如果遊戲正在進行，重新生成題目以應用變更
            if (matchingGameState.isPlaying) {
                generateMatchingData();
            }
        };
    }

    generateMatchingData();
}


function stopMatchingGame() {
    if (matchingGameState.timerInterval) {
        clearInterval(matchingGameState.timerInterval);
    }
    endMatchingGame("遊戲已中止");
}


// 請替換此函數
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

    // --- 新增：定義一個幫助函數 ---
    const getPhonetic = (text) => {
        if (userSettings.phoneticSystem === 'zhuyin') {
            return convertPinyinToZhuyin(text);
        }
        return text;
    };

    selected.forEach((sentence, index) => {
        switch (type) {
            case "hakka-chinese":
                leftItems.push({
                    id: index,
                    text: sentence["客語"],
                    type: "hakka"
                })
                rightItems.push({
                    id: index,
                    text: sentence["華語"],
                    type: "chinese"
                })
                break
            case "pinyin-chinese":
                leftItems.push({
                    id: index,
                    text: getPhonetic(sentence["拼音"]), // 修改
                    type: "pinyin"
                })
                rightItems.push({
                    id: index,
                    text: sentence["華語"],
                    type: "chinese"
                })
                break
            case "hakka-pinyin":
                leftItems.push({
                    id: index,
                    text: sentence["客語"],
                    type: "hakka"
                })
                rightItems.push({
                    id: index,
                    text: getPhonetic(sentence["拼音"]), // 修改
                    type: "pinyin"
                })
                break
                // --- 新增的音檔模式 ---
            case "audio-hakka":
                leftItems.push({
                    id: index,
                    audioFile: sentence["音檔"],
                    type: "audio"
                });
                rightItems.push({
                    id: index,
                    text: sentence["客語"],
                    type: "hakka"
                });
                break;
            case "audio-pinyin":
                leftItems.push({
                    id: index,
                    audioFile: sentence["音檔"],
                    type: "audio"
                });
                rightItems.push({
                    id: index,
                    text: getPhonetic(sentence["拼音"]), // 修改
                    type: "pinyin"
                });
                break;
            case "audio-chinese":
                leftItems.push({
                    id: index,
                    audioFile: sentence["音檔"],
                    type: "audio"
                });
                rightItems.push({
                    id: index,
                    text: sentence["華語"],
                    type: "chinese"
                });
                break;
        }
    })

    // 打亂右側項目
    rightItems.sort(() => Math.random() - 0.5)

    matchingGameState.gameData = {
        leftItems,
        rightItems,
        sentences: selected
    }

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
    const {
        leftItems,
        rightItems
    } = matchingGameState.gameData;

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
    matchingGameState.selectedItems.push({
        element,
        item
    })

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

        matchingGameState.matchedPairs.push({
            first: first.item,
            second: second.item
        })

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
    const {
        sentences
    } = matchingGameState.gameData

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
                            <button id="togglePhoneticSystem" class="p-2 rounded-md hover:bg-gray-100 transition-colors" title="切換拼音/注音">
                                <span class="material-icons text-gray-600 !text-xl align-middle">font_download</span>
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


// 請替換此函數
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

    // --- 新增開始 ---
    const togglePhoneticBtn = document.getElementById("togglePhoneticSystem");
    if (togglePhoneticBtn) {
        togglePhoneticBtn.classList.toggle('bg-blue-100', userSettings.phoneticSystem === 'zhuyin');
        togglePhoneticBtn.title = userSettings.phoneticSystem === 'pinyin' ? '切換為注音' : '切換為拼音';

        togglePhoneticBtn.onclick = () => {
            userSettings.phoneticSystem = userSettings.phoneticSystem === 'pinyin' ? 'zhuyin' : 'pinyin';
            saveUserSettings();
            togglePhoneticBtn.classList.toggle('bg-blue-100', userSettings.phoneticSystem === 'zhuyin');
            togglePhoneticBtn.title = userSettings.phoneticSystem === 'pinyin' ? '切換為注音' : '切換為拼音';

            if (quizGameState.isPlaying) {
                // 重新生成當前題目以應用變更
                generateQuizQuestion();
            }
        };
    }
    // --- 新增結束 ---
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


// 請替換此函數
function generateQuizQuestion() {
    if (quizGameState.currentIndex >= quizGameState.questions.length) {
        quizGameState.questions = [...quizGameState.questions].sort(() => Math.random() - 0.5)
        quizGameState.currentIndex = 0
    }

    const currentSentence = quizGameState.questions[quizGameState.currentIndex]
    const type = document.getElementById("quizType").value
    const optionCount = Number.parseInt(document.getElementById("quizOptions").value)

    // --- 新增：定義一個幫助函數 ---
    const getPhonetic = (text) => {
        if (userSettings.phoneticSystem === 'zhuyin') {
            return convertPinyinToZhuyin(text);
        }
        return text;
    };

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
            question = getPhonetic(currentSentence["拼音"]); // 修改
            correctAnswer = currentSentence["華語"]
            break
        case "chinese-pinyin":
            question = currentSentence["華語"]
            correctAnswer = getPhonetic(currentSentence["拼音"]); // 修改
            break
        case "hakka-pinyin":
            question = currentSentence["客語"]
            correctAnswer = getPhonetic(currentSentence["拼音"]); // 修改
            break
        case "pinyin-hakka":
            question = getPhonetic(currentSentence["拼音"]); // 修改
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
                    return getPhonetic(s["拼音"]); // 修改
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

    if (button) {
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
                             <button id="togglePlayPinyinOnClickSorting" class="p-2 rounded-md hover:bg-gray-100 transition-colors" title="啟用點擊拼音播放">
                                <span class="material-icons text-gray-600 !text-xl align-middle">mic</span>
                            </button>
                            <button id="togglePhoneticSystem" class="p-2 rounded-md hover:bg-gray-100 transition-colors" title="切換拼音/注音">
                                <span class="material-icons text-gray-600 !text-xl align-middle">font_download</span>
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


	const togglePhoneticBtn = document.getElementById("togglePhoneticSystem");
	if (togglePhoneticBtn) {
		// 根據目前設定，初始化按鈕樣式
		togglePhoneticBtn.classList.toggle('bg-blue-100', userSettings.phoneticSystem === 'zhuyin');
		togglePhoneticBtn.title = userSettings.phoneticSystem === 'pinyin' ? '切換為注音' : '切換為拼音';

		togglePhoneticBtn.onclick = () => {
			// 切換設定
			userSettings.phoneticSystem = userSettings.phoneticSystem === 'pinyin' ? 'zhuyin' : 'pinyin';
			saveUserSettings();

			// 更新按鈕樣式與標題
			togglePhoneticBtn.classList.toggle('bg-blue-100', userSettings.phoneticSystem === 'zhuyin');
			togglePhoneticBtn.title = userSettings.phoneticSystem === 'pinyin' ? '切換為注音' : '切換為拼音';

			// 如果遊戲正在進行，重新生成題目以應用變更
			if (sortingGameState.isPlaying) {
				// 傳入 false 代表使用當前的題目重新渲染，而不是產生新題目
				generateSortingQuestion(false);
			}
		};
	}


    // --- 新增開始 ---
    const togglePlayPinyinBtn = document.getElementById("togglePlayPinyinOnClickSorting");
    if (togglePlayPinyinBtn) {
        const updateBtnState = () => {
            togglePlayPinyinBtn.classList.toggle('bg-blue-100', userSettings.playPinyinOnClick);
             togglePlayPinyinBtn.title = userSettings.playPinyinOnClick ? '停用點擊拼音播放' : '啟用點擊拼音播放';
        };
        updateBtnState();

        togglePlayPinyinBtn.onclick = () => {
            userSettings.playPinyinOnClick = !userSettings.playPinyinOnClick;
            saveUserSettings();
            updateBtnState();
            if (sortingGameState.isPlaying) {
                renderSortingQuestion(); // 重新渲染題目以應用變更
            }
        };
    }
    // --- 新增結束 ---
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


function generateSortingQuestion(isNewQuestion = true) {
    let sentence;

    if (isNewQuestion) {
        // 如果沒有可用題目，重新洗牌
        if (sortingGameState.availableSentences.length === 0) {
            sortingGameState.availableSentences = [...sortingGameState.sentences].sort(() => Math.random() - 0.5)
            sortingGameState.usedSentences = []
        }
        sortingGameState.total++; // 只有在新題目時才累加題號
        // 取出下一個題目
        sentence = sortingGameState.availableSentences.shift();
        sortingGameState.usedSentences.push(sentence);
        sortingGameState.currentSentence = sentence; // 更新當前題目
    } else {
        sentence = sortingGameState.currentSentence; // 使用已經儲存的當前題目
    }

    const type = document.getElementById("sortingType").value;

    const getPhonetic = (text) => {
        if (userSettings.phoneticSystem === 'zhuyin') {
            return convertPinyinToZhuyin(text);
        }
        return text;
    };

    let questionText, answerText;
    let isPinyinAnswer = false;

    switch (type) {
        case "hakka-pinyin":
            questionText = sentence["客語"];
            answerText = getPhonetic(sentence["拼音"]);
            isPinyinAnswer = true;
            break;
        case "chinese-pinyin":
            questionText = sentence["華語"];
            answerText = getPhonetic(sentence["拼音"]);
            isPinyinAnswer = true;
            break;
        case "pinyin-hakka":
            questionText = getPhonetic(sentence["拼音"]);
            answerText = sentence["客語"];
            break;
        case "chinese-hakka":
            questionText = sentence["華語"];
            answerText = sentence["客語"];
            break;
    }

    let words;

    if (isPinyinAnswer) {
        let tempWords = answerText.split(/\s+/).filter((w) => w.trim() !== "");
        words = tempWords;
    } else {
        words = Array.from(answerText).filter((char) => char.trim() !== "");
    }

    let fixedWords = [];
    let shuffleWords = words;
    if (words.length > 6) {
        const fixedCount = words.length - 6;
        fixedWords = words.slice(0, fixedCount);
        shuffleWords = words.slice(fixedCount);
    }

    const shuffledWords = [...shuffleWords].sort(() => Math.random() - 0.5);

    sortingGameState.questionText = questionText;
    sortingGameState.originalWords = words;
    sortingGameState.fixedWords = fixedWords;
    sortingGameState.shuffledWords = shuffledWords;
    sortingGameState.userOrder = [...fixedWords];

    renderSortingQuestion();

    if (document.getElementById('sortingPlaySound').checked && isNewQuestion) {
        playAudio(sentence["音檔"]);
    }
}


function renderSortingQuestion() {
    const sortingArea = document.getElementById("sortingArea");
    const canCheck = sortingGameState.userOrder.length === sortingGameState.originalWords.length;
    const questionNumber = sortingGameState.total;

    // 【新增】檢查選項是否為拼音類型
    const type = document.getElementById("sortingType").value;
    const isPinyinOption = type.includes('pinyin');

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
                        (word, index) => {
                          // --- 【修改】 ---
                          const originalPinyin = isPinyinOption ? word : null; // 假設 shuffledWords 存的是原始拼音
                          let displayWord = word;
                          if (isPinyinOption && userSettings.phoneticSystem === 'zhuyin') {
                              displayWord = convertPinyinToZhuyin(word);
                          }
                          
                          let wordContent = displayWord;
                          if (isPinyinOption && userSettings.playPinyinOnClick) {
                              const safePinyin = originalPinyin.replace(/'/g, "\\'");
                              wordContent = `<span class="pinyin-word" onclick="event.stopPropagation(); window.PinyinAudio.kasu(this, '${safePinyin}')">${displayWord}</span>`;
                          }

                          return `
                            <div class="sorting-word bg-white border-2 border-gray-300 px-4 py-2 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors flex items-center justify-center" 
                                 style="font-size: ${userSettings.fontSize}px"
                                 onclick="addToTarget('${word.replace(/'/g, "\\'")}', ${index})">
                                ${wordContent}
                            </div>
                          `;
                          // --- 修改結束 ---
                        }
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
        // --- 答案錯誤的處理邏輯 ---
        sortingGameState.incorrect++;
        sortingGameState.score = Math.max(0, sortingGameState.score - 20);

        document.getElementById("sortingIncorrect").textContent = sortingGameState.incorrect;
        document.getElementById("sortingScore").textContent = sortingGameState.score;

        // 【新增邏輯】檢查「自動播放音效」是否勾選，若是且答案錯誤，則重播音檔
        const playSoundCheckbox = document.getElementById('sortingPlaySound');
        if (playSoundCheckbox && playSoundCheckbox.checked) {
            const sentence = sortingGameState.currentSentence;
            if (sentence && sentence["音檔"]) {
                playAudio(sentence["音檔"]);
            }
        }
        
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

    const handleRealtimeTransform = (e) => {
        const input = e.target;
        const originalValue = input.value;
        const cursorPosition = input.selectionStart;
        const transformedValue = transformHakkaQuery(originalValue);
        if (originalValue !== transformedValue) {
            const lengthDifference = transformedValue.length - originalValue.length;
            const newCursorPosition = cursorPosition + lengthDifference;
            input.value = transformedValue;
            input.setSelectionRange(newCursorPosition, newCursorPosition);
        }
        handleSearchInput(e);
    };
    searchInput.addEventListener("input", handleRealtimeTransform);
    mobileSearchInput.addEventListener("input", handleRealtimeTransform);
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
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchResults.classList.add('hidden');
        clearSearchBtn.classList.add('hidden');
        searchInput.focus();
        handleSearchInput({
            target: searchInput
        });
    });
    document.addEventListener("click", (e) => {
        const isClickInsideSearch = searchBox.contains(e.target) || mobileSearchBox.contains(e.target) || searchResults.contains(e.target);
        if (!isClickInsideSearch) {
            searchResults.classList.add("hidden");
        }
    });
    const moreTabsButton = document.getElementById("moreTabsButton");
    const moreTabsDropdown = document.getElementById("moreTabsDropdown");
    if (moreTabsButton && moreTabsDropdown) {
        moreTabsButton.addEventListener("click", (e) => {
            e.stopPropagation();
            moreTabsDropdown.classList.toggle("hidden");
        });
    }
    document.addEventListener("click", () => {
        if (moreTabsDropdown && !moreTabsDropdown.classList.contains("hidden")) {
            moreTabsDropdown.classList.add("hidden");
        }
    });
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            renderCatalogTabs();
        }, 150);
    });
    document.getElementById("viewToggle").onclick = () => {
        const newMode = currentViewMode === "card" ? "list" : "card";
        setViewMode(newMode);
    }
    document.getElementById("userButton").onclick = (e) => {
        e.stopPropagation();
        document.getElementById("userDropdown").classList.toggle("hidden");
    }
    document.addEventListener("click", (e) => {
        if (!document.getElementById("userButton").contains(e.target)) {
            document.getElementById("userDropdown").classList.add("hidden");
        }
    })
    document.getElementById("editProfile").onclick = () => {
        document.getElementById("userDropdown").classList.add("hidden");
        document.getElementById("editName").value = currentUser.name;
        document.getElementById("editId").value = currentUser.id;
        document.getElementById("editAvatar").value = currentUser.avatar;
        document.getElementById("userModal").classList.remove("hidden");
    }
    document.getElementById("saveProfile").onclick = () => {
        const newName = document.getElementById("editName").value.trim();
        const newId = document.getElementById("editId").value.trim();
        const newAvatar = document.getElementById("editAvatar").value.trim();
        if (newName && newId && newAvatar) {
            currentUser.name = newName;
            currentUser.id = newId;
            currentUser.avatar = newAvatar;
            saveUserData();
            updateUserDisplay();
            document.getElementById("userModal").classList.add("hidden");
            loadUserSettings();
        }
    }
    document.getElementById("cancelEdit").onclick = () => {
        document.getElementById("userModal").classList.add("hidden");
    }
    document.getElementById("clearData").onclick = () => {
        document.getElementById("userDropdown").classList.add("hidden");
        document.getElementById("clearModal").classList.remove("hidden");
    }
    document.getElementById("confirmClear").onclick = () => {
        const password = document.getElementById("clearPassword").value;
        if (password === config.CLEAR_DATA_PASSWORD) {
            const settingsKey = `${config.STORAGE_PREFIX}settings_${currentUser.id}`;
            const starredKey = `${config.STORAGE_PREFIX}starred_${currentUser.id}`;
            const selectedKey = `${config.STORAGE_PREFIX}selected_${currentUser.id}`;
            const collectedKey = `${config.STORAGE_PREFIX}collected_${currentUser.id}`;
            localStorage.removeItem(settingsKey);
            localStorage.removeItem(starredKey);
            localStorage.removeItem(selectedKey);
            localStorage.removeItem(collectedKey);
            starredCards.clear();
            selectedCategories.clear();
            selectedSentences.clear();
            collectedCategories.clear();
            document.getElementById("clearModal").classList.add("hidden");
            document.getElementById("clearPassword").value = "";
            showResult("✅", "清除完成", "所有學習記錄已清除");
        } else {
            showResult("❌", "密碼錯誤", "請輸入正確的密碼");
        }
    }
    document.getElementById("cancelClear").onclick = () => {
        document.getElementById("clearModal").classList.add("hidden");
        document.getElementById("clearPassword").value = "";
    }
    document.getElementById("logout").onclick = () => {
        currentUser = {
            id: "guest",
            name: "訪客",
            avatar: "U"
        };
        saveUserData();
        updateUserDisplay();
        loadUserSettings();
        document.getElementById("userDropdown").classList.add("hidden");
        showResult("👋", "已登出", "已切換為訪客模式");
    }
    const userButtonDetail = document.getElementById("userButtonDetail");
    const userDropdownDetail = document.getElementById("userDropdownDetail");
    if (userButtonDetail && userDropdownDetail) {
        userButtonDetail.onclick = (e) => {
            e.stopPropagation();
            userDropdownDetail.classList.toggle("hidden");
        }
        document.addEventListener("click", (e) => {
            if (!userButtonDetail.contains(e.target)) {
                userDropdownDetail.classList.add("hidden");
            }
        })
        document.getElementById("editProfileDetail").onclick = () => {
            userDropdownDetail.classList.add("hidden");
            document.getElementById("editName").value = currentUser.name;
            document.getElementById("editId").value = currentUser.id;
            document.getElementById("editAvatar").value = currentUser.avatar;
            document.getElementById("userModal").classList.remove("hidden");
        }
        document.getElementById("clearDataDetail").onclick = () => {
            userDropdownDetail.classList.add("hidden");
            document.getElementById("clearModal").classList.remove("hidden");
        }
        document.getElementById("logoutDetail").onclick = () => {
            currentUser = {
                id: "guest",
                name: "訪客",
                avatar: "U"
            };
            saveUserData();
            updateUserDisplay();
            loadUserSettings();
            userDropdownDetail.classList.add("hidden");
            showResult("👋", "已登出", "已切換為訪客模式");
        }
    }
    document.getElementById("menuToggle").onclick = (e) => {
        e.stopPropagation();
        document.getElementById("menuDropdown").classList.toggle("hidden");
    }
    document.addEventListener("click", (e) => {
        if (!document.getElementById("menuToggle").contains(e.target)) {
            document.getElementById("menuDropdown").classList.add("hidden");
        }
    })

// 請替換此函數
document.getElementById("goHome").onclick = () => {
    stopAllTimers();
    
    selectedCategories.clear();
    isMultiSelectMode = false;
	isLearningSelectMode = false
    
    Object.keys(categories).forEach((key) => {
      // 【修改】判斷條件變更
      if ((key.endsWith("主題") && !isNaN(parseInt(key))) || key === "星號") {
        delete categories[key];
      }
    });
    
    parseCatalog();

    if (lastVisitedTab && catalog[lastVisitedTab]) {
        currentCatalogTab = lastVisitedTab;
    } else {
        currentCatalogTab = Object.keys(catalog).find(tab => tab !== '收藏') || (Object.keys(catalog).length > 0 ? Object.keys(catalog)[0] : "");
    }
    lastVisitedTab = "";
    
    if(history.pushState) {
        history.pushState({}, '', window.location.pathname);
    }
    document.getElementById("categoryDetail").classList.add("hidden");
    document.getElementById("mainMenu").classList.remove("hidden");
    
    renderCatalogTabs();
    renderCategoryList();
    setStickyTopPosition();
    window.scrollTo(0, 0);
  }

    const ensureSentencesAreSelected = () => {
        if (selectedSentences.size === 0) {
            selectedSentences.clear();
            categories[currentCategory].forEach((_, index) => selectedSentences.add(index));
            return false;
        }
        return true;
    };

    document.getElementById("viewSentences").onclick = () => {
        stopAllTimers();
        showLearningView();
        updateCurrentMode("學習");
        document.getElementById("menuDropdown").classList.add("hidden");
        updateUrl('learning', Array.from(selectedCategories));
    }

    document.getElementById("flashcardMode").onclick = () => {
        ensureSentencesAreSelected(); // 自動全選
        stopAllTimers();
        showFlashcardView();
        updateCurrentMode("閃卡");
        document.getElementById("menuDropdown").classList.add("hidden");
        updateUrl('flashcard', Array.from(selectedCategories));
    }

    document.getElementById("matchingGame").onclick = () => {
        ensureSentencesAreSelected(); // 自動全選
        stopAllTimers();
        showMatchingGame();
        updateCurrentMode("配對");
        document.getElementById("menuDropdown").classList.add("hidden");
        updateUrl('matching', Array.from(selectedCategories));
    }

    document.getElementById("quizGame").onclick = () => {
        ensureSentencesAreSelected(); // 自動全選
        stopAllTimers();
        showQuizGame();
        updateCurrentMode("測驗");
        document.getElementById("menuDropdown").classList.add("hidden");
        updateUrl('quiz', Array.from(selectedCategories));
    }

    document.getElementById("sortingGame").onclick = () => {
        ensureSentencesAreSelected(); // 自動全選
        stopAllTimers();
        showSortingGame();
        updateCurrentMode("排序");
        document.getElementById("menuDropdown").classList.add("hidden");
        updateUrl('sorting', Array.from(selectedCategories));
    }

    document.getElementById("closeResult").onclick = () => {
        document.getElementById("resultModal").classList.add("hidden");
    }
    document.getElementById("addToCollectionBtn").onclick = addToCollection;
    document.getElementById("removeFromCollectionBtn").onclick = removeFromCollection;
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
    // 移除閃卡鍵盤監聽
    if (flashcardKeyHandler) {
        document.removeEventListener('keydown', flashcardKeyHandler)
        flashcardKeyHandler = null
    }
}
// =================================================================
// 新增：拼音注音轉換工具 (Phonetic Conversion Utility)
// =================================================================
let pinyinToZhuyinMap = null;

/**
 * 建立一個從拼音到注音的映射表，並依拼音長度排序以確保轉換正確性。
 * @returns {Array<[string, string]>} 排序後的轉換陣列。
 */
function buildPinyinToZhuyinMap() {
    if (pinyinToZhuyinMap) return pinyinToZhuyinMap;

    const conversionPairs = [];
    // 從 arr_pz 全域變數中每兩個元素建立一個配對
    for (let i = 0; i < arr_pz.length; i += 2) {
        if (arr_pz[i] && arr_pz[i + 1] !== undefined) {
            conversionPairs.push([arr_pz[i], arr_pz[i + 1]]);
        }
    }

    // 關鍵步驟：依拼音長度從長到短排序，避免 "iang" 被 "ang" 錯誤地先轉換
    conversionPairs.sort((a, b) => b[0].length - a[0].length);

    pinyinToZhuyinMap = conversionPairs;
    return pinyinToZhuyinMap;
}

/**
 * 將拼音字串轉換為注音字串。
 * @param {string} pinyinString - 原始的拼音字串。
 * @returns {string} 轉換後的注音字串。
 */
function convertPinyinToZhuyin(pinyinString) {
    if (!pinyinString) return "";

    const map = buildPinyinToZhuyinMap();
    let result = pinyinString;

    // 規則：一個或多個連字號 (-) 取代為一個空格
    result = result.replace(/-+/g, ' ');

    // 依據預先排序好的映射表進行批次取代
    for (const [pinyin, zhuyin] of map) {
        // 使用 RegExp 的 'g' 旗標來取代所有出現的實例
        result = result.replace(new RegExp(pinyin, 'g'), zhuyin);
    }

    return result;
}
// =================================================================
const arr_pz = ["ainn","","iang","","iong","","iung","","uang","","inn","","eeu","","een","","eem","","eed","","eeb","","enn","","onn","","ang","","iag","","ied","","ien","","ong","","ung","","iid","","iim","","iin","","iab","","iam","","iau","","iog","","ieb","","iem","","ieu","","iug","","iun","","uad","","uai","","uan","","ued","","uen","","iui","","ioi","","iud","","ion","","iib","","ab","","ad","","ag","","ai","","am","","an","","au","","ed","","en","","eu","","ee","","oo","","er","","id","","in","","iu","","od","","og","","oi","","ud","","ug","","un","","em","","ii","","on","","ui","","eb","","io","","ia","","ib","","ie","","im","","ua","","bb","","a","","e","","i","","o","","u","","ng","","rh","","r","","zh","","ch","","sh","","b","","p","","m","","f","","d","","t","","n","","l","","g","","k","","h","","j","","q","","x","","z","","c","","s","","v",""];

// 啟動應用
init()