
const thePrompt = [
    {
        "role": "system",
        "content": "You are an expert process analyst"
    },
    {
        "role": "user",
        "content": "# this topic:\nMy Plan"
    },
    {
        "role": "user",
        "content": "# current topic.text\nMy name is Robert this is the root of my topic map. from here I manage all my information flow from buying groceries and changing the oil in our cars to writing software and owning real estate. I have a wife and 17 year old daughter at home. A 22 year old daughter working at a research station in Peru My wife and I work from home but our income is not enough. I am currently working on a SaaS product to sell called RedShirt.info"
    },
    {
        "role": "user",
        "content": "# comments from users:\n"
    },
    {
        "role": "user",
        "content": "## Content categories of this topic\nThis should cover everything important \n\nWork, home, family, community, nation, world\n\nThere should be statements here about what I need to be doing now which have bubbled up from below.\ncommentId: Ui4WmdTVqtOXbTaSFMfJ\ncomment by: e660ZS3gfxTXZR06kqn5M23VCzl2\n"
    },
    {
        "role": "user",
        "content": "## Real Assets to manage\n3 autos\n1 house with mortgage\n1 vacant lot a joining the house lot\n\ncommentId: ua399Hv5Uzge2945PSdj\ncomment by: e660ZS3gfxTXZR06kqn5M23VCzl2\n"
    },
    {
        "role": "user",
        "content": "## update schedule for reminders to be sent\n\nmorning - regimen reminder\n\nmorning - family logistics update\n\nmidday - tool use plan\n\nmargaritaville - social cycle \n\nfamily logistics update \n\nonce a week environment maintenance project- shop, yard, house\ncommentId: nph5vexqKVI8DrR9YFd5\ncomment by: e660ZS3gfxTXZR06kqn5M23VCzl2\n"
    },
    {
        "role": "user",
        "content": "concept:{\ntopic_context,\ntopic_statement,\ntopic_subtopics,\ntopic_milestones,\ntopic_questions,\ntopic_next_steps,\n}\n\n**topic_context**\n* short but comprehensive statement about how this category fits into the parent topic. \n* include goals and outcomes of parent topic as well as goals and topics of this category. \n* be sure to explicitly state what the parent topic is\n\n**topic_statement**\n* describe what the we are trying to to achieve\n\n**topic_subtopics**\n* create 3 to 5 categories of activities or knowledge areas \n* the categories should be broad enough to cover all necessary activities\n\n**topic_milestones**\n- what are the first few things you would do and why do them now\n\n**topic_questions**\n- you may ask 3 to 5 questions to clarify details about this topic\n\n"
    }
]

const choicesObject_Topic_Topic = {
    "topic_title": "My Plan",
    "topic_subtitle": "Managing Personal and Professional Life",
    "topic_concept": "A comprehensive management strategy for balancing family, work, and personal projects to ensure efficiency and productivity.",
    "topic_statement": "The aim is to create a structured plan that integrates family responsibilities, home management, community involvement, and professional development, ultimately leading to better time management and financial stability.",
    "topic_subtopics": [
        {
            "topic_title": "Family Management",
            "topic_subtitle": "Coordinating family schedules and responsibilities",
            "topic_concept": "Ensuring fluid communication and logistics among family members to enhance unity and support.",
            "topic_statement": "To organize and implement family activities that strengthen relationships and provide for their needs.",
            "topic_subtopics": [],
            "topic_milestones": [
                {
                    "milestone": "Schedule regular family meetings to discuss logistics."
                },
                {
                    "milestone": "Set up a family calendar accessible to everyone."
                }
            ],
            "topic_questions": [
                {
                    "question": "What are the main responsibilities of each family member?"
                },
                {
                    "question": "How can we ensure everyone is involved in family planning?"
                }
            ]
        }
    ],
    "topic_milestones": [
        {
            "milestone": "Identify and prioritize tasks related to family, home, and work."
        },
        {
            "milestone": "Create a weekly schedule that includes all essential activities."
        },
        {
            "milestone": "Set reminders for critical tasks to maintain flow."
        }
    ],
    "topic_questions": [
        {
            "question": "What are the most immediate needs of my family?"
        },
        {
            "question": "Which work-related tasks need urgent attention?"
        },
        {
            "question": "How can I better align my personal project with my family's financial goals?"
        }
    ]
}

const choicesObject_Topic_Subtopic = {
    "topic_title": "My Plan",
    "topic_subtitle": "A Comprehensive Management System for Personal and Family Life",
    "topic_concept": "The parent topic focuses on organizing and managing various aspects of life, including work, family, and personal development. This category aims to streamline these activities through a structured approach that includes reminders and scheduled activities, contributing to better productivity and family cohesion.",
    "topic_statement": "We are trying to achieve a well-organized, balanced life that allows us to efficiently manage work obligations, family commitments, and personal pursuits. The goal is to create a system that supports growth in all areas, ensuring that nothing important is overlooked.",
    "topic_subtopics": [
        {
            "subtopic": "Work Management"
        },
        {
            "subtopic": "Family Logistics"
        },
        {
            "subtopic": "Financial Planning"
        },
        {
            "subtopic": "Community Engagement"
        },
        {
            "subtopic": "Personal Development"
        }
    ],
    "topic_milestones": [
        {
            "milestone": "Set up daily reminder system for tasks and activities."
        },
        {
            "milestone": "Organize current assets (3 autos, 1 house, 1 vacant lot) for better management."
        },
        {
            "milestone": "Implement a weekly environment maintenance project schedule."
        }
    ],
    "topic_questions": [
        {
            "question": "What specific tasks do I need to prioritize in my work life?"
        },
        {
            "question": "How can I ensure effective communication with family regarding logistics?"
        },
        {
            "question": "What are the financial goals I need to focus on in the short and long term?"
        },
        {
            "question": "How can I better engage with my community while balancing my commitments?"
        },
        {
            "question": "What personal development activities will contribute the most to my overall growth?"
        }
    ]
}