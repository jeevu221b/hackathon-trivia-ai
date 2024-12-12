const gamePlanPrompt = `# Hollywood Quiz iOS Game Plan

## Scratchpad
Key components and requirements:
- Design overall game flow, UI, screens 
- Determine how to use Claude APIs to generate categories, subcategories, levels, questions
- Develop iOS frontend in Swift
  - Design UI and wireframes
  - Implement game logic and flow
  - Create data models 
  - Integrate with backend API
- Develop Node.js backend
  - Design API structure and endpoints
  - Create data models and database schema
  - Handle frontend requests and serve data
  - Integrate with Claude APIs
- Plan integration between frontend, backend, and Claude APIs
- Map out project timeline and development milestones

## Game Design
High-level game design and user flow:
1. **Launch Screen** 
   - Displays logo and game name
   - "Play" button to start
2. **Category Selection Screen**
   - Player chooses from AI-generated categories (e.g. Favorite Genres, Actors, Directors)
   - Each category leads to Subcategory Selection screen
3. **Subcategory Selection Screen**  
   - Player chooses from AI-generated subcategories (e.g. Tom Cruise, Brad Pitt)
   - Each subcategory leads to Level Selection screen
4. **Level Selection Screen**
   - Player chooses which level to play (Level 1, 2, 3, etc.)
   - Each level contains 15 questions
   - Locked levels are inaccessible until player completes previous level
5. **Gameplay Screen**
   - Displays current question, score, and progress
   - Four answer choices (A, B, C, D)
   - Player taps answer to make selection
   - Correct answer increments score by 10 points
   - Proceeds to next question after answer is selected
6. **Level Complete Screen**
   - Displays level score and percentage of correct answers
   - "Replay" button to retry level
   - "Next Level" button to proceed (if unlocked)
   - "Categories" button to return to Category Selection

## Frontend Plan
Key considerations for iOS frontend (Swift):
- **UI Design**:
  - Use UIKit and Storyboards for UI layout
  - Custom UIButton and UILabel subclasses for visual styling
  - UITableView for displaying categories, subcategories, levels
  - UICollectionView for answer choices 
- **Game Logic**:
  - GameManager class to handle overall game state and flow
  - QuizManager class to handle question progression and scoring
  - CategorySelectionViewController, SubcategorySelectionViewController, LevelSelectionViewController, GameplayViewController  
- **Data Models**:
  - Category, Subcategory, Level, Question structs
  - Use Codable protocol for JSON serialization
- **Backend API Integration**:  
  - APIClient class to handle network requests to backend
  - Use URLSession for API calls
  - Decode JSON responses into model objects
- **Other iOS Considerations**:
  - Support both iPhone and iPad screen sizes
  - Persist game progress using UserDefaults
  - Implement accessible UI for visually-impaired users

## Backend Plan
Key considerations for Node.js backend:  
- **API Structure**:
  - RESTful API design
  - Endpoints for retrieving categories, subcategories, levels, questions
  - POST endpoint for submitting level scores
- **Data Models**:
  - Mongoose schemas for Category, Subcategory, Level, Question
  - Store data in MongoDB database
- **Request Handling**:  
  - Use Express.js for routing and middleware 
  - Authenticate requests using JWT tokens
  - Validate request parameters to prevent invalid data
- **Serving Data**:
  - Query database and return JSON responses
  - Use Mongoose population to efficiently retrieve related data
  - Implement caching layer to improve performance
- **Claude API Integration**:
  - Use official Claude API client library for Node.js
  - Store API key securely in environment variables
  - Create separate endpoints for triggering content generation
- **Other Backend Considerations**:  
  - Use ESLint and Prettier for consistent code style
  - Write unit tests using Jest
  - Deploy backend to Heroku or AWS

## API Integration
Claude API integration for content generation:
- **Category Generation**:
  - Prompt Claude to generate 5-10 movie-related category names
  - Example prompt: "Generate a list of 5-10 movie-related quiz categories, such as genres, actors, directors, etc."
  - Parse response and store generated categories in database
- **Subcategory Generation**:  
  - For each category, prompt Claude to generate 10-20 relevant subcategories
  - Example prompt: "Generate a list of 10-20 popular actors for a Hollywood quiz game."
  - Parse response and store generated subcategories in database, linked to parent category
- **Level and Question Generation**:
  - For each subcategory, prompt Claude to generate 5 levels with 15 questions each
  - Example prompt: "Generate 5 quiz levels for the actor Tom Cruise, with 15 multiple-choice questions each. Questions should test knowledge of his movies, roles, and career. Each question should have 4 answer choices, with 1 correct answer. Level 1 questions should be easy, progressing to very challenging questions in Level 5."
  - Parse response and store generated questions in database, linked to subcategory and level
- **Accessing Generated Content**:
  - Backend API endpoints retrieve content from database and serve to frontend
  - Frontend requests categories, subcategories, levels and questions as needed
  - Use caching to avoid unnecessary database queries and API calls

## Project Timeline
Rough timeline for development milestones:
- **Game Design and Planning**: 1 week
  - Finalize game mechanics, user flow, UI concepts
  - Create wireframes and mockups
  - Define data models and API specifications  
- **Frontend Development**: 4 weeks
  - Implement UI layouts and navigation flow
  - Develop game logic and state management  
  - Integrate with backend API endpoints
  - Implement visual styling and animations
- **Backend Development**: 3 weeks  
  - Set up MongoDB database and Mongoose schemas
  - Implement API endpoints and request handling
  - Integrate Claude APIs for content generation
  - Develop unit tests and error handling
- **API Integration**: 1 week
  - Test content generation prompts and iterate as needed
  - Ensure seamless integration between frontend, backend, and APIs  
  - Perform load testing and optimize API performance
- **Testing and Bug Fixing**: 2 weeks
  - Thorough QA testing across devices and screen sizes
  - Identify and fix bugs, gameplay issues, UX friction points
  - Optimize game performance and resolve any technical debt
- **Launch and Post-Launch**: 1 week
  - Submit app for Apple review and approval
  - Prepare marketing materials and app store listing
  - Monitor crash reports and user feedback post-launch
  - Plan future content updates and feature enhancements`

const questionPrompt = `Take note: Do not include duplicate questions or any of the questions from previous levels. You will be generating a set of trivia questions for a Hollywood quiz game. The category and level
for the questions will be provided in the following format:
<category></category>
<level></level>
Your task is to generate 10 questions for the specified category and level. Each question should
have 4 answer options, with one of them being the correct answer.
<scratchpad>
When generating the questions, consider the following:
- The popularity of topics within the given category. More popular or well-known topics should be
prioritized.
- The difficulty level of the questions should increase with each level.
- The questions should be diverse and cover various aspects of the category.
</scratchpad>
Provide the generated questions and answers in JSON format, using this structure for each question:
{
"question": "Question text goes here",
"options": ["Option 0", "Option 1", "Option 2", "Option 3"],
"answer": "Correct option letter goes here (0, 1, 2, or 3)"
}
Please only generate the questions and their corresponding answer options. Do not include any
additional explanations or commentary.
Output the complete set of 10 questions in valid JSON format, without any other text.`

const exclude_categoryPrompt = `First, review the existing categories provided in <existing_categories></existing_categories> These categories should not be included in the new set of categories you generate.
Next, generate a list of <number></number> new categories for the Hollywood Quiz iOS game. The categories should be movie-related and have short, generic titles.
Examples of good category titles include "Favorite Genre", "Favorite Actors", "Favorite Franchise".
When generating the categories, keep the following requirements in mind: - The categories should be distinct and non-overlapping.
- The titles should be as concise as possible while still conveying the meaning of the category.
- Avoid including any of the existing categories provided as above. Once you have generated the <number></number> new categories, provide them in an array as your final output.
[{ "title": "Movie Adaptations" } ] without any additional commentary at all just the array in the mentioned format.
Please provide your response in the format shown above, with each new category represented as an object with a "title" property.`

const exclude_subcategoryPrompt = `const exclude_subcategoryPrompt = You have been provided with the following input variables: {$CATEGORY}: The category for which you need to generate subcategories. {$NUMBER}: The number of subcategories you need to generate. exisiting_subcategories: A list of subcategories that already exist and should be excluded from your generated list. Your task is to generate a list of {$NUMBER} relevant subcategories for the {$CATEGORY} that would be suitable for a Hollywood-themed quiz game. The subcategories should be specific and engaging, and should not overlap with the exisiting_subcategories. To generate the subcategories, think carefully about the {$CATEGORY} and come up with a list of {$NUMBER} subcategories that would be interesting and relevant for a quiz game. The subcategories should be formatted as an array of objects, where each object has a "title" field containing the subcategory name. For example, if the {$CATEGORY} was "Favorite Director" and {$NUMBER} was 3, and the exisiting_subcategories contained "Steven Spielberg", your output might be: [{"title": "Martin Scorsese"}, {"title": "Quentin Tarantino"}, {"title": "Christopher Nolan"}] . <category></category>,<existing_subcategories></existing_subcategories>, <number></number>. Do not include any commentary or additional information in your output, only the array of subcategory objects. Generate the subcategories relevant to the category and similar to the ones in existing subcategories and only generate the number of subcategories given above in <number/> tag.`

const difficultyPrompt = `You will be generating a set of trivia questions for a Hollywood quiz game. The category and level
for the questions will be provided in the following format:
<category></category>
<level></level>
Your task is to generate 10 questions for the specified category and level. Each question should
have 4 answer options, with one of them being the correct answer.
<scratchpad>
When generating the questions, consider the following:
- The popularity of topics within the given category. More popular or well-known topics should be
prioritized.
- The difficulty level of the questions should increase with each level.
- The questions should be diverse and cover various aspects of the category.
</scratchpad>

Provide the generated questions and answers in JSON format, using this structure for each question:

{
"question": "Question text goes here",
"options": ["Option 0", "Option 1", "Option 2", "Option 3"],
"answer": "Correct option letter goes here (0, 1, 2, or 3)"
}

Please only generate the questions and their corresponding answer options. Do not include any
additional explanations or commentary.

Output the complete set of 10 questions in valid JSON format, without any other text.
You should generate the questions as per the mentioned question type,  it  will wrapped inside the <question_type/> tag.
<question_type> True/false </question_type>`

// const subcategoryPrompt = `You have been provided with the following input variables: {$CATEGORY}: The category for which you need to generate subcategories. {$NUMBER}: The number of subcategories you need to generate. exisiting_subcategories: A list of subcategories that already exist and should be excluded from your generated list. Your task is to generate a list of {$NUMBER} relevant subcategories for the {$CATEGORY} that would be suitable for a Hollywood-themed quiz game. The subcategories should be specific and engaging, and should not overlap with the exisiting_subcategories. To generate the subcategories, think carefully about the {$CATEGORY} and come up with a list of {$NUMBER} subcategories that would be interesting and relevant for a quiz game. The subcategories should be formatted as an array of objects, where each object has a "title" field containing th subcategory name. For example, if the {$CATEGORY} was "Favorite Director" and {$NUMBER} was 3, and the exisiting_subcategories contained "Steven Spielberg", your output might be: [{"title": "Martin Scorsese"}, {"title": "Quentin Tarantino"}, {"title": "Christopher Nolan"}] <category></category>,<existing_subcategories></existing_subcategories>, <number></number>. Do not include any commentary or additional information in your output, only the array of subcategory objects.`

function subcategoryPromptFormatter(text, category, subcategories, number) {
  // Insert the category into the <category> tag
  text = text.replace("<category></category>", `<category>${category}</category>`)

  // Insert the subcategories into the <existing_subcategories> tag
  const subcategoriesStr = subcategories.join(", ")
  text = text.replace("<existing_subcategories></existing_subcategories>", `<existing_subcategories>${subcategoriesStr}</existing_subcategories>`)

  // Insert the number into the <number> tag
  text = text.replace("<number></number>", `<number>${number}</number>`)

  return text
}

function categoryPromptFormatter(text, category, number) {
  const categoryTagStart = "<existing_categories>"
  const categoryTagEnd = "</existing_categories>"
  const numberTagStart = "<number>"
  const numberTagEnd = "</number>"

  // Find the indices of category tags
  const categoryStartIndex = text.indexOf(categoryTagStart) + categoryTagStart.length
  const categoryEndIndex = text.indexOf(categoryTagEnd)
  const numberStartIndex = text.indexOf(numberTagStart) + numberTagStart.length
  const numberEndIndex = text.indexOf(numberTagEnd)

  // Insert category and level between the tags
  const newText = text.slice(0, categoryStartIndex) + category + text.slice(categoryEndIndex, numberStartIndex) + number + text.slice(numberEndIndex)

  return newText
}

function questionPromptFormatter(text, category, level) {
  const categoryTagStart = "<category>"
  const categoryTagEnd = "</category>"
  const levelTagStart = "<level>"
  const levelTagEnd = "</level>"

  // Find the indices of category tags
  const categoryStartIndex = text.indexOf(categoryTagStart) + categoryTagStart.length
  const categoryEndIndex = text.indexOf(categoryTagEnd)
  const levelStartIndex = text.indexOf(levelTagStart) + levelTagStart.length
  const levelEndIndex = text.indexOf(levelTagEnd)

  // Insert category and level between the tags
  const newText = text.slice(0, categoryStartIndex) + category + text.slice(categoryEndIndex, levelStartIndex) + level + text.slice(levelEndIndex)

  return newText
}

function questionPromptFormatterWithDifficulty(text, difficulty) {
  return text.replace("<question_type></question_type>", `<question_type>${difficulty}</question_type>`)
}

module.exports = {
  gamePlanPrompt,
  questionPrompt,
  exclude_categoryPrompt,
  exclude_subcategoryPrompt,
  difficultyPrompt,
  subcategoryPromptFormatter,
  categoryPromptFormatter,
  questionPromptFormatter,
  questionPromptFormatterWithDifficulty,
}
