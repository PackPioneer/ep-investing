          <form onSubmit={saveProfile} className="bg-white border border-[#e2e6ed] rounded-2xl p-7">

            <div className="text-base font-semibold text-[#0f1a14] mb-1">Profile settings</div>
            <p className="text-xs text-[#718096] mb-6">Edit how your company appears across the platform.</p>

            {/* SECTION A — IDENTITY */}
            <div className="mb-6 pb-6 border-b border-[#e2e6ed]">
              <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-4">Identity</div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Tagline</label>
                  <input type="text" placeholder='e.g. "Climate intelligence for the energy transition"' value={form.tagline || ""}
                    onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Website URL</label>
                  <input type="url" placeholder="https://yourcompany.com" value={form.url}
                    onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Description</label>
                  <textarea rows={4} placeholder="What does your company do? Who are you serving?" value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-vertical" />
                </div>
              </div>
            </div>

            {/* SECTION B — ABOUT */}
            <div className="mb-6 pb-6 border-b border-[#e2e6ed]">
              <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-4">About the company</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Founded year</label>
                  <input type="number" placeholder="2024" value={form.founding_year || ""}
                    onChange={e => setForm(p => ({ ...p, founding_year: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Company size</label>
                  <select value={form.employee_count || ""}
                    onChange={e => setForm(p => ({ ...p, employee_count: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Headquarters city</label>
                  <input type="text" placeholder="e.g. San Francisco" value={form.headquarters_city || ""}
                    onChange={e => setForm(p => ({ ...p, headquarters_city: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Headquarters country</label>
                  <input type="text" placeholder="e.g. United States" value={form.headquarters_country || ""}
                    onChange={e => setForm(p => ({ ...p, headquarters_country: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
              </div>
            </div>

            {/* SECTION C — SECTOR & BUSINESS MODEL */}
            <div className="mb-6 pb-6 border-b border-[#e2e6ed]">
              <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-4">Sector & business model</div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Funding stage</label>
                  <select value={form.funding_stage} onChange={e => setForm(p => ({ ...p, funding_stage: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                    <option value="unknown">Select stage</option>
                    <option value="pre_seed">Pre-seed</option>
                    <option value="seed">Seed</option>
                    <option value="series_a">Series A</option>
                    <option value="series_b">Series B</option>
                    <option value="series_c">Series C+</option>
                    <option value="growth">Growth</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Business model</label>
                  <select value={form.business_model} onChange={e => setForm(p => ({ ...p, business_model: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                    <option value="">Select model</option>
                    <option value="b2b">B2B</option>
                    <option value="b2c">B2C</option>
                    <option value="b2g">B2G</option>
                    <option value="mixed">Mixed</option>
                    <option value="marketplace">Marketplace</option>
                    <option value="hardware">Hardware</option>
                    <option value="services">Services</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Industry tags (comma separated)</label>
                <input type="text" placeholder="e.g. solar, hydrogen, climate-tech" value={form.industry_tags}
                  onChange={e => setForm(p => ({ ...p, industry_tags: e.target.value }))}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
              </div>
            </div>

            {/* SECTION D — SIGNALS */}
            <div className="mb-6 pb-6 border-b border-[#e2e6ed]">
              <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-3">Signals</div>
              <p className="text-xs text-[#718096] mb-4">What you're open to. These show up as badges on your public profile and help with discovery.</p>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 text-sm text-[#0f1a14] cursor-pointer">
                  <input type="checkbox" checked={form.looking_to_raise} onChange={e => setForm(p => ({ ...p, looking_to_raise: e.target.checked }))}
                    className="w-4 h-4 accent-[#2d6a4f]" />
                  <span>Looking to raise</span>
                </label>
                <label className="flex items-center gap-3 text-sm text-[#0f1a14] cursor-pointer">
                  <input type="checkbox" checked={form.is_hiring} onChange={e => setForm(p => ({ ...p, is_hiring: e.target.checked }))}
                    className="w-4 h-4 accent-[#2d6a4f]" />
                  <span>Hiring</span>
                </label>
                <label className="flex items-center gap-3 text-sm text-[#0f1a14] cursor-pointer">
                  <input type="checkbox" checked={form.seeking_partnerships} onChange={e => setForm(p => ({ ...p, seeking_partnerships: e.target.checked }))}
                    className="w-4 h-4 accent-[#2d6a4f]" />
                  <span>Seeking partnerships</span>
                </label>
              </div>
            </div>

            {/* SECTION E — ONLINE PRESENCE */}
            <div className="mb-6 pb-6 border-b border-[#e2e6ed]">
              <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-4">Online presence</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">LinkedIn URL</label>
                  <input type="url" placeholder="https://linkedin.com/company/..." value={form.linkedin_url || ""}
                    onChange={e => setForm(p => ({ ...p, linkedin_url: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">X / Twitter URL</label>
                  <input type="url" placeholder="https://x.com/..." value={form.twitter_url || ""}
                    onChange={e => setForm(p => ({ ...p, twitter_url: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
              </div>
            </div>

            {/* SECTION F — CONTACT */}
            <div className="mb-6 pb-6 border-b border-[#e2e6ed]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide">Point of contact</div>
                  <p className="text-xs text-[#718096] mt-1">Let investors contact you directly from your profile.</p>
                </div>
                <button type="button" onClick={() => setForm(p => ({ ...p, show_contact: !p.show_contact }))}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.show_contact ? 'bg-[#2d6a4f]' : 'bg-[#d0d6e0]'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.show_contact ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {form.show_contact && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Primary contact name</label>
                    <input value={form.primary_contact_name || ""} onChange={e => setForm(p => ({ ...p, primary_contact_name: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Primary contact email</label>
                    <input type="email" value={form.primary_contact_email || ""} onChange={e => setForm(p => ({ ...p, primary_contact_email: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Secondary contact name (optional)</label>
                    <input placeholder="Team member" value={form.secondary_contact_name || ""} onChange={e => setForm(p => ({ ...p, secondary_contact_name: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Secondary contact email (optional)</label>
                    <input type="email" placeholder="teammate@company.com" value={form.secondary_contact_email || ""} onChange={e => setForm(p => ({ ...p, secondary_contact_email: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={savingProfile} className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50 transition-colors">
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
              {savedProfile && <span className="text-sm text-[#2d6a4f] font-medium">Saved</span>}
            </div>
          </form>
