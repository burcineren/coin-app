<template>
  <div class="btc-price-box bg-gray-100 rounded-xl p-6 font-sans max-w-2xl mx-auto mt-8 shadow">
    <h2 class="text-2xl font-bold mb-2 text-gray-800">Canlı BTC/USDT Fiyatı:</h2>
    <p v-if="btcPrice" class="text-3xl font-semibold text-orange-500 mb-4">{{ btcPrice }} USD</p>
    <p v-else class="text-gray-500 mb-4">Yükleniyor...</p>
    
    <!-- Anlık Fiyat Kartları -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      <div class="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-lg shadow-lg">
        <div class="text-sm font-medium opacity-90">BTC/USDT</div>
        <div class="text-lg font-bold">${{ lastBTC?.toLocaleString('tr-TR', {minimumFractionDigits: 2}) || '0.00' }}</div>
      </div>
      <div class="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-4 rounded-lg shadow-lg">
        <div class="text-sm font-medium opacity-90">ETH/USDT</div>
        <div class="text-lg font-bold">${{ lastETH?.toLocaleString('tr-TR', {minimumFractionDigits: 2}) || '0.00' }}</div>
      </div>
      <div class="bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 rounded-lg shadow-lg">
        <div class="text-sm font-medium opacity-90">SOL/USDT</div>
        <div class="text-lg font-bold">${{ lastSOL?.toLocaleString('tr-TR', {minimumFractionDigits: 2}) || '0.00' }}</div>
      </div>
    </div>
    
    <!-- Debug bilgisi -->
    <div class="text-xs text-gray-500 mb-2">
      Veri Sayısı: {{ timeHistory.length }} | Son Güncelleme: {{ lastUpdate }}
    </div>
    
    <h3 class="text-lg font-semibold mb-2 text-gray-700">Fiyat Analitiği</h3>
    <div class="bg-white rounded-lg shadow mb-6 p-2">
      <canvas ref="chartRef" height="120"></canvas>
    </div>
    <h3 class="text-lg font-semibold mb-2 text-gray-700">Son 10 İşlem</h3>
    <div class="overflow-x-auto">
      <table v-if="trades.length" class="min-w-full bg-white rounded-lg shadow text-sm">
        <thead>
          <tr class="bg-gray-200">
            <th class="py-2 px-3 text-center font-medium text-gray-700">Fiyat (USD)</th>
            <th class="py-2 px-3 text-center font-medium text-gray-700">Miktar</th>
            <th class="py-2 px-3 text-center font-medium text-gray-700">Zaman</th>
          </tr>
        </thead>
        <tbody>
          <!-- <tr v-for="(trade, idx) in trades" :key="idx" class="border-b last:border-b-0 hover:bg-orange-50">
            <td class="py-2 px-3 text-center font-medium text-green-600">${{ trade.price }}</td>
            <td class="py-2 px-3 text-center">{{ parseFloat(trade.quantity).toFixed(4) }} BTC</td>
            <td class="py-2 px-3 text-center">{{ trade.time }}</td>
          </tr> -->
          
          <tr class="border-b last:border-b-0 hover:bg-orange-50">
            <td class="py-2 px-3 text-center font-medium text-green-600">BTC/USDT</td>
            <td class="py-2 px-3 text-center">${{ lastBTC?.toLocaleString('tr-TR', {minimumFractionDigits: 2}) || '0.00' }}</td>
          </tr>
          <tr class="border-b last:border-b-0 hover:bg-orange-50">
            <td class="py-2 px-3 text-center font-medium text-green-600">ETH/USDT</td>
            <td class="py-2 px-3 text-center">${{ lastETH?.toLocaleString('tr-TR', {minimumFractionDigits: 2}) || '0.00' }}</td>
          </tr>
          <tr class="border-b last:border-b-0 hover:bg-orange-50">
            <td class="py-2 px-3 text-center font-medium text-green-600">SOL/USDT</td>
            <td class="py-2 px-3 text-center">${{ lastSOL?.toLocaleString('tr-TR', {minimumFractionDigits: 2}) || '0.00' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import Chart from 'chart.js/auto';

const btcPrice = ref(null);
const trades = ref([]);
const chartRef = ref(null); 
let chartInstance = null;
let socket = null;
let klineSocket = null;
let ethKlineSocket = null;
let solKlineSocket = null;

const priceHistory = ref([]); 
const timeHistory = ref([]);
const ethPriceHistory = ref([]);
const solPriceHistory = ref([]);
const lastBTC = ref(null);
const lastETH = ref(null);
const lastSOL = ref(null);
const lastUpdate = ref('');

// Basit veri ekleme fonksiyonu
function addDataToChart(time, btc, eth, sol) {
  console.log('Veri geldi:', { time, btc, eth, sol });
  
  // Son fiyatları güncelle
  if (btc !== undefined) lastBTC.value = btc;
  if (eth !== undefined) lastETH.value = eth;
  if (sol !== undefined) lastSOL.value = sol;
  
  // Her veri geldiğinde grafik güncelle
  timeHistory.value.push(time);
  priceHistory.value.push(lastBTC.value || 0);
  ethPriceHistory.value.push(lastETH.value || 0);
  solPriceHistory.value.push(lastSOL.value || 0);
  
  // Maksimum 20 veri tut
  if (timeHistory.value.length > 20) {
    timeHistory.value.shift();
    priceHistory.value.shift();
    ethPriceHistory.value.shift();
    solPriceHistory.value.shift();
  }
  
  lastUpdate.value = new Date().toLocaleTimeString();
  
  // Grafik güncelle
  if (chartInstance && chartInstance.data) {
    chartInstance.data.labels = [...timeHistory.value];
    chartInstance.data.datasets[0].data = [...priceHistory.value];
    chartInstance.data.datasets[1].data = [...ethPriceHistory.value];
    chartInstance.data.datasets[2].data = [...solPriceHistory.value];
    chartInstance.update('none');
  }
}

// BTC WebSocket - Her kline verisini al
function connectKlineWebSocket() {
  klineSocket = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_1s');
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
function connectEthKlineWebSocket() {
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
function connectSolKlineWebSocket() {
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
async function loadInitialData() {
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
    
    // İlk veriyi grafiğe ekle
    addDataToChart(new Date().toLocaleTimeString(), lastBTC.value, lastETH.value, lastSOL.value);
    
    console.log('İlk veriler yüklendi:', { btc: lastBTC.value, eth: lastETH.value, sol: lastSOL.value });
  } catch (error) {
    console.error('İlk veri yükleme hatası:', error);
  }
}

onMounted(async () => {
  // Dizileri temizle
  priceHistory.value = [];
  ethPriceHistory.value = [];
  solPriceHistory.value = [];
  timeHistory.value = [];

  // İlk verileri yükle
  await loadInitialData();

  if (chartRef.value) {
    try {
      chartInstance = new Chart(chartRef.value, {
        type: 'line',
        data: {
          labels: [...timeHistory.value],
          datasets: [
            {
              label: 'BTC/USDT',
              data: [...priceHistory.value],
              borderColor: '#ec4899',
              backgroundColor: 'rgba(236, 72, 153, 0.1)',
              tension: 0.4,
              pointRadius: 2,
              pointHoverRadius: 5,
              pointBackgroundColor: '#ec4899',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              fill: true,
              yAxisID: 'y',
            },
            {
              label: 'ETH/USDT',
              data: [...ethPriceHistory.value],
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              tension: 0.4,
              pointRadius: 2,
              pointHoverRadius: 5,
              pointBackgroundColor: '#8b5cf6',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              fill: true,
              yAxisID: 'y1',
            },
            {
              label: 'SOL/USDT',
              data: [...solPriceHistory.value],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              pointRadius: 2,
              pointHoverRadius: 5,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              fill: true,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: { 
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                font: { size: 12 }
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: '#ccc',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += context.parsed.y.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    });
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              title: { display: false, text: 'Zaman' },
              ticks: { 
                maxTicksLimit: 8,
                font: { size: 10 }
              },
              grid: {
                display: false
              }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: { 
                display: true, 
                text: 'BTC Fiyat (USD)',
                font: { size: 12, weight: 'bold' }
              },
              ticks: {
                callback: function(value) {
                  return value.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  });
                }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: { 
                display: true, 
                text: 'ETH/SOL Fiyat (USD)',
                font: { size: 12, weight: 'bold' }
              },
              ticks: {
                callback: function(value) {
                  return value.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  });
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Grafik oluşturma hatası:', error);
    }
  }
  
  // WebSocket bağlantılarını başlat
  connectKlineWebSocket();
  connectEthKlineWebSocket();
  connectSolKlineWebSocket();
  
  // Trade WebSocket bağlantısı
  socket = new WebSocket('wss://data-stream.binance.vision/ws/btcusdt@trade');
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const price = parseFloat(data.p).toFixed(2);
    const time = new Date(data.T).toLocaleTimeString();
    btcPrice.value = price;
    trades.value.unshift({
      price,
      quantity: parseFloat(data.q),
      time
    });
    if (trades.value.length > 10) trades.value.pop();
  };
  socket.onerror = (error) => {
    console.error('Trade WebSocket error:', error);
  };
});

onBeforeUnmount(() => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }
  if (klineSocket && klineSocket.readyState === WebSocket.OPEN) {
    klineSocket.close();
  }
  if (ethKlineSocket && ethKlineSocket.readyState === WebSocket.OPEN) {
    ethKlineSocket.close();
  }
  if (solKlineSocket && solKlineSocket.readyState === WebSocket.OPEN) {
    solKlineSocket.close();
  }
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>

<style scoped>
</style>