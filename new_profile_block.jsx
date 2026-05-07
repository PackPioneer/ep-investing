        {activeTab === "profile" && profileForm && (
          <div className="flex flex-col gap-4">

            {/* HEADER CARD */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
              <div className="flex items-center gap-5 mb-4">
                <div className="relative flex-shrink-0">
                  {investorLogoUrl ? (
                    <img src={investorLogoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover border border-[#e2e6ed]" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#eef1f6] border border-[#e2e6ed] flex items-center justify-center text-2xl font-semibold text-[#2d6a4f]">
                      {profile?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-semibold text-[#0f1a14]">{profile?.name || "Your Name"}</div>
                  <div className="text-sm text-[#718096]">{profile?.firm || "Your Firm"}</div>
                  {profile?.tagline && (
                    <div className="text-xs text-[#2d6a4f] italic mt-1.5 leading-relaxed">"{profile.tagline}"</div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {profile?.id && (
                    <a href={`/investors/${profile.id}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-medium border border-[#d0d6e0] text-[#4a5568] px-3 py-1.5 rounded-lg hover:bg-[#f8f9fb] transition-colors text-center">
                      View public profile →
                    </a>
                  )}
                  <button onClick={() => setEditingProfile(v => !v)}
                    className="text-xs font-semibold border border-[#2d6a4f] text-[#2d6a4f] px-3 py-1.5 rounded-lg hover:bg-[#eef1f6] transition-colors">
                    {editingProfile ? "Cancel" : "Edit profile"}
                  </button>
                </div>
              </div>

              {/* badges row */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-[#e2e6ed]">
                {profile?.investor_type && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#eef1f6] text-[#2d6a4f] border border-[#c8d8cc] font-medium">
                    {profile.investor_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                )}
                {profile?.show_contact && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    Open to inbound
                  </span>
                )}
                {profile?.accredited_investor === "yes" && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                    Accredited
                  </span>
                )}
                {profile?.location && (
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-white text-[#4a5568] border border-[#d0d6e0]">
                    {profile.location}
                  </span>
                )}
              </div>
            </div>

            {editingProfile ? (
              /* EDIT MODE */
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6 flex flex-col gap-5">

                <div>
                  <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-3">Identity</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClass}>Name</label><input value={profileForm.name} onChange={e => setProfileForm(p => ({...p, name: e.target.value}))} className={inputClass} /></div>
                    <div><label className={labelClass}>Firm</label><input value={profileForm.firm} onChange={e => setProfileForm(p => ({...p, firm: e.target.value}))} className={inputClass} /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Tagline (one-line description)</label><input value={profileForm.tagline} onChange={e => setProfileForm(p => ({...p, tagline: e.target.value}))} placeholder='e.g. "Backing climate founders at pre-seed"' className={inputClass} /></div>
                    <div><label className={labelClass}>Location</label><input value={profileForm.location} onChange={e => setProfileForm(p => ({...p, location: e.target.value}))} placeholder="San Francisco, CA" className={inputClass} /></div>
                    <div><label className={labelClass}>Point of contact</label><input value={profileForm.point_of_contact} onChange={e => setProfileForm(p => ({...p, point_of_contact: e.target.value}))} placeholder="jane@firm.com" className={inputClass} /></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e2e6ed]">
                  <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-3">Investment focus</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClass}>Focus sectors</label><input value={profileForm.focus} onChange={e => setProfileForm(p => ({...p, focus: e.target.value}))} placeholder="solar, battery storage..." className={inputClass} /></div>
                    <div><label className={labelClass}>Stage preference</label><input value={profileForm.stage} onChange={e => setProfileForm(p => ({...p, stage: e.target.value}))} placeholder="Seed, Series A..." className={inputClass} /></div>
                    <div><label className={labelClass}>Round preference</label><input value={profileForm.round_preference} onChange={e => setProfileForm(p => ({...p, round_preference: e.target.value}))} placeholder="Lead, Follow, Co-invest..." className={inputClass} /></div>
                    <div><label className={labelClass}>Check size</label><input value={profileForm.check_size} onChange={e => setProfileForm(p => ({...p, check_size: e.target.value}))} placeholder="$250K–$2M" className={inputClass} /></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e2e6ed]">
                  <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-3">Investment thesis</div>
                  <textarea rows={4} value={profileForm.thesis} onChange={e => setProfileForm(p => ({...p, thesis: e.target.value}))}
                    placeholder="What are you looking for? What makes a company a fit?"
                    className={inputClass + " resize-none"} />
                </div>

                <div className="pt-4 border-t border-[#e2e6ed]">
                  <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-3">Track record</div>
                  <label className={labelClass}>Previous investments</label>
                  <input value={profileForm.previous_investments} onChange={e => setProfileForm(p => ({...p, previous_investments: e.target.value}))} placeholder="Tesla, Form Energy..." className={inputClass} />
                </div>

                <div className="pt-4 border-t border-[#e2e6ed]">
                  <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-3">Online presence</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className={labelClass}>Website</label><input value={profileForm.website} onChange={e => setProfileForm(p => ({...p, website: e.target.value}))} placeholder="https://..." className={inputClass} /></div>
                    <div><label className={labelClass}>LinkedIn</label><input value={profileForm.linkedin} onChange={e => setProfileForm(p => ({...p, linkedin: e.target.value}))} placeholder="https://linkedin.com/in/..." className={inputClass} /></div>
                    <div><label className={labelClass}>X / Twitter</label><input value={profileForm.twitter_url} onChange={e => setProfileForm(p => ({...p, twitter_url: e.target.value}))} placeholder="https://x.com/..." className={inputClass} /></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e2e6ed]">
                  <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-3">Logo / Profile photo</div>
                  {investorLogoUrl && (
                    <img src={investorLogoUrl} alt="Logo" className="w-14 h-14 rounded-full object-cover border border-[#e2e6ed] mb-2" />
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-2 border border-[#d0d6e0] text-sm text-[#4a5568] px-4 py-2 rounded-lg hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
                    {uploadingInvestorLogo ? "Uploading..." : investorLogoUrl ? "Replace photo" : "Upload photo"}
                    <input type="file" accept="image/*" onChange={uploadInvestorLogo} className="hidden" disabled={uploadingInvestorLogo} />
                  </label>
                </div>

                <div className="pt-4 border-t border-[#e2e6ed] flex items-center gap-3">
                  <button onClick={saveProfile} disabled={savingProfile}
                    className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50">
                    {savingProfile ? "Saving..." : "Save changes"}
                  </button>
                  <button onClick={() => setEditingProfile(false)}
                    className="text-sm text-[#718096] hover:text-[#0f1a14] px-3 py-2.5">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* READ MODE */
              <>
                {/* Investment focus section */}
                {(profile?.focus || profile?.stage || profile?.round_preference || profile?.check_size) && (
                  <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
                    <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-4">Investment focus</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile?.focus && (
                        <div>
                          <div className="text-[10px] text-[#718096] uppercase tracking-wide mb-1">Focus sectors</div>
                          <div className="text-sm text-[#0f1a14]">{formatFocus(profile.focus)}</div>
                        </div>
                      )}
                      {profile?.stage && (
                        <div>
                          <div className="text-[10px] text-[#718096] uppercase tracking-wide mb-1">Stage preference</div>
                          <div className="text-sm text-[#0f1a14]">{profile.stage}</div>
                        </div>
                      )}
                      {profile?.round_preference && (
                        <div>
                          <div className="text-[10px] text-[#718096] uppercase tracking-wide mb-1">Round preference</div>
                          <div className="text-sm text-[#0f1a14]">{profile.round_preference}</div>
                        </div>
                      )}
                      {profile?.check_size && (
                        <div>
                          <div className="text-[10px] text-[#718096] uppercase tracking-wide mb-1">Check size</div>
                          <div className="text-sm text-[#0f1a14]">{profile.check_size}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Thesis */}
                {profile?.thesis && (
                  <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
                    <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-3">Investment thesis</div>
                    <div className="text-sm text-[#0f1a14] leading-relaxed">{profile.thesis}</div>
                  </div>
                )}

                {/* Previous investments */}
                {profile?.previous_investments && (
                  <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
                    <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-3">Previous investments</div>
                    <div className="text-sm text-[#0f1a14]">{profile.previous_investments}</div>
                  </div>
                )}

                {/* Online presence */}
                {(profile?.website || profile?.linkedin || profile?.twitter_url) && (
                  <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
                    <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-3">Online presence</div>
                    <div className="flex flex-col gap-2 text-sm">
                      {profile?.website && (
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-[#718096] uppercase tracking-wide font-mono inline-block w-20">Website</span>
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#2d6a4f] hover:underline">{profile.website}</a>
                        </div>
                      )}
                      {profile?.linkedin && (
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-[#718096] uppercase tracking-wide font-mono inline-block w-20">LinkedIn</span>
                          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#2d6a4f] hover:underline">{profile.linkedin}</a>
                        </div>
                      )}
                      {profile?.twitter_url && (
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-[#718096] uppercase tracking-wide font-mono inline-block w-20">X / Twitter</span>
                          <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="text-[#2d6a4f] hover:underline">{profile.twitter_url}</a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact */}
                {profile?.point_of_contact && (
                  <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
                    <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-3">Point of contact</div>
                    <div className="text-sm text-[#0f1a14]">{profile.point_of_contact}</div>
                  </div>
                )}

                {/* Empty state nudge */}
                {!profile?.focus && !profile?.thesis && !profile?.website && (
                  <div className="bg-[#eef1f6] border border-dashed border-[#c8d8cc] rounded-2xl p-6 text-center">
                    <div className="text-sm text-[#0f1a14] font-medium mb-1">Your profile is sparse</div>
                    <div className="text-xs text-[#4a5568] mb-3">Companies see what's filled out. The more complete, the better the match.</div>
                    <button onClick={() => setEditingProfile(true)}
                      className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-2 rounded-lg hover:bg-[#235a40]">
                      Complete your profile
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
