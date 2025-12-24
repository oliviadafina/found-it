<template>
  <!-- ROOT CONTAINER -->
  <div class="min-h-screen relative bg-gray-50">
    <!-- HEADER APLIKASI (RESET DATA AKTIVITAS) -->
    <HeaderBar @reset-activities="clearAllActivities" />

    <!-- ================================================= -->
    <!-- =================== MOBILE ===================== -->
    <!-- ================================================= -->

    <!-- MAP SEBAGAI BACKGROUND FULL SCREEN (MOBILE ONLY) -->
    <div class="md:hidden absolute inset-0 z-0 pt-16">
      <MapView
        ref="mobileMapRef"
        class="h-full"
        :searchLocation="searchLocation"
        @update-location="updateLocation"
        @ready="mobileMapReady = true"
      />
    </div>

    <!-- TOMBOL FOCUS MAP (MOBILE) -->
    <!-- Posisi di belakang bottom sheet -->
    <button
      class="md:hidden fixed z-0 right-4 bottom-52 transition-all duration-300"
      @click="focusMap"
    >
      <div
        class="w-12 h-12 rounded-full bg-found-blue text-white flex items-center justify-center shadow-lg active:scale-95"
      >
        <i class="fa-solid fa-crosshairs"></i>
      </div>
    </button>

    <!-- BOTTOM SHEET (FORM / LIST / HASIL AI) -->
    <div
      class="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white rounded-t-2xl shadow-xl transition-transform duration-300"
      :class="sheetOpen ? 'translate-y-0' : 'translate-y-[70%]'"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- HANDLE UNTUK DRAG SHEET -->
      <div
        class="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3"
        @click="sheetOpen = !sheetOpen"
      ></div>

      <!-- KONTEN SHEET -->
      <div class="px-4 pb-6 max-h-[70vh] overflow-y-auto pb-safe">
        <!-- MODE FORM / ANALYZING -->
        <template v-if="sheetMode === 'form' || sheetMode === 'analyzing'">
          <!-- FORM CATAT AKTIVITAS -->
          <ActivityForm
            :key="formKey"
            ref="activityFormRef"
            v-if="showForm"
            :currentLocation="location"
            :status="locationStatus"
            :isEditing="isEditing"
            :editData="editData"
            :activities="activities"
            @save="addActivity"
            @search="updateSearchLocation"
            @cancel-edit="cancelEditMode"
          />

          <!-- LIST AKTIVITAS -->
          <ActivityList
            v-if="!isEditing"
            :activities="activities"
            :hideActions="hideActivityActions"
            @edit="editActivity"
            @delete="deleteActivity"
          >
            <!-- TOMBOL ANALISIS AI (MOBILE) -->
            <button
              v-if="activities.length >= 2 && !aiResult"
              @click="handleAnalyzeMobile"
              class="w-full mt-3 border border-found-orange text-found-orange py-3 rounded flex items-center justify-center gap-2"
              :disabled="isAnalyzing"
            >
              <template v-if="!isAnalyzing"> Analisis AI </template>
              <template v-else>
                <i class="fa-solid fa-spinner fa-spin"></i>
                Menganalisis AI...
              </template>
            </button>
          </ActivityList>
        </template>

        <!-- MODE HASIL ANALISIS AI -->
        <template v-if="sheetMode === 'result'">
          <ActivityList :activities="activities" :hideActions="true" />
          <AiResultBox :aiResultHtml="aiResultHtml" @back="resetToAdd" />
        </template>
      </div>
    </div>

    <!-- ================================================= -->
    <!-- =================== DESKTOP ==================== -->
    <!-- ================================================= -->

    <div class="hidden md:flex h-[calc(100vh-64px)]">
      <!-- PANEL KIRI (FORM + LIST) -->
      <div class="w-1/3 bg-white shadow-md overflow-y-auto p-6 space-y-6">
        <!-- FORM AKTIVITAS (DESKTOP) -->
        <ActivityForm
          :key="formKey"
          v-if="showForm"
          :currentLocation="location"
          :status="locationStatus"
          :isEditing="isEditing"
          :editData="editData"
          :activities="activities"
          @save="addActivity"
          @search="updateSearchLocation"
          @cancel-edit="cancelEditMode"
        />

        <!-- LIST AKTIVITAS (DESKTOP) -->
        <ActivityList
          v-if="!isEditing"
          :key="`${sheetMode}-${hideActivityActions}`"
          :activities="activities"
          :hideActions="hideActivityActions"
          @edit="editActivity"
          @delete="deleteActivity"
        >
          <!-- TOMBOL ANALISIS AI (DESKTOP) -->
          <button
            v-if="activities.length >= 2 && !aiResult"
            @click="analyzeAI"
            :disabled="isAnalyzing"
            class="border border-found-orange text-found-orange hover:bg-found-orange hover:text-white py-3 md:py-2 rounded flex items-center justify-center w-full transition"
          >
            <template v-if="!isAnalyzing"> Analisis AI </template>
            <template v-else>
              <i class="fa-solid fa-spinner fa-spin mr-2"></i>
              Menganalisis AI...
            </template>
          </button>
        </ActivityList>

        <!-- HASIL AI (DESKTOP) -->
        <AiResultBox
          v-if="isViewingAIResult"
          :aiResultHtml="aiResultHtml"
          @back="resetToAdd"
        />
      </div>

      <!-- PANEL KANAN (MAP DESKTOP) -->
      <div class="w-2/3 h-full relative">
        <!-- MAP DESKTOP -->
        <MapView
          ref="desktopMapRef"
          class="h-full"
          :searchLocation="searchLocation"
          @update-location="updateLocation"
          @ready="desktopMapReady = true"
        />

        <!-- KONTROL MAP DESKTOP -->
        <div
          class="absolute bottom-6 right-6 flex items-center gap-2 bg-white/90 p-2 rounded-xl shadow"
        >
          <button @click="focusMap" class="p-3 rounded-lg hover:bg-gray-100">
            <i class="fa-solid fa-crosshairs"></i>
          </button>
          <button
            @click="desktopMapRef?.zoomIn?.()"
            class="p-3 rounded-lg hover:bg-gray-100"
          >
            <i class="fa-solid fa-plus"></i>
          </button>
          <button
            @click="desktopMapRef?.zoomOut?.()"
            class="p-3 rounded-lg hover:bg-gray-100"
          >
            <i class="fa-solid fa-minus"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from "vue-router";
import { ref, onMounted, computed, watch } from "vue";
import { marked } from "marked";

import HeaderBar from "../components/HeaderBar.vue";
import ActivityForm from "../components/ActivityForm.vue";
import ActivityList from "../components/ActivityList.vue";
import AiResultBox from "../components/AiResultBox.vue";
import MapView from "../components/MapView.vue";

import { analyzeActivities } from "../services/geminiService";
import { generateHash } from "../utils/hash";

import { nextTick } from "vue";

const router = useRouter();
const route = useRoute();

// state
const activities = ref([]);
const location = ref("");
const searchLocation = ref("");
const showForm = ref(true);
const mobileMapReady = ref(false);
const desktopMapReady = ref(false);
const isViewingAIResult = ref(false);

const currentLat = ref(null);
const currentLng = ref(null);

const mobileMapRef = ref(null);
const desktopMapRef = ref(null);
const locationStatus = ref("");
const formKey = ref(0);
const isEditing = ref(false);
const editId = ref(null);
const editData = ref(null);

const aiResult = ref("");
const aiResultHtml = computed(() => marked.parse(aiResult.value));
const isAnalyzing = ref(false);

const lostItem = ref(
  route.query.item || localStorage.getItem("lost_item_name") || ""
);

const activityFormRef = ref(null);

const sheetOpen = ref(false);
const sheetMode = ref("form");

const startY = ref(0);
const currentY = ref(0);
const isDragging = ref(false);

//  LOADING DATA
onMounted(() => {
  const savedActivities = localStorage.getItem("activities");
  const savedLostItem = localStorage.getItem("lost_item_name");

  if (savedActivities) {
    activities.value = JSON.parse(savedActivities).map((a) => ({
      ...a,
      lat: Number(a.lat),
      lng: Number(a.lng),
    }));

    // 🔑 pastikan UI di mode utama
    showForm.value = true;
    sheetMode.value = "form";
    sheetOpen.value = true;

    // restore nama barang hilang
    if (savedLostItem) {
      lostItem.value = savedLostItem;
    }
  }
});

function saveToLocalStorage() {
  localStorage.setItem("activities", JSON.stringify(activities.value));
}

const hideActivityActions = computed(() => {
  return isAnalyzing.value || isViewingAIResult.value;
});

const getMapPadding = () => {
  // Mobile only
  if (window.innerWidth >= 768) {
    return { top: 50, bottom: 50, left: 50, right: 50 };
  }

  // Mobile with bottom sheet
  return sheetOpen.value
    ? { top: 80, bottom: 300, left: 40, right: 40 } // sheet terbuka
    : { top: 80, bottom: 120, left: 40, right: 40 }; // sheet setengah
};

//  MAP
function focusMap() {
  const map = getActiveMap();
  if (!map) return;

  const padding = getMapPadding();

  if (activities.value.length > 0) {
    map.focusAllActivities(activities.value, padding);
  } else {
    map.focusCurrentMarker(padding);
  }
}

function restoreMap(mapRef) {
  if (!mapRef) return;
  if (activities.value.length === 0) return;

  mapRef.resize?.();
  mapRef.addMarkersAndLine?.(activities.value);
  focusMap();
}

watch(mobileMapReady, (ready) => {
  if (!ready) return;
  restoreMap(mobileMapRef.value);
});

watch(desktopMapReady, (ready) => {
  if (!ready) return;
  restoreMap(desktopMapRef.value);
});

watch(sheetOpen, (open) => {
  if (window.innerWidth < 768) {
    document.body.style.overflow = open ? "hidden" : "auto";
  }
});

//  CRUD ACTIVITY
const addActivity = (activity) => {
  if (isEditing.value) {
    // CEK FULL OVERLAP SAAT EDIT (KECUALI DIRINYA SENDIRI)
    if (hasOverlap(activity.startTime, activity.endTime, editId.value)) {
      alert("Jadwal aktivitas ini bertabrakan dengan aktivitas sebelumnya!");
      return;
    }

    // Kalau valid → UPDATE
    activities.value = activities.value.map((a) =>
      a.id === editId.value
        ? {
            id: editId.value,
            ...activity,
            lat: currentLat.value ?? a.lat,
            lng: currentLng.value ?? a.lng,
          }
        : a
    );
    sortActivities();

    resetFormFields();

    isEditing.value = false;
    editId.value = null;
    editData.value = null;
  } else {
    // CEK FULL OVERLAP SAAT TAMBAH BARU
    if (hasOverlap(activity.startTime, activity.endTime)) {
      alert("Jadwal aktivitas ini bertabrakan dengan aktivitas sebelumnya!");
      return;
    }

    // Kalau valid → PUSH
    activities.value.push({
      id: crypto.randomUUID(),
      ...activity,
      lat: currentLat.value,
      lng: currentLng.value,
    });
    sortActivities();

    resetFormFields();

    location.value = "";
    searchLocation.value = "";
    locationStatus.value = "";

    isEditing.value = false;
    editId.value = null;
    editData.value = null;
  }
  sheetOpen.value = true;
  sheetMode.value = "form";

  saveToLocalStorage();
  formKey.value++;
};

function toMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function sortActivities() {
  activities.value.sort((a, b) => {
    const aStart = toMinutes(a.startTime);
    const bStart = toMinutes(b.startTime);
    return aStart - bStart;
  });
}

const editActivity = async (id) => {
  const item = activities.value.find((a) => a.id === id);
  if (!item) return;

  isEditing.value = true;
  editId.value = id;

  showForm.value = true;
  await nextTick();
  activityFormRef.value?.resetFields();
  editData.value = { ...item };
};

const deleteActivity = (id) => {
  if (confirm("Hapus aktivitas ini?")) {
    activities.value = activities.value.filter((a) => a.id !== id);
    saveToLocalStorage();
  }
};

// CANCEL EDIT
function cancelEditMode() {
  isEditing.value = false;
  editId.value = null;
  editData.value = null;

  location.value = "";
  searchLocation.value = "";
  locationStatus.value = "";

  formKey.value++;
}

//  LOCATION UPDATE
const updateLocation = (loc) => {
  if (loc.status === "loading") {
    location.value = "Mencari lokasi...";
    return;
  }

  if (loc.status === "notfound") {
    locationStatus.value = "notfound";
    return;
  }

  if (loc.status === "found") {
    location.value = loc.name;
    searchLocation.value = loc.name;
    currentLat.value = loc.lat;
    currentLng.value = loc.lng;
    locationStatus.value = "found";
  }
};

const updateSearchLocation = (locName) => {
  searchLocation.value = locName;
  locationStatus.value = "loading";
};

const analyzeAI = async () => {
  if (activities.value.length < 1) return;

  const cacheKey = generateHash(activities.value, lostItem.value);
  const cachedResult = localStorage.getItem(cacheKey);

  isAnalyzing.value = true;
  aiResult.value = "";
  showForm.value = false;

  // 🔑 1. PAKAI CACHE JIKA ADA
  if (cachedResult) {
    isViewingAIResult.value = true;
    aiResult.value = cachedResult;
    sheetMode.value = "result";
    sheetOpen.value = true;
    isAnalyzing.value = false;

    const map = getActiveMap();
    map?.addMarkersAndLine(activities.value);
    map?.disableMapClick();
    return;
  }

  // 🔑 2. BARU PANGGIL GEMINI JIKA BELUM ADA
  try {
    const result = await analyzeActivities(activities.value, lostItem.value);
    aiResult.value = result;
    isViewingAIResult.value = true;
    sheetMode.value = "result";
    localStorage.setItem(cacheKey, result);

    const map = getActiveMap();
    map?.addMarkersAndLine(activities.value);
    map?.disableMapClick();

    sheetMode.value = "result";
  } catch (error) {
    alert("Analisis AI sementara tidak tersedia. Silakan coba lagi nanti.");
    showForm.value = true;
    sheetMode.value = "form";
  } finally {
    isAnalyzing.value = false;
    sheetOpen.value = true;
  }
};

const resetToAdd = () => {
  aiResult.value = "";
  isViewingAIResult.value = false;
  isAnalyzing.value = false;
  showForm.value = true;
  sheetMode.value = "form";

  const map = getActiveMap();
  map?.enableMapClick();
};

//  CLEAR
const clearAllActivities = () => {
  if (
    confirm("Tindakan anda dapat memghapus semua data aktivitas! Lanjutkan?")
  ) {
    activities.value = [];
    localStorage.removeItem("activities");

    aiResult.value = "";
    showForm.value = true;
    const map = getActiveMap();
    map?.resetMap();
    router.push("/");
    mobileMapReady.value = false;
    desktopMapReady.value = false;
  }
};

function hasOverlap(newStart, newEnd, excludeId = null) {
  return activities.value.some((a) => {
    if (a.id === excludeId) return false;

    const aStart = a.startTime;
    const aEnd = a.endTime;

    // 3 kondisi overlap:
    return (
      (newStart >= aStart && newStart < aEnd) || // newStart masuk range
      (newEnd > aStart && newEnd <= aEnd) || // newEnd masuk range
      (newStart <= aStart && newEnd >= aEnd) // MENUTUP keseluruhan range
    );
  });
}

function getActiveMap() {
  return window.innerWidth < 768 ? mobileMapRef.value : desktopMapRef.value;
}

function resetFormFields() {
  activityFormRef.value?.resetFields();
}

function onTouchStart(e) {
  startY.value = e.touches[0].clientY;
  isDragging.value = true;
}

function onTouchMove(e) {
  if (!isDragging.value) return;
  currentY.value = e.touches[0].clientY;
}

function onTouchEnd() {
  if (!isDragging.value) return;

  const diff = startY.value - currentY.value;

  if (diff > 50) {
    // swipe up
    sheetOpen.value = true;
  } else if (diff < -50) {
    // swipe down
    sheetOpen.value = false;
  }

  isDragging.value = false;
}

const handleAnalyzeMobile = async () => {
  sheetMode.value = "analyzing";
  sheetOpen.value = true;

  const map = getActiveMap();
  map?.addMarkersAndLine(activities.value);
  focusMap();

  await analyzeAI();
};

const backToForm = () => {
  isViewingAIResult.value = false;
  sheetMode.value = "form";
  aiResult.value = "";
  showForm.value = true;
};
</script>
