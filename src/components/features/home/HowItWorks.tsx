import React from 'react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '1',
      title: 'Tell Us Your Dreams',
      description: 'Share your destination, dates, and what makes you excited about travel.',
      icon: '💭'
    },
    {
      number: '2', 
      title: 'AI Creates Your Plan',
      description: 'Our smart AI crafts a personalized itinerary based on your preferences.',
      icon: '🤖'
    },
    {
      number: '3',
      title: 'Book & Explore',
      description: 'Review, customize, and book your perfect trip. Then go make memories!',
      icon: '🌟'
    }
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          How It Works
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Three simple steps to your perfect adventure
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step) => (
          <div key={step.number} className="text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {step.number}
              </div>
              <div className="text-4xl mb-4">{step.icon}</div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {step.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
          Ready to plan your next adventure?
        </p>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
          Plan My Trip
        </button>
      </div>
    </div>
  );
};

export default HowItWorks;