import React from 'react';
import { CaptionType, CountryType } from '@/app/admin/lib/types';
import { ImageContainer } from '../../components/elements/ImageContainer';

export const captionColumnRenderers = {
  id: (caption: CaptionType) => (
    <span className="font-mono text-sm text-gray-500">
      #{caption._id || caption.id}
    </span>
  ),

  national: (caption: CaptionType) => {
    const national = caption.national || '';
    return (
      <div className="space-y-1">
        <span className="font-medium text-gray-900 block">
          {national || <span className="text-gray-400 italic">No national word</span>}
        </span>
        <span className="text-xs text-gray-500 font-mono">
          {national.length} chars
        </span>
      </div>
    );
  },

  foreign: (caption: CaptionType) => {
    const foreign = caption.foreign || '';
    return (
      <div className="space-y-1">
        <span className="font-medium text-gray-900 block">
          {foreign || <span className="text-gray-400 italic">No foreign word</span>}
        </span>
        <span className="text-xs text-gray-500 font-mono">
          {foreign.length} chars
        </span>
      </div>
    );
  },

  created_at: (caption: CaptionType) => {
    const date = new Date(caption.created_at || '');
    return (
      <div className="text-sm">
        <div className="text-gray-900 font-medium">
          {date.toLocaleDateString()}
        </div>
        <div className="text-gray-500 text-xs">
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    );
  },
};

export const countryColumnRenderers = {
  'name.common': (country: CountryType) => (
    <div className="flex items-center space-x-3">
      <ImageContainer
        src={`https://flagcdn.com/w40/${country.cca2.toLowerCase()}.png`}
        alt={`${country.name.common} flag`}
        parentClassName="w-[24px] h-[16px] flex items-center"
        imageClassName="w-full h-full  border border-gray-300 object-cover"
      />
      <span className="flex font-medium text-gray-900">
        {country.name.common}
      </span>
    </div>
  ),

  region: (country: CountryType) => (
    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
      {country.region}
    </span>
  ),

  capital: (country: CountryType) => {
    const capital = country.capital;
    return (
      <span className="text-gray-900">
        {capital && capital.length > 0 ? capital[0] : 'N/A'}
      </span>
    );
  },

  currencies: (country: CountryType) => {
    const currencies = country.currencies;
    if (!currencies) return <span className="text-gray-500">N/A</span>;
    const currencyKeys = Object.keys(currencies);
    const currencyCode = currencyKeys.length > 0 ? currencyKeys[0] : 'N/A';
    const currencySymbol = currencies[currencyCode]?.symbol || '';
    
    return (
      <div className="text-sm">
        <span className="font-mono font-medium text-gray-900">{currencyCode}</span>
        {currencySymbol && (
          <span className="ml-1 text-gray-500">({currencySymbol})</span>
        )}
      </div>
    );
  },

  languages: (country: CountryType) => {
    const languages = country.languages;
    if (!languages) return <span className="text-gray-500">N/A</span>;
    const languageValues = Object.values(languages);
    const displayLanguages = languageValues.slice(0, 2);
    const hasMore = languageValues.length > 2;
    
    return (
      <div className="text-sm">
        <span className="text-gray-900">
          {displayLanguages.join(', ')}
        </span>
        {hasMore && (
          <span className="text-gray-500 ml-1">
            +{languageValues.length - 2} more
          </span>
        )}
      </div>
    );
  },

  independent: (country: CountryType) => {
    const isIndependent = country.independent;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
        isIndependent 
          ? 'bg-green-100 text-green-700' 
          : 'bg-orange-100 text-orange-700'
      }`}>
        {isIndependent ? 'Independent' : 'Dependent'}
      </span>
    );
  },
};

