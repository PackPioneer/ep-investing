"use client"

import { Mail, Linkedin, Facebook } from "lucide-react"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-[#0B0F19] text-slate-300 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Brand */}
          <div>
            <h2 className="text-white text-xl font-semibold tracking-tight">
              EP Investment
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed text-sm max-w-sm">
              Backing the next generation of energy innovation. 
              Early-stage capital for climate-tech and infrastructure founders.
            </p>

            {/* Social */}
            <div className="flex gap-4 mt-6">
              <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
                <Facebook size={18} />
              </div>
              <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
                <Linkedin size={18} />
              </div>
              <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
                <Mail size={18} />
              </div>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-medium mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-slate-400 flex flex-col">
              <Link href={'/companies'} className="hover:text-white cursor-pointer transition">Companies</Link>
              <Link href={'/investors'} className="hover:text-white cursor-pointer transition">Investors</Link>
              <Link href={'/founders'} className="hover:text-white cursor-pointer transition">Founders</Link>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-medium mb-4">Resources</h4>
            <ul className="space-y-3 text-sm text-slate-400 flex flex-col">
              <Link href={'#'} className="hover:text-white cursor-pointer transition">Experts</Link>
              <Link href={'#'} className="hover:text-white cursor-pointer transition">Insights</Link>
              <Link href={'#'} className="hover:text-white cursor-pointer transition">Get Matched</Link>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 mt-14 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} EP Investment. All rights reserved. | Designed with ❤ by <Link className="hover:text-white cursor-pointer transition" href={'https://websidezone.com/'} target="_blank">Websidezone</Link></p>

          <div className="flex gap-6">
            <Link href={"/privacy-policy"} className="hover:text-white cursor-pointer transition">
              Privacy Policy
            </Link>
            <Link href={"/terms-and-conditions"} className="hover:text-white cursor-pointer transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
 