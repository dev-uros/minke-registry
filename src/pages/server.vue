<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {useAppStore} from "../store";
import {reactive, Reactive, computed, ref, Ref} from "vue";
import {AuthResponse, Server} from "../types";
import * as v from "valibot";
import {storeToRefs} from "pinia";
import {FormSubmitEvent} from "@nuxt/ui";
import {invoke} from "@tauri-apps/api/core";
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

const appStore = useAppStore();

const {tags} = storeToRefs(appStore);

const router = useRouter();

const route = useRoute();

const {ip} = route.params

const back = async () => {
  await router.back();
}


const server = computed(() => {
  return appStore.servers.find(server => server.ip === ip)!
})

const state: Reactive<Server> = reactive({
  user: server.value.user,
  ip: server.value.ip,
  password: server.value.password,
  note: server.value.note,
  tags: server.value.tags
});

const schema = v.object({
  ip: v.pipe(v.string(), v.minLength(1, 'Must be at least 1 character')),
  user: v.pipe(v.string(), v.minLength(1, 'Must be at least 1 character')),
  password: v.pipe(v.string(), v.minLength(1, 'Must be at least 1 character')),
  note: v.pipe(v.string()),
  tags: v.pipe(
      v.array(v.string()),
      v.minLength(1, 'At least one tag is required')
  )
});

type Schema = v.InferOutput<typeof schema>


const inputMenuKey = ref(1);

function onCreate(item: string) {
  tags.value.push(item.trim())

  state.tags.push(item.trim());

  inputMenuKey.value++;
}

const formDisabled = ref(true);
const toggleForm = () => {
  formDisabled.value = !formDisabled.value;
  if (formDisabled.value) {
    state.ip = server.value.ip;
    state.user = server.value.user;
    state.password = server.value.password;
    state.note = server.value.note;
    state.tags = server.value.tags;
  }
}

const toast = useToast();

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const data = {
    ip: event.data.ip,
    tags: event.data.tags,
    note: event.data.note,
    password: event.data.password,
    user: event.data.user
  }

  await appStore.addServer(data);

  toast.add({title: 'Success', description: 'Server data updated.', color: 'success'})

  formDisabled.value = true;

}

const authResult: Ref<AuthResponse | null> = ref(null)

const handleAuth = async () =>{
  try {
    const result = await invoke<AuthResponse>('authenticate_user', {
      reason: 'Authenticate to access the app'
    })
    authResult.value = result
    console.log('Auth result:', result)
  } catch (error) {
    authResult.value = null
    console.error('Authentication error:', error)
  }
}

const copyPassword = async (password: string) => {
  await handleAuth();
  if(authResult.value && authResult.value?.success){
    await writeText(password);
    toast.add({title: 'Success', description: 'Password copied to clipboard!', color: 'success'})
  }
}

const copyUser = async (user: string) => {
  await writeText(user);
  toast.add({title: 'Success', description: 'User copied to clipboard!', color: 'success'})
}

const copyIP = async (IP: string) => {
  await writeText(IP);
  toast.add({title: 'Success', description: 'IP copied to clipboard!', color: 'success'})
}

const copyCommand = async (user: string, ip: string) => {
  await writeText(`ssh ${user}@${ip}`);
  toast.add({title: 'Success', description: 'SSH command copied to clipboard!', color: 'success'})
}

const deleteModalOpened = ref(false);
const deleteServer = async () => {
  deleteModalOpened.value = true;
}

const confirmDelete = async () => {
  deleteModalOpened.value = false;
  await appStore.deleteServer(server.value.ip);
  toast.add({title: 'Success', description: 'Server data deleted!', color: 'success'})
  await router.back()
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <UCard>
      <template #header>
        <div class="flex flex-row gap-8 justify-between">
          <div class="flex flex-row gap-4">
            <UButton icon="i-lucide:arrow-left" @click="back"/>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Server Details</h2>
          </div>
            <UButton :icon=" formDisabled ? 'i-lucide:pen' : 'i-lucide:circle-x'" @click="toggleForm"
                     :color="formDisabled ? 'warning' : 'error'"/>


        </div>
      </template>

      <UForm :validate-on="['change', 'input']" :schema="schema" :state="state" class="flex flex-col gap-4"
             :disabled="formDisabled"
             @submit="onSubmit">
        <div class="flex flex-row justify-between px-4">
          <UFormField label="IP" name="ip">
            <UFieldGroup>
              <UInput v-model.trim="state.ip" :disabled="true"/>
              <UButton v-if="formDisabled" color="neutral" variant="subtle" icon="i-lucide-clipboard" @click="copyIP(state.ip)"/>
            </UFieldGroup>
          </UFormField>
          <UFormField label="User" name="user">
            <UFieldGroup>
              <UInput v-model.trim="state.user"/>
              <UButton v-if="formDisabled" color="neutral" variant="subtle" icon="i-lucide-clipboard" @click="copyUser(state.user)"/>
              <UButton v-if="formDisabled" color="neutral" variant="subtle" icon="i-lucide:terminal" @click="copyCommand(state.user, state.ip)"/>
            </UFieldGroup>
          </UFormField>

        </div>

        <div class="flex flex-row">
          <UFormField label="Password" name="password" class="w-full px-4">
            <UFieldGroup class="w-full">
              <UInput v-model.trim="state.password" type="password" class="w-full"/>
              <UButton v-if="formDisabled" color="neutral" variant="subtle" icon="i-lucide-clipboard" @click="copyPassword(state.password)"/>
            </UFieldGroup>
          </UFormField>
        </div>
        <div class="flex flex-row" :key="inputMenuKey">
          <UFormField label="Tags" name="tags" class="w-full px-4">
            <UInputMenu open-on-focus v-model="state.tags" multiple :items="tags" create-item @create="onCreate"
                        class="w-full"/>
          </UFormField>
        </div>

        <div class="flex flex-row">
          <UFormField label="Note" name="note" class="w-full px-4">
            <UTextarea v-model="state.note" autoresize class="w-full"/>
          </UFormField>
        </div>

        <div class="flex flex-row px-4" v-if="!formDisabled">
          <UButton type="submit" class="w-full justify-center">
            Submit
          </UButton>
        </div>
      </UForm>


      <div class="w-full px-4 py-8" v-if="formDisabled">
        <div class="border border-red-200 dark:border-red-900 rounded-lg p-6 bg-red-50 dark:bg-red-950/20">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <UIcon name="i-lucide:triangle-alert" class="text-red-600 dark:text-red-400 w-5 h-5" />
              </div>
            </div>

            <div class="flex-1">
              <h3 class="text-lg font-semibold text-red-900 dark:text-red-100 mb-1">
                Danger Zone
              </h3>
              <p class="text-sm text-red-700 dark:text-red-300 mb-4">
                Once you delete this server data, there is no going back. Please be certain.
              </p>

              <UButton
                  icon="i-lucide:trash-2"
                  @click="deleteServer"
                  color="error"
                  variant="solid"
                  size="md"
              >
                Delete Server Data
              </UButton>
            </div>
          </div>
        </div>
      </div>


    </UCard>

    <UModal v-model:open="deleteModalOpened">
      <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <UIcon name="i-lucide:triangle-alert" class="text-red-600 dark:text-red-400 w-5 h-5" />
            </div>
            <h3 class="text-lg font-semibold">Delete Server</h3>
          </div>
        </template>

        <div class="space-y-3">
          <p class="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this server data? This action cannot be undone.
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
              Delete Server
            </UButton>
          </div>
        </template>
      </UCard>
      </template>
    </UModal>
  </div>

</template>

<style scoped>

</style>