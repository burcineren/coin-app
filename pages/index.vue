

<template>
  <div class="btc-price-box bg-gray-100 rounded-xl p-6 font-sans max-w-2xl mx-auto mt-8 shadow">
    <h2 class="text-2xl font-bold mb-2 text-gray-800">Canlı BTC/USDT Fiyatı:</h2>
    <p v-if="btcPrice" class="text-3xl font-semibold text-orange-500 mb-4">{{ btcPrice }} USD</p>
    <p v-else class="text-gray-500 mb-4">Yükleniyor...</p>
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
          <tr v-for="(trade, idx) in trades" :key="idx" class="border-b last:border-b-0 hover:bg-orange-50">
            <td class="py-2 px-3 text-center">{{ trade.price }}</td>
            <td class="py-2 px-3 text-center">{{ trade.quantity }}</td>
            <td class="py-2 px-3 text-center">{{ trade.time }}</td>
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
const priceHistory = ref([]); 
const timeHistory = ref([]);

onMounted(() => {
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
    priceHistory.value.push(Number(price));
    timeHistory.value.push(time);
    if (priceHistory.value.length > 30) {
      priceHistory.value.shift();
      timeHistory.value.shift();
    }
    if (chartInstance) {
      chartInstance.data.labels = [...timeHistory.value];
      chartInstance.data.datasets[0].data = [...priceHistory.value];
      chartInstance.update();
    }
  };
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  if (chartRef.value) {
    chartInstance = new Chart(chartRef.value, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'BTC/USDT Fiyatı',
            data: [],
            borderColor: '#f7931a',
            backgroundColor: 'rgba(247, 147, 26, 0.1)',
            tension: 0.2,
            pointRadius: 0,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            title: { display: true, text: 'Zaman' },
            ticks: { maxTicksLimit: 8 },
          },
          y: {
            title: { display: true, text: 'Fiyat (USD)' },
          },
        },
      },
    });
  }
});

onBeforeUnmount(() => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>

<style scoped>
</style>