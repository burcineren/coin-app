export const priceHistory = ref<number[]>([]);
export const timeHistory = ref<string[]>([]);
export const ethPriceHistory = ref<number[]>([]);
export const solPriceHistory = ref<number[]>([]);
export const lastBTC = ref<number | null>(null);
export const lastETH = ref<number | null>(null);
export const lastSOL = ref<number | null>(null);
export const lastUpdate = ref<string>('');
export const addDataToChart = (time: string, btc: number | null | undefined, eth: number | null | undefined, sol: number | null | undefined) => {


    console.log('Veri geldi:', { time, btc, eth, sol });

    // Son fiyatları güncelleme
    if (btc !== undefined) lastBTC.value = btc;
    if (eth !== undefined) lastETH.value = eth;
    if (sol !== undefined) lastSOL.value = sol;

    // Her veri geldiğinde grafik verilerini güncelleme
    timeHistory.value.push(time);
    priceHistory.value.push(lastBTC.value || 0);
    ethPriceHistory.value.push(lastETH.value || 0);
    solPriceHistory.value.push(lastSOL.value || 0);


    if (timeHistory.value.length > 20) {
        timeHistory.value.shift();
        priceHistory.value.shift();
        ethPriceHistory.value.shift();
        solPriceHistory.value.shift();
    }

    lastUpdate.value = new Date().toLocaleTimeString();
}
export const connectKlineWebSocket = () => {

    const klineSocket = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_1s');
    klineSocket.onopen = () => {
        console.log('BTC Kline WebSocket bağlantısı açıldı');
    };
    klineSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.k) {
            const kline = data.k;
            const price = parseFloat(kline.c).toFixed(2);
            const time = new Date(kline.t).toLocaleTimeString();
            addDataToChart(time, Number(price), undefined, undefined);
        }
    };
    klineSocket.onerror = (error) => {
        console.error('BTC Kline WebSocket error:', error);
    };
}

// ETH WebSocket
export const connectEthKlineWebSocket = () => {

    const trades = ref([]);
    const chartRef = ref(null);

    let socket = null;
    let klineSocket = null;
    let ethKlineSocket = null;

    ethKlineSocket = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@kline_1s');
    ethKlineSocket.onopen = () => {
        console.log('ETH Kline WebSocket bağlantısı açıldı');
    };
    ethKlineSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.k) {
            const kline = data.k;
            const price = parseFloat(kline.c).toFixed(2);
            const time = new Date(kline.t).toLocaleTimeString();
            addDataToChart(time, undefined, Number(price), undefined);
        }
    };
    ethKlineSocket.onerror = (error) => {
        console.error('ETH Kline WebSocket error:', error);
    };
}

// SOL WebSocket
export const connectSolKlineWebSocket = () => {
    let solKlineSocket = null;

    solKlineSocket = new WebSocket('wss://stream.binance.com:9443/ws/solusdt@kline_1s');
    solKlineSocket.onopen = () => {
        console.log('SOL Kline WebSocket bağlantısı açıldı');
    };
    solKlineSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.k) {
            const kline = data.k;
            const price = parseFloat(kline.c).toFixed(2);
            const time = new Date(kline.t).toLocaleTimeString();
            addDataToChart(time, undefined, undefined, Number(price));
        }
    };
    solKlineSocket.onerror = (error) => {
        console.error('SOL Kline WebSocket error:', error);
    };
}

// İlk veri yükleme
export const loadInitialData = async () => {

    try {
        // BTC fiyatı
        const btcResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const btcData = await btcResponse.json();
        lastBTC.value = parseFloat(btcData.price);

        // ETH fiyatı
        const ethResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
        const ethData = await ethResponse.json();
        lastETH.value = parseFloat(ethData.price);

        // SOL fiyatı
        const solResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT');
        const solData = await solResponse.json();
        lastSOL.value = parseFloat(solData.price);

        // İlk veriyi grafiğe ekleme
        addDataToChart(new Date().toLocaleTimeString(), lastBTC.value, lastETH.value, lastSOL.value);

        console.log('İlk veriler yüklendi:', { btc: lastBTC.value, eth: lastETH.value, sol: lastSOL.value });
    } catch (error) {
        console.error('İlk veri yükleme hatası:', error);
    }
}