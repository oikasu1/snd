// =================================================================
// 全域設定 (Global Configuration)
// =================================================================
const config = {
    // Local Storage 的獨特前綴，避免衝突
    STORAGE_PREFIX: "hakkaLearningApp_v6_",


    // 【新增】GOOGLE 表單設定
    GOOGLE_FORM_CONFIG: {
        formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeAHb2ovqcJsQnOhuEqVjk_9ORt9mcfGvqvNpwBA7FgOCXTzw/formResponse", 
        nameField: "entry.390906906",      // 姓名
        idField: "entry.766582104",        // 班號/ID
        gameTypeField: "entry.1584239140",   // 遊戲類型 (文字: matching, quiz, sorting)
        scoreField: "entry.774071075",      // 分數 (數字)
        durationField: "entry.125296714",   // 遊戲時間 (秒) (數字)
        correctField: "entry.1437468126",    // 答對題數 (數字)
        incorrectField: "entry.998835752",  // 答錯題數 (數字)
        stepsField: "entry.928414443",      // 步數 (配對遊戲) (數字)
        accuracyField: "entry.500179980",   // 正確率 (%) (數字)
        settingsField: "entry.1928836665"    // 遊戲設定 (文字, JSON 格式)
    },

    // 慶祝動畫的表情符號
    CELEBRATION_EMOJIS: ["🌈", "🌟", "🎊", "🎉", "✨", "💖", "😍", "🥰"],


    // 彩色紙片慶祝特效的顏色列表
    CONFETTI_COLORS: ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800", "#FF5722"],


    // 連續答對觸發門檻
    STREAK_THRESHOLDS: {
        matching: 6, // 配對遊戲連續答對 6 組
        quiz: 5,     // 測驗遊戲連續答對 5 題
        sorting: 3   // 排序遊戲連續答對 3 題
    },
	
    // 預設設定
    DEFAULT_USER_SETTINGS: {
        fontSize: 20,
        flashcardFontSize: 28,
        layout: "double",  // double、single、精簡compact、3col、4col、table
        viewMode: "card",
        matchingLayout: '1col',
		matchingColumns: 2,
        quizLayout: 'horizontal',
        flashcardAutoPlayAudio: true,
		quizAutoPlayAudio: true,
		playPinyinOnClick: true,
        pinyinAnnotation: true,
        phoneticSystem: 'pinyin'
    },

    // 不同模式字體大小級距
    FONT_SIZES: {
        learning: [20, 22, 24, 26, 28, 30, 32],
        flashcard: [28, 32, 36, 40, 44, 48, 52, 56, 60]
    },

    // 學習紀錄最大保存筆數
    MAX_HISTORY_RECORDS: 100,

    // 音檔路徑設定
    AUDIO_PATHS: {
        // key 是副檔名 (不含點)，value 是對應的路徑
        "oikasu": "https://oikasu2.github.io/snd/oikasu/",
        "k100": "https://oikasu1.github.io/kasu100/",
        // 'mp3' 作為預設或後備路徑
        "mp3": "https://oikasu1.github.io/snd/oikasu/"
    },
};
// =================================================================


// 全域變數
let sentences = []
let categories = {}
let orderedCategories = [];
let currentUser = {
    id: "guest",
    name: "訪客",
    avatar: "K"
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

const avatarEmojis = [
    "😀", "😁", "😆", "🤣", "😊", "🥰", "🤩", "🤗", "🫣", "😶‍🌫️", 
    "😴", "🤠", "🥳", "😭", "👺", "👻", "😺", "😼", "💯", "💃", 
    "🕺", "🐵", "🐶", "🐺", "🦊", "🦁", "🐯", "🫎", "🦄", "🐘", 
    "🐰", "🐻", "🦥", "🐣", "🐦", "🐸", "🐲", "🐳", "🦖", "🦎", 
    "🐊", "🐡", "🪸", "🐛", "🐞", "🌱", "🌵", "🍄", "🌶️", "🍆", 
    "🍍", "🍉", "🥝", "🥯", "🍔", "🍿", "🍩", "🎂", "🧁", "🍭", 
    "🧋", "🧸", "🪅", "✨", "⚽", "⚾", "🏀", "🏐", "🏸", "🧑‍🎤", 
    "🧑‍🚀", "🏇", "🌍", "🧭", "🎠", "🎡", "🏍️", "🚗", "🚨", "🚦", 
    "🪂", "🚁", "🛸", "👑", "🪗", "🎸", "🎹", "🎻", "📸"
];

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
星期	📅
時間	⏰
比較	⚖️
活動	🎯
禮貌	🙏
算數	➕
認知	🧠
身份	🪪
關心	💖
顏色	🎨
鼓勵	💪
問好	👋
禮貌	🙏
姓名	📝
年紀	🎂
年級	🎒
身份	🪪
擁有	📦
星期	📅
時間	⏰
交通	🚌
住處	🏠
去向	➡️
排隊	🚶
動作	🤸
學習	📖
活動	🎯
比較	⚖️
算數	➕
顏色	🎨
認知	🧠
關心	💖
健康	🩺
感覺	😊
`;

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

    // 2. 根據選取的主題數量，決定顯示方式
    if (categoriesToSelect.length === 1) {
        const singleCategoryName = categoriesToSelect[0];
        showCategoryDetail(singleCategoryName);
    } else {
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
    if (selectedSentences.size === 0 && targetMode !== 'learning' && targetMode !== 'flashcard') {
        showResult("⚠️", "提醒", "所選主題內沒有可供練習的句子。");
        return true; 
    }

    // 讀取遊戲設定參數
    const gameParams = {
        lang: params.get('lang'),
        pairs: params.get('pairs'),
        options: params.get('options'),
        condition: params.get('condition')
    };

    switch (targetMode) {
        case 'flashcard':
            showFlashcardView();
            updateCurrentMode("閃卡");
            break;
        case 'matching':
            showMatchingGame();
            updateCurrentMode("配對");
            applyAndStartGameFromParams('matching', gameParams);
            break;
        case 'quiz':
            showQuizGame();
            updateCurrentMode("測驗");
            applyAndStartGameFromParams('quiz', gameParams);
            break;
        case 'sorting':
            showSortingGame();
            updateCurrentMode("排序");
            applyAndStartGameFromParams('sorting', gameParams);
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
                <span>❌</span>
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
    parseCatalog(); // Catalog is now available

    const tabKeys = Object.keys(catalog);
    let defaultTabName = tabKeys.find(tab => tab !== '收藏') || (tabKeys.length > 0 ? tabKeys[0] : "");

    loadUserSettings();

    // --- Start of new logic for parsing URL parameter ---
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');

    // 檢查 URL 中是否有 'type' 參數，如果有，則優先處理遊戲模式，忽略 'tab'
    if (!params.has('type')) {
        if (tabParam) {
            const tabIndex = parseInt(tabParam, 10);
            // 檢查 tabIndex 是否為有效數字且在可用頁籤的範圍內
            if (!isNaN(tabIndex) && tabIndex > 0 && tabIndex <= tabKeys.length) {
                // 根據 URL 中的 1-based 索引設定當前頁籤
                currentCatalogTab = tabKeys[tabIndex - 1];
            } else {
                console.warn(`URL 'tab' parameter "${tabParam}" is invalid. Falling back to default.`);
                currentCatalogTab = defaultTabName;
            }
        } else {
            currentCatalogTab = defaultTabName;
        }
    } else {
         currentCatalogTab = defaultTabName;
    }
    // --- End of new logic ---


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

    // 動態建立「收藏」頁籤
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

// 處理頁籤溢出
function renderCatalogTabs() {
    const tabsContainer = document.getElementById("catalogTabs");
    const moreTabsContainer = document.getElementById("moreTabsContainer");
    const moreTabsDropdown = document.getElementById("moreTabsDropdown");
    const container = document.getElementById("catalogTabsContainer");

    // 如果容器是隱藏的(寬度為0)，則不執行後續程式碼
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

    // 確保元素已渲染以進行寬度計算
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

    // --- Start of new logic for updating URL ---
    if (history.pushState) {
        const tabKeys = Object.keys(catalog);
        const tabIndex = tabKeys.indexOf(tabName) + 1; // 將 0-based 索引轉為 1-based

        if (tabIndex > 0) {
            const newUrl = `${window.location.pathname}?tab=${tabIndex}`;
            
            // 僅在 URL 發生變化時才更新，避免產生重複的歷史紀錄
            if (window.location.search !== `?tab=${tabIndex}`) {
                 history.pushState({ tab: tabIndex }, '', newUrl);
            }
        }
    }
    // --- End of new logic ---

    renderCatalogTabs();
    renderCategoryList();
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
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

    // 載入收藏的分類
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


function loadUserSettings() {
    const settingsKey = `${config.STORAGE_PREFIX}settings_${currentUser.id}`
    const settings = localStorage.getItem(settingsKey)
    if (settings) {
        userSettings = JSON.parse(settings)
    } else {
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

    // 為測驗模式的自動播放音效設定預設值
    if (userSettings.quizAutoPlayAudio === undefined) {
        userSettings.quizAutoPlayAudio = true;
    }

    if (userSettings.flashcardLoop === undefined) {
        userSettings.flashcardLoop = false;
    }

    if (userSettings.pinyinAnnotation === undefined) {
        userSettings.pinyinAnnotation = false;
    }

    if (userSettings.phoneticSystem === undefined) {
        userSettings.phoneticSystem = 'pinyin';
    }

    currentViewMode = userSettings.viewMode || "card"

    // 載入選取的分類
    const selectedKey = `${config.STORAGE_PREFIX}selected_${currentUser.id}`
    const selectedData = localStorage.getItem(selectedKey)
    if (selectedData) {
        selectedCategories = new Set(JSON.parse(selectedData))
    }

    // 載入星號紀錄 ---
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
    // 獲取所有需要更新的頭像和名稱元素
    const avatarElements = [
        document.getElementById("userAvatar"),
        document.getElementById("dropdownAvatar"),
        document.getElementById("userAvatarDetail"),
        document.getElementById("dropdownAvatarDetail")
    ].filter(el => el); // 過濾掉不存在的元素

    const nameElements = [
        document.getElementById("userName"),
        document.getElementById("dropdownName"),
        document.getElementById("userNameDetail"),
        document.getElementById("dropdownNameDetail")
    ].filter(el => el);

    const idElements = [
        document.getElementById("dropdownId"),
        document.getElementById("dropdownIdDetail")
    ].filter(el => el);

    // 更新姓名和ID
    nameElements.forEach(el => el.textContent = currentUser.name);
    idElements.forEach(el => el.textContent = `#${currentUser.id}`);

    // 檢查頭像是否為 Emoji
    const isEmoji = avatarEmojis.includes(currentUser.avatar);

    // 根據是否為 Emoji 來動態調整樣式
    avatarElements.forEach(el => {
        el.textContent = currentUser.avatar;
        if (isEmoji) {
            // 如果是 Emoji，移除背景色和文字顏色，並放大字體
            el.classList.remove('bg-blue-500', 'text-white', 'font-bold');
            if (el.id === 'userAvatar' || el.id === 'userAvatarDetail') {
                 el.style.fontSize = '1.75rem'; // ~28px
            } else { // dropdownAvatar
                 el.style.fontSize = '2.25rem'; // ~36px
            }
        } else {
            // 如果不是 Emoji (預設情況)，確保背景和文字顏色存在
            el.classList.add('bg-blue-500', 'text-white', 'font-bold');
            el.style.fontSize = ''; // 清除行內樣式，恢復 CSS 預設
        }
    });
    
    // --- 根據登入狀態更新按鈕 ---
    const editProfileBtn = document.getElementById("editProfile");
    const viewHistoryBtn = document.getElementById("viewHistory");
    const logoutBtn = document.getElementById("logout");
    
    const editProfileDetailBtn = document.getElementById("editProfileDetail");
    const viewHistoryDetailBtn = document.getElementById("viewHistoryDetail");
    const logoutDetailBtn = document.getElementById("logoutDetail");

    const isGuest = currentUser.id === 'guest';

    // 處理主選單的下拉選單
    if (logoutBtn) {
        if (isGuest) {
            logoutBtn.textContent = "登入";
            editProfileBtn.classList.add("text-gray-400", "cursor-not-allowed");
            editProfileBtn.disabled = true;
            viewHistoryBtn.classList.add("text-gray-400", "cursor-not-allowed");
            viewHistoryBtn.disabled = true;
        } else {
            logoutBtn.textContent = "登出";
            editProfileBtn.classList.remove("text-gray-400", "cursor-not-allowed");
            editProfileBtn.disabled = false;
            viewHistoryBtn.classList.remove("text-gray-400", "cursor-not-allowed");
            viewHistoryBtn.disabled = false;
        }
    }
    
    // 處理詳情頁的下拉選單
    if (logoutDetailBtn) {
        if (isGuest) {
            logoutDetailBtn.textContent = "登入";
            editProfileDetailBtn.classList.add("text-gray-400", "cursor-not-allowed");
            editProfileDetailBtn.disabled = true;
            viewHistoryDetailBtn.classList.add("text-gray-400", "cursor-not-allowed");
            viewHistoryDetailBtn.disabled = true;
        } else {
            logoutDetailBtn.textContent = "登出";
            editProfileDetailBtn.classList.remove("text-gray-400", "cursor-not-allowed");
            editProfileDetailBtn.disabled = false;
            viewHistoryDetailBtn.classList.remove("text-gray-400", "cursor-not-allowed");
            viewHistoryDetailBtn.disabled = false;
        }
    }
}

// 搜尋功能
function handleSearchInput(e) {
    // 將查詢中的一個或多個 '-' 替換為空格
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

    // 輔助函數：轉義正則表達式中的特殊字符
    const escapeRegex = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    // --- 規則 1: 彈性元音 (o/oo) 和聲調的正規表示式查詢 ---
    const createSearchRegex = (pattern, isToneInsensitive = false) => {
        // 先對輸入的 pattern 進行轉義，避免特殊字符干擾
        let regexPattern = escapeRegex(pattern);
        
        // **修正點：只對看起來像拼音的查詢應用 o/oo 規則**
        const isPinyinLike = /[a-z]/.test(regexPattern);
        if (isPinyinLike) {
            regexPattern = regexPattern.replace(/o/g, '(o|oo)');
        }

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
                // --- Start of Modification ---
                // 1. 在搜尋前，先移除客語欄位中的特殊造字
                const cleanHakkaText = sentence["客語"].replace(/[\uE166-\uE24B]/g, '');

                // 2. 使用清理過的客語文字來建立要搜尋的字串
                let searchText = `${cleanHakkaText} ${sentence["拼音"]} ${sentence["華語"]}`.toLowerCase().replace(/-+/g, ' ');
                // --- End of Modification ---

                if (isToneInsensitive) {
                    searchText = searchText.replace(/[ˊˇˋˆ]/g, ''); // 移除資料中的聲調
                }

                if (searchRegex.test(searchText)) {
                    foundResults.push({
                        type: "sentence",
                        title: sentence["客語"], // 顯示結果時，仍顯示原始的客語文字
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
    let categoryResults = [];
    let sentenceResults = [];

    // --- 搜尋分類 (分類搜尋不受聲調影響) ---
    const categorySearchRegex = createSearchRegex(query, false);
    if (categorySearchRegex) {
        Object.keys(categories).forEach((category) => {
            // 使用 .test() 進行比對
            if (categorySearchRegex.test(category)) {
                categoryResults.push({
                    type: "category",
                    title: category,
                    subtitle: `${categories[category].length} 句`,
                    data: category,
                });
            }
        });
    }

    // 1. 先進行包含聲調的標準查詢
    sentenceResults.push(...searchInSentences(false));

    // 2. 如果沒有句子結果，且使用者有輸入內容，則進行無聲調的後援查詢
    if (sentenceResults.length === 0 && query.trim() !== '') {
        const fallbackResults = searchInSentences(true);
        sentenceResults.push(...fallbackResults);
    }

    // 合併結果，主題優先
    let results = [...categoryResults, ...sentenceResults];

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
    const cleanName = categoryName.replace(/[0-9\s-]+/g, '');
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

    // 檢查「收藏」頁籤在移除後是否應被刪除
    const isCollectionNowEmpty = collectedCategories.size === 0 && starredCards.size === 0;

    // 重新解析目錄，這會移除空的「收藏」頁籤
    parseCatalog();

    if (isCollectionNowEmpty && currentCatalogTab === '收藏') {
        // 如果收藏已空且當前就在該頁籤，則跳轉到預設頁籤
        const defaultTabName = Object.keys(catalog).find(tab => tab !== '收藏') || (Object.keys(catalog).length > 0 ? Object.keys(catalog)[0] : "");

        if (defaultTabName) {
            selectCatalogTab(defaultTabName); // selectCatalogTab 會自動處理畫面渲染
        } else {
            // 備用：如果沒有其他頁籤，就只渲染空的畫面
            renderCategoryList();
            renderCatalogTabs();
        }
    } else {
        // 如果收藏未空，或使用者不在收藏頁籤，則正常刷新當前畫面即可
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
  
  // 使用更嚴謹的方式來清除舊的暫存分類
  Object.keys(categories).forEach(key => {
    // 確保只刪除由數字開頭的暫存主題，例如 "4主題", "3/4主題"
    if (key.endsWith("主題") && !isNaN(parseInt(key, 10))) {
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

    // 【圖示顯示的是你將要切換到的模式
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
  if (categories[category]) {
      categories[category].forEach((_, index) => {
        selectedSentences.add(index)
      })
  }


  document.getElementById("mainMenu").classList.add("hidden")
  document.getElementById("categoryDetail").classList.remove("hidden")

  const categoryTitleContainer = document.getElementById("categoryTitleContainer");
  
  // 放寬判斷條件，只要以「主題」結尾就渲染互動式標題
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

    // 解析初始的主題總數
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

    // 讀取初始總數，並產生新的標題格式
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
    
    // --- MODIFICATION START ---
    let hakkaSegments;
    // 整合您提供的邏輯：如果客語字串沒有空格且包含特殊注音字元，則為其加上空格再分割。
    if (hakkaText.split(/\s+/).length === 1 && /[\uE166-\uE24B]/.test(hakkaText)) {
        let processedText = hakkaText.replace(/([\uE166-\uE24B]+)(?=\S|$)/g, "$1 ").trim();
        hakkaSegments = processedText.split(/\s+/);
    } else {
        // 其他情況則維持原樣，按單一字元分割，以處理普通漢字。
        hakkaSegments = Array.from(hakkaText);
    }
    // --- MODIFICATION END ---

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

    // --- MODIFICATION START ---
    // 將 forEach 的迭代對象從 hakkaChars 改為新的 hakkaSegments
    hakkaSegments.forEach(char => {
    // --- MODIFICATION END ---
        const currentPinyin = pinyinSegments[pinyinIndex];
        let pinyinForDisplay = currentPinyin;

        // 如果啟用注音，轉換顯示文字
        if (userSettings.phoneticSystem === 'zhuyin' && pinyinForDisplay) {
            pinyinForDisplay = convertPinyinToZhuyin(pinyinForDisplay);
        }
        
        // 準備 onclick 事件的內容
        let rubyAttributes = '';
        // 只有當啟用點擊播放、有對應拼音、且當前字元不是標點符號時，才加上點擊事件
        if (userSettings.playPinyinOnClick && currentPinyin && !/[，。？！；：、（）]/.test(char)) {
            const safePinyin = currentPinyin.replace(/'/g, "\\'");
            // 將 class 和 onclick 屬性一起加上，讓整個 ruby 元素都能點擊並有 hover 效果
            rubyAttributes = `class="pinyin-word" onclick="window.PinyinAudio.kasu(this, '${safePinyin}')"`;
        }

        if (/[，。？！；：、（）]/.test(char)) {
            if (pinyinIndex < pinyinSegments.length && (currentPinyin === char || punctuationMap[currentPinyin] === char)) {
                resultHtml += `<ruby><rb>${char}</rb><rt>${pinyinForDisplay}</rt></ruby>`;
                pinyinIndex++;
            } else {
                resultHtml += `<span>${char}</span>`;
            }
        } else if (pinyinIndex < pinyinSegments.length) {
            // 將點擊事件屬性 rubyAttributes 加到 <ruby> 標籤上
            resultHtml += `<ruby ${rubyAttributes}><rb>${char}</rb><rt>${pinyinForDisplay}</rt></ruby>`;
            pinyinIndex++;
        } else {
            resultHtml += `<span>${char}</span>`;
        }
    });

    return resultHtml;
}


/**
 * 播放音檔，並可選擇性地更新按鈕圖示。
 * 此版本會根據原始副檔名查找路徑，但一律播放 .mp3 檔案。
 * @param {string} filename - 要播放的音檔名稱 (例如 "oikasu-k1-001.mp3" 或 "k016.k100")。
 * @param {HTMLElement} [iconElement=null] - (可選) 要更新的 Material Icons 元素。
 * @returns {Promise<void>} - 一個在音檔播放完畢時解析的 Promise。
 */
function playAudio(filename, iconElement = null) {
    // 停止任何正在播放的音檔，防止重疊
    if (currentAudio) {
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

        // --- 動態決定音檔路徑 ---
        const parts = filename.split('.');
        const hasExtension = parts.length > 1;
        
        // 取得原始副檔名用於查找路徑，如果沒有則預設為 'mp3'
        const originalExtension = hasExtension ? parts[parts.length - 1].toLowerCase() : 'mp3';
        
        // 從 config 中尋找對應的路徑，如果找不到，則使用 'mp3' 的路徑作為後備
        const basePath = config.AUDIO_PATHS[originalExtension] || config.AUDIO_PATHS['mp3'];
        
        // 取得不含副檔名的檔名主體
        const filenameBody = hasExtension ? parts.slice(0, -1).join('.') : filename;
        
        // 組成最終要播放的 .mp3 檔案路徑
        const audioUrl = `${basePath}${filenameBody}.mp3`;

        const audio = new Audio(audioUrl);
        currentAudio = audio;

        if (iconElement) {
            currentPlayingIcon = iconElement;
            originalIconContent = iconElement.textContent;
            iconElement.textContent = 'graphic_eq';
        }

        const cleanupAndResolve = () => {
            if (iconElement && currentPlayingIcon === iconElement) {
                iconElement.textContent = originalIconContent;
                currentPlayingIcon = null;
            }
            audio.onended = null;
            audio.onerror = null;
            resolve();
        };

        audio.onended = cleanupAndResolve;
        audio.onerror = () => {
            console.error(`音檔播放失敗: ${audioUrl}`);
            cleanupAndResolve();
        };

        audio.play().catch(e => {
            console.error(`音檔播放命令失敗:`, e);
            cleanupAndResolve();
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
    element.classList.add("celebration");
    setTimeout(() => element.classList.remove("celebration"), 800);

    // 安全邊界距離，避免太靠近邊緣
    const margin = 100;

    // 隨機表情符號特效
    const emoji = config.CELEBRATION_EMOJIS[
        Math.floor(Math.random() * config.CELEBRATION_EMOJIS.length)
    ];
    const emojiElement = document.createElement("div");
    emojiElement.className = "emoji-celebration";
    emojiElement.textContent = emoji;

    // 限制隨機位置在 margin 內
    const left = Math.random() * (window.innerWidth - margin * 2) + margin;
    const top = Math.random() * (window.innerHeight - margin * 2) + margin;

    emojiElement.style.left = `${left}px`;
    emojiElement.style.top = `${top}px`;

    document.body.appendChild(emojiElement);

    setTimeout(() => emojiElement.remove(), 2000);
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

    contentArea.innerHTML = `
        <div id="learningModeToolbar" class="sticky top-0 z-20 bg-gray-50/80 backdrop-blur-sm border-b border-gray-200 mb-6 py-1 px-3">
            <div class="max-w-6xl mx-auto flex flex-wrap items-center justify-start gap-x-6 gap-y-2" role="toolbar">
                
                <div class="flex items-center gap-4">
                    <button id="enableLearningSelect" title="啟用選取模式" class="control-button">
                        <span class="material-icons !text-lg">check_box_outline_blank</span>
                        <span class="hidden md:inline text-sm">選取</span>
                    </button>
                    <div id="learningSelectActions" class="hidden items-center gap-4">
                        <button id="disableLearningSelect" title="關閉選取模式" class="control-button active">
                            <span>❌</span>
                            <span class="hidden md:inline text-sm">關閉</span>
                        </button>
                        <button id="learningSelectAll" title="全選/取消全選" class="control-button">
                            <span class="material-icons !text-lg">select_all</span>
                            <span class="hidden md:inline text-sm">勾選</span>
                        </button>
                        <div class="relative">
                            <button id="starMenuToggle" title="星號操作" class="control-button">
                                <span class="material-icons !text-lg">star_outline</span>
                                <span class="hidden md:inline text-sm">星號</span>
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

                <div id="learningModeStandardControls" class="flex flex-wrap items-center gap-x-6 gap-y-2">

                    <div class="flex items-center gap-4 border-l border-gray-300 pl-6">
                         <div class="relative">
                            <button id="displayMenuToggle" class="control-button" title="顯示設定">
                                <span class="material-icons !text-lg">visibility</span>
                                <span class="hidden md:inline text-sm">顯示</span>
                            </button>
                            <div id="displayMenu" class="hidden absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10 py-1">
                                <button id="hideHakka" title="客語" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700">
                                    <span class="material-icons text-base mr-3 w-5 text-center">visibility</span>
                                    <span>客語</span>
                                </button>
                                <button id="hidePinyin" title="拼音" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700">
                                    <span class="material-icons text-base mr-3 w-5 text-center">visibility</span>
                                    <span>拼音</span>
                                </button>
                                <button id="hideChinese" title="華語" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700">
                                    <span class="material-icons text-base mr-3 w-5 text-center">visibility</span>
                                    <span>華語</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-4 border-l border-gray-300 pl-6">
                        <div class="relative">
                            <button id="annotationMenuToggle" class="control-button" title="標音位置">
                                <span class="material-icons !text-lg">title</span>
                                <span class="hidden md:inline text-sm">音位</span>
                            </button>
                            <div id="annotationMenu" class="hidden absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10 py-1">
                                <button data-setting="pinyinAnnotation" data-value="true" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700 setting-option">
                                    <span class="material-icons check-icon w-6 mr-1"></span>
                                    <span class="material-icons text-base mr-2">text_rotate_up</span>
                                    <span>標在字上</span>
                                </button>
                                <button data-setting="pinyinAnnotation" data-value="false" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700 setting-option">
                                    <span class="material-icons check-icon w-6 mr-1"></span>
                                    <span class="material-icons text-base mr-2">text_rotation_none</span>
                                    <span>獨立一行</span>
                                </button>
                            </div>
                        </div>
                        <div class="relative">
                            <button id="phoneticMenuToggle" class="control-button" title="拼音注音">
                                <span class="material-icons !text-lg">translate</span>
                                <span class="hidden md:inline text-sm">拼注</span>
                            </button>
                            <div id="phoneticMenu" class="hidden absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10 py-1">
                                <button data-setting="phoneticSystem" data-value="pinyin" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700 setting-option">
                                    <span class="material-icons check-icon w-6 mr-1"></span>
                                    <span class="material-icons text-base mr-2">text_fields</span>
                                    <span>拼音</span>
                                </button>
                                <button data-setting="phoneticSystem" data-value="zhuyin" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700 setting-option">
                                    <span class="material-icons check-icon w-6 mr-1"></span>
                                    <span class="material-icons text-base mr-2">sticky_note_2</span>
                                    <span>注音</span>
                                </button>
                            </div>
                        </div>
                        <div class="relative">
                            <button id="clickPlayMenuToggle" class="control-button" title="點音播放">
                                <span class="material-icons !text-lg">touch_app</span>
                                <span class="hidden md:inline text-sm">點播</span>
                            </button>
                            <div id="clickPlayMenu" class="hidden absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10 py-1">
                                <button data-setting="playPinyinOnClick" data-value="true" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700 setting-option">
                                    <span class="material-icons check-icon w-6 mr-1"></span>
                                    <span class="material-icons text-base mr-2">music_note</span>
                                    <span>啟用點音播放</span>
                                </button>
                                <button data-setting="playPinyinOnClick" data-value="false" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700 setting-option">
                                    <span class="material-icons check-icon w-6 mr-1"></span>
                                    <span class="material-icons text-base mr-2">music_off</span>
                                    <span>關閉點音播放</span>
                                </button>
                            </div>
                        </div>
                    </div>

                   
                    <div class="flex items-center gap-4 border-l border-gray-300 pl-6">
                        <div class="relative">
                            <button id="layoutMenuToggle" class="control-button" title="切換版面">
                                <span id="layoutIcon" class="material-icons !text-lg"></span>
                                <span class="hidden md:inline text-sm">版面</span>
                            </button>
                            <div id="layoutMenu" class="hidden absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10 py-1">
                                <button data-layout="double" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700 layout-option">
                                    <span class="material-icons check-icon w-6 mr-1"></span>
                                    <span class="material-icons text-base mr-2">view_column</span>
                                    <span>雙欄</span>
                                </button>
                                <button data-layout="single" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700 layout-option">
                                    <span class="material-icons check-icon w-6 mr-1"></span>
                                    <span class="material-icons text-base mr-2">view_agenda</span>
                                    <span>單欄</span>
                                </button>
                                <button data-layout="compact" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700 layout-option">
                                    <span class="material-icons check-icon w-6 mr-1"></span>
                                    <span class="material-icons text-base mr-2">view_list</span>
                                    <span>精簡</span>
                                </button>
                                <div class="border-t my-1 mx-2"></div>
                                <button data-layout="3col" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700 layout-option">
                                    <span class="material-icons check-icon w-6 mr-1"></span>
                                    <span class="material-icons text-base mr-2">view_module</span>
                                    <span>三欄</span>
                                </button>
                                <button data-layout="4col" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700 layout-option">
                                    <span class="material-icons check-icon w-6 mr-1"></span>
                                    <span class="material-icons text-base mr-2">grid_view</span>
                                    <span>四欄</span>
                                </button>
                                <div class="border-t my-1 mx-2"></div>
                                <button data-layout="table" class="w-full text-left px-3 py-2 flex items-center hover:bg-gray-100 text-sm text-gray-700 layout-option">
                                    <span class="material-icons check-icon w-6 mr-1"></span>
                                    <span class="material-icons text-base mr-2">table_view</span>
                                    <span>表格</span>
                                </button>
                            </div>
                        </div>
                        <div class="relative">
                            <button id="fontSizeMenuToggle" class="control-button" title="調整字體">
                                <span class="material-icons !text-lg">format_size</span>
                                <span class="hidden md:inline text-sm">字體</span>
                            </button>
                            <div id="fontSizeMenu" class="hidden absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10 p-1">
                                <div class="grid grid-cols-2 gap-1">
                                ${config.FONT_SIZES.learning.map(size => `
                                    <button data-size="${size}" class="w-full flex items-center justify-start px-3 py-1.5 hover:bg-gray-100 text-sm rounded-md font-size-option">
                                        <span class="material-icons check-icon w-6 mr-1"></span>
                                        <span>${size}px</span>
                                    </button>
                                `).join('')}
                                </div>
                            </div>
                        </div>
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

    // 1. 先建立一個基礎的 class 陣列
    let containerClasses = [];
    if (isLearningSelectMode) {
        containerClasses.push("learning-select-active");
    }
    if (userSettings.pinyinAnnotation) {
        // 確保 pinyin-annotated class 能在任何版面模式下都被加入
        containerClasses.push("pinyin-annotated");
    }


    if (userSettings.layout === 'table') {
        // 2. 將表格模式專用的 class 加入陣列後再設定
        container.className = containerClasses.concat([
            'table-responsive-wrapper', 'bg-white', 'rounded-xl', 'shadow-sm', 'border'
        ]).join(' ');

        if (!sentences) {
            container.innerHTML = "";
            return;
        }

        let tableHtml = `<table class="learning-table" style="font-size: ${userSettings.fontSize * 0.9}px;">
            <thead>
                <tr>
                    <th class="col-index">#</th>
                    <th class="col-actions">操作</th>
                    <th class="col-hakka" style="font-size: ${userSettings.fontSize}px">客語</th>
                    <th class="col-pinyin">拼音</th>
                    <th class="col-chinese">華語</th>
                </tr>
            </thead>
            <tbody>`;
        
        sentences.forEach((sentence, index) => {
            const isSelected = selectedSentences.has(index);
            const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
            const isStarred = starredCards.has(sentenceId);
            const starIcon = isStarred ? 'star' : 'star_border';
            const originalPinyin = sentence["拼音"];
            const pinyinDisplayHtml = createClickablePhoneticHtml(originalPinyin);
            const annotatedHakka = annotateHakkaText(sentence["客語"], originalPinyin, userSettings.pinyinAnnotation);

            tableHtml += `
                <tr>
                    <td class="text-gray-500 font-mono">${index + 1}</td>
                    <td>
                        <div class="flex items-center gap-1">
                            <input type="checkbox" class="sentence-checkbox w-4 h-4 text-blue-600 rounded" 
                                   ${isSelected ? "checked" : ""} 
                                   onchange="toggleSentenceSelection(${index}, this.checked)">
                            <button onclick="playAudio('${sentence["音檔"]}', this.querySelector('.material-icons'))" class="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                <span class="material-icons text-lg">volume_up</span>
                            </button>
                            <button onclick="toggleStar(${index})" class="learning-star-btn" title="標示星號">
                                <span class="material-icons ${isStarred ? 'text-yellow-400' : 'text-gray-400'}">${starIcon}</span>
                            </button>
                        </div>
                    </td>
                    <td class="hakka-text text-blue-800" style="font-size: ${userSettings.fontSize}px">${annotatedHakka}</td>
                    <td class="pinyin-text text-gray-600">${pinyinDisplayHtml}</td>
                    <td class="chinese-text text-gray-800">${sentence["華語"]}</td>
                </tr>
            `;
        });

        tableHtml += `</tbody></table>`;
        container.innerHTML = tableHtml;
        
        // After rendering, apply visibility based on select mode
        document.querySelectorAll('.sentence-checkbox').forEach(cb => {
            cb.style.display = isLearningSelectMode ? 'block' : 'none';
        });

    } else { // Keep original logic for other layouts
        // 3. 將其他版面模式的 class 加入陣列後再設定
        if (userSettings.layout === "double" && window.innerWidth >= 1024) {
            containerClasses.push("grid", "grid-cols-1", "lg:grid-cols-2", "gap-4");
        } else if (userSettings.layout === "3col") {
            containerClasses.push("grid", "grid-cols-2", "md:grid-cols-3", "gap-2");
        } else if (userSettings.layout === "4col") {
            containerClasses.push("grid", "grid-cols-2", "sm:grid-cols-3", "md:grid-cols-4", "gap-2");
        } else if (userSettings.layout === "single" || (userSettings.layout === "double" && window.innerWidth < 1024)) {
            containerClasses.push("grid", "grid-cols-1", "gap-4");
        } else { // compact layout
            containerClasses.push("bg-white", "rounded-xl", "shadow-sm", "border");
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
                    if (e.target.closest('button, input, .pinyin-word')) return;
                    toggleSentenceSelection(index, !isSelected);
                    renderSentences();
                };
            }

            const originalPinyin = sentence["拼音"];
            const pinyinDisplayHtml = createClickablePhoneticHtml(originalPinyin);
            const annotatedHakka = annotateHakkaText(sentence["客語"], originalPinyin, userSettings.pinyinAnnotation);

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
                const cardPadding = (userSettings.layout === '3col' || userSettings.layout === '4col') ? 'p-4' : 'p-4';
                sentenceItem.className += ` sentence-card bg-white rounded-xl shadow-sm ${cardPadding}`;
                sentenceItem.innerHTML = `
                <div class="flex items-start justify-between mb-3">
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
    }

    const toggleAnnotationBtn = document.getElementById("togglePinyinAnnotation");
    if (toggleAnnotationBtn) {
        toggleAnnotationBtn.classList.toggle("annotation-active", userSettings.pinyinAnnotation);
    }

    updateSelectAllButtonState();
}

function setupLearningControls() {
    const hideStates = { hakka: "show", pinyin: "show", chinese: "show" };
    const enableBtn = document.getElementById("enableLearningSelect");
    const disableBtn = document.getElementById("disableLearningSelect");
    const actionsContainer = document.getElementById("learningSelectActions");
    const standardControls = document.getElementById("learningModeStandardControls");

    const toggleLearningSelectMode = (enable) => {
        isLearningSelectMode = enable;
        if (enable) {
            enableBtn.classList.add("hidden");
            actionsContainer.classList.remove("hidden");
            actionsContainer.classList.add("flex");
            standardControls.classList.add("hidden"); // 隱藏其他按鈕
            selectedSentences.clear();
            categories[currentCategory].forEach((_, index) => selectedSentences.add(index));
        } else {
            if (selectedSentences.size === 0) {
                categories[currentCategory].forEach((_, index) => selectedSentences.add(index));
            }
            enableBtn.classList.remove("hidden");
            actionsContainer.classList.add("hidden");
            actionsContainer.classList.remove("flex");
            standardControls.classList.remove("hidden"); // 顯示其他按鈕
        }
        renderSentences();
        updateSelectAllButtonState();
    };

    enableBtn.onclick = () => toggleLearningSelectMode(true);
    disableBtn.onclick = () => toggleLearningSelectMode(false);

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
        updateSelectAllButtonState();
    };

    // --- Helper function to manage multiple dropdowns ---
    const dropdowns = [
        { toggle: 'starMenuToggle', menu: 'starMenu' },
        { toggle: 'annotationMenuToggle', menu: 'annotationMenu' },
        { toggle: 'phoneticMenuToggle', menu: 'phoneticMenu' },
        { toggle: 'clickPlayMenuToggle', menu: 'clickPlayMenu' },
        { toggle: 'displayMenuToggle', menu: 'displayMenu' },
        { toggle: 'layoutMenuToggle', menu: 'layoutMenu' },
        { toggle: 'fontSizeMenuToggle', menu: 'fontSizeMenu' },
    ];

    const closeAllDropdowns = (exceptMenuId = null) => {
        dropdowns.forEach(d => {
            const menu = document.getElementById(d.menu);
            if (menu && d.menu !== exceptMenuId) {
                menu.classList.add('hidden');
            }
        });
    };

    dropdowns.forEach(d => {
        const toggleBtn = document.getElementById(d.toggle);
        const menu = document.getElementById(d.menu);
        if (toggleBtn && menu) {
            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                const isHidden = menu.classList.contains('hidden');
                closeAllDropdowns();
                if (isHidden) {
                    menu.style.visibility = 'hidden';
                    menu.classList.remove('hidden');
                    const menuRect = menu.getBoundingClientRect();
                    menu.style.visibility = '';
                    menu.classList.add('hidden');

                    const btnRect = toggleBtn.getBoundingClientRect();
                    
                    menu.classList.remove('left-0', 'right-0');

                    if ((btnRect.right - menuRect.width) < 0) {
                        menu.classList.add('left-0');
                    } else {
                        menu.classList.add('right-0');
                    }
                    
                    menu.classList.remove('hidden');
                }
            };
        }
    });

    document.addEventListener('click', () => closeAllDropdowns());
    dropdowns.forEach(d => {
        const menu = document.getElementById(d.menu);
        menu?.addEventListener('click', e => e.stopPropagation());
    });

    // --- New Dropdown Logic ---
    const updateLearningControlsUI = () => {
        // Update setting options (annotation, phonetic, clickPlay)
        document.querySelectorAll('.setting-option').forEach(button => {
            const setting = button.dataset.setting;
            const value = button.dataset.value === 'true' ? true : button.dataset.value === 'false' ? false : button.dataset.value;
            const checkIcon = button.querySelector('.check-icon');
            if (userSettings[setting] === value) {
                button.classList.add('active');
                checkIcon.textContent = 'check';
            } else {
                button.classList.remove('active');
                checkIcon.textContent = '';
            }
        });

        // Update layout options
        const layoutIcon = document.getElementById('layoutIcon');
        document.querySelectorAll('.layout-option').forEach(button => {
            const layout = button.dataset.layout;
            const checkIcon = button.querySelector('.check-icon');
            if (userSettings.layout === layout) {
                button.classList.add('active');
                checkIcon.textContent = 'check';
            } else {
                button.classList.remove('active');
                checkIcon.textContent = '';
            }
        });
        if (layoutIcon) {
           switch(userSettings.layout) {
                case "double": layoutIcon.textContent = "view_column"; break;
                case "single": layoutIcon.textContent = "view_agenda"; break;
                case "compact": layoutIcon.textContent = "view_list"; break;
                case "3col": layoutIcon.textContent = "view_module"; break;
                case "4col": layoutIcon.textContent = "grid_view"; break;
                case "table": layoutIcon.textContent = "table_view"; break;
                default: layoutIcon.textContent = "view_agenda"; break;
           }
        }
        
        // Update font size options
        document.querySelectorAll('.font-size-option').forEach(button => {
            const size = parseInt(button.dataset.size, 10);
            const checkIcon = button.querySelector('.check-icon');
            if (userSettings.fontSize === size) {
                button.classList.add('active');
                checkIcon.textContent = 'check';
            } else {
                button.classList.remove('active');
                checkIcon.textContent = '';
            }
        });
    };

    // Generic handler for setting options
    document.querySelectorAll('.setting-option').forEach(button => {
        button.onclick = () => {
            const setting = button.dataset.setting;
            const value = button.dataset.value === 'true' ? true : button.dataset.value === 'false' ? false : button.dataset.value;
            
            if (userSettings[setting] !== value) {
                userSettings[setting] = value;
                saveUserSettings();
                renderSentences();
                updateLearningControlsUI();
            }
            closeAllDropdowns();
        };
    });

    // Layout options handler
    document.querySelectorAll('.layout-option').forEach(button => {
        button.onclick = () => {
            const layout = button.dataset.layout;
            if (userSettings.layout !== layout) {
                userSettings.layout = layout;
                saveUserSettings();
                showLearningView();
            }
            closeAllDropdowns();
        };
    });

    // Font size options handler
    document.querySelectorAll('.font-size-option').forEach(button => {
        button.onclick = () => {
            const size = parseInt(button.dataset.size, 10);
            if (userSettings.fontSize !== size) {
                userSettings.fontSize = size;
                saveUserSettings();
                renderSentences();
                updateLearningControlsUI();
            }
            closeAllDropdowns();
        };
    });
    
    document.getElementById("starSelected").onclick = () => {
        categories[currentCategory].forEach(sentence => {
            if (!sentence) return;
            const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
            starredCards.add(sentenceId);
        });
        saveStarredCards();
        renderSentences();
        closeAllDropdowns();
    };

    document.getElementById("unstarSelected").onclick = () => {
        categories[currentCategory].forEach(sentence => {
            if (!sentence) return;
            const sentenceId = sentence["ID"] || `${sentence["分類"]}_${sentence["華語"]}`;
            starredCards.delete(sentenceId);
        });
        saveStarredCards();
        renderSentences();
        closeAllDropdowns();
    };

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
                case "show": button.title = `${label}顯示`; icon.textContent = "visibility"; break;
                case "blur": elements.forEach((el) => el.classList.add("blur-text")); button.classList.add("bg-yellow-100", "text-yellow-700"); button.title = `${label}模糊`; icon.textContent = "blur_on"; break;
                case "hide": elements.forEach((el) => el.classList.add("hidden-text")); button.classList.add("bg-red-100", "text-red-700"); button.title = `${label}隱藏`; icon.textContent = "visibility_off"; break;
            }
        };
    };
    setupHideButton("hideHakka", "hakka-text", "hakka", "客語");
    setupHideButton("hidePinyin", "pinyin-text", "pinyin", "拼音");
    setupHideButton("hideChinese", "chinese-text", "chinese", "華語");

    updateLearningControlsUI();
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
        icon.textContent = 'check_box'; 
        selectAllButton.title = '取消全選';
    } else {
        icon.textContent = 'select_all'; 
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
    <div class="max-w-5xl mx-auto pt-4">
        <div id="flashcardContainer" class="bg-white rounded-xl shadow-lg p-8 mb-4 relative overflow-hidden">
            <div class="absolute top-4 left-4 z-10">
                <div class="flex items-center gap-1">
                     <label for="flashcardAutoPlayAudio" class="flex items-center gap-1 p-1.5 rounded-md hover:bg-gray-200 cursor-pointer setting-btn" title="自動播音">
                        <input type="checkbox" id="flashcardAutoPlayAudio" class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300">
                        <span class="material-icons text-gray-600 !text-xl align-middle">volume_up</span>
                    </label>
                    <button id="toggleFlashcardAnnotation" class="setting-btn" title="標音設定 (U)">
                        <span class="material-icons">text_rotation_none</span>
                    </button>
                    <button id="toggleFlashcardPhoneticSystem" class="setting-btn" title="切換拼音/注音 (Y)">
                        <span class="material-icons">translate</span>
                    </button>
                </div>
            </div>

            <div id="progressBarContainer" class="absolute top-0 left-0 w-full h-1.5">
                <div id="progressBar" class="bg-purple-500 h-full transition-all duration-300" style="width: 0%"></div>
            </div>

            <div class="absolute top-4 right-4 flex items-center gap-1 z-10">
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
                <div class="w-px h-4 bg-gray-300 mx-1"></div>
                <button onclick="adjustFontSize(-1, 'flashcard')" class="setting-btn" title="縮小字體 (-)">
                    <span class="material-icons">text_decrease</span>
                </button>
                <button onclick="adjustFontSize(1, 'flashcard')" class="setting-btn" title="加大字體 (+)">
                    <span class="material-icons">text_increase</span>
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

    let pinyinDisplay = sentence["拼音"];
    if (userSettings.phoneticSystem === 'zhuyin') {
        pinyinDisplay = convertPinyinToZhuyin(pinyinDisplay);
    }
    const annotatedHakka = annotateHakkaText(sentence["客語"], pinyinDisplay, userSettings.pinyinAnnotation);

    hakkaTextEl.innerHTML = annotatedHakka;
    pinyinTextEl.textContent = pinyinDisplay;
    chineseTextEl.textContent = sentence["華語"];
    document.getElementById("cardCounter").textContent = `${currentCardIndex + 1} / ${flashcardSentences.length}`;

    // 根據標音狀態，切換容器的 class
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

    // 更新卡片內部導航按鈕的禁用狀態
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

    const annotationButton = document.getElementById("toggleFlashcardAnnotation");
    if (annotationButton) {
        const updateAnnotationButtonState = () => {
            const icon = annotationButton.querySelector('.material-icons');
            if (userSettings.pinyinAnnotation) {
                annotationButton.classList.add('active');
                icon.textContent = 'text_rotate_up';
                annotationButton.title = "標音在字上 (U)";
            } else {
                annotationButton.classList.remove('active');
                icon.textContent = 'text_rotation_none';
                annotationButton.title = "拼音獨立一行 (U)";
            }
        };
        updateAnnotationButtonState();
        annotationButton.onclick = () => {
            userSettings.pinyinAnnotation = !userSettings.pinyinAnnotation;
            saveUserSettings();
            updateFlashcard();
            updateAnnotationButtonState();
        };
    }

    const phoneticButton = document.getElementById("toggleFlashcardPhoneticSystem");
    if (phoneticButton) {
        const updatePhoneticButtonState = () => {
            phoneticButton.classList.toggle('active', userSettings.phoneticSystem === 'zhuyin');
            phoneticButton.title = userSettings.phoneticSystem === 'pinyin' ? '切換為注音 (Y)' : '切換為拼音 (Y)';
        };
        updatePhoneticButtonState();
        phoneticButton.onclick = () => {
            userSettings.phoneticSystem = userSettings.phoneticSystem === 'pinyin' ? 'zhuyin' : 'pinyin';
            saveUserSettings();
            updateFlashcard();
            updatePhoneticButtonState();
        };
    }

    const popups = [{
            btn: autoPlayButton,
            menu: autoPlayPopup
        },
        {
            btn: filterButton,
            menu: filterPopup
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
                    saveStarredCards();
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
        if (isAutoplayLooping) {
            repeatButton.classList.add("active");
            repeatButton.title = "取消循環";
        } else {
            repeatButton.classList.remove("active");
            repeatButton.title = "循環播放";
        }

        repeatButton.onclick = () => {
            isAutoplayLooping = !isAutoplayLooping;
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
        saveStarredCards();
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
            case '+':
            case '=':
                event.preventDefault();
                adjustFontSize(1, 'flashcard');
                break;
            case '-':
                event.preventDefault();
                adjustFontSize(-1, 'flashcard');
                break;
            case 'u':
                event.preventDefault();
                if (document.getElementById('toggleFlashcardAnnotation')) {
                    document.getElementById('toggleFlashcardAnnotation').click();
                }
                break;
            case 'y':
                event.preventDefault();
                if (document.getElementById('toggleFlashcardPhoneticSystem')) {
                    document.getElementById('toggleFlashcardPhoneticSystem').click();
                }
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
                        
                        <button id="stopMatching" class="hidden bg-red-500 hover:bg-red-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-colors" title="停止遊戲">
                            <span class="material-icons !text-xl">close</span>
                        </button>

                        <div id="matchingOptions" class="flex items-center flex-wrap gap-2">
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
                        </div>
                        <div id="matchingTimer" class="text-lg font-mono text-gray-700 min-w-[5rem] text-center">00:00</div>
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
                                <span class="material-icons text-gray-600 !text-xl align-middle">translate</span>
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
                
                <div id="matchingStartNotice" class="text-center py-20 text-gray-500 min-h-[300px] flex flex-col justify-center items-center">
                    <button id="startMatchingGameBtn" class="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-xl flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        <span class="material-icons">play_circle</span>
                        <span>開始配對</span>
                    </button>
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
        streak: 0, // 【新增】連續答對計數器
        timeLeft: 0,
        timerInterval: null,
        gameData: [],
        // 根據螢幕寬度設定預設欄數，手機版為1，電腦版為2
        columnsPerSide: isMobile ? 1 : (userSettings.matchingColumns || 2),
    }

    const layoutToggleButton = document.getElementById("matchingLayoutToggle");
    if (layoutToggleButton) {
        // 統一圖示邏輯
        const icon = layoutToggleButton.querySelector(".material-icons");
        icon.textContent = matchingGameState.columnsPerSide === 1 ? 'view_column' : 'view_agenda';
    }
    
    // 將事件監聽器綁定到新的按鈕上
    document.getElementById("startMatchingGameBtn").onclick = startMatchingGame;
    document.getElementById("stopMatching").onclick = stopMatchingGame; // 新增停止按鈕的監聽

    layoutToggleButton.onclick = () => {
        matchingGameState.columnsPerSide = matchingGameState.columnsPerSide === 1 ? 2 : 1;

        const icon = layoutToggleButton.querySelector(".material-icons");
        // 統一圖示邏輯
        icon.textContent = matchingGameState.columnsPerSide === 1 ? 'view_column' : 'view_agenda';

        userSettings.matchingColumns = matchingGameState.columnsPerSide;
        saveUserSettings();

        if (matchingGameState.isPlaying) {
            renderMatchingItems();
        }
    }

    ;
    ["matchingType", "matchingPairs", "matchingCondition"].forEach((id) => {
        const selectElement = document.getElementById(id);
        if (selectElement) {
            selectElement.onchange = () => {

                updateUrlWithGameSettings('matching');
                
                // 維持原有邏輯：如果遊戲尚未開始，則重新生成題目
                if (!matchingGameState.isPlaying) {
                    generateMatchingData();
                }
            }
        }
    });


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
    endMatchingGame("遊戲已中止", null, false);
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

    // --- 定義一個幫助函數 ---
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

        // 【新增】處理連續答對邏輯
        matchingGameState.streak++;
        if (matchingGameState.streak > 0 && matchingGameState.streak === config.STREAK_THRESHOLDS.matching) {
            triggerStreakCelebration();
            matchingGameState.streak = 0; // 觸發後重置
        }

        // 檢查是否要播放音效
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

        // 【新增】答錯時重置連續答對計數器
        matchingGameState.streak = 0;

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
    toggleGameUI(true);
	updateUrlWithGameSettings('matching');

    const condition = document.getElementById("matchingCondition").value
    const stopButton = document.getElementById("stopMatching"); // 取得停止按鈕
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

    // 顯示停止按鈕
    stopButton.classList.remove("hidden");

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

    // 顯示遊戲區，隱藏開始提示區
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

function startQuizGame() {
    toggleGameUI(true);
	updateUrlWithGameSettings('quiz');

    const sentences = getSelectedSentences()
    const condition = document.getElementById("quizCondition").value
    const stopButton = document.getElementById("stopQuiz");
    const optionsContainer = document.getElementById("quizOptionsContainer");

    quizGameState.isPlaying = true
    quizGameState.correct = 0
    quizGameState.incorrect = 0
    quizGameState.total = 0
    quizGameState.currentIndex = 0
    quizGameState.questions = [...sentences].sort(() => Math.random() - 0.5)

    // 遊戲開始時，移除禁用 class
    document.getElementById("quizArea").classList.remove("game-area-disabled");

    // 顯示停止按鈕
    stopButton.classList.remove("hidden");

    optionsContainer.querySelectorAll('select').forEach(el => {
        el.classList.add('opacity-50', 'pointer-events-none');
        el.disabled = true;
    });
    if (window.innerWidth < 768) {
        optionsContainer.classList.add('hidden');
    }

    document.getElementById("quizCorrect").textContent = "0"
    document.getElementById("quizIncorrect").textContent = "0"

    // 顯示遊戲區，隱藏開始提示區
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



function startSortingGame() {
    toggleGameUI(true);
	updateUrlWithGameSettings('sorting'); 

    const sentences = getSelectedSentences()
    const condition = document.getElementById("sortingCondition").value
    const stopButton = document.getElementById("stopSorting");
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

    // 顯示停止按鈕
    stopButton.classList.remove("hidden");

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

    // 顯示遊戲區，隱藏開始提示區
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
                        
                        <button id="stopQuiz" class="hidden bg-red-500 hover:bg-red-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-colors" title="停止遊戲">
                            <span class="material-icons !text-xl">close</span>
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
                                <input type="checkbox" id="autoPlayAudio" class="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300" ${userSettings.quizAutoPlayAudio ? 'checked' : ''}>
                                <span class="material-icons text-gray-600 !text-xl align-middle">volume_up</span>
                            </label>
                            <button id="quizLayoutToggle" class="p-2 rounded-md hover:bg-gray-100 transition-colors" title="切換排版">
                                <span class="material-icons text-gray-600 !text-xl align-middle">view_agenda</span>
                            </button>
                            <button id="togglePhoneticSystem" class="p-2 rounded-md hover:bg-gray-100 transition-colors" title="切換拼音/注音">
                                <span class="material-icons text-gray-600 !text-xl align-middle">translate</span>
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

                <div id="quizStartNotice" class="text-center py-20 text-gray-500 min-h-[300px] flex flex-col justify-center items-center">
                    <button id="startQuizGameBtn" class="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-xl flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        <span class="material-icons">play_circle</span>
                        <span>開始測驗</span>
                    </button>
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
        streak: 0, // 【新增】連續答對計數器
        total: 0,
        timeLeft: 0,
        timerInterval: null,
        questions: [],
        currentIndex: 0,
        isAnswered: false,
    }

    document.getElementById("startQuizGameBtn").onclick = startQuizGame;
    document.getElementById("stopQuiz").onclick = stopQuizGame;

    // 監聽自動播放音效核取方塊的變化
    const autoPlayAudioCheckbox = document.getElementById("autoPlayAudio");
    if (autoPlayAudioCheckbox) {
        autoPlayAudioCheckbox.onchange = () => {
            // 當使用者點擊時，更新設定並儲存
            userSettings.quizAutoPlayAudio = autoPlayAudioCheckbox.checked;
            saveUserSettings();
        };
    }

    ["quizType", "quizOptions", "quizCondition"].forEach((id) => {
        const selectElement = document.getElementById(id);
        if (selectElement) {
            selectElement.onchange = () => {
                updateUrlWithGameSettings('quiz');
            }
        }
    });

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
}

function selectQuizOption(selectedAnswer, element) {
    if (quizGameState.isAnswered) return;

    quizGameState.isAnswered = true;
    quizGameState.total++;

    const isCorrect = selectedAnswer.trim() === quizGameState.correctAnswer.trim();

    document.querySelectorAll(".quiz-option").forEach((option) => {
        option.classList.add("quiz-answered");

        // 使用更穩健的方式來獲取選項的純文字內容，以進行比對
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
        
        // 【新增】處理連續答對邏輯
        quizGameState.streak++;
        if (quizGameState.streak > 0 && quizGameState.streak === config.STREAK_THRESHOLDS.quiz) {
            triggerStreakCelebration();
            quizGameState.streak = 0; // 觸發後重置
        }
    } else {
        quizGameState.incorrect++;
        document.getElementById("quizIncorrect").textContent = quizGameState.incorrect;
        // 【新增】答錯時重置連續答對計數器
        quizGameState.streak = 0;
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



function stopQuizGame() {
    if (quizGameState.timerInterval) {
        clearInterval(quizGameState.timerInterval);
    }
    endQuizGame("遊戲已中止", false);
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

    // --- 定義一個幫助函數 ---
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
            question = getPhonetic(currentSentence["拼音"]);
            correctAnswer = currentSentence["華語"]
            break
        case "chinese-pinyin":
            question = currentSentence["華語"]
            correctAnswer = getPhonetic(currentSentence["拼音"]);
            break
        case "hakka-pinyin":
            question = currentSentence["客語"]
            correctAnswer = getPhonetic(currentSentence["拼音"]);
            break
        case "pinyin-hakka":
            question = getPhonetic(currentSentence["拼音"]);
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
                    return getPhonetic(s["拼音"]);
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
    <div class="mb-8">
        <div class="flex items-center justify-center text-center mb-6">
            <div class="flex flex-col md:flex-row items-center gap-y-2 md:gap-x-4">
                <div class="flex items-center gap-2 flex-shrink-0">
                    <button onclick="playAudio('${quizGameState.questions[quizGameState.currentIndex]["音檔"]}', this.querySelector('.material-icons'))" 
                            class="text-gray-800 hover:bg-gray-100 p-2 rounded transition-colors">
                        <span class="material-icons">volume_up</span>
                    </button>
                    <span class="question-number text-2xl text-red-800" style="font-size: ${userSettings.fontSize + 4}px">${questionNumber}.</span>
                </div>
                <div id="quizQuestion" class="text-2xl text-red-800 cursor-pointer w-full" style="font-size: ${userSettings.fontSize + 4}px">
                    <span class="question-text">${quizGameState.currentQuestion}</span>
                </div>
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
                        
                        <button id="stopSorting" class="hidden bg-red-500 hover:bg-red-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-colors" title="停止遊戲">
                            <span class="material-icons !text-xl">close</span>
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
                                <span class="material-icons text-gray-600 !text-xl align-middle">touch_app</span>
                            </button>
                            <button id="togglePhoneticSystem" class="p-2 rounded-md hover:bg-gray-100 transition-colors" title="切換拼音/注音">
                                <span class="material-icons text-gray-600 !text-xl align-middle">translate</span>
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
                <div id="sortingStartNotice" class="text-center py-20 text-gray-500 min-h-[300px] flex flex-col justify-center items-center">
                     <button id="startSortingGameBtn" class="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-xl flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        <span class="material-icons">play_circle</span>
                        <span>開始排序</span>
                    </button>
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
        // --- 使用物件陣列來儲存單字資訊 ---
        originalWordObjects: [], // 儲存正確順序的單字物件
        shuffledWordObjects: [], // 儲存打亂順序的單字物件
        userOrderObjects: [],    // 儲存使用者排序的單字物件
        correct: 0,
        incorrect: 0,
        streak: 0, // 【新增】連續答對計數器
        score: 0,
        timeLeft: 0,
        timerInterval: null,
        sentences: [],
        availableSentences: [],
        total: 0
    }

    document.getElementById("startSortingGameBtn").onclick = startSortingGame;
    document.getElementById("stopSorting").onclick = stopSortingGame;

    ["sortingType", "sortingCondition"].forEach((id) => {
        const selectElement = document.getElementById(id);
        if (selectElement) {
            selectElement.onchange = () => {
                updateUrlWithGameSettings('sorting');
            }
        }
    });

	const togglePhoneticBtn = document.getElementById("togglePhoneticSystem");
	if (togglePhoneticBtn) {
		togglePhoneticBtn.classList.toggle('bg-blue-100', userSettings.phoneticSystem === 'zhuyin');
		togglePhoneticBtn.title = userSettings.phoneticSystem === 'pinyin' ? '切換為注音' : '切換為拼音';

		togglePhoneticBtn.onclick = () => {
			userSettings.phoneticSystem = userSettings.phoneticSystem === 'pinyin' ? 'zhuyin' : 'pinyin';
			saveUserSettings();
			togglePhoneticBtn.classList.toggle('bg-blue-100', userSettings.phoneticSystem === 'zhuyin');
			togglePhoneticBtn.title = userSettings.phoneticSystem === 'pinyin' ? '切換為注音' : '切換為拼音';
			if (sortingGameState.isPlaying) {
				generateSortingQuestion(false);
			}
		};
	}

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
                renderSortingQuestion();
            }
        };
    }
}

function checkSortingAnswer() {
    if (sortingGameState.userOrderObjects.length !== sortingGameState.originalWordObjects.length) {
        showResult("⚠️", "提醒", "請完成排列");
        return;
    }

    // 透過比較每個物件的唯一 ID 來檢查順序是否正確
    const isCorrect = sortingGameState.userOrderObjects.every((obj, index) => obj.id === sortingGameState.originalWordObjects[index].id);

    if (isCorrect) {
        sortingGameState.correct++;
        sortingGameState.score += 100;
        document.getElementById("sortingCorrect").textContent = sortingGameState.correct;
        document.getElementById("sortingScore").textContent = sortingGameState.score;

        // 【新增】處理連續答對邏輯
        sortingGameState.streak++;
        if (sortingGameState.streak > 0 && sortingGameState.streak === config.STREAK_THRESHOLDS.sorting) {
            triggerStreakCelebration();
            sortingGameState.streak = 0; // 觸發後重置
        }

        const targetDiv = document.getElementById("sortingTarget");
        showCelebration(targetDiv);
        document.querySelector('#sortingArea button[onclick="checkSortingAnswer()"]').disabled = true;

        targetDiv.querySelectorAll('.sorting-word').forEach(wordEl => {
            wordEl.classList.remove('bg-indigo-500', 'cursor-pointer');
            wordEl.classList.add('bg-green-600', 'cursor-default');
            wordEl.onclick = null;
        });

        const wordBankContainer = document.getElementById('sortingWordBankContainer');
        const sentence = sortingGameState.currentSentence;
        const type = document.getElementById("sortingType").value;
        let revealedText = '';
        
        // 輔助函數，用於處理拼音/注音轉換
        const getPhonetic = (text) => userSettings.phoneticSystem === 'zhuyin' ? convertPinyinToZhuyin(text) : text;

        if (type.includes('hakka') && type.includes('pinyin')) {
            revealedText = sentence['華語'];
        } else if (type.includes('chinese') && type.includes('pinyin')) {
            revealedText = sentence['客語'];
        } else if (type.includes('chinese') && type.includes('hakka')) {
            // 當第三語言是拼音時，也需要根據用戶設定轉換為注音
            revealedText = getPhonetic(sentence['拼音']);
        }

        if (revealedText && wordBankContainer) {
            wordBankContainer.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-center transition-all duration-300 w-full animate-pulse">
                    <p class="text-green-900 mt-1" style="font-size: ${userSettings.fontSize + 2}px">${revealedText}</p>
                </div>
            `;
        }

        const condition = document.getElementById("sortingCondition").value;
        if (condition.startsWith("correct")) {
            const target = Number.parseInt(condition.replace("correct", ""));
            if (sortingGameState.correct >= target) {
                setTimeout(() => endSortingGame(`恭喜完成目標！\n答對 ${target} 題`), 2000);
                return;
            }
        }
        setTimeout(() => generateSortingQuestion(), 2000);

    } else {
        sortingGameState.incorrect++;
        sortingGameState.score = Math.max(0, sortingGameState.score - 20);
        document.getElementById("sortingIncorrect").textContent = sortingGameState.incorrect;
        document.getElementById("sortingScore").textContent = sortingGameState.score;
        
        // 【新增】答錯時重置連續答對計數器
        sortingGameState.streak = 0;
        
        const playSoundCheckbox = document.getElementById('sortingPlaySound');
        if (playSoundCheckbox && playSoundCheckbox.checked) {
            playAudio(sortingGameState.currentSentence["音檔"]);
        }
        
        // 找出答錯的部分並將它們移回選項區
        let correctCount = 0;
        for (let i = 0; i < sortingGameState.userOrderObjects.length; i++) {
            if (sortingGameState.userOrderObjects[i].id === sortingGameState.originalWordObjects[i].id) {
                correctCount++;
            } else {
                break;
            }
        }

        const wrongPart = sortingGameState.userOrderObjects.slice(correctCount);
        sortingGameState.userOrderObjects.splice(correctCount);
        sortingGameState.shuffledWordObjects.push(...wrongPart);

        renderSortingQuestion();
    }
}

function stopSortingGame() {
    if (sortingGameState.timerInterval) {
        clearInterval(sortingGameState.timerInterval);
    }
    endSortingGame("遊戲已中止", false);
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
        if (sortingGameState.availableSentences.length === 0) {
            sortingGameState.availableSentences = [...sortingGameState.sentences].sort(() => Math.random() - 0.5);
        }
        sortingGameState.total++;
        sentence = sortingGameState.availableSentences.shift();
        sortingGameState.currentSentence = sentence;
    } else {
        sentence = sortingGameState.currentSentence;
    }

    const type = document.getElementById("sortingType").value;
    const getPhonetic = (text) => userSettings.phoneticSystem === 'zhuyin' ? convertPinyinToZhuyin(text) : text;

    let questionText = "";
    let wordObjects = [];
    let pinyinSyllables;
	sentence["拼音"] = sentence["拼音"].replace(/([,.?!;:。！？，、：；()（）])/g, ' $1 ').trim();

    if (type.endsWith('-pinyin')) {
        pinyinSyllables = sentence["拼音"].split(/[\s]+/).filter(w => w.trim() !== "");
    } else {
        pinyinSyllables = sentence["拼音"].split(/[\s-]+/).filter(w => w.trim() !== "");
    }

    // --- MODIFICATION START ---
    let hakkaSegments;
    let rawHakkaText = sentence["客語"];

    // 整合您提供的邏輯：如果客語字串沒有空格且包含特殊注音字元，則為其加上空格再分割。
    if (rawHakkaText.split(/\s+/).length === 1 && /[\uE166-\uE24B]/.test(rawHakkaText)) {
        let processedText = rawHakkaText.replace(/([\uE166-\uE24B]+)(?=\S|$)/g, "$1 ").trim();
        hakkaSegments = processedText.split(/\s+/);
    } 
    // 如果字串本身已有空格，則直接按空格分割。
    else if (rawHakkaText.includes(' ')) {
        hakkaSegments = rawHakkaText.split(/\s+/);
    }
    // 其他情況（如無空格的普通漢字），則按單一字元分割。
    else {
        hakkaSegments = Array.from(rawHakkaText);
    }

    const baseWordInfo = hakkaSegments.map((segment, index) => ({
        hakka: segment,
        pinyin: pinyinSyllables[index] || ''
    }));
    // --- MODIFICATION END ---


    switch (type) {
        case "hakka-pinyin":
        case "chinese-pinyin":
			questionText = (type === "hakka-pinyin") ? sentence["客語"] : sentence["華語"];
			wordObjects = baseWordInfo
				.filter(item => item.pinyin && item.pinyin.trim() !== "") 
				.map(item => {
					return {
						display: getPhonetic(item.pinyin),
						pinyin: item.pinyin
					};
				});
            break;
        case "pinyin-hakka":
            const formattedPinyinForQuestion = sentence["拼音"].replace(/([,.?!;:。！？，、：；()（）])/g, ' $1 ');
            questionText = getPhonetic(formattedPinyinForQuestion);
            wordObjects = baseWordInfo.map(item => ({ display: item.hakka, pinyin: item.pinyin }));
            break;
        case "chinese-hakka":
            questionText = sentence["華語"];
            wordObjects = baseWordInfo.map(item => ({ display: item.hakka, pinyin: item.pinyin }));
            break;
    }

    wordObjects.forEach((obj, index) => obj.id = index);

    let fixedObjects = [];
    let shuffleObjects = wordObjects;
    sortingGameState.fixedCount = 0;

    if (wordObjects.length > 6) {
        const fixedCount = wordObjects.length - 6;
        sortingGameState.fixedCount = fixedCount; 
        fixedObjects = wordObjects.slice(0, fixedCount);
        shuffleObjects = wordObjects.slice(fixedCount);
    }

    sortingGameState.questionText = questionText;
    sortingGameState.originalWordObjects = [...wordObjects];
    sortingGameState.shuffledWordObjects = [...shuffleObjects].sort(() => Math.random() - 0.5);
    sortingGameState.userOrderObjects = [...fixedObjects];

    renderSortingQuestion();

    if (document.getElementById('sortingPlaySound').checked && isNewQuestion) {
        playAudio(sentence["音檔"]);
    }
}


function renderSortingQuestion() {
    const sortingArea = document.getElementById("sortingArea");
    const canCheck = sortingGameState.userOrderObjects.length === sortingGameState.originalWordObjects.length;
    const questionNumber = sortingGameState.total;

    sortingArea.innerHTML = `
        <div class="mb-8">
            <div class="flex items-center justify-center text-center mb-6">
                <div class="flex flex-col md:flex-row items-center gap-y-2 md:gap-x-4">
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <button onclick="playAudio('${sortingGameState.currentSentence["音檔"]}', this.querySelector('.material-icons'))" 
                                class="text-gray-800 hover:bg-gray-100 p-2 rounded transition-colors">
                            <span class="material-icons">volume_up</span>
                        </button>
                        <span class="question-number text-2xl font-bold text-indigo-800" style="font-size: ${userSettings.fontSize + 4}px">${questionNumber}.</span>
                    </div>
                    <div id="sortingQuestion" class="text-2xl font-bold text-indigo-800 cursor-pointer w-full" style="font-size: ${userSettings.fontSize + 4}px">
                        <span class="question-text">${sortingGameState.questionText}</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-100 rounded-lg p-4 mb-6 min-h-16">
                <div id="sortingTarget" class="flex gap-2 flex-wrap justify-center min-h-12">
                    ${sortingGameState.userOrderObjects
                      .map((wordObj, index) => {
                          if (index < sortingGameState.fixedCount) {
                              // 固定項目的樣式、不可點擊
                              return `
                                <div class="sorting-word bg-green-600 text-white px-4 py-2 rounded-lg cursor-default" 
                                     style="font-size: ${userSettings.fontSize}px">
                                    ${wordObj.display}
                                </div>
                              `;
                          } else {
                              // 使用者放置的項目樣式、可點擊
                              return `
                                <div class="sorting-word bg-indigo-500 text-white px-4 py-2 rounded-lg cursor-pointer" 
                                     style="font-size: ${userSettings.fontSize}px"
                                     onclick="removeFromTarget(${index})">
                                    ${wordObj.display}
                                </div>
                              `;
                          }
                      }).join("")}
                    ${sortingGameState.userOrderObjects.length === 0 ? '<div class="invisible-placeholder px-4 py-2">　</div>' : ""}
                </div>
            </div>
            
            <div id="sortingWordBankContainer" class="flex gap-3 flex-wrap justify-center mb-6 min-h-16">
                <div class="min-h-12 flex gap-3 flex-wrap justify-center">
                    ${sortingGameState.shuffledWordObjects
                      .map((wordObj, index) => `
                            <div class="sorting-word bg-white border-2 border-gray-300 px-4 py-2 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors flex items-center justify-center" 
                                 style="font-size: ${userSettings.fontSize}px"
                                 onclick="addToTarget(${index})">
                                ${wordObj.display}
                            </div>
                        `).join("")}
                    ${sortingGameState.shuffledWordObjects.length === 0 ? '<div class="invisible-placeholder px-4 py-2">　</div>' : ""}
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


function addToTarget(shuffledIndex) {
    const wordObject = sortingGameState.shuffledWordObjects[shuffledIndex];

    // 如果啟用「點擊拼音播放」
    if (userSettings.playPinyinOnClick) {
        const type = document.getElementById("sortingType").value;
        const answerType = type.split('-')[1];

        // 只要答案不是華語，且該選項物件有對應的拼音，就播放
        if (answerType !== 'chinese' && wordObject.pinyin) {
            // 使用 PinyinAudio.kasu 播放單一音節
            window.PinyinAudio.kasu(null, wordObject.pinyin);
        }
    }

    // 將物件從選項區移動到答案區
    sortingGameState.userOrderObjects.push(wordObject);
    sortingGameState.shuffledWordObjects.splice(shuffledIndex, 1);
    
    // 重新渲染畫面
    renderSortingQuestion();
}

function removeFromTarget(targetIndex) {
    // 將物件從答案區移回選項區
    const wordObject = sortingGameState.userOrderObjects[targetIndex];
    sortingGameState.userOrderObjects.splice(targetIndex, 1);
    sortingGameState.shuffledWordObjects.push(wordObject);
    
    // 重新渲染畫面
    renderSortingQuestion();
}




/**
 * 儲存遊戲結果到 Local Storage
 * @param {object} resultData - 包含遊戲結果的物件
 */
function saveGameResult(resultData) {
    if (!currentUser || currentUser.id === 'guest') {
        console.log("訪客模式，不儲存遊戲記錄。");
        return;
    }
    const historyKey = `${config.STORAGE_PREFIX}gameHistory_${currentUser.id}`;
    let history = [];
    try {
        const storedHistory = localStorage.getItem(historyKey);
        if (storedHistory) {
            history = JSON.parse(storedHistory);
        }
    } catch (e) {
        console.error("讀取遊戲歷史記錄失敗:", e);
        history = [];
    }

    // 新增時間戳記 & 提交狀態
    resultData.timestamp = new Date().toISOString();
    resultData.submitted = false; 

    // 將新記錄加到最前面
    history.unshift(resultData);

    // 保持最多紀錄筆數 (使用 config 設定)
    if (history.length > config.MAX_HISTORY_RECORDS) {
        history = history.slice(0, config.MAX_HISTORY_RECORDS);
    }

    localStorage.setItem(historyKey, JSON.stringify(history));
}


/**
 * 將遊戲結果非同步送到 Google 表單
 * @param {object} gameResult - 包含遊戲結果的物件
 * @returns {Promise<boolean>} - 回傳一個表示提交是否成功的 Promise
 */
async function submitToGoogleForm(gameResult) {
    const { GOOGLE_FORM_CONFIG } = config;

    // 檢查 URL 是否為預設值，如果是，則提醒使用者修改
    if (!GOOGLE_FORM_CONFIG.formUrl || GOOGLE_FORM_CONFIG.formUrl.includes("YOUR_FORM_URL")) {
        console.error("錯誤：Google 表單 URL 未設定。請在 script.js 的 config 物件中修改 GOOGLE_FORM_CONFIG.formUrl。");
        showResult("❌", "提交失敗", "開發者尚未設定成績提交網址。");
        return false;
    }

    const formData = new FormData();
    formData.append(GOOGLE_FORM_CONFIG.nameField, currentUser.name);
    formData.append(GOOGLE_FORM_CONFIG.idField, currentUser.id);
    formData.append(GOOGLE_FORM_CONFIG.gameTypeField, gameResult.gameType);
    formData.append(GOOGLE_FORM_CONFIG.scoreField, gameResult.score);
    formData.append(GOOGLE_FORM_CONFIG.durationField, gameResult.duration);
    
    // 根據遊戲類型，附加額外資訊
    if (gameResult.correct !== undefined) formData.append(GOOGLE_FORM_CONFIG.correctField, gameResult.correct);
    if (gameResult.incorrect !== undefined) formData.append(GOOGLE_FORM_CONFIG.incorrectField, gameResult.incorrect);
    if (gameResult.steps !== undefined) formData.append(GOOGLE_FORM_CONFIG.stepsField, gameResult.steps);
    if (gameResult.accuracy !== undefined) formData.append(GOOGLE_FORM_CONFIG.accuracyField, gameResult.accuracy);
    
    // 將設定物件轉換為 JSON 字串
    if (gameResult.settings) {
        formData.append(GOOGLE_FORM_CONFIG.settingsField, JSON.stringify(gameResult.settings));
    }

    try {
        await fetch(GOOGLE_FORM_CONFIG.formUrl, {
            method: "POST",
            body: formData,
            mode: "no-cors" // Google 表單需要 no-cors 模式
        });
        return true; // 提交成功
    } catch (error) {
        console.error("提交至 Google 表單時發生錯誤:", error);
        return false; // 提交失敗
    }
}

function endMatchingGame(message, finalTime = null, save = true) {
    toggleGameUI(false);
    matchingGameState.isPlaying = false;
    const startButton = document.getElementById("startMatchingGameBtn"); // 改為指向中央的開始按鈕
    const stopButton = document.getElementById("stopMatching"); // 指向停止按鈕
    const optionsContainer = document.getElementById("matchingOptions");

    // 遊戲結束時，新增禁用 class
    document.getElementById("matchingArea").classList.add("game-area-disabled");

    if (matchingGameState.timerInterval) {
        clearInterval(matchingGameState.timerInterval);
    }
    
    let gameResult = null;
    
    if (save) {
        const condition = document.getElementById("matchingCondition").value;
        let duration = 0;
        if (condition.startsWith("time")) {
            const timeLimit = parseInt(condition.replace("time", ""), 10);
            duration = timeLimit - matchingGameState.timeLeft;
        } else if (matchingGameState.startTime) {
            duration = Math.floor((Date.now() - matchingGameState.startTime) / 1000);
        }

        gameResult = {
            gameType: 'matching',
            score: matchingGameState.score,
            steps: matchingGameState.steps,
            duration: finalTime !== null ? finalTime : duration,
            settings: {
                categories: Array.from(selectedCategories),
                type: document.getElementById("matchingType").value,
                pairs: document.getElementById("matchingPairs").value,
                condition: condition
            }
        };
        saveGameResult(gameResult);
    }


    // 隱藏停止按鈕
    if (stopButton) {
        stopButton.classList.add("hidden");
    }

    // 顯示開始提示區，並將按鈕文字改為 "重新開始"
    if (startButton) {
        startButton.innerHTML = `
            <span class="material-icons">replay</span>
            <span>重新開始</span>
        `;
        document.getElementById("matchingStartNotice").classList.remove("hidden");
        document.getElementById("matchingArea").classList.add("hidden"); // 隱藏遊戲區
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
        `${message}\n\n最終分數：${matchingGameState.score}\n操作步數：${matchingGameState.steps}`,
        gameResult
    );
}



function endQuizGame(message, save = true) {
    toggleGameUI(false);
    quizGameState.isPlaying = false;
    const startButton = document.getElementById("startQuizGameBtn");
    const stopButton = document.getElementById("stopQuiz");
    const optionsContainer = document.getElementById("quizOptionsContainer");

    // 遊戲結束時，新增禁用 class
    document.getElementById("quizArea").classList.add("game-area-disabled");

    if (quizGameState.timerInterval) {
        clearInterval(quizGameState.timerInterval);
    }

    let gameResult = null;
    const accuracy = quizGameState.total > 0 ? Math.round((quizGameState.correct / quizGameState.total) * 100) : 0;
    
    if (save) {
        const condition = document.getElementById("quizCondition").value;
        let duration = 0;
        if (condition.startsWith("time")) {
            const timeLimit = parseInt(condition.replace("time", ""), 10);
            duration = timeLimit - quizGameState.timeLeft;
        } else if (quizGameState.startTime) {
            duration = Math.floor((Date.now() - quizGameState.startTime) / 1000);
        }
        
        gameResult = {
            gameType: 'quiz',
            score: quizGameState.correct, // 以答對題數為分數
            correct: quizGameState.correct,
            incorrect: quizGameState.incorrect,
            accuracy: accuracy,
            duration: duration,
            settings: {
                categories: Array.from(selectedCategories),
                type: document.getElementById("quizType").value,
                options: document.getElementById("quizOptions").value,
                condition: condition,
            }
        };
        saveGameResult(gameResult);
    }

    // 隱藏停止按鈕
    if (stopButton) {
        stopButton.classList.add("hidden");
    }

    // 顯示開始提示區，並將按鈕文字改為 "重新開始"
    if (startButton) {
        startButton.innerHTML = `
            <span class="material-icons">replay</span>
            <span>重新開始</span>
        `;
        document.getElementById("quizStartNotice").classList.remove("hidden");
        document.getElementById("quizArea").classList.add("hidden"); // 隱藏遊戲區
    }
    
    optionsContainer.querySelectorAll('select').forEach(el => {
        el.classList.remove('opacity-50', 'pointer-events-none');
        el.disabled = false;
    });
    if (window.innerWidth < 768) {
        optionsContainer.classList.remove('hidden');
    }

    showResult(
        "🎯",
        "測驗結束",
        `${message}\n\n` +
        `答對：${quizGameState.correct} 題\n` +
        `答錯：${quizGameState.incorrect} 題\n` +
        `總題數：${quizGameState.total} 題\n` +
        `正確率：${accuracy}%`,
        gameResult
    );
}

function endSortingGame(message, save = true) {
    toggleGameUI(false);
    sortingGameState.isPlaying = false;
    const startButton = document.getElementById("startSortingGameBtn");
    const stopButton = document.getElementById("stopSorting");
    const optionsContainer = document.getElementById("sortingOptions");

    // 遊戲結束時，新增禁用 class
    document.getElementById("sortingArea").classList.add("game-area-disabled");

    if (sortingGameState.timerInterval) {
        clearInterval(sortingGameState.timerInterval);
    }
    
    let gameResult = null;
    const totalQuestions = sortingGameState.correct + sortingGameState.incorrect;
    const accuracy = totalQuestions > 0 ? Math.round((sortingGameState.correct / totalQuestions) * 100) : 0;
    
    if (save) {
        const condition = document.getElementById("sortingCondition").value;
        let duration = 0;
        if (condition.startsWith("time")) {
            const timeLimit = parseInt(condition.replace("time", ""), 10);
            duration = timeLimit - sortingGameState.timeLeft;
        } else if (sortingGameState.startTime) {
            duration = Math.floor((Date.now() - sortingGameState.startTime) / 1000);
        }
        
        gameResult = {
            gameType: 'sorting',
            score: sortingGameState.score,
            correct: sortingGameState.correct,
            incorrect: sortingGameState.incorrect,
            accuracy: accuracy,
            duration: duration,
            settings: {
                categories: Array.from(selectedCategories),
                type: document.getElementById("sortingType").value,
                condition: condition,
            }
        };
        saveGameResult(gameResult);
    }

    // 隱藏停止按鈕
    if (stopButton) {
        stopButton.classList.add("hidden");
    }

    // 顯示開始提示區，並將按鈕文字改為 "重新開始"
    if (startButton) {
        startButton.innerHTML = `
            <span class="material-icons">replay</span>
            <span>重新開始</span>
        `;
        document.getElementById("sortingStartNotice").classList.remove("hidden");
        document.getElementById("sortingArea").classList.add("hidden");
    }

    optionsContainer.querySelectorAll('select').forEach(el => {
        el.classList.remove('opacity-50', 'pointer-events-none');
        el.disabled = false;
    });
    if (window.innerWidth < 768) {
        optionsContainer.classList.remove('hidden');
    }

    showResult(
        "🎯",
        "排序結束",
        `${message}\n\n` +
        `最終分數：${sortingGameState.score}\n` +
        `答對題數：${sortingGameState.correct}\n` +
        `答錯題數：${sortingGameState.incorrect}\n` +
        `正確率：${accuracy}%`,
        gameResult
    );
}

// 顯示結果視窗
function showResult(icon, title, message, gameResult = null) {
    document.getElementById("resultIcon").textContent = icon;
    document.getElementById("resultTitle").textContent = title;
    document.getElementById("resultMessage").textContent = message;

    const submitButton = document.getElementById("submitResult");
    
    // 處理成績提交按鈕的邏輯
    if (gameResult && currentUser.id !== 'guest') {
        submitButton.classList.remove("hidden");
        submitButton.disabled = false;
        // 確保按鈕回到初始狀態
        submitButton.innerHTML = `<span class="material-icons !text-xl">cloud_upload</span><span>送出成績</span>`;
        submitButton.classList.remove("bg-gray-400", "cursor-not-allowed");
        submitButton.classList.add("bg-green-500", "hover:bg-green-600");


        // 為避免重複綁定，先移除舊的監聽器
        const newButton = submitButton.cloneNode(true);
        submitButton.parentNode.replaceChild(newButton, submitButton);

        newButton.addEventListener("click", async () => {
            // 點擊後禁用按鈕並顯示處理中
            newButton.disabled = true;
            newButton.innerHTML = `<span>處理中...</span>`;
            newButton.classList.remove("bg-green-500", "hover:bg-green-600");
            newButton.classList.add("bg-gray-400", "cursor-not-allowed");


            const success = await submitToGoogleForm(gameResult);

            if (success) {
                newButton.innerHTML = `<span>已送出</span>`;
            } else {
                // 如果失敗，恢復按鈕狀態，讓使用者可以重試
                newButton.disabled = false;
                newButton.innerHTML = `<span class="material-icons !text-xl">cloud_upload</span><span>重新送出</span>`;
                newButton.classList.remove("bg-gray-400", "cursor-not-allowed");
                newButton.classList.add("bg-green-500", "hover:bg-green-600");
            }
        });

    } else {
        submitButton.classList.add("hidden");
    }
    
    document.getElementById("resultModal").classList.remove("hidden");
}


function setStickyTopPosition() {
    const header = document.querySelector('#mainMenu > header');
    const tabBar = document.getElementById('tabBarStrip');
    if (header && tabBar) {
        const headerHeight = header.offsetHeight;
        tabBar.style.top = `${headerHeight}px`;
    }
}

/**
 * 填充頭像 Emoji 選擇器並設定點擊事件
 * @param {string} currentAvatar - 當前使用者的頭像
 */
function populateEmojiSelector(currentAvatar) {
    const emojiSelector = document.getElementById("emojiSelector");
    if (!emojiSelector) return;

    emojiSelector.innerHTML = ""; // 清空舊內容

    avatarEmojis.forEach(emoji => {
        const emojiEl = document.createElement("div");
        emojiEl.className = "emoji-option";
        emojiEl.textContent = emoji;
        emojiEl.dataset.avatar = emoji; // 將 emoji 存儲在 data 屬性中

        if (emoji === currentAvatar) {
            emojiEl.classList.add("selected-emoji");
        }

        emojiEl.onclick = () => {
            // 移除所有選項的選中樣式
            emojiSelector.querySelectorAll('.emoji-option').forEach(el => {
                el.classList.remove('selected-emoji');
            });
            // 為被點擊的選項加上樣式
            emojiEl.classList.add('selected-emoji');
        };

        emojiSelector.appendChild(emojiEl);
    });
}

// 設置事件監聽器
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
		if (currentUser.id === 'guest') return;

		document.getElementById("userDropdown").classList.add("hidden");
		document.getElementById("editName").value = currentUser.name;
		document.getElementById("editId").value = currentUser.id;
		populateEmojiSelector(currentUser.avatar); // <-- 此處正確使用 currentUser.avatar
		document.getElementById("userModal").classList.remove("hidden");
	}
    document.getElementById("saveProfile").onclick = () => {
        const newName = document.getElementById("editName").value.trim();
        const newId = document.getElementById("editId").value.trim();
        const selectedEmojiEl = document.querySelector('#emojiSelector .selected-emoji');
        const newAvatar = selectedEmojiEl ? selectedEmojiEl.dataset.avatar : currentUser.avatar;

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

	document.getElementById("confirmClear").onclick = () => {
		const settingsKey = `${config.STORAGE_PREFIX}settings_${currentUser.id}`;
		const starredKey = `${config.STORAGE_PREFIX}starred_${currentUser.id}`;
		const selectedKey = `${config.STORAGE_PREFIX}selected_${currentUser.id}`;
		const collectedKey = `${config.STORAGE_PREFIX}collected_${currentUser.id}`;
		const historyKey = `${config.STORAGE_PREFIX}gameHistory_${currentUser.id}`;

		localStorage.removeItem(settingsKey);
		localStorage.removeItem(starredKey);
		localStorage.removeItem(selectedKey);
		localStorage.removeItem(collectedKey);
		localStorage.removeItem(historyKey);

		starredCards.clear();
		selectedCategories.clear();
		selectedSentences.clear();
		collectedCategories.clear();
		document.getElementById("clearModal").classList.add("hidden");

		showResult("✅", "清除完成", "所有學習記錄已清除");
		// 如果使用者正在歷史紀錄頁面，清除後需要重新渲染
		if (!document.getElementById("learningHistory").classList.contains("hidden")) {
			renderLearningHistory();
		}
	}
    document.getElementById("cancelClear").onclick = () => {
        document.getElementById("clearModal").classList.add("hidden");
        document.getElementById("clearPassword").value = "";
    }
	document.getElementById("logout").onclick = () => {
		document.getElementById("userDropdown").classList.add("hidden");

		if (currentUser.id === 'guest') {
			// 訪客狀態下，此按鈕為「登入」
			// 清空輸入框並顯示登入視窗
			document.getElementById("editName").value = "";
			document.getElementById("editId").value = "";
			populateEmojiSelector("😀"); // <-- 在這裡為訪客模式設定預設 Emoji
			document.getElementById("userModal").classList.remove("hidden");
		} else {
			// 登入狀態下，此按鈕為「登出」
			currentUser = { id: "guest", name: "訪客", avatar: "U" };
			saveUserData();
			updateUserDisplay();
			loadUserSettings(); // 重新載入訪客的設定
			showResult("👋", "已登出", "已切換為訪客模式");
		}
	}
	document.getElementById("viewHistory").onclick = () => {
		document.getElementById("userDropdown").classList.add("hidden");
		showLearningHistory();
	};

	document.getElementById("viewHistoryDetail").onclick = () => {
		document.getElementById("userDropdownDetail").classList.add("hidden");
		showLearningHistory();
	};

	document.getElementById("goHomeFromHistory").onclick = () => {
		document.getElementById("learningHistory").classList.add("hidden");
		document.getElementById("mainMenu").classList.remove("hidden");
		// 確保返回首頁時，重新渲染頁籤和列表
		renderCatalogTabs();
		renderCategoryList();
	};

	document.getElementById("clearHistoryBtn").onclick = () => {
		// 直接使用清除所有資料的 modal，但可以客製化標題
		document.getElementById("clearModalTitle").textContent = "清除學習紀錄";
		document.getElementById("clearModal").classList.remove("hidden");
	};

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
			if (currentUser.id === 'guest') return;

			userDropdownDetail.classList.add("hidden");
			document.getElementById("editName").value = currentUser.name;
			document.getElementById("editId").value = currentUser.id;
			populateEmojiSelector(currentUser.avatar); // <-- 此處正確使用 currentUser.avatar
			document.getElementById("userModal").classList.remove("hidden");
		}
	document.getElementById("logoutDetail").onclick = () => {
		userDropdownDetail.classList.add("hidden");

		if (currentUser.id === 'guest') {
			// 訪客狀態下，此按鈕為「登入」
			document.getElementById("editName").value = "";
			document.getElementById("editId").value = "";
			populateEmojiSelector("😀"); // <-- 在這裡為訪客模式設定預設 Emoji
			document.getElementById("userModal").classList.remove("hidden");
		} else {
			// 登入狀態下，此按鈕為「登出」
			currentUser = { id: "guest", name: "訪客", avatar: "U" };
			saveUserData();
			updateUserDisplay();
			loadUserSettings();
			showResult("👋", "已登出", "已切換為訪客模式");
		}
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



document.getElementById("goHome").onclick = () => {
    stopAllTimers();

    selectedCategories.clear();
    isMultiSelectMode = false;
    isLearningSelectMode = false;

    Object.keys(categories).forEach((key) => {
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

    // --- Start of Fix ---
    if (history.pushState) {
        const tabKeys = Object.keys(catalog);
        const tabIndex = tabKeys.indexOf(currentCatalogTab) + 1;
        let newUrl = window.location.pathname;

        if (tabIndex > 0) {
            newUrl += `?tab=${tabIndex}`;
        }
        history.pushState({}, '', newUrl);
    }
    // --- End of Fix ---

    document.getElementById("categoryDetail").classList.add("hidden");
    document.getElementById("learningHistory").classList.add("hidden");
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
	document.getElementById("learnSelected").addEventListener("click", startLearning);
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

/**
 * 啟用或禁用遊戲模式下的主要導覽介面
 * @param {boolean} disable - true 為禁用, false 為啟用
 */
function toggleGameUI(disable) {
    const elementsToToggle = [
        document.getElementById("menuToggle"),
        document.getElementById("goHome"),
        document.getElementById("userButtonDetail"),
        document.getElementById("categoryDropdownBtn")
    ];

    elementsToToggle.forEach(el => {
        if (el) {
            el.disabled = disable;
            el.classList.toggle('opacity-50', disable);
            el.classList.toggle('pointer-events-none', disable);
        }
    });
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

/**
 * 根據 URL 參數設定遊戲選項並自動開始遊戲
 * @param {string} mode - 遊戲模式 ('matching', 'quiz', 'sorting')
 * @param {object} params - 從 URL 讀取的參數物件
 */
function applyAndStartGameFromParams(mode, params) {
    // 輔助函數：檢查某個值是否為 select 元素中的有效選項
    const isValidOption = (selectEl, value) => {
        if (!selectEl || !value) return true; // 如果沒有傳入元素或值，視為有效(不需檢查)
        return [...selectEl.options].some(opt => opt.value === value);
    };

    let startButton, allParamsValid = true;
    let selectors = {};

    switch (mode) {
        case 'matching':
            selectors = {
                lang: document.getElementById('matchingType'),
                pairs: document.getElementById('matchingPairs'),
                condition: document.getElementById('matchingCondition')
            };
            startButton = document.getElementById('startMatching');
            break;
        case 'quiz':
            selectors = {
                lang: document.getElementById('quizType'),
                options: document.getElementById('quizOptions'),
                condition: document.getElementById('quizCondition')
            };
            startButton = document.getElementById('startQuiz');
            break;
        case 'sorting':
            selectors = {
                lang: document.getElementById('sortingType'),
                condition: document.getElementById('sortingCondition')
            };
            startButton = document.getElementById('startSorting');
            break;
        default:
            return;
    }

    // 逐一驗證並設定參數
    for (const key in params) {
        if (params[key] && selectors[key]) {
            if (isValidOption(selectors[key], params[key])) {
                selectors[key].value = params[key];
            } else {
                console.error(`參數 ${key}=${params[key]} 在 ${mode} 模式中無效。`);
                allParamsValid = false;
            }
        }
    }

    // 如果所有傳入的參數都有效，則自動開始遊戲
    if (allParamsValid && startButton) {
        // 使用 setTimeout 確保 UI 渲染完成後再點擊
        setTimeout(() => startButton.click(), 100);
    }
}

/**
 * 當手動開始遊戲時，將當前的遊戲設定更新到 URL 上
 * @param {string} mode - 遊戲模式 ('matching', 'quiz', 'sorting')
 */
function updateUrlWithGameSettings(mode) {
    if (!history.pushState) return;

    const params = new URLSearchParams(window.location.search);
    let settings = {};

    switch (mode) {
        case 'matching':
            settings = {
                lang: document.getElementById('matchingType').value,
                pairs: document.getElementById('matchingPairs').value,
                condition: document.getElementById('matchingCondition').value
            };
            break;
        case 'quiz':
            settings = {
                lang: document.getElementById('quizType').value,
                options: document.getElementById('quizOptions').value,
                condition: document.getElementById('quizCondition').value
            };
            break;
        case 'sorting':
            settings = {
                lang: document.getElementById('sortingType').value,
                condition: document.getElementById('sortingCondition').value
            };
            break;
        default:
            return;
    }
    
    // 設定參數到 URL
    for (const key in settings) {
        if (settings[key]) {
            params.set(key, settings[key]);
        }
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    // 使用 replaceState 避免用戶按上一頁時，只改變了參數
    history.replaceState(history.state, '', newUrl);
}

/**
 * 顯示學習紀錄頁面
 */
function showLearningHistory() {
    if (currentUser.id === 'guest') {
        showResult("👤", "訪客模式", "登入後即可開始記錄學習歷程。");
        return;
    }
    document.getElementById("mainMenu").classList.add("hidden");
    document.getElementById("categoryDetail").classList.add("hidden");
    document.getElementById("learningHistory").classList.remove("hidden");
    renderLearningHistory();
    window.scrollTo(0, 0);
}

/**
 * 渲染學習紀錄內容
 */
function renderLearningHistory() {
    const contentArea = document.getElementById("historyContent");
    const historyKey = `${config.STORAGE_PREFIX}gameHistory_${currentUser.id}`;
    let history = [];
    try {
        const storedHistory = localStorage.getItem(historyKey);
        if (storedHistory) {
            history = JSON.parse(storedHistory);
        }
    } catch (e) {
        console.error("讀取遊戲歷史記錄失敗:", e);
    }

    if (history.length === 0) {
        contentArea.innerHTML = `<div class="text-center py-20 text-gray-500">
            <span class="material-icons text-6xl text-gray-300">history</span>
            <p class="mt-4 text-lg">目前沒有任何學習紀錄</p>
        </div>`;
        document.getElementById("clearHistoryBtn").classList.add("hidden");
        return;
    }
    
    document.getElementById("clearHistoryBtn").classList.remove("hidden");

    const gameInfo = {
        matching: { icon: 'extension', name: '配對', color: 'orange' },
        quiz: { icon: 'quiz', name: '測驗', color: 'red' },
        sorting: { icon: 'sort', name: '排序', color: 'indigo' }
    };
    
    const langMap = {
        'hakka-chinese': '客↔華', 'pinyin-chinese': '拼↔華', 'hakka-pinyin': '客↔拼',
        'audio-hakka': '音↔客', 'audio-pinyin': '音↔拼', 'audio-chinese': '音↔華',
        'chinese-hakka': '華→客', 'chinese-pinyin': '華→拼', 'pinyin-hakka': '拼→客'
    };
    
    const formatCondition = (cond) => {
        if (!cond) return '';
        if (cond.startsWith('time')) return `${cond.replace('time', '')}秒`;
        if (cond.startsWith('correct')) return `${cond.replace('correct', '')}題`;
        if (cond.startsWith('round')) return `${cond.replace('round', '')}關`;
        if (cond === 'unlimited') return '無限';
        return cond;
    };

    const headerHtml = `
        <div class="history-list-header">
            <div class="col-icon" title="遊戲類型"><span class="material-icons">category</span></div>
            <div class="col-topic">主題單元</div>
            <div class="col-settings">遊戲設定</div>
            <div class="col-stats">成績紀錄</div>
            <div class="col-date">時間</div>
            <div class="col-action">操作</div>
        </div>
    `;

    const rowsHtml = history.map((item, index) => {
        const info = gameInfo[item.gameType] || { icon: 'videogame_asset', name: '遊戲', color: 'gray' };
        const date = new Date(item.timestamp);
        const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        const settings = item.settings || {};
        
        let topicsDisplay = 'N/A';
        if (settings.categories && settings.categories.length > 0) {
            if (settings.categories.length === 1) {
                topicsDisplay = settings.categories[0];
            } else {
                const categoryIndexes = settings.categories
                    .map(name => orderedCategories.indexOf(name) + 1)
                    .filter(index => index > 0)
                    .sort((a, b) => a - b);
                
                const compressedString = compressNumberArray(categoryIndexes);
                topicsDisplay = `${settings.categories.length}主題(${compressedString})`;
            }
        }
        
        const settingsParts = [
            langMap[settings.type] || settings.type,
            settings.pairs ? `${settings.pairs}組` : null,
            settings.options ? `${settings.options}項` : null,
            formatCondition(settings.condition)
        ].filter(Boolean).join(', ');

        let statsHtml = '';
        if(item.score !== undefined) statsHtml += `<span class="stat-icon-group" title="分數"><span class="material-icons">scoreboard</span>${item.score}</span>`;
        if(item.correct !== undefined) statsHtml += `<span class="stat-icon-group" title="答對"><span class="material-icons text-green-600">check_circle</span>${item.correct}</span>`;
        if(item.incorrect !== undefined) statsHtml += `<span class="stat-icon-group" title="答錯"><span class="material-icons text-red-500">cancel</span>${item.incorrect}</span>`;
        if(item.accuracy !== undefined) statsHtml += `<span class="stat-icon-group" title="正確率"><span class="material-icons text-blue-500">percent</span>${item.accuracy}</span>`;
        if(item.duration !== undefined) statsHtml += `<span class="stat-icon-group" title="耗時"><span class="material-icons">timer</span>${item.duration}s</span>`;
        if(item.steps !== undefined) statsHtml += `<span class="stat-icon-group" title="步數"><span class="material-icons">footprint</span>${item.steps}</span>`;

        const isSubmitted = item.submitted === true;
        const buttonHtml = `
            <button 
                class="history-submit-btn ${isSubmitted ? 'submitted' : ''}" 
                onclick="handleHistorySubmit(${index}, this)"
                ${isSubmitted ? 'disabled' : ''}>
                ${isSubmitted ? '已送出' : '送出'}
            </button>
        `;

        return `
            <div class="history-list-row ${item.gameType}">
                <div class="col-icon" title="${info.name}"><span class="material-icons">${info.icon}</span></div>
                <div class="col-topic" title="${settings.categories?.join(', ')}">${topicsDisplay}</div>
                <div class="col-settings">${settingsParts}</div>
                <div class="col-stats">${statsHtml}</div>
                <div class="col-date">${formattedDate}</div>
                <div class="col-action">${buttonHtml}</div>
            </div>`;
    }).join('');

    contentArea.innerHTML = `<div class="history-list-container">${headerHtml}${rowsHtml}</div>`;
}


/**
 * 處理從歷史紀錄頁面提交單筆成績的事件
 * @param {number} itemIndex - 該筆紀錄在 history 陣列中的索引
 * @param {HTMLElement} buttonElement - 被點擊的按鈕元素
 */
async function handleHistorySubmit(itemIndex, buttonElement) {
    const historyKey = `${config.STORAGE_PREFIX}gameHistory_${currentUser.id}`;
    let history = [];
    try {
        const storedHistory = localStorage.getItem(historyKey);
        if (storedHistory) {
            history = JSON.parse(storedHistory);
        }
    } catch (e) {
        console.error("讀取遊戲歷史記錄失敗:", e);
        showResult("❌", "錯誤", "讀取歷史紀錄失敗，無法提交。");
        return;
    }

    const gameResult = history[itemIndex];
    if (!gameResult) {
        showResult("❌", "錯誤", "找不到對應的遊戲紀錄。");
        return;
    }

    // 1. 更新 UI 為「處理中」
    buttonElement.disabled = true;
    buttonElement.textContent = '處理中...';
    buttonElement.classList.add('processing');

    // 2. 提交至 Google 表單
    const success = await submitToGoogleForm(gameResult);

    if (success) {
        // 3. 成功後，更新 UI 為「已送出」
        buttonElement.textContent = '已送出';
        buttonElement.classList.remove('processing');
        buttonElement.classList.add('submitted');
        
        // 4. 更新 Local Storage 中的紀錄
        gameResult.submitted = true;
        history[itemIndex] = gameResult;
        localStorage.setItem(historyKey, JSON.stringify(history));

    } else {
        // 5. 處理失敗情況
        buttonElement.disabled = false;
        buttonElement.textContent = '重新送出';
        buttonElement.classList.remove('processing');
        showResult("⚠️", "提交失敗", "無法將成績送出，請檢查網路連線後再試一次。");
    }
}

/**
 * (輔助函數) 格式化時間 (秒 -> 分:秒)
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
/**
 * 【更新】觸發彩色紙片慶祝特效
 * @param {number} particleCount - 要產生的紙片數量
 */
function triggerStreakCelebration(particleCount = 50) {
    const colors = config.CONFETTI_COLORS;
    if (!colors || colors.length === 0) return;

    for (let i = 0; i < particleCount; i++) {
        const confettiElement = document.createElement("div");
        confettiElement.className = "confetti";

        // 隨機選擇形狀
        const shape = Math.random();
        if (shape < 0.3) {
            confettiElement.classList.add('square');
        } else if (shape < 0.6) {
            confettiElement.classList.add('triangle');
        } // 否則為預設的圓形

        confettiElement.style.setProperty('--confetti-color', colors[Math.floor(Math.random() * colors.length)]);

        // 隨機設定水平偏移量、落下距離和旋轉角度
        const randomX = (Math.random() - 0.5) * window.innerWidth * 0.8; // 寬度 80% 的範圍
        const randomY = window.innerHeight + Math.random() * 200; // 落在畫面下方並延伸
        const randomRotate = Math.random() * 720 - 360; // -360deg 到 360deg
        
        confettiElement.style.setProperty('--confetti-x', `${randomX}px`);
        confettiElement.style.setProperty('--confetti-y', `${randomY}px`);
        confettiElement.style.setProperty('--confetti-rotate', `${randomRotate}deg`);
        
        // 設置隨機的動畫延遲，讓紙片陸續落下
        confettiElement.style.animationDelay = `${Math.random() * 1}s`; // 延遲 0 到 1 秒

        document.body.appendChild(confettiElement);

        // 動畫結束後移除元素
        setTimeout(() => {
            confettiElement.remove();
        }, 3000); // 應比動畫時間 2.5s 稍長，確保完全結束
    }
}


// =================================================================
const arr_pz = ["ainn","","iang","","iong","","iung","","uang","","inn","","eeu","","een","","eem","","eed","","eeb","","enn","","onn","","ang","","iag","","ied","","ien","","ong","","ung","","iid","","iim","","iin","","iab","","iam","","iau","","iog","","ieb","","iem","","ieu","","iug","","iun","","uad","","uai","","uan","","ued","","uen","","iui","","ioi","","iud","","ion","","iib","","ab","","ad","","ag","","ai","","am","","an","","au","","ed","","en","","eu","","ee","","oo","","er","","id","","in","","iu","","od","","og","","oi","","ud","","ug","","un","","em","","ii","","on","","ui","","eb","","io","","ia","","ib","","ie","","im","","ua","","bb","","a","","e","","i","","o","","u","","ng","","rh","","r","","zh","","ch","","sh","","b","","p","","m","","f","","d","","t","","n","","l","","g","","k","","h","","j","","q","","x","","z","","c","","s","","v",""];

// 啟動應用
init()