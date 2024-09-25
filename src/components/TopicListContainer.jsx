// src/components/TopicListContainer.jsx
import React from 'react';
import TopicList from '@/src/components/TopicList';

const TopicListContainer = ({ config, parentId, refreshTrigger, refreshTopics }) => {
  const renderDivs = () => {
    const divs = [];

    divs.push(
      <div key="relationships">
        <TopicList type="relationships" parentId={parentId} refreshTrigger={refreshTrigger} refreshTopics={refreshTopics} />
      </div>
    );
    
    config.divForEach.forEach(category => {
      divs.push(
        <div key={category}>
          <TopicList 
            type="category" 
            categories={[category]} 
            parentId={parentId}
            refreshTrigger={refreshTrigger}
            refreshTopics={refreshTopics}
          />
        </div>
      );
    });

    Object.entries(config).forEach(([key, value]) => {
      if (key.startsWith('singleDivForGroup')) {
        const categories = Array.isArray(value) ? value : value.items;

        divs.push(
          <div key={key}>
            <TopicList 
              type="category" 
              categories={categories} 
              parentId={parentId} 
              refreshTrigger={refreshTrigger}
              refreshTopics={refreshTopics}
            />
          </div>
        );
      }
    });

    return divs;
  };

  return <div className="topic-list-container">{renderDivs()}</div>;
};

export default TopicListContainer;