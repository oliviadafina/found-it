<template>
  <div class="p-6 bg-white shadow-md">
    <h2 class="text-xl text-center text-found-dark font-semibold mb-4">Catat Aktivitasmu</h2>
    <form @submit.prevent="handleSubmit" class="space-y-3">
      <div class="flex">
        <input
          v-model="location"
          type="text"
          placeholder="Lokasi"
          class="w-full border rounded-l p-2"
        />
        <button
          type="button"
          @click="searchLocation"
          class="border border-found-blue text-found-blue hover:bg-found-blue hover:text-white px-4 rounded-r flex items-center justify-center transition ">
          <i class="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>
      <input
        v-model="activity"
        type="text"
        placeholder="Kegiatan"
        class="w-full border rounded p-2"
      />
      <input v-model="startTime" type="time" class="w-full border rounded p-2" />
      <input v-model="endTime" type="time" class="w-full border rounded p-2" />
      <button
        type="submit"
        class="border border-found-orange text-found-orange hover:bg-found-orange hover:text-white py-2 rounded flex items-center justify-center w-full transition"
      >
        Simpan Aktivitas
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  currentLocation: String,
});

const emits = defineEmits(["save", "search"]);
const location = ref("");
const activity = ref("");
const startTime = ref("");
const endTime = ref("");

watch(
  () => props.currentLocation,
  (newLoc) => {
    if (newLoc) location.value = newLoc;
  }
);

const handleSubmit = () => {
  if (!location.value || !activity.value || !startTime.value || !endTime.value) {
    alert("Harap mengisi semua kolom!");
    return;
  }
  emits("save", {
    location: location.value,
    activity: activity.value,
    startTime: startTime.value,
    endTime: endTime.value,
  });
  location.value = "";
  activity.value = "";
  startTime.value = "";
  endTime.value = "";
};

const searchLocation = () => {
  if (!location.value.trim()) {
    alert("Harap masukkan lokasi!");
    return;
  }
  emits("search", location.value);
};
</script>
