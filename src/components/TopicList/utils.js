// src/components/TopicList/utils.js

export const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case 'procedure':
      case 'preference':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'topic':
      case 'comment':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'artifact':
      case 'prompt':
      case 'prompt-response':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };