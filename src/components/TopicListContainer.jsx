// src/components/TopicListContainer.jsx
import React from 'react';
import TopicList from '@/src/components/TopicList';

const TopicListContainer = ({ config, parentId }) => {
  const renderDivs = () => {
    const divs = [];

    // Render divs for each individual category

    // Render special div for parent/sibling/children relationships
    divs.push(
        <div key="relationships">
          <TopicList type="relationships" parentId={parentId} />
        </div>
      );
    
    config.divForEach.forEach(category => {
      divs.push(
        <div key={category}>
          <TopicList categories={[category]} parentId={parentId} parentType="divForEach"/>
        </div>
      );
    });

    // Render divs for grouped categories
    Object.entries(config).forEach(([key, value]) => {
      if (key.startsWith('singleDivForGroup')) {
        const categories = Array.isArray(value) ? value : value.items;

        divs.push(
          <div key={key}>
            <TopicList 
                categories={categories} 
                parentId={parentId} 
                parentType={categories[0]} 
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