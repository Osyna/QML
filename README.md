# QML
Question Markup Language V0.1

QML enables the creation and management of diverse question types for quizzes, surveys, and educational assessments. This API supports a flexible and robust way to handle questions and questionnaires, including various interaction types and checking methods.

API Overview
The QML API allows for the creation and management of individual questions and question pools, as well as the assembly of these questions into structured questionnaires. It supports various question types and flexible checking methods, particularly for free-text responses.


# API Call

#### Question Pool
A pool is like a folder containing list of Questions
Contains unorganized list of Questions.
Can be usefull to create Questionnaire by selecting Random Question from This Pool for a Specific question.
- Create an Empty Pool or a Pool With Questions
- 

#### Questionnaire
- Create a Questionnaire with Questions or Empty
- Edit Questionnaire Info and Property
- Delete a Questionnaire
  
    - #### Question   
    - Add a Question or Multiples Questions to a Questionnaire
    - Add a Question or Multiples Questions to a a Pool/Folder of Questions
    - Modify a Question
    - Delete a Question from a Questionnaire or a question Pool






### Question (type)
- **Free-Text**: Allows open-ended responses.
- **MCQ**: Multiple choice questions.
- **Rating**: Questions that use a rating scale.
- **Likert**: Questions based on the Likert scale.
- **Yes-No**: Simple yes or no questions.
- **Ranking**: Questions where items need to be ranked in order.
- **Matching**: Questions that involve matching items from two sets.
- **Fill-in-the-Blank**: Questions with a blank space to be filled in by the respondent.
- **Picture-Choice**: Questions where the answers are images.
- **Slider**: Questions using a slider for responses.
- **Dropdown**: Questions that provide a dropdown menu for answer selection.
- **Semantic-Differential**: Questions that measure reactions using bipolar scales.
- **Matrix**: Questions presented in a grid format (similar to Likert scale questions).
- **Demographic**: Questions used to gather demographic information.
- **Hotspot**: Questions where respondents interact with an image.
- **Drag-and-Drop**: Interactive questions involving dragging items to match or sort.

### Checking (check) ###


Checking is a specific parameter for **Free-Text Question**, because sometimes it's kind of diffcult to check all the answers of ours students / Customers.
- **AI** : We can use AI to be sure the answer of the student have the same meaning (it will result in a score in percentage) and this meaning can be check true or wrong with a 'sensitivity' from 0 to 1.
For the sensivity set to 1, it mean an exact Meaning will result in a max points score and for 0 and all answer will be accepted and result to max points score.
    - **Meaning**: Check if the meaning of the user answer is the same as the answer.
        - **sensitivity**: Set a sensivity from 0 to 1, 1 meaning an exact Meaning and 0 all answer will be accepted. 
    - **Custom**: 
        - **prompt** : Custom prompt to check the answer, you can make your own sentimental analysis prompt to get your user/customer answer sentiment.
- **Keywords** : The user Answer must contains Keywords or exact sentences. Return points / count of keywords.
- **Exact** : The user Answer must be exactly like the answer.
- **Manual** : The check is manual, on the corrector side.



# Objects & Parameters 

### question

- **type (String)**: The type of question (e.g., "Free-Text", "MCQ").
- **minChar (Integer) (Optional)**: Minimum character limit for the answer.
- **maxChar (Integer) (Optional)**: Maximum character limit for the answer.
- **check (String)**: The method of answer verification for Free-Text Question Only ("AI","Keywords","Exact","Manual").
    - **check-type (string)** : Meaning / Sentimental Analysis / Custom
    - **sensitivity (float) (Optional)** : Only for Meaning type from 0 to 1,  1 mean an exact Meaning, 0 and all answer will be accepted
    - **prompt (string) (Optional)** : Custom Prompt (e.g., "Return Yes if the Answer didn't say Solar Panel but speak about Wind power")
- **points (Float) (Optional)**: Points awarded for a correct answer.
- **difficulty (String) (Optional)**: Difficulty level of the question (e.g., "easy", "medium", "hard").
- **category (String) (Optional)**: Category or subject of the question.
- **timeLimit (Integer) (Optional)**: Time limit to answer the question in seconds.
- **version (String) (Optional)**: Version of the QML or question.


### content

- **text (String)**: The question text.
- **multimedia (String) (Optional)**: URL to an image, video, or audio clip.
- **answers (Array of Objects)(Optional)** : (Answer is optionnal because QML can be used to create Customer Survey or Study Survey).
    - **answerText (String)**: Text of the answer.
- **hints (Array of Objects) (Optional)**
    - **hintText (String)**: Text of the hint.
    - **cost (Float) (Optional)**: The cost of using the hint.
- **feedback (Object) (Optional)**
    - **correct (String) (Optional)**: Feedback for a correct answer.
    - **incorrect (String) (Optional)**: Feedback for an incorrect answer.
- **tags (Array of Strings) (Optional)**: Tags or keywords related to the question.



# API Endpoints

## 1. POST /questions

Request Body Example

This example is for a Free-Text Question  : 
with at least 100 characters and maximum 300 characters, a difficulty set to medium, Category is Biology, 220 seconds of timeLimit, it's the first version of the questions.
The top content is Describe the process of photosynthesis, there is no image and no video urls, a base answer, 2 hints with a different costs. The feedback for correct and incorrect answer is set. The question is tagged as Photosynthesis and Biology.

```
{
  "question": {
    "type": "Free-Text",
    "minChar": 100,
    "maxChar": 300,
    "check": "AI",
    "points": 3,
    "difficulty": "medium",
    "category": "Biology",
    "timeLimit": 220,
    "version": "1.0",
    "content": {
      "text": "Describe the process of photosynthesis.",
      "multimedia": null,
      "answers": [
        {
          "answerText": "Photosynthesis is the process plants use to convert sunlight into energy."
        }
      ],
      "hints": [
        {
          "hintText": "It’s a process from plants",
          "cost": 0.5
        },
        {
          "hintText": "it’s linked to sun",
          "cost": 1
        }
      ],
      "feedback": {
        "correct": "Great job!",
        "incorrect": "Remember that photosynthesis..."
      },
      "tags": ["Photosynthesis", "Biology"]
    }
  }
}
```

# Contributing
Contributions to the QML API are welcome. Please follow the guidelines outlined in CONTRIBUTING.md to submit your contributions.
