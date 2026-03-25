// --- CONFIGURATION ---
const API_KEYS = {
    EXCHANGE_RATE: "7690e500f736a474488a6e79"
};

// Multiple CORS Proxies (سنجربهم بالترتيب)
const CORS_PROXIES = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
    "https://api.codetabs.com/v1/proxy?quest="
];

// --- STATE VARIABLES ---
let btcPriceUSD = 65000; // سعر افتراضي مبدئي
let usdToMru = 39.75;    // سعر افتراضي مبدئي
let currentLang = 'en';
let isDataLoaded = false;
let wsConnected = false;

// --- TRANSLATIONS ---
const translations = {
    en: {
        dashboard: "Dashboard",
        converter: "Converter",
        lbl_btc_usd: "Price in USD",
        lbl_usd_mru: "Exchange Rate (USD/MRU)",
        last_updated: "Last Update: ",
        convert_title: "Currency Converter",
        btn_convert: "Convert Now",
        loading: "Loading...",
        error_msg: "Using cached data",
        success: "Live",
        error: "Offline"
    },
    ar: {
        dashboard: "لوحة التحكم",
        converter: "محول العملات",
        lbl_btc_usd: "السعر بالدولار",
        lbl_usd_mru: "سعر الصرف (دولار/أوقية)",
        last_updated: "آخر تحديث: ",
        convert_title: "محول العملات",
        btn_convert: "تحويل الآن",
        loading: "جاري التحميل...",
        error_msg: "استخدام البيانات المؤقتة",
        success: "مباشر",
        error: "غير متصل"
    }
};

// --- DOM ELEMENTS ---const els = {
    btcUsd: document.getElementById('price-btc-usd'),
    usdMru: document.getElementById('price-usd-mru'),
    lastUpdated: document.getElementById('last-updated'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    sections: document.querySelectorAll('.section'),
    convAmount: document.getElementById('conv-amount'),
    convFrom: document.getElementById('conv-from'),
    convTo: document.getElementById('conv-to'),
    convResult: document.getElementById('conv-result'),
    convError: document.getElementById('conv-error')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ CryptoMRU Initialized");
    setLanguage('en');
    
    // عرض الأسعار الافتراضية فوراً
    updateUI(btcPriceUSD, usdToMru);
    
    // الاتصال بـ Binance WebSocket
    connectBinanceWebSocket();
    
    // جلب سعر الصرف كل 30 ثانية
    fetchExchangeRate();
    setInterval(fetchExchangeRate, 30000);
});

// --- BINANCE WEBSOCKET (لا يحتاج CORS!) ---
function connectBinanceWebSocket() {
    console.log(" Connecting to Binance WebSocket...");
    
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
    
    ws.onopen = () => {
        console.log("✅ Binance WebSocket Connected");
        wsConnected = true;
        els.convError.style.display = 'none';
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const price = parseFloat(data.p);
        
        if (price > 0) {
            btcPriceUSD = price;
            updateUI(btcPriceUSD, usdToMru);
            console.log("📊 BTC Price:", price);
        }    };
    
    ws.onerror = (error) => {
        console.error("❌ WebSocket Error:", error);
        wsConnected = false;
    };
    
    ws.onclose = () => {
        console.log("🔌 WebSocket Closed, reconnecting...");
        wsConnected = false;
        setTimeout(connectBinanceWebSocket, 5000);
    };
}

// --- FETCH EXCHANGE RATE ---
async function fetchExchangeRate() {
    const t = translations[currentLang];
    
    for (let proxy of CORS_PROXIES) {
        try {
            const url = `https://v6.exchangerate-api.com/v6/${API_KEYS.EXCHANGE_RATE}/latest/USD`;
            const response = await fetch(proxy + encodeURIComponent(url));
            
            if (response.ok) {
                const data = await response.json();
                const rate = data.conversion_rates.MRU;
                
                if (rate && rate > 0) {
                    usdToMru = rate;
                    updateUI(btcPriceUSD, usdToMru);
                    console.log("✅ USD to MRU:", rate);
                    return; // نجح، اخرج من الحلقة
                }
            }
        } catch (error) {
            console.warn(`Proxy failed: ${proxy}`, error);
            // جرب البروكسي التالي
        }
    }
    
    // إذا كل البروكسيات فشلت، استخدم سعر تقريبي
    console.log("⚠️ Using fallback exchange rate");
    updateUI(btcPriceUSD, usdToMru);
}

// --- UPDATE UI ---
function updateUI(btc, mru) {
    isDataLoaded = true;
    
    // تحديث BTC    els.btcUsd.style.color = "#00ff88";
    els.btcUsd.style.textShadow = "0 0 20px #00ff88";
    els.btcUsd.innerText = `$ ${btc.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    setTimeout(() => {
        els.btcUsd.style.color = "";
        els.btcUsd.style.textShadow = "";
    }, 600);
    
    // تحديث MRU
    els.usdMru.style.color = "#00f0ff";
    els.usdMru.style.textShadow = "0 0 20px #00f0ff";
    els.usdMru.innerText = `${mru.toLocaleString('en-US', {minimumFractionDigits: 4, maximumFractionDigits: 4})} MRU`;
    
    setTimeout(() => {
        els.usdMru.style.color = "";
        els.usdMru.style.textShadow = "";
    }, 600);
    
    // تحديث الوقت
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    let prefix = translations[currentLang].last_updated;
    els.lastUpdated.innerText = `${prefix} ${timeString}`;
    
    // إخفاء رسالة الخطأ
    els.convError.style.display = 'none';
}

// --- LANGUAGE SWITCHER ---
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    document.body.style.direction = dir;
    document.documentElement.lang = lang;
    
    // Update buttons
    document.getElementById('btn-en').classList.remove('active');
    document.getElementById('btn-ar').classList.remove('active');
    document.getElementById(`btn-${lang}`).classList.add('active');
    
    // Update text
    document.getElementById('tab-dashboard').innerText = t.dashboard;
    document.getElementById('tab-converter').innerText = t.converter;
    document.getElementById('lbl-btc-usd').innerText = t.lbl_btc_usd;
    document.getElementById('lbl-usd-mru').innerText = t.lbl_usd_mru;
    document.getElementById('lbl-convert-title').innerText = t.convert_title;
    document.getElementById('btn-convert').innerText = t.btn_convert;}

// --- TABS LOGIC ---
els.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        els.tabBtns.forEach(b => b.classList.remove('active'));
        els.sections.forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// --- CONVERTER ---
function convertCurrency() {
    const amount = parseFloat(els.convAmount.value);
    const from = els.convFrom.value;
    const to = els.convTo.value;
    
    els.convError.style.display = 'none';
    
    if (!amount || amount <= 0 || isNaN(amount)) {
        els.convResult.value = "0";
        return;
    }
    
    // حتى لو البيانات تقريبية، نحسب
    let amountInUSD = 0;
    if (from === 'USD') amountInUSD = amount;
    else if (from === 'BTC') amountInUSD = amount * btcPriceUSD;
    else if (from === 'MRU') amountInUSD = amount / usdToMru;
    
    let result = 0;
    if (to === 'USD') result = amountInUSD;
    else if (to === 'BTC') result = amountInUSD / btcPriceUSD;
    else if (to === 'MRU') result = amountInUSD * usdToMru;
    
    let decimals = to === 'BTC' ? 8 : 2;
    const formattedResult = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(result);
    
    els.convResult.value = formattedResult;
    
    // Success animation
    els.convResult.style.borderColor = "#00ff88";
    setTimeout(() => {
        els.convResult.style.borderColor = "rgba(255,255,255,0.2)";
    }, 500);
        }
