// src/components/PromptEditor.jsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { FiMaximize, FiMinimize, FiChevronUp, FiChevronDown } from 'react-icons/fi';


const PromptEditor = ({
  editingTopic,
  handleSaveTopic,
  handleGptQuery,
  handleConceptQuery
}) => {
  const [localTopic, setLocalTopic] = useState(editingTopic);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFields, setExpandedFields] = useState({
    title: true,
    subtitle: true,
    prompt: true,
    concept: true,
    concept_json: true,
    text: true
  });

  useEffect(() => {
    setLocalTopic(editingTopic);
  }, [editingTopic]);

  const handleLocalChange = (e) => {
    const { name, value } = e.target;
    setLocalTopic(prev => ({ ...prev, [name]: value }));
  };

  function extractJson(inputString) {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = inputString.match(jsonRegex);
    
    let text_response = inputString;
    let json_response = {
      isValid: false,
      jsonObject: null,
      jsonString: null,
      error: null
    };
  
    if (match && match[1]) {
      const jsonString = match[1];
      text_response = inputString.replace(match[0], '').trim();
      
      try {
        const jsonObject = JSON.parse(jsonString);
        json_response = {
          isValid: true,
          jsonObject: jsonObject,
          jsonString: jsonString,
          error: null
        };
      } catch (error) {
        json_response = {
          isValid: false,
          jsonObject: null,
          jsonString: jsonString,
          error: "Invalid JSON format"
        };
      }
    } else {
      json_response.error = "No JSON object found in the string";
    }
  
    return { text_response, json_response };
  }

  const handleSubmitConceptQuery = async () => {
    setIsLoading(true);
    try {
      const conceptQuery = {
        systemPrompt: "what are some important things to keep in mind about the following",
        userPrompts: [localTopic.prompt, localTopic.concept],
        model: "gpt-4o-mini", 
        temperature: 0.7,
        responseFormat: { type: "text" }
      }

      const gptResponse = await handleConceptQuery(conceptQuery);
      const { text_response, json_response } = extractJson(gptResponse)
      const updatedTopic = { 
        ...localTopic, 
        text: text_response,
        concept_json: json_response.isValid 
          ? JSON.stringify(json_response.jsonObject) 
          : JSON.stringify({err: json_response.error})
      };

      setLocalTopic(updatedTopic);
      await handleSaveTopic(updatedTopic);
    } catch (error) {
      console.error("Error submitting concept query:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitGptQuery = async () => {
    setIsLoading(true);
    try {
      const gptResponse = await handleGptQuery(localTopic.prompt);
      const updatedTopic = { ...localTopic, text: gptResponse };
      setLocalTopic(updatedTopic);
      await handleSaveTopic(updatedTopic);
    } catch (error) {
      console.error("Error submitting GPT query:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteText = () => {
    setLocalTopic(prev => ({ ...prev, prompt: prev.text }));
  };

  const toggleFieldExpansion = (field) => {
    setExpandedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleAllFields = () => {
    const allExpanded = Object.values(expandedFields).every(v => v);
    setExpandedFields(Object.fromEntries(Object.keys(expandedFields).map(k => [k, !allExpanded])));
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="first-letter:font-bold text-xl">Prompt Editor</div>
      <div className="flex-shrink-0 mb-4">
        <h2 className="text-xl font-bold mb-2">Edit Topic</h2>
        <div className="flex justify-between items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePromoteText}>
            Promote Text to Prompt
          </Button>
          <Button variant="outline" size="sm" onClick={handleSubmitGptQuery} disabled={isLoading}>
            {isLoading ? 'Running...' : 'Submit to GPT'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSubmitConceptQuery} disabled={isLoading}>
            {isLoading ? 'Running...' : 'Submit concept'}
          </Button>            
          <Button variant="outline" size="sm" onClick={() => handleSaveTopic(localTopic)}>Save</Button>
          <Button variant="outline" size="sm" onClick={toggleAllFields}>
            {Object.values(expandedFields).every(v => v) ? <FiMinimize /> : <FiMaximize />}
          </Button>
        </div>
      </div>
      <div className="flex-grow grid gap-4 py-4 overflow-y-auto">
        {['title', 'subtitle', 'prompt', 'concept', 'comments', 'concept_json','sub-topics', 'text'].map((field) => (
          <div key={field} className="border p-2 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">{`topic.${field}`}</span>
              <Button variant="ghost" size="sm" onClick={() => toggleFieldExpansion(field)}>
                {expandedFields[field] ? <FiChevronUp /> : <FiChevronDown />}
              </Button>
            </div>
            {expandedFields[field] && (
              field === 'prompt' ? (
                <Textarea
                  id={field}
                  name={field}
                  value={localTopic[field] || ''}
                  onChange={handleLocalChange}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  className="resize-vertical overflow-auto h-16"
                />
              ) : field === 'title' || field === 'subtitle' ? (
                <Input
                  id={field}
                  name={field}
                  value={localTopic[field] || ''}
                  onChange={handleLocalChange}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                />
              ) : (
                <Textarea
                  id={field}
                  name={field}
                  value={localTopic[field] || ''}
                  onChange={handleLocalChange}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  className="resize-none overflow-auto h-40"
                />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromptEditor;