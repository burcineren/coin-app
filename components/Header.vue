<template>
<h2 class="text-2xl font-bold mb-2 text-gray-800">
      Canlı BTC/USDT Fiyatı:
    </h2>
    <p v-if="btcPrice" class="text-3xl font-semibold text-orange-500 mb-4">
      {{ btcPrice }} USD
    </p>
    <p v-else class="text-gray-500 mb-4">Yükleniyor...</p>

    <div class="grid grid-cols-3 gap-3 mb-6">
      <div
        class="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-lg shadow-lg"
      >
        <div class="text-sm font-medium opacity-90">BTC/USDT</div>
        <div class="text-lg font-bold">
          ${{
            lastBTC?.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) ||
            "0.00"
          }}
        </div>
      </div>
      <div
        class="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-4 rounded-lg shadow-lg"
      >
        <div class="text-sm font-medium opacity-90">ETH/USDT</div>
        <div class="text-lg font-bold">
          ${{
            lastETH?.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) ||
            "0.00"
          }}
        </div>
      </div>
      <div
        class="bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 rounded-lg shadow-lg"
      >
        <div class="text-sm font-medium opacity-90">SOL/USDT</div>
        <div class="text-lg font-bold">
          ${{
            lastSOL?.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) ||
            "0.00"
          }}
        </div>
      </div>
    </div>

</template>
<script setup  lang="ts">
  import { defineProps } from 'vue';
const props = defineProps<{
    btcPrice:any
}>();
</script>
<style scoped>
</style >