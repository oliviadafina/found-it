<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <HeaderBar />
    <div class="flex flex-col md:flex-row flex-grow h-[calc(100vh-64px)]">
      <div
        class="w-full md:w-1/3 flex flex-col bg-white shadow-md overflow-y-auto max-h-[calc(100vh-64px)] p-6 space-y-6"
      >
        <ActivityForm
          :currentLocation="location"
          @save="addActivity"
          @search="updateSearchLocation"
        />

        <div class="bg-white p-4 rounded-lg shadow-md flex flex-col">
          <h2 class="text-lg text-center font-semibold mb-4 text-found-dark">
            Daftar Aktivitas
          </h2>

          <div v-if="activities.length > 0" class="relative border-l-4 border-found-dark ml-4">
            <div
              v-for="(item, index) in activities"
              :key="index"
              class="mb-6 ml-6 relative"
            >
              <div
                class="absolute -left-[22px] top-1.5 w-4 h-4 bg-found-orange rounded-full border-2 border-white"
              ></div>
              <p class="text-gray-800 font-medium">
                {{ item.startTime }} - {{ item.endTime }} |
                <span class="font-semibold text-found-blue">{{ item.location }}</span> |
                {{ item.activity }}
              </p>
            </div>
          </div>

          <p v-else class="text-gray-500 text-center">
            Belum ada aktivitas disimpan.
          </p>

          <div class="mt-4">
            <button
              v-if="activities.length >= 2"
              @click="analyzeAI"
              class="border border-found-orange text-found-orange hover:bg-found-orange hover:text-white py-2 rounded flex items-center justify-center w-full transition"
            >
              Analisis AI
            </button>
          </div>
        </div>
      </div>

      <div class="w-full md:w-2/3 h-[calc(100vh-64px)]">
        <MapView :searchLocation="searchLocation" @update-location="updateLocation" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import HeaderBar from "../components/HeaderBar.vue";
import ActivityForm from "../components/ActivityForm.vue";
import MapView from "../components/MapView.vue";

const activities = ref([]);
const location = ref("");
const searchLocation = ref("");

const addActivity = (activity) => {
  activities.value.push(activity);
};

const updateLocation = (loc) => {
  location.value = loc;
};

const updateSearchLocation = (locName) => {
  searchLocation.value = locName;
};
</script>