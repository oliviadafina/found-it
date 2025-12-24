<template>
  <div class="p-4 md:p-6 bg-white shadow-md">
    <h2 class="text-xl text-center text-found-dark font-semibold mb-4">
      {{ isEditing ? "Edit Aktivitasmu" : "Catat Aktivitasmu" }}
    </h2>

    <form class="space-y-3">
      <!-- LOKASI -->
      <div class="flex">
        <input
          v-model="location"
          ref="locationInput"
          type="text"
          placeholder="Lokasi"
          class="w-full border rounded-l p-2"
          @keyup.enter="handleLocationEnter"
        />

        <button
          type="button"
          @click="searchLocation"
          class="border border-found-blue text-found-blue hover:bg-found-blue hover:text-white px-4 rounded-r flex items-center justify-center transition"
        >
          <i class="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>

      <p v-if="status === 'loading'" class="text-blue-600 text-sm">
        Mencari lokasi...
      </p>
      <p v-if="status === 'notfound'" class="text-red-600 text-sm">
        Lokasi tidak ditemukan.
      </p>

      <!-- KEGIATAN -->
      <input
        v-model="activity"
        ref="activityInput"
        type="text"
        placeholder="Kegiatan"
        class="w-full border rounded p-2"
        @keyup.enter="$refs.startTimeInput.focus()"
      />

      <!-- WAKTU -->
      <input
        v-model="startTime"
        ref="startTimeInput"
        type="time"
        class="w-full border rounded p-2"
        :min="allowedStartMin"
        :max="allowedStartMax"
        @input="validateStart"
        @keyup.enter="$refs.endTimeInput.focus()"
      />
      <p v-if="startError" class="text-red-600 text-sm -mt-1">
        {{ startError }}
      </p>
      <input
        v-model="endTime"
        ref="endTimeInput"
        type="time"
        class="w-full border rounded p-2"
        :min="allowedEndMin"
        :max="allowedEndMax"
        @input="validateEnd"
        @keyup.enter="handleSubmit"
      />
      <p v-if="endError" class="text-red-600 text-sm -mt-1">{{ endError }}</p>
      <p v-if="timeError" class="text-red-600 text-sm -mt-1 mb-1">
        {{ timeError }}
      </p>
      <button
        type="button"
        @click="handleSubmit"
        class="border border-found-orange text-found-orange hover:bg-found-orange hover:text-white py-3 md:py-2 text-base md:text-sm rounded flex items-center justify-center w-full transition"
      >
        {{ isEditing ? "Simpan Perubahan" : "Simpan Aktivitas" }}
      </button>
      <button
        v-if="isEditing"
        type="button"
        @click="handleCancelEdit"
        class="border border-[#DC0E0E] text-[#DC0E0E] hover:bg-[#DC0E0E] hover:text-white py-2 rounded flex items-center justify-center w-full transition"
      >
        Kembali
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  currentLocation: String,
  status: String,
  editData: Object,
  isEditing: Boolean,
  activities: Array,
});

const emits = defineEmits(["save", "search", "cancel-edit"]);

const location = ref("");
const activity = ref("");
const startTime = ref("");
const endTime = ref("");

const timeError = ref("");
const startError = ref(""); // ⭐ tambahan
const endError = ref(""); // ⭐ tambahan

const allowedStartMin = ref("00:00");
const allowedStartMax = ref("23:59");
const allowedEndMin = ref("00:00");
const allowedEndMax = ref("23:59");

// isi form saat edit
watch(
  () => props.editData,
  (data) => {
    if (data) {
      location.value = data.location;
      activity.value = data.activity;
      startTime.value = data.startTime;
      endTime.value = data.endTime;
    }
  }
);

function handleCancelEdit() {
  emits("cancel-edit");
}

// auto isi lokasi dari map
watch(
  () => props.currentLocation,
  (v) => {
    if (!v) return;
    if (props.isEditing && location.value) return;
    location.value = v;
  }
);

// jam yang sudah dipakai
const blockedRanges = computed(() =>
  props.activities
    .filter((a) => !props.isEditing || a.id !== props.editData?.id)
    .map((a) => ({
      start: a.startTime,
      end: a.endTime,
    }))
);

// Convert "HH:MM" -> menit
function toMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Cek overlap start
function isStartBlocked(startMin) {
  return blockedRanges.value.some((r) => {
    const rStart = toMinutes(r.start);
    const rEnd = toMinutes(r.end);
    return startMin >= rStart && startMin < rEnd;
  });
}

// Cek overlap end
function isEndBlocked(endMin) {
  return blockedRanges.value.some((r) => {
    const rStart = toMinutes(r.start);
    const rEnd = toMinutes(r.end);
    return endMin > rStart && endMin <= rEnd;
  });
}

// VALIDASI START TIME
function validateStart() {
  startError.value = "";
  if (!startTime.value) return;

  const startMin = toMinutes(startTime.value);
  const endMin = endTime.value ? toMinutes(endTime.value) : null;

  // Overlap di start
  if (isStartBlocked(startMin)) {
    startError.value = "Waktu mulai bertabrakan dengan aktivitas sebelumnya!";
    startTime.value = "";
    return;
  }

  // FULL OVERLAP saat end sudah terisi
  if (endMin && isFullOverlap(startMin, endMin)) {
    startError.value =
      "Harap periksa kembali rentang waktu yang anda masukkan!";
    startTime.value = "";
    return;
  }

  allowedEndMin.value = startTime.value;

  if (endTime.value && endMin <= startMin) {
    endError.value = "Waktu selesai harus lebih besar dari waktu mulai!";
    endTime.value = "";
  }
}

// VALIDASI END TIME
function validateEnd() {
  endError.value = "";
  if (!endTime.value) return;

  const startMin = toMinutes(startTime.value);
  const endMin = toMinutes(endTime.value);

  // END <= START
  if (endMin <= startMin) {
    endError.value = "Waktu selesai harus lebih besar dari waktu mulai.";
    endTime.value = "";
    return;
  }

  // Overlap di end
  if (isEndBlocked(endMin)) {
    endError.value = "Waktu selesai bertabrakan dengan aktivitas sebelumnya!";
    endTime.value = "";
    return;
  }

  // FULL OVERLAP
  if (isFullOverlap(startMin, endMin)) {
    endError.value = "Harap periksa kembali rentang waktu yang anda masukkan!";
    endTime.value = "";
    return;
  }
}

function isFullOverlap(startMin, endMin) {
  return blockedRanges.value.some((r) => {
    const rStart = toMinutes(r.start);
    const rEnd = toMinutes(r.end);
    return startMin <= rStart && endMin >= rEnd;
  });
}

// SUBMIT
function handleSubmit() {
  if (
    !location.value ||
    !activity.value ||
    !startTime.value ||
    !endTime.value
  ) {
    alert("Harap mengisi semua kolom!");
    return;
  }

  if (startTime.value >= endTime.value) {
    timeError.value = "Harap periksa kembali waktu yang Anda masukkan!";
    return;
  }

  timeError.value = "";
  emits("save", {
    location: location.value,
    activity: activity.value,
    startTime: startTime.value,
    endTime: endTime.value,
  });
}

// SEARCH
function searchLocation() {
  if (!location.value.trim()) {
    alert("Harap masukkan lokasi!");
    return;
  }
  emits("search", location.value);
}

function handleLocationEnter() {
  searchLocation();
  setTimeout(() => $refs.activityInput?.focus(), 800);
}

function resetFields() {
  location.value = "";
  activity.value = "";
  startTime.value = "";
  endTime.value = "";
}

defineExpose({
  resetFields,
});
</script>
