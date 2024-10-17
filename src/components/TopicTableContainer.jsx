// src/components/TopicTableContainer.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/src/contexts/UserProvider';
import { 
  fetchTopic, 
  updateTopic, 
  createTopic,
  fetchTopicsByCategory, 
  deleteTopic 
} from '@/src/app/actions/topic-actions';

import { runOpenAiQuery, runConceptQuery, prepareStructuredQuery_forConceptAnalysis } from '@/src/app/actions/query-actions';
import TopicTable from './TopicTable';
import TopicModals from './TopicModals';
import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";

const TopicTableContainer = (
  { topicId, 
    parentId, 
    topic_type, 
    rowHeight 
  }) => {
  const { user } = useUser();
  const [topics, setTopics] = useState([]);
  const [topicTypes, setTopicTypes] = useState([]);
  
  const [currentTopic, setCurrentTopic] = useState(null);
  const [parentTopic, setParentTopic] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [expandedSubTopicIds, setExpandedSubTopicIds] = useState(new Set());
  const [isCurrentTopicExpanded, setIsCurrentTopicExpanded] = useState(false);
  const [addingTopicType, setAddingTopicType] = useState(null);
  const [addingToTopicId, setAddingToTopicId] = useState(null);

  const loadTopicsAndCurrent = useCallback(async () => {

    setLoading(true);
    setError(null);
    try {
      const idToken = await getIdToken(auth.currentUser);
  
      const [fetchedTopics, fetchedTopicTypes, fetchedCurrentTopic, fetchedParentTopic] = await Promise.all([        
        fetchTopicsByCategory([topic_type], topicId, idToken),
        fetchTopicsByCategory('-topic', topicId, idToken),
        fetchTopic(topicId, idToken),
        fetchTopic(parentId, idToken)
      ]);
  
      const sortedTopics = fetchedTopics.sort((a, b) => a.title.localeCompare(b.title));
      const sortedTypes = fetchedTopicTypes.sort((a, b) => {
        const topicTypeComparison = a.topic_type.localeCompare(b.topic_type);
        return topicTypeComparison === 0 ? a.title.localeCompare(b.title) : topicTypeComparison;
      });
  
      setTopics(sortedTopics);
      setTopicTypes(sortedTypes);

      if (fetchedCurrentTopic.error) {
        console.log('Error loading current topic');
        setError(`Error loading current topic: ${fetchedCurrentTopic.error}`);
        setCurrentTopic(fetchedCurrentTopic); // Still set the topic to display error info
      } else {
        setCurrentTopic(fetchedCurrentTopic);
      }
  
      if (fetchedParentTopic.error) {
        // console.warn(`Parent topic error: ${fetchedParentTopic.error}`);
        // Still set the parent topic, as it contains useful information
      }
      setParentTopic(fetchedParentTopic);
  
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [parentId, topicId, topic_type]);

  useEffect(() => {
    loadTopicsAndCurrent();
    const savedExpandedIds = localStorage.getItem(`expandedSubTopics_${parentId}_${topic_type}`);
    if (savedExpandedIds) {
      setExpandedSubTopicIds(new Set(JSON.parse(savedExpandedIds)));
    }
    const savedCurrentTopicExpanded = localStorage.getItem(`currentTopicExpanded_${parentId}`);
    setIsCurrentTopicExpanded(savedCurrentTopicExpanded === 'true');
  }, [parentId, topic_type, loadTopicsAndCurrent]);

  const toggleSubTopicExpansion = (subTopicId) => {
    setExpandedSubTopicIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subTopicId)) {
        newSet.delete(subTopicId);
      } else {
        newSet.add(subTopicId);
      }
      localStorage.setItem(`expandedSubTopics_${parentId}_${topic_type}`, JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const toggleCurrentTopicExpansion = () => {
    setIsCurrentTopicExpanded(prev => {
      const newState = !prev;
      localStorage.setItem(`currentTopicExpanded_${parentId}`, newState.toString());
      return newState;
    });
  };

  const handleAddTopic = (topicType = topic_type, toTopicId = parentId) => {
    setAddingTopicType(topicType);
    setAddingToTopicId(toTopicId);
    setIsAddModalOpen(true);
  };

  const handleAddComment = (topicId) => handleAddTopic('comment', topicId);
  const handleAddPrompt = (topicId) => handleAddTopic('prompt', topicId);
  const handleAddArtifact = (topicId) => handleAddTopic('artifact', topicId);

  const handleTopicAdded = () => {
    loadTopicsAndCurrent();
    setIsAddModalOpen(false);
  };

  const handleEditTopic = (topic) => {
    setEditingTopic(topic);
    setEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingTopic(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveTopic = async (updatedTopic) => {
    try {
      if (!updatedTopic || !updatedTopic.id) {
        throw new Error("Invalid topic data");
      }
      
      const updatedFields = {
        title: updatedTopic.title,
        topic_type: updatedTopic.topic_type,
        topic_sub_type: updatedTopic.topic_sub_type,
        subtitle: updatedTopic.subtitle,
        text: updatedTopic.text,
        prompt: updatedTopic.prompt,
        promptResponse: updatedTopic.prompt_response,
        concept: updatedTopic.concept,
        concept_json: updatedTopic.concept_json,
      };
      
      console.log('clean-ish inputs')
      Object.keys(updatedFields).forEach(key => updatedFields[key] === undefined && delete updatedFields[key]);
  
      const idToken = await getIdToken(auth.currentUser);
      await updateTopic(updatedTopic.id, updatedFields, idToken);

      setEditModalOpen(false);
      loadTopicsAndCurrent();
    } catch (error) {
      console.error("Error updating topic:", error);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      const idToken = await getIdToken(auth.currentUser);
      await deleteTopic(topicId, idToken);
      loadTopicsAndCurrent();
    } catch (error) {
      console.error("Error deleting topic:", error);
    }
  };

  const handleAutoSubtopics = async (jsonstring, topicId) => {
    try {
      const idToken = await getIdToken(auth.currentUser);
      const json = JSON.parse(jsonstring);

      console.log(JSON.stringify(json, null, 2));

      const arrayProperty = Object.values(json).find(Array.isArray);
      if (arrayProperty) {
        for (const item of arrayProperty) {
          console.log(item.title + '\n' + item.concept);
          // Uncomment and implement the following when ready to create topics
          // const topicData = { title: item.title, concept: item.concept };
          // await createTopic(topicId, topicData, idToken);
        }
      }      
      
      loadTopicsAndCurrent();
    } catch (error) {
      console.error("Error creating subtopics:", error);
    }
  };

  const handleGptQuery = async (prompt) => {
    try {
      const idToken = await getIdToken(auth.currentUser);
      const result = await runOpenAiQuery({
        systemPrompt: "You are a helpful assistant.",
        userPrompts: [prompt],
        model: "gpt-4o-mini",
        temperature: 0.7,
        responseFormat: { type: "text" },
        owner: user.uid
      }, idToken);
      return result.content;
    } catch (error) {
      console.error("Error in GPT query:", error);
      throw error;
    }
  };




  
  const handleFetchContext = async (data) => {

    let textChunks = [];

    textChunks.push("# this topic:\n" + currentTopic.title);
    
    if(data.useConcept){
      textChunks.push("# current concept description\n" + (currentTopic?.concept ?? currentTopic?.text ?? ''));
    }else{
      textChunks.push("# current topic.text\n" + (currentTopic?.text ?? ''));
    }


    if(parentTopic.id !== 'none'){
      textChunks.push("# parent topic is:\n" + parentTopic.title);
      textChunks.push('# parent current concept description:\n' + (parentTopic?.concept ?? parentTopic?.text ?? '') );// nullish coalescing  
    }else{

    }

    const goodToKnowTopics = topicTypes.filter(topic => topic.topic_sub_type === 'good-to-know');

    if( goodToKnowTopics.length ){
      textChunks.push("# comments from users:\n");
    }
    const commentChunks = goodToKnowTopics.map(t => {
      const info = (t?.concept ?? t?.text ?? '');
      const md = [];
      md.push('## ' + t.title);
      md.push(info);
      md.push('commentId: ' + t.id);
      md.push("comment by: " + (t.email ? t.email : t.owner));
      md.push('');
      return md.join('\n');
    });

    textChunks = [...textChunks, ...commentChunks];

    console.log('concept/text,parent c/t, cmmts')
    return textChunks;
  };







  const handleFetchPrompts = async (data) => {
   const prompts = []
   topicTypes.forEach(t=>{
      if(t?.topic_sub_type){
        if(data?.subType === t?.topic_sub_type){
          console.log('## ',t.topic_type,t.title,t.prompt?.length);
          prompts.push( t )
        }  
      }
   })

   if(!prompts.length && data?.subType){
    console.log('no topic prompt ',data?.subType)
    const idToken = await getIdToken(auth.currentUser);
    
    // does parent have prompt?
    if(parentId && idToken){      
      const parentPrompts = await fetchTopicsByCategory(['prompt'],parentId, idToken, data.subType);
      console.log('parentPrompts',parentPrompts.length)
      parentPrompts.forEach(p=>{prompts.push(p)})
      
    }else{
      console.log('no parent prompt')
    }
    // does parent parent have prompt
    if(prompts.length == 0){
      if(parentTopic.parents[0]){
        console.log('parentParentPrompts')
        const parentParentPrompts = await fetchTopicsByCategory(['prompt'],parentTopic.parents[0], idToken, data.subType)
        console.log('parentParentPrompts',parentParentPrompts.length)
        parentParentPrompts.forEach(p=>{prompts.push(p)})

      }else{
        console.log('no grand parent prompt')
      }
    }
   }
   return prompts;
  }





  const handleConceptQuery = async (data) => {
    const idToken = await getIdToken(auth.currentUser);
    console.log('handleConceptQuery()')
    try {

      // GET CONTEXT FROM TOPICS
      const chunkyContextArray = await handleFetchContext({useConcept:false})
      console.log('\nCHUNKY CONTEXT ARRAY \n\t from TopicTableContainer.handleFetchContext(){// reads gathered topics/subtopics}'); // all comments
      console.log(chunkyContextArray.join('\n\n')); // all comments

      // GET PROMPT FROM COMMENTS
      const prompts = await handleFetchPrompts({subType:'concept-prompt'})
      console.log( '~~~~~~~~~~ prompts[0].prompt.concept-prompt'); // how to format output
      console.log( prompts[0].prompt); // how to format output

      // FORMAT QUERY
      const structuredQuery = await prepareStructuredQuery_forConceptAnalysis({ // ON SERVER
        contextArray: chunkyContextArray,
        conceptQuery: prompts[0].prompt
      });

      // RUN QUERY
      const completionObject = await runConceptQuery(structuredQuery, idToken); // return an an object
      const resultFormat = {
            "id": "chatcmpl-AIvxhDP6bzUsnQM2uLaf64NheMJQp",
            "object": "chat.completion",
            "created": 1729076073,
            "model": "gpt-4o-mini-2024-07-18",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "{\"topic_title\":\"My Plan\",\"topic_subtitle\":\"Comprehensive Management of Personal and Professional Life\",\"topic_concept\":\"This plan outlines my comprehensive approach to managing various aspects of my life, including work, family, home maintenance, and community engagement. It encapsulates the commitment to improve my current circumstances through strategic planning and execution in all relevant areas.\",\"topic_statement\":\"I am attempting to create a sustainable and fulfilling lifestyle that effectively addresses my responsibilities, aspirations, and relationships while generating sufficient income through innovative projects like RedShirt.info.\",\"topic_subtopics\":\"1. Work & Income Management 2. Family Dynamics & Responsibilities 3. Asset Management & Maintenance 4. Community Engagement & Networking 5. Personal Development & Well-being\",\"topic_milestones\":\"1. Finalize the development of RedShirt.info within the next 3 months to kickstart income generation. 2. Establish a comprehensive schedule for family logistics updates to facilitate better communication and organization. 3. Initiate environment maintenance projects once a week to improve home conditions and relieve stress.\",\"topic_questions\":\"1. What specific features will RedShirt.info provide to meet market needs? 2. How can I better balance family responsibilities with work demands? 3. What are the most pressing maintenance issues with my real assets that need immediate attention?\"}",
                        "refusal": null,
                        "tool_calls": [],
                        "parsed": {
                            "topic_title": "My Plan",
                            "topic_subtitle": "Comprehensive Management of Personal and Professional Life",
                            "topic_concept": "This plan outlines my comprehensive approach to managing various aspects of my life, including work, family, home maintenance, and community engagement. It encapsulates the commitment to improve my current circumstances through strategic planning and execution in all relevant areas.",
                            "topic_statement": "I am attempting to create a sustainable and fulfilling lifestyle that effectively addresses my responsibilities, aspirations, and relationships while generating sufficient income through innovative projects like RedShirt.info.",
                            "topic_subtopics": "1. Work & Income Management 2. Family Dynamics & Responsibilities 3. Asset Management & Maintenance 4. Community Engagement & Networking 5. Personal Development & Well-being",
                            "topic_milestones": "1. Finalize the development of RedShirt.info within the next 3 months to kickstart income generation. 2. Establish a comprehensive schedule for family logistics updates to facilitate better communication and organization. 3. Initiate environment maintenance projects once a week to improve home conditions and relieve stress.",
                            "topic_questions": "1. What specific features will RedShirt.info provide to meet market needs? 2. How can I better balance family responsibilities with work demands? 3. What are the most pressing maintenance issues with my real assets that need immediate attention?"
                        }
                    },
                    "logprobs": null,
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": 639,
                "completion_tokens": 264,
                "total_tokens": 903,
                "prompt_tokens_details": {
                    "cached_tokens": 0
                },
                "completion_tokens_details": {
                    "reasoning_tokens": 0
                }
            },
            "system_fingerprint": "fp_e2bde53e6e"
          }

      completionObject.prompt = structuredQuery;
      return completionObject; // TO HANDLE-C

    } catch (error) {
      console.error("Error in concept query:", error);
      throw error;
    }
  };

  // USED IN topicModal, check it out
  const handleSavePrompt = (updatedTopic) => {
    handleSaveTopic(updatedTopic);
  };

  if (loading) return <div>Loading topics...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="TOPIC_TABLE_CONTAINER overflow-x-auto">
      <TopicTable 
        currentTopic={currentTopic}
        topics={topics}
        topicTypes={topicTypes}
        rowHeight={rowHeight}
        expandedSubTopicIds={expandedSubTopicIds}
        toggleSubTopicExpansion={toggleSubTopicExpansion}
        isCurrentTopicExpanded={isCurrentTopicExpanded}
        toggleCurrentTopicExpansion={toggleCurrentTopicExpansion}

        handleAddTopic={handleAddTopic}
        handleSaveTopic={handleSaveTopic}

        handleAddComment={handleAddComment}

        handleEditTopic={handleEditTopic}
        handleAddPrompt={handleAddPrompt}
        handleAddArtifact={handleAddArtifact}
        handleDeleteTopic={handleDeleteTopic}
        handleAutoSubtopics={handleAutoSubtopics}
        handleConceptQuery={handleConceptQuery}
        handleFetchContext={handleFetchContext}
      />

      <TopicModals 
        topicId={addingToTopicId || topicId}
        topicType={addingTopicType || topic_type}

        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        editModalOpen={editModalOpen}
        setEditModalOpen={setEditModalOpen}
        editingTopic={editingTopic}
        onTopicAdded={handleTopicAdded}
        
        handleSaveTopic={handleSaveTopic}
        handleEditChange={handleEditChange}
        handleSavePrompt={handleSavePrompt}
        handleGptQuery={handleGptQuery}
        handleConceptQuery={handleConceptQuery}
        userId={user?.uid}
      />
    </div>
  );
};

export default TopicTableContainer;