

import React, { useState } from 'react';
import { Colors } from '../constants.ts'; 

export const Footer: React.FC = () => {
  const [openSections, setOpenSections] = useState<string[]>([]);

  const footerLinksData = {
    company: [
      { label: 'About Travel Buddy', href: '#' },
      { label: 'Our Mission', href: '#' },
      { label: 'Work With Us', href: '#' },
      { label: 'In The News', href: '#' },
      { label: 'Travel Blog', href: '#' }
    ],
    features: [
      { label: 'AI Place Discovery', href: '#' },
      { label: 'Smart Trip Planner', href: '#' },
      { label: 'Exclusive Deals', href: '#' },
      { label: 'Emergency SOS Assist', href: '#' },
      { label: 'Travel Buddy Mobile App', href: '#' }
    ],
    support: [
      { label: 'FAQ & Help Center', href: '#' },
      { label: 'Contact Support', href: '#' },
      { label: 'Safety & Trust', href: '#' },
      { label: 'Community Forum', href: '#' },
      { label: 'Report an Issue', href: '#' }
    ],
    discover: [ 
      { label: 'Destinations', href: '#' },
      { label: 'Popular Trips', href: '#' },
      { label: 'Travel Styles', href: '#' },
      { label: 'Sustainable Travel', href: '#' },
      { label: 'Hidden Gems', href: '#' }
    ]
  };

  const socialLinks = [
    { iconPlaceholder: 'FB', href: '#', label: 'Facebook' },
    { iconPlaceholder: 'TW', href: '#', label: 'Twitter' },
    { iconPlaceholder: 'IG', href: '#', label: 'Instagram' },
    { iconPlaceholder: 'YT', href: '#', label: 'YouTube' }
  ];

  const toggleSection = (sectionKey: string) => {
    setOpenSections(prev => 
      prev.includes(sectionKey) 
        ? prev.filter(key => key !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  const footerBg = Colors.primaryDark;
  const footerTextColor = Colors.textOnDark;
  const footerLinkColor = Colors.textOnDark_secondary;
  const footerLinkHoverColor = Colors.primary;
  const footerBorderColor = Colors.primaryDark;

  // Order of sections for rendering in columns
  const sectionOrder: Array<keyof typeof footerLinksData> = ['company', 'features', 'support', 'discover'];


  return (
    <footer style={{ backgroundColor: footerBg, color: footerTextColor, borderColor: footerBorderColor }} className="mt-12 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left Section: Branding & Contact */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md" style={{backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.accentInfo})`}}>
                <span className="text-white font-bold text-lg">TB</span>
              </div>
              <span className="font-bold text-2xl" style={{color: footerTextColor}}>
                Travel Buddy
              </span>
            </div>
            <p className="text-base leading-relaxed mb-6" style={{color: footerLinkColor}}>
              Your ultimate AI-powered travel companion. Discover amazing places, plan perfect trips, 
              and explore the world with confidence.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-sm" style={{color: footerLinkColor}}>
                <span className="w-5 h-5 inline-flex items-center justify-center" style={{color:Colors.primary}}>📧</span>
                <span>hello@travelbuddy.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm" style={{color: footerLinkColor}}>
                <span className="w-5 h-5 inline-flex items-center justify-center" style={{color:Colors.primary}}>📞</span>
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-sm" style={{color: footerLinkColor}}>
                <span className="w-5 h-5 inline-flex items-center justify-center" style={{color:Colors.primary}}>🌐</span>
                <span>Available in 100+ countries</span>
              </div>
            </div>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a key={index} href={social.href} aria-label={social.label}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{color: Colors.textOnDark}}>
                  <span className="text-base font-medium">{social.iconPlaceholder}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Right Section: Link Columns */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-1">
            {sectionOrder.map((sectionKey) => {
              const section = footerLinksData[sectionKey];
              if (!section) return null;
              const title = sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
              const isOpen = openSections.includes(sectionKey);
              
              return (
                <div key={sectionKey} className="py-4 border-b lg:border-none" style={{borderColor: `${footerLinkColor}40`}}>
                  <button
                    className="w-full flex justify-between items-center lg:cursor-default"
                    onClick={() => window.innerWidth < 1024 && toggleSection(sectionKey)}
                    aria-expanded={isOpen}
                    aria-controls={`footer-section-${sectionKey}`}
                  >
                    <h3 className="font-bold text-lg uppercase tracking-wider text-left" style={{color: footerTextColor}}>{title}</h3>
                    <span className="lg:hidden transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </button>
                  <ul 
                    id={`footer-section-${sectionKey}`}
                    className={`space-y-3 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 mt-6' : 'max-h-0'} lg:max-h-none lg:mt-6`}
                  >
                    {section.map((link, index) => (
                      <li key={index}>
                        <a href={link.href} className="transition-colors duration-200 text-sm"
                           style={{color: footerLinkColor}}
                           onMouseEnter={(e) => e.currentTarget.style.color = footerLinkHoverColor}
                           onMouseLeave={(e) => e.currentTarget.style.color = footerLinkColor}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};
