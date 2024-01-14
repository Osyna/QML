# QML
Question Markup Language

- **Free-Text**: Allows open-ended responses.
- **MCQ**: Multiple choice questions.
- **True/False**: Questions with true or false answers.
- **Rating**: Questions that use a rating scale.
- **Likert**: Questions based on the Likert scale.
- **Yes/No**: Simple yes or no questions.
- **Ranking**: Questions where items need to be ranked in order.
- **Matching**: Questions that involve matching items from two sets.
- **Fill-in-the-Blank**: Questions with a blank space to be filled in by the respondent.
- **Picture Choice**: Questions where the answers are images.
- **Slider**: Questions using a slider for responses.
- **Dropdown**: Questions that provide a dropdown menu for answer selection.
- **Semantic Differential**: Questions that measure reactions using bipolar scales.
- **Matrix**: Questions presented in a grid format (similar to Likert scale questions).
- **Demographic**: Questions used to gather demographic information.
- **Hotspot**: Questions where respondents interact with an image.
- **Drag-and-Drop**: Interactive questions involving dragging items to match or sort.


# Objects & Parameters 

### question (Object)

**type (String)**: The type of question (e.g., "Free-Text", "MCQ").
**minChar (Integer) (Optional)**: Minimum character limit for the answer.
**maxChar (Integer) (Optional)**: Maximum character limit for the answer.
**check (String)**: The method of answer verification for Free-Text Question Only ("AI","Keywords","Exact","Manual").
**points (Float) (Optional)**: Points awarded for a correct answer.
**difficulty (String) (Optional)**: Difficulty level of the question (e.g., "easy", "medium", "hard").
**category (String) (Optional)**: Category or subject of the question.
**timeLimit (Integer) (Optional)**: Time limit to answer the question in seconds.
**version (String) (Optional)**: Version of the QML or question.


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
