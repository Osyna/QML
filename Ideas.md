##Answer object

If answer is valid then Answer return the defined answer else return "wrong answer"
If Question have hints and the parameter auto hints is defined return first hint and remove the dedicated points.

An Answer can also not be correct/wrong, ex : Customer Survey so the return will be "sent"


Questionnaire [GROUP of Questions]




1 - Creator create a question or a group of questions 
2 - Creator link question or group of questions to a questionnaire or a Pool
    A -  Questionnaire can includes Questions / a group of Random questions from a Pool / a random subgroup of a group of questions

3 - User answer to a questionnaire 
4 - questionnaire answers are sent to the server
5 - validation of the server
    The Server validate / Process the user answer's . 
    Server return a response : 
    - a score
    - the list of valid and wrong answer with explaination or not
    - simply a valited message (example for customer survey)


Questions Path Ideas / Questions Logic

In Questionnaire : 
Pool is a Tree of Question with n the amount of Answer possible
so n paths by question

Questionnaire 

If a questionnaire follow a Logic Path of Questions it will use a temp / non listed pool to group the question on a certain level.

Question embed a pool of question(s) (which can contain also one question) and each of these question can embed a pool of question(s)


Questionnnaire / Qpath System (Questionnaire path to Logic Graph) / Usefull for no code organization of the Questionnaire

    {
        "name" : "test",
        "description" : "This is test questionnaire",
        "type":"Questionnaire",
        "pool": 
        [
            {
                "type":"path",
                "question": 12, // Question ID
                "Answers" : [
                        "Answer1" : {
                            "type" : "question",
                            "question" : 16,
                        }
                        "Answer2" : {
                            "type" : "path",
                            "question" : 26,
                            "Answers" : [
                                "Answer1" : {
                                    "type" : "question",
                                    "question" : 16,
                                }
                                "Answer2" : {
                                    "type" : "end" // End questionnaire
                                },
                                "Answer3" : {
                                    "type" : "break" // Break Path / Go to
                                }
                            ]
                        "Answer3" : {
                            "type": "break"
                        }
                    ]
            },
            {
                "type": "question",
                "question" : 346
            }
        ]
    }


### type available 

    - path : path to get multiple choices of path proposed base on a question answer, one path by answer 
    - question : the type is a question 
    - break :  break the path logic and got the next question on the parent level 
    - end : end the questionnaire 
    - goto :  jump to a specific path or question / label


