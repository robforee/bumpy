// src/lib/openai/utils.js
export async function cleanForTask(str) {
    return str.replace(/[\\"\u0000-\u001F\u007F-\u009F]/g, function (c) {
      return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
    });
  }
  