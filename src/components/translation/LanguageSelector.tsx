import { cn } from '../../lib/utils';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../../types';

// =============================================================================
// LANGUAGE SELECTOR
// =============================================================================

interface LanguageSelectorProps {
  selectedLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  excludeLanguage?: LanguageCode;
  className?: string;
}

export function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  excludeLanguage = 'en',
  className,
}: LanguageSelectorProps): React.ReactElement {
  const languages = Object.values(SUPPORTED_LANGUAGES).filter(
    (lang) => lang.code !== excludeLanguage
  );

  return (
    <div className={cn('grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3', className)}>
      {languages.map((language) => (
        <LanguageCard
          key={language.code}
          language={language}
          isSelected={selectedLanguage === language.code}
          onClick={() => onLanguageChange(language.code)}
        />
      ))}
    </div>
  );
}

// =============================================================================
// LANGUAGE CARD
// =============================================================================

interface LanguageCardProps {
  language: (typeof SUPPORTED_LANGUAGES)[LanguageCode];
  isSelected: boolean;
  onClick: () => void;
}

function LanguageCard({
  language,
  isSelected,
  onClick,
}: LanguageCardProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center',
        'w-full aspect-[5/6] p-4 rounded-2xl',
        'border-2 transition-all duration-200',
        'hover:-translate-y-1',
        isSelected
          ? 'border-current bg-current/10'
          : 'border-cport-gray/30 bg-cport-blue/20/50 hover:bg-cport-blue/20 hover:border-cport-gray'
      )}
      style={{
        color: isSelected ? language.color : undefined,
        boxShadow: isSelected ? `0 0 20px ${language.color}40` : undefined,
      }}
    >
      {/* Flag */}
      <span className="text-4xl mb-3">{language.flag}</span>
      
      {/* Native name */}
      <span 
        className={cn(
          'text-body-sm font-medium text-center',
          isSelected ? 'text-white' : 'text-cport-green-light'
        )}
        style={{ direction: language.rtl ? 'rtl' : 'ltr' }}
      >
        {language.nativeName}
      </span>
      
      {/* English name */}
      <span className="text-caption text-cport-gray mt-0.5">
        {language.name}
      </span>

      {/* Selection indicator */}
      {isSelected && (
        <div 
          className="w-2 h-2 rounded-full mt-2"
          style={{ backgroundColor: language.color }}
        />
      )}
    </button>
  );
}

// =============================================================================
// COMPACT LANGUAGE SELECTOR
// =============================================================================

interface CompactLanguageSelectorProps {
  selectedLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  excludeLanguage?: LanguageCode;
  className?: string;
}

export function CompactLanguageSelector({
  selectedLanguage,
  onLanguageChange,
  excludeLanguage = 'en',
  className,
}: CompactLanguageSelectorProps): React.ReactElement {
  const languages = Object.values(SUPPORTED_LANGUAGES).filter(
    (lang) => lang.code !== excludeLanguage
  );

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {languages.map((language) => {
        const isSelected = selectedLanguage === language.code;
        
        return (
          <button
            key={language.code}
            type="button"
            onClick={() => onLanguageChange(language.code)}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              'border-2 transition-all duration-150',
              isSelected
                ? 'border-current scale-110'
                : 'border-transparent hover:border-cport-gray opacity-60 hover:opacity-100'
            )}
            style={{ color: isSelected ? language.color : undefined }}
            title={language.name}
          >
            <span className="text-xl">{language.flag}</span>
          </button>
        );
      })}
    </div>
  );
}
