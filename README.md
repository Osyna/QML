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


# API Endpoints

## 1. POST /questions

Request Body Example :
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
    "timeLimit": 60,
    "randomizeOptions": false,
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
