'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/components/providers';
import { useGameStore } from '@/stores/game-store';

export default function HomePage() {
  const router = useRouter();
  const { data: themes, isLoading, error } = trpc.themes.getAll.useQuery();
  const { playerId } = useGameStore();

  const handleThemeSelect = (themeId: string, themeName: string) => {
    if (!playerId) {
      alert('Player ID not generated yet. Please refresh the page.');
      return;
    }

    // Navigate to matchmaking page with theme info
    router.push(`/matchmaking?themeId=${themeId}&themeName=${encodeURIComponent(themeName)}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading themes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px] text-center">
          <div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">Connection Error</h2>
            <p className="text-gray-600">Unable to connect to the server. Make sure the API is running on port 3001.</p>
            <p className="text-sm text-gray-500 mt-2">Error: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

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
          {themes?.map((theme) => (
            <div key={theme.id} className="bg-white rounded-lg border shadow-sm hover:shadow-lg transition-shadow p-6">
              <h3 className="text-lg font-semibold mb-2">{theme.name}</h3>
              <p className="text-gray-600 mb-4">{theme.description || 'Test your knowledge!'}</p>
              <button
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleThemeSelect(theme.id, theme.name)}
                disabled={!playerId}
              >
                {!playerId ? 'Loading...' : 'Start Battle'}
              </button>
            </div>
          ))}
        </div>

        {!themes || themes.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Themes Available</h3>
              <p className="text-yellow-700 mb-4">Please set up the database first by running the SQL script in your Supabase dashboard.</p>
              <p className="text-sm text-yellow-600">
                Copy the contents of <code>database-setup.sql</code> and run it in your Supabase SQL Editor.
              </p>
            </div>
          </div>
        )}

        {playerId && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Player ID: <code className="bg-gray-100 px-2 py-1 rounded">{playerId}</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
