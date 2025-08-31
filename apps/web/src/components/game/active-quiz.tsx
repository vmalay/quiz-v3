'use client';

import { Question } from '@quiz-battle/shared';

interface ActiveQuizProps {
  currentQuestion: Question;
  currentQuestionIndex: number;
  timeRemaining: number;
  playerScore: number;
  opponentScore: number;
  hasAnswered: boolean;
  opponentHasAnswered: boolean;
  selectedAnswer: number | null;
  onAnswerSelect: (answerIndex: number) => void;
}

export function ActiveQuiz({
  currentQuestion,
  currentQuestionIndex,
  timeRemaining,
  playerScore,
  opponentScore,
  hasAnswered,
  opponentHasAnswered,
  selectedAnswer,
  onAnswerSelect,
}: ActiveQuizProps) {
  return (
    <div className="container mx-auto p-4 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto">
        {/* Enhanced Game Header */}
        <div className="bg-white rounded-xl border shadow-lg p-6 mb-8 transition-all duration-500 hover:shadow-xl">
          <div className="flex justify-between items-center">
            {/* Question Progress with animation */}
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600 font-medium">
                Question {currentQuestionIndex + 1} of 5
              </div>
              <div className="flex space-x-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i < currentQuestionIndex ? 'bg-green-500' :
                      i === currentQuestionIndex ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Enhanced Timer */}
            <div className={`text-3xl font-bold transition-all duration-300 ${
              timeRemaining <= 3 ? 'text-red-600 animate-pulse scale-110' : 
              timeRemaining <= 5 ? 'text-yellow-600 scale-105' : 'text-green-600'
            }`}>
              {Math.max(0, Math.ceil(timeRemaining))}s
            </div>
            
            {/* Enhanced Scores */}
            <div className="text-right">
              <div className="text-sm text-gray-600 font-medium">
                <span className={`${playerScore > opponentScore ? 'text-green-600 font-bold' : ''}`}>
                  You: {playerScore}
                </span>
                <span className="mx-2">|</span>
                <span className={`${opponentScore > playerScore ? 'text-green-600 font-bold' : ''}`}>
                  Opponent: {opponentScore}
                </span>
              </div>
            </div>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mt-4 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ease-in-out ${
                timeRemaining <= 3 ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' : 
                timeRemaining <= 5 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                'bg-gradient-to-r from-green-500 to-green-600'
              }`}
              style={{ width: `${(timeRemaining / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Enhanced Question Card */}
        <div 
          key={currentQuestionIndex} // Force re-render for animation
          className="bg-white rounded-xl border shadow-lg p-8 mb-8 transition-all duration-500 hover:shadow-xl animate-fade-in"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-8 text-center leading-relaxed">
            {currentQuestion.questionText}
          </h2>
          
          {/* Enhanced Answer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => onAnswerSelect(index)}
                disabled={hasAnswered || timeRemaining <= 0}
                className={`p-5 rounded-xl border-2 transition-all duration-300 text-left transform ${
                  selectedAnswer === index
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500 text-blue-800 scale-105 shadow-lg'
                    : hasAnswered || timeRemaining <= 0
                    ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed opacity-75'
                    : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:scale-102 hover:shadow-md'
                }`}
              >
                <div className="flex items-center">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-4 transition-colors ${
                    selectedAnswer === index
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="font-medium text-lg">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Player Status */}
        <div className="bg-white rounded-xl border shadow-lg p-6 transition-all duration-500">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                hasAnswered ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}></div>
              <span className="text-gray-700 font-medium">
                You: {hasAnswered ? '✅ Answered' : '⏳ Answering...'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                opponentHasAnswered ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}></div>
              <span className="text-gray-700 font-medium">
                Opponent: {opponentHasAnswered ? '✅ Answered' : '⏳ Answering...'}
              </span>
            </div>
          </div>
          
          {/* Battle indicator */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-purple-800">⚡ Live Quiz Battle</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}