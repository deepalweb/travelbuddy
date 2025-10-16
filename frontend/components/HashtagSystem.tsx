import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Search, Globe } from './Icons.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface HashtagSystemProps {
  onHashtagClick: (hashtag: string) => void;
  selectedHashtags: string[];
  onHashtagSelect?: (hashtag: string) => void;
  mode?: 'display' | 'input' | 'discovery';
  postContent?: string;
}

interface TrendingHashtag {
  tag: string;
  count: number;
  growth: string;
  category: 'travel' | 'food' | 'adventure' | 'culture' | 'tips';
}

const TRENDING_HASHTAGS: TrendingHashtag[] = [
  { tag: 'solotravel', count: 1250, growth: '+15%', category: 'travel' },
  { tag: 'foodie', count: 980, growth: '+22%', category: 'food' },
  { tag: 'backpacking', count: 760, growth: '+8%', category: 'adventure' },
  { tag: 'budgettravel', count: 650, growth: '+35%', category: 'travel' },
  { tag: 'photography', count: 540, growth: '+12%', category: 'culture' },
  { tag: 'hiddengems', count: 420, growth: '+28%', category: 'tips' },
  { tag: 'digitalnomad', count: 380, growth: '+45%', category: 'travel' },
  { tag: 'localeats', count: 320, growth: '+18%', category: 'food' },
  { tag: 'hiking', count: 290, growth: '+25%', category: 'adventure' },
  { tag: 'culturalimmersion', count: 250, growth: '+30%', category: 'culture' },
];

const SUGGESTED_HASHTAGS = [
  '#adventure', '#wanderlust', '#explore', '#travel', '#vacation',
  '#nature', '#sunset', '#beach', '#mountains', '#city',
  '#food', '#culture', '#local', '#photography', '#memories',
  '#journey', '#discover', '#beautiful', '#amazing', '#incredible'
];

const HashtagSystem: React.FC<HashtagSystemProps> = ({
  onHashtagClick,
  selectedHashtags,
  onHashtagSelect,
  mode = 'display',
  postContent = ''
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  // Auto-suggest hashtags based on post content
  useEffect(() => {
    if (mode === 'input' && postContent) {
      const content = postContent.toLowerCase();
      const suggestions = SUGGESTED_HASHTAGS.filter(tag => {
        const tagWord = tag.replace('#', '');
        return content.includes(tagWord) || 
               content.includes(tagWord.slice(0, -1)) || // singular/plural
               (tagWord === 'food' && (content.includes('eat') || content.includes('restaurant'))) ||
               (tagWord === 'adventure' && (content.includes('exciting') || content.includes('thrill'))) ||
               (tagWord === 'beautiful' && (content.includes('gorgeous') || content.includes('stunning')));
      });
      setSuggestedTags(suggestions.slice(0, 5));
    }
  }, [postContent, mode]);

  const filteredHashtags = TRENDING_HASHTAGS.filter(hashtag =>
    hashtag.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'travel': return 'from-blue-500 to-indigo-600';
      case 'food': return 'from-orange-500 to-red-600';
      case 'adventure': return 'from-green-500 to-emerald-600';
      case 'culture': return 'from-purple-500 to-pink-600';
      case 'tips': return 'from-yellow-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const renderHashtagInput = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={t('hashtags.searchPlaceholder', 'Search hashtags...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Suggested hashtags based on content */}
      {suggestedTags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Star size={16} />
            {t('hashtags.suggested', 'Suggested for your post')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onHashtagSelect?.(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedHashtags.includes(tag)
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending hashtags */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <TrendingUp size={16} />
          {t('hashtags.trending', 'Trending')}
        </h4>
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {filteredHashtags.map((hashtag) => (
            <div
              key={hashtag.tag}
              onClick={() => onHashtagSelect?.(`#${hashtag.tag}`)}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                selectedHashtags.includes(`#${hashtag.tag}`)
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-gray-600" />
                  <span className="font-medium">#{hashtag.tag}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full bg-gradient-to-r ${getCategoryColor(hashtag.category)} text-white`}>
                    {hashtag.category}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{hashtag.count.toLocaleString()}</div>
                  <div className="text-xs text-green-600">{hashtag.growth}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHashtagDiscovery = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={t('hashtags.discoverPlaceholder', 'Discover hashtags...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Trending hashtags grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="text-indigo-600" size={24} />
          {t('hashtags.trendingHashtags', 'Trending Hashtags')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHashtags.map((hashtag, index) => (
            <div
              key={hashtag.tag}
              onClick={() => onHashtagClick(`#${hashtag.tag}`)}
              className="group p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-r from-white to-gray-50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full bg-gradient-to-r ${getCategoryColor(hashtag.category)}`}>
                    <Star size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">#{hashtag.tag}</h4>
                    <span className="text-xs text-gray-500 capitalize">{hashtag.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{hashtag.count.toLocaleString()}</div>
                  <div className="text-xs text-green-600 font-medium">{hashtag.growth}</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">
                {t('hashtags.postsCount', `${hashtag.count.toLocaleString()} posts`)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('hashtags.categories', 'Browse by Category')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['travel', 'food', 'adventure', 'culture', 'tips'].map((category) => (
            <button
              key={category}
              onClick={() => setSearchTerm('')}
              className={`p-3 rounded-lg bg-gradient-to-r ${getCategoryColor(category)} text-white font-medium capitalize hover:shadow-lg transition-all`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHashtagDisplay = () => (
    <div className="flex flex-wrap gap-2">
      {selectedHashtags.map((hashtag) => (
        <span
          key={hashtag}
          onClick={() => onHashtagClick(hashtag)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm cursor-pointer hover:bg-indigo-200 transition-colors"
        >
          <Star size={12} />
          {hashtag.replace('#', '')}
        </span>
      ))}
    </div>
  );

  switch (mode) {
    case 'input':
      return renderHashtagInput();
    case 'discovery':
      return renderHashtagDiscovery();
    default:
      return renderHashtagDisplay();
  }
};

export default HashtagSystem;
