// src/lib/openai/utils.js
export const cleanForTask = async (str) => {
  return str.replace(/[\\"\u0000-\u001F\u007F-\u009F]/g, (c) => {
    return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
  });
};