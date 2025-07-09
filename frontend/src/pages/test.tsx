export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-900 mb-6">
          TailwindCSS Test Page
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Card 1</h2>
            <p className="text-gray-600">
              This should be a white card with shadow
            </p>
          </div>

          <div className="bg-green-100 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              Card 2
            </h2>
            <p className="text-green-700">This should be a green card</p>
          </div>

          <div className="bg-red-100 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Card 3</h2>
            <p className="text-red-700">This should be a red card</p>
          </div>
        </div>

        <button className="mt-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Test Button
        </button>
      </div>
    </div>
  );
}
