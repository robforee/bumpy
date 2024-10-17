// src/components/TopicHeaderRow.jsx

import React, { useState } from 'react';
import { FiZap, FiEdit, FiChevronRight, FiClock, FiPlusCircle, FiPlus } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import EditPropertyModal from './EditPropertyModal';

const TopicHeaderRow = ({
  currentTopic,
  isCurrentTopicExpanded,
  toggleCurrentTopicExpansion,
  handleEditTopic,
  handleAddTopic,
  handleAddComment,
  handleAddPrompt,
  handleAddArtifact,
  rowHeight,
  handleAutoSubtopics,
  handleSaveTopic,
  handleConceptQuery,
  handleFetchContext

}) => {

  const [isHovered, setIsHovered] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState('');
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [isConceptExpanded, setIsConceptExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const markdownComponents = {
    h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4 text-blue-600" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-xl font-semibold my-3 text-blue-500" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-lg font-medium my-2 text-blue-400" {...props} />,
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
  };

  const toggleTextExpansion = () => {
    setIsTextExpanded(!isTextExpanded);
    if (!isTextExpanded) setIsConceptExpanded(false);
  };

  const toggleConceptExpansion = () => {
    setIsConceptExpanded(!isConceptExpanded);
    if (!isConceptExpanded) setIsTextExpanded(false);
  };

  const handleEditProperty = (property) => {
    console.log('TopicHeaderRow.handleEditProperty EditPropertyModal')
    setPropertyToEdit(property);
    setIsEditModalOpen(true);
  };

  const handleSaveProperty = (topicId, property, value) => {
    const updatedTopic = { ...currentTopic, [property]: value };
    handleSaveTopic(updatedTopic);
  };

  function convertToMarkdown(topics) {
    // Helper function to indent text based on level
    const indent = (text, level) => '  '.repeat(level) + text;
  
    // Recursive function to transform a topic and its subtopics
    function topicToMarkdown(topic, level = 0) {
      let markdown = `${indent(`# ${topic.topic_title}`, level)}\n`;
      markdown += `${indent(`**${topic.topic_subtitle}**`, level + 1)}\n\n`;
      markdown += `${indent(`- **Concept:** ${topic.topic_concept}`, level + 1)}\n`;
      markdown += `${indent(`- **Statement:** ${topic.topic_statement}`, level + 1)}\n`;
  
      // Process subtopics
      if (topic.topic_subtopics && topic.topic_subtopics.length > 0) {
        markdown += `\n${indent(`### Subtopics:`, level + 1)}\n`;
        topic.topic_subtopics.forEach(subtopic => {
          markdown += topicToMarkdown(subtopic, level + 1) + "\n";
        });
      }
  
      // Process milestones
      if (topic.topic_milestones && topic.topic_milestones.length > 0) {
        markdown += `\n${indent(`### Milestones:`, level + 1)}\n`;
        topic.topic_milestones.forEach(milestone => {
          markdown += `${indent(`- ${milestone.milestone}`, level + 2)}\n`;
        });
      }
  
      // Process questions
      if (topic.topic_questions && topic.topic_questions.length > 0) {
        markdown += `\n${indent(`### Questions:`, level + 1)}\n`;
        topic.topic_questions.forEach(question => {
          markdown += `${indent(`- ${question.question}`, level + 2)}\n`;
        });
      }
  
      return markdown;
    }
  
    // Generate markdown for each top-level topic
    return topics.map(topic => topicToMarkdown(topic)).join("\n");
  }

  function convertToMarkdown(topics) {
    // Helper function to indent text based on level
    const indent = (text, level) => '  '.repeat(level) + text;
  
    // Recursive function to transform a topic and its subtopics
    function topicToMarkdown(topic, level = 0) {
      let markdown = `${indent(`# ${topic.topic_title}`, level)}\n`;
      markdown += `${indent(`**${topic.topic_subtitle}**`, level + 1)}\n\n`;
      markdown += `${indent(`- **Concept:** ${topic.topic_concept}`, level + 1)}\n`;
      markdown += `${indent(`- **Statement:** ${topic.topic_statement}`, level + 1)}\n`;
  
      // Process subtopics
      if (topic.topic_subtopics && topic.topic_subtopics.length > 0) {
        markdown += `\n${indent(`### Subtopics:`, level + 1)}\n`;
        topic.topic_subtopics.forEach(subtopic => {
          markdown += topicToMarkdown(subtopic, level + 1) + "\n";
        });
      }
  
      // Process milestones
      if (topic.topic_milestones && topic.topic_milestones.length > 0) {
        markdown += `\n${indent(`### Milestones:`, level + 1)}\n`;
        topic.topic_milestones.forEach(milestone => {
          markdown += `${indent(`- ${milestone.milestone}`, level + 2)}\n`;
        });
      }
  
      // Process questions
      if (topic.topic_questions && topic.topic_questions.length > 0) {
        markdown += `\n${indent(`### Questions:`, level + 1)}\n`;
        topic.topic_questions.forEach(question => {
          markdown += `${indent(`- ${question.question}`, level + 2)}\n`;
        });
      }
  
      return markdown;
    }
  
    // Generate markdown for each top-level topic
    return topics.map(topic => topicToMarkdown(topic)).join("\n");
  }
  const handleSubmitConceptQuery = async () => {
    setIsLoading(true);    

    try{
      
      // BUILD, RUN, RETURN QUERY; called by  TopicTableContainer

      const completionObject = await handleConceptQuery({});
      const { choices: [firstChoice, ...otherChoices], ...restOfCompletion } = completionObject;  
      const choicesObject = firstChoice ;
      const choicesObject2 = { choices: [firstChoice] };
      const usageObject = { ...restOfCompletion, choices: otherChoices };
        

      // REPORT USAGE
      console.log('usageObject.usage\n',usageObject.usage);
      console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        'usageObject.prompt.messages\n',
        usageObject.prompt.messages.map(m=>{return '~~~~~~~~\N' + m.role + ':\n\t' + m.content}).join('\n')

      );
      console.log('choicesObject\n',choicesObject)
      //console.log('choicesObject.message\n',choicesObject.message)
      console.log('choicesObject.message.parsed',choicesObject.message.parsed)
      //console.log('choicesObject.message.content',choicesObject.message.content)
      //console.log('choicesObject.message.finish_reason',choicesObject.message.finish_reason)

      // PRETTIFY PARSED STRUCTURED RESPONSE for TEXT FIELD
      let textResponse = '';
      Object.entries( choicesObject.message.parsed ).forEach(([key, value]) => {
        if(key === 'topic_title') next;
        if(key === 'topic_subtitle') next;
        textResponse += '# ' + key + '\n';
        textResponse += value + '\n\n';
      });

      // THE topic.CONCEPT ('concept', 'statement','subtopics','milestones','questions')
      let sections = [
        'title', 'subtitle','concept', 'statement','subtopics','milestones','questions'
      ]
      let userConceptView = '';
        userConceptView += '\n# THIS CONCEPT\n';
        userConceptView += choicesObject.message.parsed.topic_concept;

        userConceptView += '\n# Statement of purpose\n';
        userConceptView += choicesObject.message.parsed.topic_statement;

        userConceptView += '\n# Subtopics \n * ';
        userConceptView += convertToMarkdown(choicesObject.message.parsed.topic_subtopics);

        userConceptView += '\n# Milestones\n * ';
        userConceptView += choicesObject.message.parsed.topic_milestones.map(i=>{return i.milestone}).join('\n * ') + '\n'; //.slice(0, -1);

        userConceptView += '\n# Questions\n * ';
        userConceptView += choicesObject.message.parsed.topic_questions.map(i=>{return i.question}).join('\n * ') + '\n'; //.slice(0, -1);

      console.log('\nuserConceptView\n',
        userConceptView
      )
            
      const updatedTopic = { 
        ...currentTopic, 
        // title: choicesObject.message.parsed.topic_title,
        subtitle: choicesObject.message.parsed.topic_subtitle,
        prompt: usageObject.prompt.messages.map(m=>{return m.content}).join('\n'),
        concept: userConceptView,
        concept_json: choicesObject.message.parsed
      };

      handleSaveTopic(updatedTopic);    

    } catch (error) {
      console.error("Error in TopicHeaderRow.handleSubmitConceptQuery:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="TOPIC_PARENT mt-2 parent-info relative cursor-pointer border-b border-gray-200">
      <div 
        className={`${rowHeight} px-2 py-2 hover:bg-gray-100 flex items-center`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button onClick={toggleTextExpansion} className="mr-2">
          <FiChevronRight 
            size={14} 
            className={isTextExpanded ? 'transform rotate-90' : ''}
          />
        </button>
        <button onClick={toggleConceptExpansion} className="mr-2">
          <FiChevronRight 
            size={14} 
            className={`text-blue-500 ${isConceptExpanded ? 'transform rotate-90' : ''}`}
          />
        </button>
        <div className="font-medium flex-grow">
          <span className="font-bold text-blue-800 text-4xl">{currentTopic.title}</span>
          {currentTopic.subtitle && (
            <span className="text-red-700 ml-2"> {currentTopic.subtitle}</span>
          )}
        </div>
        <div className="ml-2 flex items-center">
          <button
            onClick={handleSubmitConceptQuery}
            className="ml-2 text-gray-500 hover:text-gray-700"
            title="Propose structure" 
            disabled={isLoading}
          >
            <FiZap size={24} />
          </button>

          <button
            onClick={() => handleEditTopic(currentTopic)}
            className="ml-2 text-gray-500 hover:text-gray-700"
            title="Edit Topic"
          >
            <FiEdit size={14} />
          </button>

          <button onClick={() => handleAddTopic('topic', currentTopic.id)} className="ml-2" title="Add Sub-Topic">
            <FiPlusCircle size={14} />
          </button>

          <button onClick={() => handleAddComment(currentTopic.id)} className="ml-2" title="Add Comment">
            <FiPlusCircle size={14} />
          </button>

          <button onClick={() => handleAddPrompt(currentTopic.id)} className="ml-2" title="Add Prompt">
            <FiPlusCircle size={14} />
          </button>

          <button onClick={() => handleAddArtifact(currentTopic.id)} className="ml-2" title="Add Artifact">
            <FiPlusCircle size={14} />
          </button>
        </div>
      </div>

      {isTextExpanded && (        
        <div 
          className="pl-12 pr-6 py-2 bg-gray-100 cursor-pointer"
          onClick={() => handleEditProperty('text')}
        >
          <h3 className="text-lg font-semibold mb-2">Text Content</h3>
          {!currentTopic.text ? (
            <div className="px-0 py-2 text-red-800">No text content available</div>
          ) : (

            // components={markdownComponents} 
            <ReactMarkdown components={markdownComponents} 
                className="markdown-content blue-green-600 italic">
                  {currentTopic.text}
            </ReactMarkdown>
          )}
        </div>
      )}

      {isConceptExpanded && (        
        <div className="pl-12 pr-6 py-2 bg-gray-100">
          <div 
            className="cursor-pointer mb-4"
            onClick={() => handleEditProperty('concept')}
          >
            <h3 className="text-lg font-semibold mb-2">Concept</h3>
            {!currentTopic.concept ? (
              <div className="px-0 py-2 text-red-800">No concept available</div>
            ) : (
              <ReactMarkdown  components={markdownComponents} 
                  className="markdown-content text-green-600 italic">
                {currentTopic.concept}
              </ReactMarkdown>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Concept JSON</h3>
            {!currentTopic.concept_json ? (
              <div className="px-0 py-2 text-red-800">No concept JSON available</div>
            ) : (
              <pre className="bg-gray-200 p-2 rounded overflow-x-auto">
                {JSON.stringify(currentTopic.concept_json,null,2)}
              </pre>
            )}
          </div>
        </div>
      )}

      <EditPropertyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProperty}
        topic={currentTopic}
        propertyToEdit={propertyToEdit}
      />
    </div>
  );
};

export default TopicHeaderRow;