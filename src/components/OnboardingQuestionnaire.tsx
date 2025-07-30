import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Building2 } from 'lucide-react';

interface OnboardingData {
  companyName: string;
  description: string;
  hasHistoricalData: boolean;
  dataYears?: number;
}

interface OnboardingQuestionnaireProps {
  onComplete: (data: OnboardingData) => void;
}

const OnboardingQuestionnaire: React.FC<OnboardingQuestionnaireProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<OnboardingData>();

  const questions = [
    {
      id: 'companyName',
      title: 'What\'s your company name?',
      subtitle: 'This helps us personalize your experience',
      type: 'input' as const,
      placeholder: 'Enter company name...',
      required: true
    },
    {
      id: 'description',
      title: 'What do you want to analyze?',
      subtitle: 'Tell us about your financial modeling goals',
      type: 'textarea' as const,
      placeholder: 'Describe what you want to analyze or achieve...',
      required: true
    },
    {
      id: 'hasHistoricalData',
      title: 'Do you have historical financial data?',
      subtitle: 'This helps us recommend the best modeling approach',
      type: 'choice' as const,
      choices: [
        { value: true, label: 'Yes, I have historical data' },
        { value: false, label: 'No, this is a new venture/startup' }
      ],
      required: true
    }
  ];

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  const handleNext = (data: any) => {
    const newFormData = { ...formData, [currentQuestion.id]: data };
    setFormData(newFormData);

    if (isLastStep) {
      onComplete(newFormData as OnboardingData);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleChoice = (value: any) => {
    handleNext(value);
  };

  const handleFormSubmit = (data: any) => {
    handleNext(data[currentQuestion.id]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentStep + 1} of {questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentStep + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1">
            <div 
              className="bg-primary h-1 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="animate-fade-in">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">{currentQuestion.title}</h1>
              <p className="text-muted-foreground text-lg">{currentQuestion.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              {currentQuestion.type === 'input' && (
                <div className="space-y-2">
                  <Label htmlFor={currentQuestion.id} className="sr-only">
                    {currentQuestion.title}
                  </Label>
                  <Input
                    id={currentQuestion.id}
                    {...register(currentQuestion.id as keyof OnboardingData, { 
                      required: currentQuestion.required 
                    })}
                    placeholder={currentQuestion.placeholder}
                    className="text-lg py-6 text-center"
                    autoFocus
                  />
                  {errors[currentQuestion.id as keyof OnboardingData] && (
                    <p className="text-destructive text-sm text-center">
                      This field is required
                    </p>
                  )}
                </div>
              )}

              {currentQuestion.type === 'textarea' && (
                <div className="space-y-2">
                  <Label htmlFor={currentQuestion.id} className="sr-only">
                    {currentQuestion.title}
                  </Label>
                  <Textarea
                    id={currentQuestion.id}
                    {...register(currentQuestion.id as keyof OnboardingData, { 
                      required: currentQuestion.required 
                    })}
                    placeholder={currentQuestion.placeholder}
                    className="text-lg py-4 min-h-32 resize-none"
                    autoFocus
                  />
                  {errors[currentQuestion.id as keyof OnboardingData] && (
                    <p className="text-destructive text-sm text-center">
                      This field is required
                    </p>
                  )}
                </div>
              )}

              {currentQuestion.type === 'choice' && (
                <div className="space-y-4">
                  {currentQuestion.choices?.map((choice, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full py-6 text-lg hover-scale"
                      onClick={() => handleChoice(choice.value)}
                      type="button"
                    >
                      {choice.label}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  ))}
                </div>
              )}

              {(currentQuestion.type === 'input' || currentQuestion.type === 'textarea') && (
                <div className="text-center pt-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="px-8 hover-scale"
                  >
                    {isLastStep ? 'Get Started' : 'Continue'}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Navigation hint */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Press Enter to continue or click the button
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingQuestionnaire; 