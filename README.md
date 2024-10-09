# Rebuild Project
 // dashboard with drive integration working
 // token manager on dashboard page
 // all firebase, drive, gpt queries as app/actions/*-actions
 


## about actions
// src/app/actions.js
    ServerWriteAsImpersonatedUser
        getAdminAuth(); // do AUTH( get CONFIG )  (lib/firebase/adminApp)
        getAdminFirestore();                      (lib/firebase/adminApp)

## LAYOUT AUTH FLOW (update for where user profile is fetched at login )
    RootLayout                   src/app/layout  
        UserProvider             src/contexts/UserContext
        useEffect()              src/contexts/UserContext
            onAuthStateChanged() src/lib/firebase/auth.js";
                unsubscribe
    
    Header
        handleSignIn                     src/components/Header
            signInWithGoogle             src/lib/firebase/auth.js
                provider.addScopes       src/lib/firebase/auth.js  
                   | change this to get scope list from /user_scopes
                signInWithPopup          firebase/auth
                
                updateProfile(photo)     src/lib/firebase/auth.js

                sendTokensToBackend      src/lib/firebase/auth.js  ! db_viaClient      | change this
                    storeTokens          functions/index           via cloud function  |   to this
                        user_tokens      firestore/user_tokens
                        encrypt

                storeUserScopes          src/lib/firebase/auth.js  db_viaClient


        useEffect()                      src/components/Header
            initializeNewUserIfNeeded    src/services/userService
                initializeTopicRoot      src/services/userService
                    addTopicFunction     functions/index  (create root topic)             | change this
                    updateUserFunction   functions/index  ( root topic id = newTopicId )  | to use db_viaClient


    page.jsx              (src/app/topics/[id]/page.jsx)
    TopicTableContainer   
    TopicTable
            TopicTable(topics) // made listener

    TopicPage                src/app/topics/[id] page











## AUTH FLOW
layout.js
    function invoked        where invoked
    -------------------   ---------------------
    onAuthStateChanged    (components/UserContext import from lib/firebase/auth        )
    getUserProfile        (components/UserContext import from '@/src/services/userService'; )
    UserContext           (@/src/app/layout.js    wraps <Header > serves { user, loading, userProfile })


    handleSignIn          (src/components/Header.js )
    signInWithGoogle      (src/lib/firebase/auth )
    sendTokensToBackend   (src/lib/firebase/auth   via api db.user_tokens)
    storeUserScopes       (src/lib/firebase/auth )
    ### new user setup
    initializeUser        (src/services/userService  db_viaClient)
    initializeTopicRoot   (src/services/userService  fbFunction: addTopic,  :updateUser)



## FETCH TOPIC AUTH FLOW
    fetchTopic            (src/app/topics[id]/page )
    getTopicById          (src/app/topics[id]/page import from '@/src/lib/firebase/firestore')
    getDoc                (src/lib/firebase/firestore import from firebase/firestore)
    TopicList             (categories) (src/components/TopicList/index )
    fetchTopics
    fetchRelationshipTopics (parentId)           ( /src/lib/topicFirebaseOperations)
    fetchTopicsByCategory   (categories,parentId)( /src/lib/topicFirebaseOperations)
    onTopicsChange        ( /src/lib/topicFirebaseOperations)


## GET USER EMAIL FLOW >broken<
    handleFetchEmails                    (src/app/admin/page)
    fetchEmailsFromServer                (src/lib/gmail/gmailClientOperations)
    // server ops
    fetch /api/gmail?userId              (src/lib/gmail/gmailClientOperations)
    getGmailService                      (src/lib/tokenManager)
    getValidAccessToken                  (src/lib/tokenManager)
     getTokens                            (src/lib/tokenManager)
     refreshAccessToken                   (src/lib/tokenManager)
     getAdminFirestore                    (src/lib/firebase/adminApp)
    getGmailService (tokenManager.js)
    -> getValidAccessToken (tokenManager.js)
    -> getTokens (tokenManager.js)
    -> getAdminFirestore (adminApp.js)

## NODE SCRIPT DEMO GET USER EMAIL FLOW >working<



functions involved in the Gmail authentication and token refresh process, along with the files where they're found:

1. generateAuthUrl      (test-firebase-gmail.js)
2. storeTokens          (test-firebase-gmail.js)
3. refreshAccessToken   (test-firebase-gmail.js)
4. getGmailService      (test-firebase-gmail.js)
5. getValidAccessToken  (test-firebase-gmail.js)
6. getTokens            (test-firebase-gmail.js)
7. checkTokenValidity   (test-firebase-gmail.js)
8. checkGmailToken      (test-firebase-gmail.js)
9. fetchGmailMessages   (test-firebase-gmail.js)
10. exchangeCodeForTokens (test-firebase-gmail.js)
11. runTests            (test-firebase-gmail.js)

Note that all these functions are located in the same file (test-firebase-gmail.js) in this case. In a larger application, these functions might be spread across different files for better organization.

The main flow typically goes:

1. generateAuthUrl (if not authorized)
2. exchangeCodeForTokens (after user authorizes)
3. storeTokens
4. getValidAccessToken
5. refreshAccessToken (if token is expired)
6. getGmailService
7. fetchGmailMessages

The other functions (checkTokenValidity, checkGmailToken, getTokens) are helper functions used within this main flow.




# demo nesting and speial topics ()
Topic a title
    topic a-1 title
        a-1 subtitle
        a-1 text
        a-1 comments (topic_type prompt)
            a-1 comments subtitle
            a-1 comments text
            a-1 comments response
        a-1 artifacts (topic_type prompt)
            a-1 artifacts subtitle
            a-1 artifacts text
            a-1 artifacts factors
        a-1 prompts (topic_type prompt)
            a-1 prompts subtitle
            a-1 prompts text
            a-1 prompts response
        a-1 emails (topic_type email)
            a-1 emails comments, prompts, artifacts
        a-1 documents (topic_type email)
            a-1 documents comments, prompts, artifacts
        a-1 regulatory (topic_type regulatory-form)
            a-1 documents comments, prompts, artifacts
    topic a-2 title
topic b title


### app revision
* auth, topic editor, 

* topic.addParent or prompt.use = topic.artifact, topic.comment,
* Offline cache for navigator with fold snipper
* Email display and swipe
* Document query and compare 
* Calendar and swimlanes
* Voice input, dual channel
* Chat interface
* 



## Running Tests

This project uses Jest for testing. To run all tests and see the name of each test file as it runs, use the following command:

```
npm run test
```

This will run all `.test.js` files in the project and display verbose output, including the name of each test file.

To run a specific test file, you can use:

```
npm run test -- path/to/your/test/file.test.js
```

For example, to run the indexManager.test.js file:

```
npm run test -- Email/tests/indexManager.test.js
```

## Test Configuration

The test configuration is set up in `package.json`. It uses the following settings:

- Verbose mode is enabled to show detailed output, including test file names.
- A custom reporter located at `Email/cleanReporter.js` is used in addition to the default reporter.
- The test environment is set to "node".

If you need to modify the test configuration, you can do so in the "jest" section of `package.json`.