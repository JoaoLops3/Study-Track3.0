import { useFontSize } from '../hooks/useFontSize';

export function FontSizeSelector() {
  const { fontSize, setFontSize } = useFontSize();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setFontSize('small')}
        className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
          fontSize === 'small'
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center justify-center w-6 h-6 mb-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">Aa</span>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pequeno</span>
      </button>

      <button
        onClick={() => setFontSize('medium')}
        className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
          fontSize === 'medium'
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center justify-center w-6 h-6 mb-2">
          <span className="text-base text-gray-700 dark:text-gray-300">Aa</span>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Médio</span>
      </button>

      <button
        onClick={() => setFontSize('large')}
        className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
          fontSize === 'large'
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center justify-center w-6 h-6 mb-2">
          <span className="text-lg text-gray-700 dark:text-gray-300">Aa</span>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Grande</span>
      </button>
    </div>
  );
} 