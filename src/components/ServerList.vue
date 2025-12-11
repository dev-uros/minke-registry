<script setup lang="ts">
import {useAppStore} from "../store";
import {storeToRefs} from "pinia";
import {computed, Ref, ref, watch} from "vue";
import {Server} from "../types";
import {useRouter} from "vue-router";

const appStore = useAppStore();

const {servers, tags} = storeToRefs(appStore);
const router = useRouter();

const serverModalOpened = ref(false);
const openServerModal = () => {
  serverModalOpened.value = true;
}

watch(serverModalOpened, (value) => {
  if (!value) {
    const toast = useToast()
    toast.clear();
  }
})

const goToServerDetails = async (server: Server) => {
  await router.push({
    path: `/server/${server.ip}`
  })

}
const filters: Ref<string[]> = ref([]);

const filteredServers = computed(() => {
  if (filters.value.length === 0) return servers.value;
  const lowerInputTags = Array.from(filters.value);
  return servers.value.filter(server =>
      lowerInputTags.some(tag => server.tags.includes(tag))
  );
})

</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <UCard>
      <div class="flex flex-row justify-between gap-8" v-if="servers.length > 0">
        <UInputMenu class="flex-1" v-model="filters" multiple :items="tags"/>

        <UButton @click="openServerModal" icon="i-lucide:circle-plus"/>

      </div>
      <USeparator orientation="horizontal" class="py-4" v-if="servers.length > 0"/>

      <ul class="" v-if="servers.length !== 0">

        <li
            v-for="server in filteredServers"
            :key="server.ip"
        >
          <div
              class="flex items-start justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer rounded-lg px-3 -mx-3 py-3"
              @click="goToServerDetails(server)">
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-2">
                {{ server.ip }}
              </h3>
              <div class="flex flex-wrap gap-2">
                <UBadge
                    v-for="tag in server.tags"
                    :key="tag"
                    variant="subtle"
                    size="sm"
                >
                  {{ tag }}
                </UBadge>
              </div>
            </div>
            <UButton
                icon="i-heroicons-chevron-right-20-solid"
                color="gray"
                variant="ghost"
                size="sm"
            />
          </div>
        </li>
      </ul>
      <UEmpty v-else
              @click="openServerModal"
              icon="i-zondicons:servers"
              title="No servers found"
              description="It looks like you haven't added any server. Create one to get started."
              :actions="[
      {
        icon: 'i-lucide-plus',
        label: 'Create new',

      }
    ]"
      />
    </UCard>

    <ServerFormModal @form-submitted="serverModalOpened = false" v-model:open="serverModalOpened"/>
  </div>
</template>

<style scoped>

</style>