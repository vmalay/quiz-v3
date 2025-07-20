'use client';

export default function HomePage() {
  const themes = [
    { id: '1', name: 'Science', description: 'Test your knowledge of scientific facts' },
    { id: '2', name: 'History', description: 'Explore historical events and figures' },
    { id: '3', name: 'Geography', description: 'Challenge yourself with world geography' },
  ];

  return (
    <div className="container mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Quiz Battle
        </h1>
        <p className="text-xl text-gray-600">
          Challenge opponents in real-time multiplayer trivia battles
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Choose Your Theme
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <div key={theme.id} className="bg-white rounded-lg border shadow-sm hover:shadow-lg transition-shadow p-6">
              <h3 className="text-lg font-semibold mb-2">{theme.name}</h3>
              <p className="text-gray-600 mb-4">{theme.description}</p>
              <button 
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => alert(`Starting ${theme.name} battle!`)}
              >
                Start Battle
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}