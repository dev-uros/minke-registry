import { Command } from '@tauri-apps/plugin-shell';
import {Server} from "../types";

// Your app identifier (use your actual bundle ID from tauri.conf.json)
const APP_ID = 'com.uros.minke-registry';

export async function keychainSet(key: string, value: string) {
    try {
        const result = await Command.create('security', [
            'add-generic-password',
            '-a', APP_ID,
            '-s', key,
            '-w', value,
            '-U' // Update if already exists
        ]).execute();

        if (result.code !== 0) {
            throw new Error(`Failed to store in keychain: ${result.stderr}`);
        }

        return true;
    } catch (error) {
        console.error('Keychain set error:', error);
        throw error;
    }
}

export async function keychainGet(key: string) {
    try {
        const result = await Command.create('security', [
            'find-generic-password',
            '-a', APP_ID,
            '-s', key,
            '-w' // Output password only
        ]).execute();

        if (result.code !== 0) {
            // Key not found
            return null;
        }

        return result.stdout.trim();
    } catch (error) {
        console.error('Keychain get error:', error);
        return null;
    }
}

export async function keychainRemove(key: string) {
    try {
        const result = await Command.create('security', [
            'delete-generic-password',
            '-a', APP_ID,
            '-s', key
        ]).execute();

        if (result.code !== 0 && !result.stderr.includes('could not be found')) {
            throw new Error(`Failed to remove from keychain: ${result.stderr}`);
        }

        return true;
    } catch (error) {
        console.error('Keychain remove error:', error);
        throw error;
    }
}

export async function keychainSetJSON(key: string, data: Server[]) {
    const jsonString = JSON.stringify(data);
    return keychainSet(key, jsonString);
}


export async function keychainGetJSON(key: string) {
    const value = await keychainGet(key);
    if (!value) return null;

    try {
        return JSON.parse(value);
    } catch (error) {
        console.error('Failed to parse JSON from keychain:', error);
        return null;
    }
}