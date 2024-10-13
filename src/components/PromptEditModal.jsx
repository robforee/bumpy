// src/components/PromptEditModal.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { FiX, FiMaximize, FiMinimize, FiChevronUp, FiChevronDown } from 'react-icons/fi';

const PromptEditModal = ({
  isOpen,
  onClose,
  editingTopic,
  handleSaveTopic,
  handleGptQuery,
  handleConceptQuery
}) => {
  const [localTopic, setLocalTopic] = useState(editingTopic);
  const [isLoading, setIsLoading] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [expandedFields, setExpandedFields] = useState({
    title: true,
    subtitle: true,
    prompt: true,
    concept: true,
    text: true
  });
  const dialogContentRef = useRef(null);

  useEffect(() => {
    setLocalTopic(editingTopic);
  }, [editingTopic]);

  useEffect(() => {
    if (dialogContentRef.current) {
      dialogContentRef.current.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (dialogContentRef.current) {
        dialogContentRef.current.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const handleWheel = (e) => {
    e.stopPropagation();
  };

  const handleLocalChange = (e) => {
    const { name, value } = e.target;
    setLocalTopic(prev => ({ ...prev, [name]: value }));
  };

  function extractJson(inputString) {
    // Regular expression to match JSON object
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    
    // Try to extract JSON string
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
      
      // Remove the JSON (including the ```json ``` tags) from the original string
      text_response = inputString.replace(match[0], '').trim();
      
      try {
        // Try to parse the JSON string
        const jsonObject = JSON.parse(jsonString);
        
        // If parsing succeeds, it's valid JSON
        json_response = {
          isValid: true,
          jsonObject: jsonObject,
          jsonString: jsonString,
          error: null
        };
      } catch (error) {
        // If parsing fails, it's not valid JSON
        json_response = {
          isValid: false,
          jsonObject: null,
          jsonString: jsonString,
          error: "Invalid JSON format"
        };
      }
    } else {
      // If no JSON object is found
      json_response.error = "No JSON object found in the string";
    }
  
    return { text_response, json_response };
  }
  const handleSubmitConceptQuery = async () => {
    setIsLoading(true);
    try {
      const conceptQuery = {
        systemPrompt: "what are some important things to keep in mind about the following",
        userPrompts: [],
        model: "gpt-4o-mini", 
        temperature: 0.7,
        responseFormat: { type: "text" }
      }
      conceptQuery.userPrompts.push(localTopic.prompt)
      conceptQuery.userPrompts.push(localTopic.concept)

      const gptResponse = await handleConceptQuery(conceptQuery);
      const { text_response, json_response } = extractJson(gptResponse)
      const updatedTopic = { ...localTopic, text: text_response };

      if (json_response.isValid) {
        console.log("Valid JSON object:", json_response.jsonObject);
        
        updatedTopic.concept_json = JSON.stringify(json_response.jsonObject);

      } else {
        updatedTopic.concept_json = {err:json_response.error};
        console.log("JSON error:", json_response.error);
        if (json_response.jsonString) {
          console.log("Invalid JSON string:", json_response.jsonString);
        }
      }      
      console.log(updatedTopic)
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
  
  const handleSave = () => {
    handleSaveTopic(localTopic);
    onClose();
  };

  const handlePromoteText = () => {
    setLocalTopic(prev => ({ ...prev, prompt: prev.text }));
  };

  const togglePromptExpansion = () => {
    setIsPromptExpanded(!isPromptExpanded);
  };

  const toggleFieldExpansion = (field) => {
    setExpandedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleAllFields = () => {
    const allExpanded = Object.values(expandedFields).every(v => v);
    setExpandedFields(Object.fromEntries(Object.keys(expandedFields).map(k => [k, !allExpanded])));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full flex flex-col" ref={dialogContentRef}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Topic</DialogTitle>
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
            <Button variant="outline" size="sm" onClick={handleSave}>Save</Button>
            <Button variant="outline" size="sm" onClick={toggleAllFields}>
              {Object.values(expandedFields).every(v => v) ? <FiMinimize /> : <FiMaximize />}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <FiX />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-grow grid gap-4 py-4 overflow-y-auto">
          {['title', 'subtitle', 'prompt', 'concept', 'concept_json', 'text'].map((field) => (
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
      </DialogContent>
    </Dialog>
  );
};

export default PromptEditModal;