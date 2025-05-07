// import { useFontSize } from '../hooks/useFontSize';
// TODO: Implemente o hook useFontSize ou ajuste o caminho se necessário.

export function FontSizeButtons() {
  // const { fontSize, setFontSize } = useFontSize();

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    console.log('Mudando tamanho da fonte para:', size);
    // setFontSize(size);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        type="button"
        onClick={() => handleFontSizeChange('small')}
        className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
          // fontSize === 'small'
            'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
        }`}
        aria-label="Tamanho de fonte pequeno"
      >
        <div className="flex items-center justify-center w-6 h-6 mb-2">
          <span className="text-xs text-gray-700 dark:text-gray-300">Aa</span>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pequeno</span>
      </button>

      <button
        type="button"
        onClick={() => handleFontSizeChange('medium')}
        className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
          // fontSize === 'medium'
            'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
        }`}
        aria-label="Tamanho de fonte médio"
      >
        <div className="flex items-center justify-center w-6 h-6 mb-2">
          <span className="text-base text-gray-700 dark:text-gray-300">Aa</span>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Médio</span>
      </button>

      <button
        type="button"
        onClick={() => handleFontSizeChange('large')}
        className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
          // fontSize === 'large'
            'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
        }`}
        aria-label="Tamanho de fonte grande"
      >
        <div className="flex items-center justify-center w-6 h-6 mb-2">
          <span className="text-lg text-gray-700 dark:text-gray-300">Aa</span>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Grande</span>
      </button>
    </div>
  );
} 