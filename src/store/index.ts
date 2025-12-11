import {defineStore} from 'pinia'
import {AppStore, Server} from "../types";
import {load} from '@tauri-apps/plugin-store';
import {keychainGetJSON, keychainSetJSON} from "../services/keychain.ts";
import {confirm, open, save} from "@tauri-apps/plugin-dialog";
import {readTextFile, writeTextFile} from '@tauri-apps/plugin-fs';

export const useAppStore = defineStore('appStore', {
    state: (): AppStore => ({
        servers: [],
        tags: []
    }),
    actions: {
        async setupAppData() {
            const tagStore = await load('tagStore.json');
            const tagData = await tagStore.get<string[]>('tags')
            if (tagData) {
                this.tags = tagData;
            }

            const serverData = await keychainGetJSON('servers');
            if (serverData) {
                this.servers = serverData
            }

        },
        async addServer(data: Server) {
            const serverIndex = this.servers.findIndex(server => server.ip === data.ip);
            if (serverIndex !== -1) {
                this.servers[serverIndex] = data
            } else {
                this.servers.unshift(data);
            }

            await keychainSetJSON('servers', this.servers);
        },

        async deleteServer(ip: string) {
            const serverIndex = this.servers.findIndex(server => server.ip === ip);

            if (serverIndex !== -1) {
                this.servers.splice(serverIndex, 1);
                await keychainSetJSON('servers', this.servers);

            }
        },

        async export() {
            try {
                // Get your array from Pinia store
                const data = this.servers; // or whatever your state is called

                // Convert to JSON string
                const jsonString = JSON.stringify(data, null, 2);

                // Show save dialog - user picks location
                const filePath = await save({
                    defaultPath: 'minke-registry-data-export.json',
                    filters: [{
                        name: 'JSON',
                        extensions: ['json']
                    }]
                });

                // If user didn't cancel
                if (filePath) {
                    // Write to the chosen file path
                    await writeTextFile(filePath, jsonString);

                }
            } catch (error) {
                console.error('Error saving file:', error);
                alert('Failed to save file: ' + error);
            }
        },

        async importData() {
            try {
                // Show open file dialog (returns string path or null)
                const filePath = await open({
                    multiple: false,
                    directory: false,
                    filters: [{
                        name: 'JSON',
                        extensions: ['json']
                    }]
                });

                // If user didn't cancel
                if (filePath) {
                    // Read the file content
                    const fileContent = await readTextFile(filePath);

                    // Parse JSON
                    const data = JSON.parse(fileContent);

                    // Validate the structure (optional)
                    if (Array.isArray(data) && data.every(item =>
                        item.ip && item.tags && item.password && item.user
                    )) {
                        this.servers = await this.mergeImportedServers(data, this.servers);

                        await keychainSetJSON('servers', this.servers);

                        const importedTags = this.extractTags(this.servers);

                        this.tags = this.mergeTags(this.tags, importedTags);

                        const tagStore = await load('tagStore.json');

                        await tagStore.set('tags', this.tags)

                    } else {
                        throw new Error('Invalid file format');
                    }
                }
            } catch (error) {
                console.error('Error loading file:', error);
                alert('Failed to load file: ' + error);
            }
        },
        async askOverwrite(ip: string) {
            return confirm(`Server with IP ${ip} already exists. Overwrite?`, {
                title: "Conflict",
                okLabel: "Overwrite",
                cancelLabel: "Skip"
            });
        },
        async mergeImportedServers(imported: Server[], existing: Server[]) {
            const merged: Server[] = [...existing];

            for (const incoming of imported) {
                const existingIndex = merged.findIndex(s => s.ip === incoming.ip);

                // If no IP conflict → add
                if (existingIndex === -1) {
                    merged.push(incoming);
                    continue;
                }

                // Conflict → ask user
                const overwrite = await this.askOverwrite(incoming.ip);

                if (overwrite) {
                    merged[existingIndex] = incoming;          // Replace
                } else {
                    // Skip
                    continue;
                }
            }

            return merged;
        },
        extractTags(servers: Server[]) {
            const tags = new Set<string>();

            for (const s of servers) {
                for (const t of s.tags) {
                    tags.add(t.trim());
                }
            }

            return Array.from(tags);
        },
        mergeTags(storeTags: string[], importedTags: string[]) {
            const set = new Set(storeTags);

            for (const t of importedTags) {
                set.add(t);
            }

            return Array.from(set);
        },
        async clearData() {
            await keychainSetJSON('servers', [])
            const tagStore = await load('tagStore.json');
            await tagStore.set('tags', []);
            this.servers = [];
            this.tags = [];
        }


    }
})