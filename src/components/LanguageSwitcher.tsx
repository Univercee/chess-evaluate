import { LANGUAGES, setLanguage, t, useLanguage } from '../i18n';

interface LanguageSwitcherProps {
  className?: string;
}

/**
 * Segmented control for the UI language
 */
export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const language = useLanguage();

  return (
    <div role="group" aria-label={t('app.language')} className={`flex gap-0.5 p-0.5 bg-gray-800 rounded-lg ${className}`}>
      {LANGUAGES.map(({ code, label, name }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          title={name}
          aria-pressed={language === code}
          lang={code}
          className={`px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
            language === code ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
