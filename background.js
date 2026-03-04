// background.js - 后台服务工作者

// 默认 API 地址
const DEFAULT_API_URL = 'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/all';

// 当前设置
let currentSettings = {
  customApiUrl: '',
  refreshInterval: 0,
  maxItems: 50
};

// 自动刷新定时器
let refreshTimer = null;

// 扩展安装或更新时
chrome.runtime.onInstalled.addListener((details) => {
  console.log('B站动态播放列表扩展已安装/更新:', details.reason);
  loadSettings();
});

// 启动时加载设置
chrome.runtime.onStartup.addListener(() => {
  loadSettings();
});

// 加载设置
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['settings']);
    if (result.settings) {
      currentSettings = { ...currentSettings, ...result.settings };
    }
    setupAutoRefresh();
  } catch (e) {
    console.error('加载设置失败:', e);
  }
}

// 设置自动刷新
function setupAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  if (currentSettings.refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      console.log('自动刷新触发');
    }, currentSettings.refreshInterval * 60 * 1000);
  }
}

// 获取 B站 Cookie
async function getBilibiliCookies() {
  try {
    // 获取所有 bilibili 相关域名的 cookie
    const domains = ['.bilibili.com', 'bilibili.com'];
    const allCookies = [];

    for (const domain of domains) {
      try {
        const cookies = await chrome.cookies.getAll({ domain: domain });
        allCookies.push(...cookies);
      } catch (e) {
        // 忽略错误
      }
    }

    // 去重
    const cookieMap = {};
    allCookies.forEach(cookie => {
      cookieMap[cookie.name] = cookie.value;
    });

    // 生成 Cookie 字符串
    const cookieString = Object.entries(cookieMap)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');

    return {
      cookieString,
      cookieMap
    };
  } catch (e) {
    console.error('获取Cookie失败:', e);
    return { cookieString: '', cookieMap: {} };
  }
}

// 检查登录状态
async function checkLoginStatus() {
  const { cookieMap } = await getBilibiliCookies();
  return !!cookieMap['SESSDATA'];
}

// 获取播放列表数据
async function fetchPlaylist(apiUrl) {
  const url = apiUrl || DEFAULT_API_URL;
  
  // 获取 Cookie
  const { cookieMap } = await getBilibiliCookies();
  
  // 检查登录状态
  if (!cookieMap['SESSDATA']) {
    return {
      error: '账号未登录，请先在浏览器中登录B站',
      code: -101
    };
  }

  // 生成 Cookie 字符串
  const cookieString = Object.entries(cookieMap)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

  try {
    // 构建请求头
    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': 'https://www.bilibili.com/',
      'Origin': 'https://www.bilibili.com',
      'Cookie': cookieString,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const data = await response.json();

    if (data.code === -101) {
      return {
        error: '账号未登录或登录已过期，请重新登录B站',
        code: -101
      };
    }

    if (data.code !== 0) {
      return {
        error: data.message || `API错误 (code: ${data.code})`,
        code: data.code
      };
    }

    // 统计视频数量
    const items = data.data?.items || [];
    const videoItems = items.filter(item =>
      item.modules?.module_dynamic?.major?.archive?.title
    );

    return {
      data: data.data,
      videoCount: videoItems.length,
      code: 0
    };

  } catch (e) {
    console.error('请求失败:', e);
    return {
      error: e.message || '请求失败，请检查网络连接',
      code: -1
    };
  }
}

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'FETCH_PLAYLIST':
      fetchPlaylist(message.apiUrl)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ error: error.message, code: -1 }));
      return true; // 异步响应

    case 'SETTINGS_UPDATED':
      currentSettings = { ...currentSettings, ...message.settings };
      setupAutoRefresh();
      sendResponse({ success: true });
      return false;

    case 'CHECK_LOGIN':
      checkLoginStatus()
        .then(isLoggedIn => sendResponse({ isLoggedIn }))
        .catch(() => sendResponse({ isLoggedIn: false }));
      return true;

    case 'GET_COOKIES':
      getBilibiliCookies()
        .then(cookies => sendResponse(cookies))
        .catch(() => sendResponse({ cookieString: '', cookieMap: {} }));
      return true;

    default:
      sendResponse({ error: '未知消息类型' });
      return false;
  }
});

console.log('B站动态播放列表后台服务已启动');
