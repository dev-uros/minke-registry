<script setup lang="ts">
import * as v from 'valibot'
import type {FormSubmitEvent} from '@nuxt/ui'
import {Reactive, reactive, ref, watch} from "vue";
import {useAppStore} from "../store";
import {storeToRefs} from "pinia";
import {load} from '@tauri-apps/plugin-store';
import {Server} from "../types";

const appStore = useAppStore();
const {tags, servers} = storeToRefs(appStore);
const emit = defineEmits(['formSubmitted'])

function onCreate(item: string) {
  tags.value.push(item.trim())

  state.tags.push(item.trim());

  inputMenuKey.value++;
}

watch(tags, async () => {
  //@ts-ignore
  const store = await load('tagStore.json', {autoSave: true});
  await store.set('tags', tags.value);
}, {deep: true})

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

const state: Reactive<Server> = reactive({
  user: '',
  ip: '',
  password: '',
  note: '',
  tags: []
})

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const data = {
    ip: event.data.ip,
    tags: event.data.tags,
    note: event.data.note ?? null,
    password: event.data.password,
    user: event.data.user
  }
  const serverExists = servers.value.find(server => server.ip === data.ip);
  if (serverExists) {
    toast.add({
      title: 'New server entry',
      description: 'Entered IP already exists',
      progress: true,
      duration: 30000,
      actions: [
        {
          icon: 'i-lucide:repeat',
          label: 'Overwrite',
          color: 'primary',
          variant: 'outline',
          onClick: async(e) => {
            await appStore.addServer(data);
            state.ip = '';
            state.password = '';
            state.note = '';
            state.tags = [];
            e?.stopPropagation();
            emit('formSubmitted')
            toast.add({title: 'Success', description: 'Server data stored.', color: 'success'})

          }
        },
        {
          icon: 'i-lucide:x',
          label: 'Skip',
          color: 'neutral',
          variant: 'outline',
          onClick: (e) => {
            e?.stopPropagation()
          }
        }]
    })
  } else {
    await appStore.addServer(data);
    state.user = '';
    state.ip = '';
    state.password = '';
    state.note = '';
    state.tags = [];
    emit('formSubmitted')
    toast.add({title: 'Success', description: 'Server data stored.', color: 'success'})

  }

}

const inputMenuKey = ref(1);


</script>

<template>
  <UModal title="Server entry"
          :ui="{ footer: 'justify-end' }" :dismissible="false">
    <template #body>
      <UForm :validate-on="['change', 'input']" :schema="schema" :state="state" class="flex flex-col gap-4"
             @submit="onSubmit">
        <div class="flex flex-row justify-around">
          <UFormField label="IP" name="ip">
            <UInput v-model.trim="state.ip"/>
          </UFormField>
          <UFormField label="User" name="user">
            <UInput v-model.trim="state.user"/>
          </UFormField>

        </div>

        <div class="flex flex-row">
          <UFormField label="Password" name="password"  class="w-full px-4">
            <UInput v-model.trim="state.password" type="password" class="w-full"/>
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

        <div class="flex flex-row px-4">
          <UButton type="submit" class="w-full justify-center">
            Submit
          </UButton>
        </div>
      </UForm>
    </template>

    <template #footer="{ close }">
      <UButton label="Cancel" color="neutral" variant="outline" @click="close"/>
    </template>
  </UModal>
</template>

<style scoped>

</style>