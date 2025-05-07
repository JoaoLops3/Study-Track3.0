export function FontSizeButtons() {
  // const { fontSize, setFontSize } = useFontSize();

  const handleFontSizeChange = (size: "small" | "medium" | "large") => {
    console.log("Mudando tamanho da fonte para:", size);
    // setFontSize(size);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        type="button"
        onClick={() => handleFontSizeChange("small")}
        className="flex flex-col items-center justify-center p-4 rounded-lg border transition-all"
        aria-label="Tamanho de fonte pequeno"
      >
        <div className="flex items-center justify-center w-6 h-6 mb-2">
          <span className="text-xs text-gray-700 dark:text-gray-300">Aa</span>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Pequeno
        </span>
      </button>

      <button
        type="button"
        onClick={() => handleFontSizeChange("medium")}
        className="flex flex-col items-center justify-center p-4 rounded-lg border transition-all"
        aria-label="Tamanho de fonte médio"
      >
        <div className="flex items-center justify-center w-6 h-6 mb-2">
          <span className="text-base text-gray-700 dark:text-gray-300">Aa</span>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Médio
        </span>
      </button>

      <button
        type="button"
        onClick={() => handleFontSizeChange("large")}
        className="flex flex-col items-center justify-center p-4 rounded-lg border transition-all"
        aria-label="Tamanho de fonte grande"
      >
        <div className="flex items-center justify-center w-6 h-6 mb-2">
          <span className="text-lg text-gray-700 dark:text-gray-300">Aa</span>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Grande
        </span>
      </button>
    </div>
  );
}
