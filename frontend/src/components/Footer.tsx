import React from 'react'
import { Link } from 'react-router-dom'
import { Compass, Instagram, Mail, MapPinned, Phone, Sparkles, Tag, Users } from 'lucide-react'

const footerColumns = [
  {
    title: 'Platform',
    links: [
      { label: 'Trip Planner', path: '/trips' },
      { label: 'Community', path: '/community' },
      { label: 'Deals', path: '/deals' },
      { label: 'Events', path: '/events' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Transport Hub', path: '/transport' },
      { label: 'Travel Agents', path: '/services' },
      { label: 'Subscription', path: '/subscription' },
      { label: 'Contact', path: '/contact' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', path: '/about' },
      { label: 'Privacy Policy', path: '/privacy-policy' },
      { label: 'Terms of Service', path: '/terms-of-service' },
      { label: 'Cookie Policy', path: '/cookie-policy' },
    ],
  },
]

export const Footer: React.FC = () => {
  return (
    <footer className="relative overflow-hidden bg-[#08111d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.16),transparent_26%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#155e75,#0f172a)] shadow-[0_16px_30px_rgba(8,15,34,0.38)]">
                <Compass className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-heading text-2xl font-semibold tracking-tight">TravelBuddy</h3>
                <p className="text-sm uppercase tracking-[0.22em] text-white/50">Smart travel decision assistant</p>
              </div>
            </div>

            <p className="mt-6 text-base leading-8 text-white/72">
              A calmer way to make travel decisions: discover where to go, use community context, and keep the useful
              trip tools close while the planner is rebuilt more simply.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
                <Sparkles className="h-5 w-5 text-sky-300" />
                <p className="mt-3 text-sm font-semibold">Planner reset</p>
                <p className="mt-1 text-sm text-white/58">We cleared the old trip module.</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
                <Users className="h-5 w-5 text-amber-300" />
                <p className="mt-3 text-sm font-semibold">Community context</p>
                <p className="mt-1 text-sm text-white/58">See how people actually travel.</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
                <Tag className="h-5 w-5 text-rose-300" />
                <p className="mt-3 text-sm font-semibold">Useful deals</p>
                <p className="mt-1 text-sm text-white/58">Save money where it matters.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">{column.title}</h4>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.path}>
                      <Link to={link.path} className="text-sm text-white/74 transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 text-sm text-white/62 sm:flex-row sm:items-center sm:gap-6">
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              drtechservicelk@gmail.com
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              +94 76 084 6996
            </span>
            <span className="flex items-center gap-2">
              <MapPinned className="h-4 w-4" />
              Sri Lanka
            </span>
          </div>

          <div className="flex items-center gap-4 text-white/56">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
              <Instagram className="h-4 w-4" />
            </a>
            <p className="text-sm">© 2026 TravelBuddy. Crafted for better trip decisions.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
