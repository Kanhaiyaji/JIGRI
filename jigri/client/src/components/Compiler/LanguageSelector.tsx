import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setLanguage } from '../../features/compiler/compilerSlice';
import { languages, getLanguage } from '../../lib/languageRegistry';
import { ChevronDown } from 'lucide-react';

const LanguageSelector = () => {
  const dispatch = useDispatch();
  const currentLangId = useSelector((state: RootState) => state.compiler.language);
  const currentLang = getLanguage(currentLangId);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-sm">
        {currentLang?.emoji ?? '💻'}
      </div>
      <select
        id="language-selector"
        value={currentLangId}
        onChange={(e) => dispatch(setLanguage(e.target.value))}
        className="appearance-none bg-dark-card border border-dark-border text-white text-sm rounded-lg pl-8 pr-8 py-1.5 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 cursor-pointer transition-all hover:border-gray-500"
      >
        {languages.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.name}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </div>
    </div>
  );
};

export default LanguageSelector;