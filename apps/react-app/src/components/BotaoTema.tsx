import { useTheme } from '../contexts/ThemeContext';

const BotaoTema = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
      aria-label="Alternar tema"
    >
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
};

export default BotaoTema; 