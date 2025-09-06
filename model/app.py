from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os
import random
from datetime import datetime
from dotenv import load_dotenv


load_dotenv()

app = Flask(__name__)
CORS(app)


AI_API_URL = os.getenv('AI_API_URL', 'https://api.openai.com/v1/chat/completions')
AI_API_KEY = os.getenv('AI_API_KEY')
MAX_RETRIES = 3
REQUEST_TIMEOUT = 30


DEMO_MODE = os.getenv('DEMO_MODE', 'true').lower() == 'true'

class SurveyAIService:
    def __init__(self):
        self.question_templates = {
            'feedback': {
                'multiple-choice': [
                    "How would you rate your overall experience?",
                    "Which aspect needs the most improvement?",
                    "How likely are you to recommend us to others?",
                    "What is your primary reason for using our service?"
                ],
                'text': [
                    "What specific improvements would you suggest?",
                    "Please describe your experience in detail",
                    "What do you like most about our service?",
                    "Any additional comments or suggestions?"
                ],
                'rating-scale': [
                    "Rate your satisfaction with our service",
                    "How would you rate the quality of our product?",
                    "Rate the friendliness of our staff",
                    "How would you rate our response time?"
                ],
                'yes-no': [
                    "Would you use our service again?",
                    "Did we meet your expectations?",
                    "Would you recommend us to a friend?",
                    "Was the service provided as promised?"
                ]
            },
            'research': {
                'multiple-choice': [
                    "What is your age group?",
                    "What is your highest level of education?",
                    "Which best describes your occupation?",
                    "How often do you use this type of product/service?"
                ],
                'text': [
                    "Describe your typical daily routine",
                    "What challenges do you face in this area?",
                    "How do you currently solve this problem?",
                    "What would an ideal solution look like?"
                ],
                'rating-scale': [
                    "How important is this issue to you?",
                    "Rate your current satisfaction level",
                    "How urgent is finding a solution?",
                    "Rate your expertise in this area"
                ],
                'yes-no': [
                    "Have you experienced this problem before?",
                    "Are you actively looking for solutions?",
                    "Would you pay for a solution?",
                    "Do you have access to alternatives?"
                ]
            },
            'evaluation': {
                'multiple-choice': [
                    "How would you rate the overall performance?",
                    "Which area showed the most improvement?",
                    "What was the biggest challenge faced?",
                    "Which resource was most valuable?"
                ],
                'text': [
                    "What were the key achievements?",
                    "Describe areas that need improvement",
                    "What strategies worked best?",
                    "What would you do differently next time?"
                ],
                'rating-scale': [
                    "Rate the effectiveness of the approach",
                    "How well were objectives met?",
                    "Rate the quality of execution",
                    "How satisfied are you with the results?"
                ],
                'yes-no': [
                    "Were the objectives clearly defined?",
                    "Did you have adequate resources?",
                    "Would you use this approach again?",
                    "Were stakeholders satisfied with outcomes?"
                ]
            },
            'marketing': {
                'multiple-choice': [
                    "How did you first hear about us?",
                    "What influenced your purchase decision?",
                    "Which marketing channel do you prefer?",
                    "What type of content interests you most?"
                ],
                'text': [
                    "Describe your ideal customer experience",
                    "What messaging resonates with you?",
                    "How can we better communicate our value?",
                    "What would make you choose us over competitors?"
                ],
                'rating-scale': [
                    "Rate the effectiveness of our advertising",
                    "How clear is our brand message?",
                    "Rate your brand awareness before today",
                    "How appealing are our promotional offers?"
                ],
                'yes-no': [
                    "Do you follow us on social media?",
                    "Have you seen our recent advertising?",
                    "Would you sign up for our newsletter?",
                    "Are you interested in exclusive offers?"
                ]
            }
        }
        
        self.option_templates = {
            'satisfaction': ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'],
            'frequency': ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            'likelihood': ['Very Unlikely', 'Unlikely', 'Neutral', 'Likely', 'Very Likely'],
            'agreement': ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
            'age_group': ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'],
            'education': ['High School', 'Some College', "Bachelor's Degree", "Master's Degree", 'Doctorate'],
            'experience': ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
            'importance': ['Not Important', 'Slightly Important', 'Moderately Important', 'Important', 'Very Important']
        }

    def generate_questions_demo(self, requirements):
        """Generate demo questions without calling external AI API"""
        try:
            category = requirements.get('category', 'feedback')
            target_audience = requirements.get('targetAudience', 'general')
            num_questions = int(requirements.get('numberOfQuestions', 8))
            question_types = requirements.get('questionTypes', ['multiple-choice', 'text'])
            
            questions = []
            templates = self.question_templates.get(category, self.question_templates['feedback'])

            type_cycle = question_types * ((num_questions // len(question_types)) + 1)
            
            for i in range(num_questions):
                question_type = type_cycle[i]
                
                if question_type in templates:
                    question_templates = templates[question_type]
                    if question_templates:
                        question_text = random.choice(question_templates)
                        
                        question = {
                            'type': question_type,
                            'text': question_text,
                            'required': i < num_questions // 2,  
                            'order': i
                        }
                        

                        if question_type == 'multiple-choice':
                            if 'satisfaction' in question_text.lower() or 'rate' in question_text.lower():
                                question['options'] = self.option_templates['satisfaction']
                            elif 'likely' in question_text.lower() or 'recommend' in question_text.lower():
                                question['options'] = self.option_templates['likelihood']
                            elif 'age' in question_text.lower():
                                question['options'] = self.option_templates['age_group']
                            elif 'education' in question_text.lower():
                                question['options'] = self.option_templates['education']
                            elif 'experience' in question_text.lower() or 'expertise' in question_text.lower():
                                question['options'] = self.option_templates['experience']
                            elif 'important' in question_text.lower():
                                question['options'] = self.option_templates['importance']
                            else:
                                question['options'] = self.option_templates['agreement']
                        
                        questions.append(question)
            
            return {
                'success': True,
                'questions': questions,
                'generated_at': datetime.now().isoformat(),
                'method': 'demo_template'
            }
            
        except Exception as e:
            print(f"Demo generation error: {str(e)}")
            return {
                'success': False,
                'message': f'Failed to generate demo questions: {str(e)}'
            }

    def generate_questions_ai(self, requirements):
        """Generate questions using external AI API"""
        try:
            prompt = self._build_ai_prompt(requirements)
            

            headers = {
                'Authorization': f'Bearer {AI_API_KEY}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': 'gpt-3.5-turbo',
                'messages': [
                    {
                        'role': 'system',
                        'content': 'You are an expert survey designer. Generate survey questions in JSON format.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'max_tokens': 1500,
                'temperature': 0.7
            }
            
            response = requests.post(
                AI_API_URL,
                headers=headers,
                json=payload,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code == 200:
                ai_response = response.json()
                content = ai_response['choices'][0]['message']['content']
                questions_data = json.loads(content)
                
                return {
                    'success': True,
                    'questions': questions_data.get('questions', []),
                    'generated_at': datetime.now().isoformat(),
                    'method': 'ai_api'
                }
            else:
                print(f"AI API error: {response.status_code} - {response.text}")
                return self.generate_questions_demo(requirements)
                
        except Exception as e:
            print(f"AI API error: {str(e)}")
            return self.generate_questions_demo(requirements)

    def _build_ai_prompt(self, requirements):
        """Build prompt for AI API"""
        title = requirements.get('title', '')
        description = requirements.get('description', '')
        category = requirements.get('category', 'feedback')
        target_audience = requirements.get('targetAudience', 'general')
        num_questions = requirements.get('numberOfQuestions', 8)
        question_types = requirements.get('questionTypes', ['multiple-choice', 'text'])
        
        prompt = f"""
Create a survey with {num_questions} questions for:
Title: {title}
Description: {description}
Category: {category}
Target Audience: {target_audience}
Question Types: {', '.join(question_types)}

Return ONLY a JSON object in this exact format:
{{
  "questions": [
    {{
      "type": "multiple-choice",
      "text": "Question text here",
      "required": true,
      "options": ["Option 1", "Option 2", "Option 3"],
      "order": 0
    }}
  ]
}}

Use these question types: {', '.join(question_types)}
Make questions relevant to {category} for {target_audience}.
For multiple-choice, provide 3-5 realistic options.
Make about half the questions required.
"""
        return prompt

    def improve_questions_demo(self, questions, goals):
        """Demo question improvement"""
        try:
            improved = []
            
            for question in questions:
                improved_question = question.copy()
                

                if 'clarity' in goals:
                    text = improved_question['text']
                    if not text.endswith('?'):
                        improved_question['text'] = text + '?'
                    

                    text = improved_question['text']
                    text = text.replace('utilize', 'use')
                    text = text.replace('facilitate', 'help')
                    improved_question['text'] = text
                
                if 'engagement' in goals:
                    text = improved_question['text']
                    if text.startswith('Please'):
                        improved_question['text'] = text.replace('Please ', '', 1)
                
                improved.append({
                    'original': question['text'],
                    'improved': improved_question['text'],
                    'type': improved_question['type'],
                    'changes': 'Improved clarity and engagement',
                    'options': improved_question.get('options', [])
                })
            
            return {
                'success': True,
                'improvedQuestions': improved,
                'method': 'demo_improvement'
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to improve questions: {str(e)}'
            }

    def get_suggestions_demo(self, category, target_audience=None):
        """Get demo survey suggestions"""
        try:
            suggestions_db = {
                'feedback': [
                    {
                        'title': 'Customer Satisfaction Survey',
                        'description': 'Measure customer satisfaction and identify improvement areas',
                        'keyAreas': ['Service Quality', 'Product Features', 'Support Experience'],
                        'expectedInsights': ['Satisfaction levels', 'Pain points', 'Improvement priorities'],
                        'recommendedQuestions': 10
                    },
                    {
                        'title': 'Employee Feedback Survey',
                        'description': 'Gather employee feedback on workplace experience',
                        'keyAreas': ['Work Environment', 'Management', 'Career Development'],
                        'expectedInsights': ['Employee satisfaction', 'Retention factors', 'Culture assessment'],
                        'recommendedQuestions': 12
                    }
                ],
                'research': [
                    {
                        'title': 'Market Research Survey',
                        'description': 'Understand market trends and consumer behavior',
                        'keyAreas': ['Demographics', 'Preferences', 'Purchase Behavior'],
                        'expectedInsights': ['Market segments', 'Consumer needs', 'Competitive landscape'],
                        'recommendedQuestions': 15
                    },
                    {
                        'title': 'Product Development Research',
                        'description': 'Collect insights for new product development',
                        'keyAreas': ['Feature Preferences', 'Pricing Sensitivity', 'Usage Patterns'],
                        'expectedInsights': ['Feature priorities', 'Price points', 'User workflows'],
                        'recommendedQuestions': 12
                    }
                ],
                'evaluation': [
                    {
                        'title': 'Training Program Evaluation',
                        'description': 'Assess effectiveness of training programs',
                        'keyAreas': ['Content Quality', 'Delivery Method', 'Learning Outcomes'],
                        'expectedInsights': ['Program effectiveness', 'Improvement areas', 'ROI assessment'],
                        'recommendedQuestions': 10
                    }
                ],
                'marketing': [
                    {
                        'title': 'Brand Awareness Survey',
                        'description': 'Measure brand recognition and perception',
                        'keyAreas': ['Brand Recognition', 'Brand Association', 'Purchase Intent'],
                        'expectedInsights': ['Brand strength', 'Market position', 'Campaign effectiveness'],
                        'recommendedQuestions': 8
                    }
                ]
            }
            
            category_suggestions = suggestions_db.get(category, suggestions_db['feedback'])
            
            return {
                'success': True,
                'suggestions': category_suggestions[:3]  
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to get suggestions: {str(e)}'
            }

# Initialize AI service
ai_service = SurveyAIService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Survey Generator',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'demo_mode': DEMO_MODE
    })

@app.route('/generate-survey', methods=['POST'])
def generate_survey():
    """Generate survey questions using AI"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['title', 'description', 'category', 'targetAudience']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Choose generation method based on demo mode or API availability
        if DEMO_MODE or not AI_API_KEY or AI_API_KEY == 'demo-key-replace-with-real':
            result = ai_service.generate_questions_demo(data)
        else:
            result = ai_service.generate_questions_ai(data)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500
            
    except Exception as e:
        print(f"Generate survey error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@app.route('/improve-questions', methods=['POST'])
def improve_questions():
    """Improve existing survey questions"""
    try:
        data = request.get_json()
        
        questions = data.get('questions', [])
        goals = data.get('improvementGoals', ['clarity'])
        
        if not questions:
            return jsonify({
                'success': False,
                'message': 'Questions array is required'
            }), 400
        
        # Use demo improvement for now
        result = ai_service.improve_questions_demo(questions, goals)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500
            
    except Exception as e:
        print(f"Improve questions error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@app.route('/suggestions', methods=['GET'])
def get_suggestions():
    """Get survey suggestions based on category"""
    try:
        category = request.args.get('category')
        target_audience = request.args.get('targetAudience')
        
        if not category:
            return jsonify({
                'success': False,
                'message': 'Category parameter is required'
            }), 400
        
        result = ai_service.get_suggestions_demo(category, target_audience)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500
            
    except Exception as e:
        print(f"Get suggestions error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('DEBUG', 'true').lower() == 'true'
    
    print(f"🤖 AI Survey Service starting on port {port}")
    print(f"🔧 Demo mode: {DEMO_MODE}")
    print(f"🌐 API URL: http://localhost:{port}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
