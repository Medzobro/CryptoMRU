// --- CONFIGURATION ---
const API_KEYS = {
    COINGECKO: "CG-PvvJn7iqqY7oXJDXPoirgogr",
    EXCHANGE_RATE: "7690e500f736a474488a6e79"
};

// --- STATE VARIABLES ---
let btcPriceUSD = 0;
let usdToMru = 0;
let currentLang = 'en';
let isDataLoaded = false;
let lastBtcFetchTime = 0;

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
        error_msg: "Please wait for prices to load...",
        btc_error: "Failed to load BTC price. Try again later.",
        success: "Updated",
        error: "Error"
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
        error_msg: "الرجاء الانتظار حتى يتم تحميل الأسعار...",
        btc_error: "فشل تحميل سعر البيتكوين. حاول مرة أخرى لاحقاً.",
        success: "تم التحديث",
        error: "خطأ"
    },
    fr: {
        dashboard: "Tableau de bord",
        converter: "Convertisseur",
        lbl_btc_usd: "Prix en USD",
        lbl_usd_mru: "Taux de change (USD/MRU)",
        last_updated: "Dernière mise à jour: ",
        convert_title: "Convertisseur de devises",        btn_convert: "Convertir",
        loading: "Chargement...",
        error_msg: "Veuillez attendre le chargement...",
        btc_error: "Échec du chargement du prix BTC. Réessayez plus tard.",
        success: "Mis à jour",
        error: "Erreur"
    }
};

// --- DOM ELEMENTS ---
const els = {
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
    setLanguage('en');
    fetchPrices();
    // Auto refresh every 10 seconds
    setInterval(fetchPrices, 10000);
});

// --- API FUNCTIONS ---
async function fetchPrices() {
    const t = translations[currentLang];
    
    // We only update the "Last Updated" time if at least one API succeeds
    let anySuccess = false;

    try {
        // --- API 1: CoinGecko for BTC/USD ---
        // Add a small delay to avoid rate limiting on rapid requests
        const now = Date.now();
        if (now - lastBtcFetchTime < 5000) {
             console.log("Skipping BTC fetch to avoid rate limit");
        } else {
            lastBtcFetchTime = now;
            const btcRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`);
            
            if (!btcRes.ok) {
                if (btcRes.status === 429) {                    throw new Error('Rate Limit Exceeded');
                }
                throw new Error('CoinGecko API failed');
            }
            const btcData = await btcRes.json();
            
            if (btcData && btcData.bitcoin && btcData.bitcoin.usd) {
                btcPriceUSD = btcData.bitcoin.usd;
                animateValue(els.btcUsd, btcPriceUSD, "$", 2);
                anySuccess = true;
            } else {
                throw new Error('Invalid BTC data');
            }
        }

        // --- API 2: ExchangeRate for USD/MRU ---
        const mruRes = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEYS.EXCHANGE_RATE}/latest/USD`);
        if (!mruRes.ok) throw new Error('ExchangeRate API failed');
        const mruData = await mruRes.json();
        
        if (mruData && mruData.conversion_rates && mruData.conversion_rates.MRU) {
            usdToMru = mruData.conversion_rates.MRU;
            animateValue(els.usdMru, usdToMru, "MRU", 4);
            anySuccess = true;
        } else {
            throw new Error('Invalid MRU data');
        }

        // If at least one API succeeded, mark data as loaded and update status
        if (anySuccess) {
            isDataLoaded = true;
            updateStatus(t.success);
        }

    } catch (error) {
        console.error("API Error:", error.message);
        
        // Show specific error for BTC if it fails
        if (error.message.includes('BTC') || error.message.includes('CoinGecko') || error.message.includes('Rate Limit')) {
            els.btcUsd.innerText = t.btc_error;
            els.btcUsd.style.color = "#ff4444";
        }
        
        // Only show general error if BOTH fail
        if (!anySuccess) {
            updateStatus(t.error);
            isDataLoaded = false;
        } else {
            // If one succeeded, just update the time
            updateStatus(t.success + " (Partial)");        }
    }
}

// --- UI UPDATES ---
function animateValue(element, value, currency, decimals) {
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
    
    // Flash animation on update
    element.style.color = "#00ff88";
    element.style.textShadow = "0 0 20px #00ff88";
    
    setTimeout(() => {
        element.style.color = "";
        element.style.textShadow = "";
    }, 600);
    
    element.innerText = `${currency} ${formatted}`;
}

function updateStatus(msg) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    let prefix = translations.en.last_updated;
    if(currentLang === 'ar') prefix = translations.ar.last_updated;
    if(currentLang === 'fr') prefix = translations.fr.last_updated;

    els.lastUpdated.innerText = `${prefix} ${timeString}`;
}

// --- LANGUAGE SWITCHER ---
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    document.body.style.direction = dir;
    document.documentElement.lang = lang;

    document.getElementById('tab-dashboard').innerText = t.dashboard;
    document.getElementById('tab-converter').innerText = t.converter;
    
    document.getElementById('lbl-btc-usd').innerText = t.lbl_btc_usd;
    document.getElementById('lbl-usd-mru').innerText = t.lbl_usd_mru;
    
    document.getElementById('lbl-convert-title').innerText = t.convert_title;    document.getElementById('btn-convert').innerText = t.btn_convert;

    if(!isDataLoaded) {
        els.btcUsd.innerText = t.loading;
        els.usdMru.innerText = t.loading;
    }
}

// --- TABS LOGIC ---
els.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        els.tabBtns.forEach(b => b.classList.remove('active'));
        els.sections.forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.tab);
        target.classList.add('active');
    });
});

// --- CONVERTER LOGIC ---
function convertCurrency() {
    const amount = parseFloat(els.convAmount.value);
    const from = els.convFrom.value;
    const to = els.convTo.value;
    
    els.convError.style.display = 'none';

    if (!amount || amount <= 0 || isNaN(amount)) {
        els.convResult.value = "0";
        return;
    }

    if (!isDataLoaded || (from !== 'USD' && btcPriceUSD === 0 && usdToMru === 0)) {
        els.convError.innerText = translations[currentLang].error_msg;
        els.convError.style.display = 'block';
        els.convResult.value = "";
        return;
    }

    let result = 0;
    let amountInUSD = 0;

    if (from === 'USD') {
        amountInUSD = amount;
    } else if (from === 'BTC') {
        if (btcPriceUSD === 0) {
             els.convError.innerText = "BTC price not available";
             els.convError.style.display = 'block';
             return;
        }        amountInUSD = amount * btcPriceUSD;
    } else if (from === 'MRU') {
        if (usdToMru === 0) {
             els.convError.innerText = "MRU rate not available";
             els.convError.style.display = 'block';
             return;
        }
        amountInUSD = amount / usdToMru;
    }

    if (to === 'USD') {
        result = amountInUSD;
    } else if (to === 'BTC') {
        if (btcPriceUSD === 0) {
             els.convError.innerText = "BTC price not available";
             els.convError.style.display = 'block';
             return;
        }
        result = amountInUSD / btcPriceUSD;
    } else if (to === 'MRU') {
        if (usdToMru === 0) {
             els.convError.innerText = "MRU rate not available";
             els.convError.style.display = 'block';
             return;
        }
        result = amountInUSD * usdToMru;
    }

    let decimals = 2;
    if (to === 'BTC') decimals = 8;
    
    const formattedResult = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(result);

    els.convResult.value = formattedResult;
    
    els.convResult.style.borderColor = "#00ff88";
    setTimeout(() => {
        els.convResult.style.borderColor = "rgba(255,255,255,0.2)";
    }, 500);
                                       }        error_msg: "الرجاء الانتظار حتى يتم تحميل الأسعار...",
        success: "تم التحديث",
        error: "خطأ"
    },
    fr: {
        dashboard: "Tableau de bord",
        converter: "Convertisseur",
        lbl_btc_usd: "Prix en USD",
        lbl_usd_mru: "Taux de change (USD/MRU)",
        last_updated: "Dernière mise à jour: ",
        convert_title: "Convertisseur de devises",
        btn_convert: "Convertir",
        loading: "Chargement...",
        error_msg: "Veuillez attendre le chargement...",        success: "Mis à jour",
        error: "Erreur"
    }
};

// --- DOM ELEMENTS ---
const els = {
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
    setLanguage('en');
    fetchPrices();
    // Auto refresh every 10 seconds (as requested)
    setInterval(fetchPrices, 10000);
});

// --- API FUNCTIONS ---
async function fetchPrices() {
    const t = translations[currentLang];
    updateStatus(t.loading);

    try {
        // API 1: CoinGecko for BTC/USD
        const btcRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`);
        if (!btcRes.ok) throw new Error('CoinGecko API failed');
        const btcData = await btcRes.json();
        btcPriceUSD = btcData.bitcoin.usd;

        // API 2: ExchangeRate for USD/MRU
        const mruRes = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEYS.EXCHANGE_RATE}/latest/USD`);
        if (!mruRes.ok) throw new Error('ExchangeRate API failed');
        const mruData = await mruRes.json();
        usdToMru = mruData.conversion_rates.MRU;

        // Validate data
        if (btcPriceUSD > 0 && usdToMru > 0) {
            isDataLoaded = true;
            
            // Update UI with High Precision            animateValue(els.btcUsd, btcPriceUSD, "$", 2);
            animateValue(els.usdMru, usdToMru, "MRU", 4);
            
            updateStatus(t.success);
        }

    } catch (error) {
        console.error("API Error:", error);
        updateStatus(t.error);
        isDataLoaded = false;
    }
}

// --- UI UPDATES ---
function animateValue(element, value, currency, decimals) {
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
    
    // Flash animation on update
    element.style.color = "#00ff88";
    element.style.textShadow = "0 0 20px #00ff88";
    
    setTimeout(() => {
        element.style.color = "";
        element.style.textShadow = "";
    }, 600);
    
    element.innerText = `${currency} ${formatted}`;
}

function updateStatus(msg) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    let prefix = translations.en.last_updated;
    if(currentLang === 'ar') prefix = translations.ar.last_updated;
    if(currentLang === 'fr') prefix = translations.fr.last_updated;

    els.lastUpdated.innerText = `${prefix} ${timeString}`;
}

// --- LANGUAGE SWITCHER ---
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    document.body.style.direction = dir;    document.documentElement.lang = lang;

    document.getElementById('tab-dashboard').innerText = t.dashboard;
    document.getElementById('tab-converter').innerText = t.converter;
    
    document.getElementById('lbl-btc-usd').innerText = t.lbl_btc_usd;
    document.getElementById('lbl-usd-mru').innerText = t.lbl_usd_mru;
    
    document.getElementById('lbl-convert-title').innerText = t.convert_title;
    document.getElementById('btn-convert').innerText = t.btn_convert;

    if(!isDataLoaded) {
        els.btcUsd.innerText = t.loading;
        els.usdMru.innerText = t.loading;
    }
}

// --- TABS LOGIC ---
els.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        els.tabBtns.forEach(b => b.classList.remove('active'));
        els.sections.forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.tab);
        target.classList.add('active');
    });
});

// --- CONVERTER LOGIC (FIXED & ACCURATE) ---
function convertCurrency() {
    const amount = parseFloat(els.convAmount.value);
    const from = els.convFrom.value;
    const to = els.convTo.value;
    
    els.convError.style.display = 'none';

    // Validate input
    if (!amount || amount <= 0 || isNaN(amount)) {
        els.convResult.value = "0";
        return;
    }

    // Check if data is loaded
    if (!isDataLoaded || btcPriceUSD === 0 || usdToMru === 0) {
        els.convError.innerText = translations[currentLang].error_msg;
        els.convError.style.display = 'block';
        els.convResult.value = "";
        return;
    }
    let result = 0;

    // Step 1: Convert everything to USD first (base currency)
    let amountInUSD = 0;

    if (from === 'USD') {
        amountInUSD = amount;
    } else if (from === 'BTC') {
        amountInUSD = amount * btcPriceUSD;
    } else if (from === 'MRU') {
        amountInUSD = amount / usdToMru;
    }

    // Step 2: Convert from USD to Target currency
    if (to === 'USD') {
        result = amountInUSD;
    } else if (to === 'BTC') {
        result = amountInUSD / btcPriceUSD;
    } else if (to === 'MRU') {
        result = amountInUSD * usdToMru;
    }

    // Step 3: Format result with appropriate precision
    let decimals = 2;
    if (to === 'BTC') decimals = 8; // Bitcoin needs 8 decimals for accuracy
    if (to === 'MRU') decimals = 2; 
    if (to === 'USD') decimals = 2;

    const formattedResult = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(result);

    els.convResult.value = formattedResult;
    
    // Success flash
    els.convResult.style.borderColor = "#00ff88";
    setTimeout(() => {
        els.convResult.style.borderColor = "rgba(255,255,255,0.2)";
    }, 500);
}
