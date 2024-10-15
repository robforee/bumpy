// src/components/TopicParentRow.jsx

import React, { useState } from 'react';
import { FiZap, FiEdit, FiChevronRight, FiClock, FiPlusCircle, FiPlus } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import EditPropertyModal from './EditPropertyModal';

const TopicParentRow = ({
  thisTopic,
  isParentTopicExpanded,
  toggleParentTopicExpansion,
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

  const formatDate = (date) => {
    if (!(date instanceof Date)) return 'N/A';
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const renderContent = () => {
    switch (thisTopic.topic_type) {
      case 'topic':
      case 'comment':
      case 'artifact':
        return thisTopic.text;
      case 'concept':
        return thisTopic.concept;
      case 'prompt':
        return thisTopic.prompt;
      default:
        return 'No content available';
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
    setPropertyToEdit(property);
    setIsEditModalOpen(true);
  };

  const handleSaveProperty = (topicId, property, value) => {
    const updatedTopic = { ...thisTopic, [property]: value };
    handleSaveTopic(updatedTopic);
  };

  const handleSubmitConceptQuery = async () => {
    setIsLoading(true);
    
    const response = handleFetchContext({});
    

    console.log('// get "process concept" topic.prompt (child or default)')
    console.log('// get  "good-to-know" [topic.text] all child, check valid?')
    return;
    try {
      const conceptQuery = {
        systemPrompt: "what are some important things to keep in mind about the following",
        userPrompts: [thisTopic.prompt, thisTopic.concept],
        model: "gpt-4o-mini", 
        temperature: 0.7,
        responseFormat: { type: "text" }
      }

      const gptResponse = await handleConceptQuery(conceptQuery);
      const { text_response, json_response } = extractJson(gptResponse)
      const updatedTopic = { 
        ...thisTopic, 
        text: text_response,
        concept_json: json_response.isValid 
          ? JSON.stringify(json_response.jsonObject) 
          : JSON.stringify({err: json_response.error})
      };

      handleSaveTopic(updatedTopic);
    } catch (error) {
      console.error("Error submitting concept query:", error);
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
          <span className="font-bold text-blue-800 text-4xl">{thisTopic.title}</span>
          {thisTopic.subtitle && (
            <span className="text-red-700 ml-2"> {thisTopic.subtitle}</span>
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
            onClick={() => handleEditTopic(thisTopic)}
            className="ml-2 text-gray-500 hover:text-gray-700"
            title="Edit Topic"
          >
            <FiEdit size={14} />
          </button>

          <button onClick={() => handleAddTopic('topic', thisTopic.id)} className="ml-2" title="Add Sub-Topic">
            <FiPlusCircle size={14} />
          </button>

          <button onClick={() => handleAddComment(thisTopic.id)} className="ml-2" title="Add Comment">
            <FiPlusCircle size={14} />
          </button>

          <button onClick={() => handleAddPrompt(thisTopic.id)} className="ml-2" title="Add Prompt">
            <FiPlusCircle size={14} />
          </button>

          <button onClick={() => handleAddArtifact(thisTopic.id)} className="ml-2" title="Add Artifact">
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
          {!thisTopic.text ? (
            <div className="px-0 py-2 text-red-800">No text content available</div>
          ) : (

            // components={markdownComponents} 
            <ReactMarkdown components={markdownComponents} 
                className="markdown-content blue-green-600 italic">
                  {thisTopic.text}
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
            {!thisTopic.concept ? (
              <div className="px-0 py-2 text-red-800">No concept available</div>
            ) : (
              <ReactMarkdown  components={markdownComponents} 
                  className="markdown-content text-green-600 italic">
                {thisTopic.concept}
              </ReactMarkdown>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Concept JSON</h3>
            {!thisTopic.concept_json ? (
              <div className="px-0 py-2 text-red-800">No concept JSON available</div>
            ) : (
              <pre className="bg-gray-200 p-2 rounded overflow-x-auto">
                {JSON.stringify(JSON.parse(thisTopic.concept_json), null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      <EditPropertyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProperty}
        topic={thisTopic}
        propertyToEdit={propertyToEdit}
      />
    </div>
  );
};

export default TopicParentRow;