// src/lib/fileOperations.js
import fs from 'fs/promises';

export async function readJsonFile(path) {
  try {
    const data = await fs.readFile(path, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading JSON file from ${path}:`, error);
    throw error;
  }
}

export async function readTextFile(path) {
  try {
    return await fs.readFile(path, 'utf8');
  } catch (error) {
    console.error(`Error reading text file from ${path}:`, error);
    throw error;
  }
}