# TopicModel
topics are fractal bits of information
a data model for managing topic information and relationships
a user interface for navigating and editing topics 

## Properties
### Minimum Properties
owner
sharing
version
### Sys Properties
seq
topic_type (default is Topic)
output_type
versions[]
### Content Properties
title
subtitle
text
topic_doc_uri
parents[]
children[]

## Schema
/topics/topicId/
/topic_versions/topicId // this requires index id change :

## Special Methods
topic = addTopic(parentId,{title:'cat in the hat})
topic.changeParent(newParentId)
topic.updatePhoto(newPhotoUrl) (use version)
topic.runPrompts({select:'all'}) (stub with a call to cloud function)
topic.addComment() // which is a child topic
topic.addPrompt() // which is a child topic
topic.addComment() // which is a child topic

## Presentation & Use
### Topic View
this is a series of flexible length and wrap boxes good to display on mobile or desktop.
Section 1 is the editor for the topic at hand
Other sections are list presentations of subtopics filtered and formatted by type
Clicking on a subtopic icon will navigate to that topic
There is a navigation bar that allows navigating to the parent or sibling topics.
There is a delete this topic and sub-topics button.

Section - Content
title
subtitle
text (text box with markdown viewer/editor)
topic_doc_uri (embed both google doc and pdf viewer)

Section - Artifacts
list of child topics type artifact

Section - Prompts
list of child topics type prompt and type prompt-response

Section - Events
list of child topics type calendar and type calendar-event

Section - Comments
list of child topics type comment


## For the Webapp as a whole
### Software Libraries and Versions

1. Next.js (v14.2.3) - React framework for server-side rendering and static site generation
2. React (v18.3.1) - JavaScript library for building user interfaces
3. Firebase (v10.11.1) - Platform for building web and mobile applications
4. Firebase Admin (v12.1.0) - Server-side Firebase SDK
5. React Markdown (v9.0.1) - Markdown component for React
6. Server-only (v0.0.1) - Utility for server-side only code
7. Google Generative AI (v0.10.0) - Library for interacting with Google's generative AI models

### Design Patterns Used

1. Server-side Rendering (SSR) - Utilized through Next.js for improved performance and SEO
2. Component-based Architecture - React components are used throughout the application
3. Hooks - React hooks (useState, useEffect) are used for state management and side effects
4. Server Actions - Next.js server actions are used for server-side operations
5. Service Worker - Custom service worker for handling Firebase authentication
6. Modular File Structure - Separation of concerns with different files for actions, components, and Firebase configurations

## Firestore naming so far
/users
/user_tokens
/user_scopes
/user_activity