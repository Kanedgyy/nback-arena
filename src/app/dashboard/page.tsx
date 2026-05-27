'use client';

import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  const handleJoinRoom = () => {
    const roomId = prompt('Enter Room ID:');
    if (roomId) {
      router.push(`/room/${roomId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">🎮 Dashboard</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Room Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">🆕 Create New Room</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start a new N-Back game with your friends.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              Create Room
            </button>
          </div>

          {/* Join Room Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">🚪 Join Existing Room</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Enter a room ID to join an ongoing game.
            </p>
            <button
              onClick={handleJoinRoom}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              Join Room
            </button>
          </div>

          {/* How to Play */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">📖 How to Play</h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                <strong>N-Back Challenge:</strong> You&apos;ll see a sequence of positions in a 3×3 grid.
                Press &quot;Match&quot; if the current position matches the position from N steps ago.
              </p>
              <p>
                <strong>Scoring:</strong> +10 points for each correct answer. Mistakes reduce your score.
              </p>
              <p>
                <strong>Speed Up:</strong> Every 3 mistakes from any player increases the game speed for everyone!
              </p>
              <p>
                <strong>Winning:</strong> The player with the most correct answers wins!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
