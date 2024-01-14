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


# 1. Free-Text Question

    <Question type="Free-Text"  minchar="100" maxchar="300" check="AI" points="3">
    
        <Text>Describe the process of photosynthesis.</Text>
    
        <Answers>
    
            <Answer>Photosynthesis is the process plants use to convert sunlight into energy.</Answer>
    
        </Answers>
    
        <Hints>
    
            <Hint cost="0.5">It’s a process from plants<Hint>
    
            <Hint cost="1">it’s linked to sun<Hint>
    
        </Hints>
    
    </Question>
