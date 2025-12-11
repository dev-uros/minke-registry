<script setup lang="ts">
import {useAppStore} from "./store";
import {onMounted, ref} from "vue";
import {storeToRefs} from "pinia";

const toaster = {position: 'top-center'}
const appStore = useAppStore();
const {servers} = storeToRefs(appStore);
onMounted(async () => {
  await appStore.setupAppData();
})
const toast = useToast();
const exportData = async () => {
  await appStore.export();
  toast.add({title: 'Success', description: 'Server data exported.', color: 'success'})
  optionsSlideOverOpened.value = false;
}

const importData = async () => {
  await appStore.importData();
  toast.add({title: 'Success', description: 'Server data imported.', color: 'success'})
  optionsSlideOverOpened.value = false;
}



const deleteModalOpened = ref(false);
const clearData = async () => {
  deleteModalOpened.value = true;
}

const confirmDelete = async () => {
  await appStore.clearData();
  toast.add({title: 'Success', description: 'Data deleted.', color: 'success'})
  deleteModalOpened.value = false;
  optionsSlideOverOpened.value = false;

}
const optionsSlideOverOpened = ref(false);
</script>

<template>
  <UApp :toaster="toaster">
    <UHeader :toggle="false">
      <template #left>
        <RouterLink to="/">
          <AppLogo class="w-auto h-6 shrink-0"/>
        </RouterLink>
      </template>

      <template #right>
        <USlideover v-model:open="optionsSlideOverOpened" title="Options">
          <UButton icon="i-lucide:settings" color="neutral" variant="subtle" @click="optionsSlideOverOpened = true"/>

          <template #body>
            <div class="flex flex-col gap-4 p-4">
              <!-- Export Card -->
              <UCard
                  v-if="servers.length > 0"
                  class="cursor-pointer hover:shadow-lg transition-shadow"
                  @click="exportData"
              >
                <div class="flex items-center gap-4">
                  <div class="flex-shrink-0">
                    <div
                        class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <UIcon name="i-heroicons-arrow-down-tray" class="w-6 h-6 text-green-600 dark:text-green-400"/>
                    </div>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                      Export Data
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Download your data as a file
                    </p>
                  </div>
                  <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-400"/>
                </div>
              </UCard>

              <!-- Import Card -->
              <UCard
                  class="cursor-pointer hover:shadow-lg transition-shadow"
                  @click="importData"
              >
                <div class="flex items-center gap-4">
                  <div class="flex-shrink-0">
                    <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <UIcon name="i-heroicons-arrow-up-tray" class="w-6 h-6 text-blue-600 dark:text-blue-400"/>
                    </div>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                      Import Data
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Upload and restore your data
                    </p>
                  </div>
                  <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-400"/>
                </div>
              </UCard>

              <!-- Clear Data Card -->
              <UCard
                  class="cursor-pointer hover:shadow-lg transition-shadow"
                  @click="clearData"
              >
                <div class="flex items-center gap-4">
                  <div class="flex-shrink-0">
                    <div class="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <UIcon name="i-heroicons-trash" class="w-6 h-6 text-red-600 dark:text-red-400"/>
                    </div>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                      Clear Data
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Remove all stored information
                    </p>
                  </div>
                  <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-400"/>
                </div>
              </UCard>
            </div>
          </template>
        </USlideover>
        <UColorModeButton/>
      </template>

    </UHeader>

    <UMain>
      <RouterView/>
    </UMain>
    <UModal v-model:open="deleteModalOpened">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <UIcon name="i-lucide:triangle-alert" class="text-red-600 dark:text-red-400 w-5 h-5" />
              </div>
              <h3 class="text-lg font-semibold">Delete Data</h3>
            </div>
          </template>

          <div class="space-y-3">
            <p class="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete all data? This action cannot be undone.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              All server data will be permanently removed.
            </p>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                  color="gray"
                  variant="ghost"
                  @click="deleteModalOpened = false"
              >
                Cancel
              </UButton>
              <UButton
                  color="error"
                  icon="i-lucide:trash-2"
                  @click="confirmDelete"
              >
                Delete Data
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

  </UApp>
</template>

