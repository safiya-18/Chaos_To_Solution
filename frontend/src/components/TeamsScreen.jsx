import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  ArrowLeft,
  Users,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  BookOpen,
  AlertCircle,
  Share2,
  X,
  Trash2
} from 'lucide-react';
import { useRouter } from '../router/Router.jsx';
import { fetchTeamsList, deleteTeamAssignment } from '../services/challengeApi.js';
import { THEMES } from '../data/mockChallenges.js';

export function TeamsScreen() {
  const { navigate } = useRouter();

  const [teams, setTeams] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Delete team state
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt' | 'teamName'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  // Selected Team for Mission Detail Modal
  const [selectedTeam, setSelectedTeam] = useState(null);

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTeamsList({
        search: searchTerm,
        theme: selectedTheme,
        sortBy,
        sortOrder,
        limit: 100
      });

      setTeams(data.teams || []);
      setTotal(data.total || 0);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'Failed to fetch registered teams.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedTheme, sortBy, sortOrder]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const [deleteOperatorToken, setDeleteOperatorToken] = useState('');

  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return;
    if (!deleteOperatorToken.trim()) {
      setDeleteError('Operator authorization token is required.');
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteTeamAssignment(teamToDelete.id || teamToDelete.challengeId, deleteOperatorToken.trim());
      setTeamToDelete(null);
      setDeleteOperatorToken('');
      if (selectedTeam && (selectedTeam.id === teamToDelete.id || selectedTeam.challengeId === teamToDelete.challengeId)) {
        setSelectedTeam(null);
      }
      await loadTeams();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete team.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Find theme config for styling badges
  const getThemeConfig = (themeName) => {
    return THEMES.find((t) => t.name.toLowerCase() === (themeName || '').toLowerCase()) || THEMES[0];
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-[#111820] flex flex-col font-sans selection:bg-yellow-300 selection:text-black">

      {/* ── TOP HEADER ── */}
      <header className="sticky top-0 z-30 bg-[#F7F3EA]/90 backdrop-blur-md border-b border-[#E2DDD6] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            id="back-to-dashboard-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#EFE9DD] border border-[#11151C]/15 font-bold text-xs sm:text-sm text-[#111820] shadow-2xs transition-all cursor-pointer active:scale-95 select-none"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            <span>Dashboard</span>
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-[#111820] flex items-center gap-2">
              <span>Team Challenge Table</span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#111820] text-white">
                {total} {total === 1 ? 'Team' : 'Teams'}
              </span>
            </h1>
          </div>
        </div>

        {/* Refresh button with timestamp */}
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="hidden sm:inline-block text-[11px] font-mono text-[#78716C]">
              Updated: {lastRefreshed}
            </span>
          )}

          <button
            type="button"
            onClick={loadTeams}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#11151C] hover:bg-[#1E2532] text-white text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 select-none shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-4">

        {/* ── FILTER & SEARCH TOOLBAR ── */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2DDD6] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 select-none">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#8C8477] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search team name or challenge topic..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#F7F3EA]/70 border border-[#11151C]/15 text-xs sm:text-sm font-semibold text-[#111820] placeholder:text-[#8C8477] placeholder:font-normal focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FFE56A]"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Theme Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#6B6358]" aria-hidden="true" />
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="h-10 px-3 rounded-xl bg-[#F7F3EA]/70 border border-[#11151C]/15 text-xs font-bold text-[#111820] focus:outline-none focus:ring-2 focus:ring-[#FFE56A]"
              >
                <option value="All">All Themes (8)</option>
                {THEMES.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#6B6358]" aria-hidden="true" />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="h-10 px-3 rounded-xl bg-[#F7F3EA]/70 border border-[#11151C]/15 text-xs font-bold text-[#111820] focus:outline-none focus:ring-2 focus:ring-[#FFE56A]"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="teamName-asc">Team Name (A-Z)</option>
                <option value="teamName-desc">Team Name (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── ERROR STATE ── */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-700 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={loadTeams}
              className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── TABLE CONTAINER ── */}
        <div className="bg-white rounded-2xl border border-[#E2DDD6] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111820] text-white text-[10.5px] uppercase tracking-[0.14em] font-black border-b border-[#111820] select-none">
                  <th className="py-3.5 px-3 text-center w-12">#</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Team Name</th>
                  <th className="py-3.5 px-3 min-w-[120px]">Theme</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Problem Statement</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Technical Restriction</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Resource</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Deliverable</th>
                  <th className="py-3.5 px-3 text-center min-w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD6]/70 text-xs">
                {isLoading && teams.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-[#78716C]">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#304DB4]" />
                      <p className="font-bold">Loading team assignments from MongoDB...</p>
                    </td>
                  </tr>
                ) : teams.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-16 text-center text-[#78716C]">
                      <Users className="w-10 h-10 text-[#8C8477]/50 mx-auto mb-2" />
                      <h3 className="text-sm font-black text-[#111820]">No teams registered yet</h3>
                      <p className="text-xs text-[#8C8477] mt-1">
                        Teams will appear here in real-time as they register on the Dashboard.
                      </p>
                    </td>
                  </tr>
                ) : (
                  teams.map((item, idx) => {
                    const themeConf = getThemeConfig(item.theme);
                    return (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-[#F7F3EA]/40 transition-colors"
                      >
                        {/* # */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-[#8C8477] text-xs">
                          {item.index || idx + 1}
                        </td>

                        {/* Team Name */}
                        <td className="py-3 px-4 font-black text-[#111820] text-sm tracking-tight">
                          <div className="flex items-center gap-1.5">
                            <span>{item.teamName}</span>
                            {item.source === 'ai' ? (
                              <span title="AI Generated">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600 inline" aria-hidden="true" />
                              </span>
                            ) : (
                              <span title="Backup Challenge">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-700 inline" aria-hidden="true" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-[#8C8477] block mt-0.5">
                            {new Date(item.generatedAt || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        {/* Theme */}
                        <td className="py-3 px-3">
                          <span
                            className="inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold border border-[#111820]/10 whitespace-nowrap shadow-2xs"
                            style={{ backgroundColor: themeConf.bgColor, color: '#111820' }}
                          >
                            {item.theme}
                          </span>
                        </td>

                        {/* Problem */}
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-[#111820] line-clamp-1">
                            {item.challenge?.problem?.title}
                          </div>
                          <div className="text-[11px] text-[#524B43] line-clamp-2 mt-0.5 leading-snug">
                            {item.challenge?.problem?.statement}
                          </div>
                        </td>

                        {/* Restriction */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#A16207] line-clamp-1">
                            {item.challenge?.restriction?.name}
                          </div>
                          <div className="text-[11px] text-[#524B43] line-clamp-2 mt-0.5 leading-snug">
                            {item.challenge?.restriction?.rule}
                          </div>
                        </td>

                        {/* Resource */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#304DB4] line-clamp-1">
                            {item.challenge?.resource?.name}
                          </div>
                          {item.challenge?.resource?.docsUrl && (
                            <a
                              href={item.challenge.resource.docsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-[#304DB4] hover:underline inline-flex items-center gap-1 mt-0.5 font-medium"
                            >
                              <span>Docs</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </td>

                        {/* Deliverable */}
                        <td className="py-3 px-4">
                          <div className="text-[11.5px] text-[#292524] line-clamp-2 font-medium leading-snug">
                            {item.challenge?.deliverable}
                          </div>
                        </td>

                        {/* Action: View Modal & Delete */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedTeam(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#F7F3EA] hover:bg-[#FFE56A] text-[#111820] font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap border border-[#11151C]/15"
                            >
                              View Mission
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setTeamToDelete(item);
                              }}
                              aria-label={`Delete ${item.teamName}`}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all cursor-pointer"
                              title="Delete Team Assignment"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* ── DETAIL MODAL ── */}
      {selectedTeam && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-team-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTeam(null);
          }}
        >
          <div className="w-full max-w-2xl max-h-[85vh] rounded-3xl bg-[#F7F3EA] border border-[#11151C]/20 shadow-2xl flex flex-col overflow-hidden text-[#111820]">
            {/* Modal Header (Pinned) */}
            <div className="flex items-start justify-between gap-3 border-b border-[#E2DDD6] px-6 sm:px-8 py-5 shrink-0 bg-[#F7F3EA]">
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#304DB4] block">
                  ASSIGNED MISSION
                </span>
                <h2 id="modal-team-title" className="text-xl sm:text-2xl font-black text-[#111820] tracking-tight mt-0.5">
                  {selectedTeam.teamName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FFE56A] text-[#111820]">
                    {selectedTeam.theme}
                  </span>
                  <span className="text-xs text-[#78716C] font-mono">
                    ID: #{selectedTeam.challengeId}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTeam(null)}
                className="p-2 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-[#111820]" />
              </button>
            </div>

            {/* 4 Pillars in Modal (Scrollable content with custom floating scrollbar) */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-5 flex flex-col gap-3.5 custom-modal-scrollbar">
              {/* Problem */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2DDD6] shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#DC2626] block">
                  01 — PROBLEM STATEMENT
                </span>
                <h4 className="text-sm font-black text-[#111820] mt-0.5">
                  {selectedTeam.challenge?.problem?.title}
                </h4>
                <p className="text-xs text-[#44403C] mt-1 leading-relaxed">
                  {selectedTeam.challenge?.problem?.statement}
                </p>
              </div>

              {/* Restriction */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2DDD6] shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#A16207] block">
                  02 — TECHNICAL RESTRICTION
                </span>
                <h4 className="text-sm font-black text-[#111820] mt-0.5">
                  {selectedTeam.challenge?.restriction?.name}
                </h4>
                <p className="text-xs text-[#44403C] mt-1 leading-relaxed">
                  {selectedTeam.challenge?.restriction?.rule}
                </p>
              </div>

              {/* Resource */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2DDD6] shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#304DB4] block">
                  03 — PRESCRIBED RESOURCE
                </span>
                <h4 className="text-sm font-black text-[#111820] mt-0.5">
                  {selectedTeam.challenge?.resource?.name} ({selectedTeam.challenge?.resource?.type})
                </h4>
                <p className="text-xs text-[#44403C] mt-1 leading-relaxed">
                  {selectedTeam.challenge?.resource?.guidance}
                </p>
                {selectedTeam.challenge?.resource?.docsUrl && (
                  <a
                    href={selectedTeam.challenge.resource.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#304DB4] hover:underline inline-flex items-center gap-1 mt-2"
                  >
                    <span>View Official Documentation</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Deliverable */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2DDD6] shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#16A34A] block">
                  04 — EXPECTED DELIVERABLE
                </span>
                <p className="text-xs font-semibold text-[#111820] mt-1 leading-relaxed">
                  {selectedTeam.challenge?.deliverable}
                </p>
              </div>
            </div>

            {/* Modal Footer (Pinned) */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-t border-[#E2DDD6] shrink-0 bg-[#F7F3EA]">
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setTeamToDelete(selectedTeam);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Delete Assignment</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTeam(null)}
                className="px-5 py-2.5 rounded-full bg-[#111820] hover:bg-[#1E2532] text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {teamToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#11151C]/15 p-6 shadow-2xl flex flex-col gap-4 text-[#111820]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="text-base font-black text-[#111820]">
                  Delete Team Assignment?
                </h3>
                <p className="text-xs text-[#78716C] mt-0.5">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#44403C] leading-relaxed bg-[#F7F3EA] p-3 rounded-xl border border-[#E2DDD6]">
              Are you sure you want to remove <strong className="text-[#111820]">"{teamToDelete.teamName}"</strong> and their challenge assignment ({teamToDelete.theme})?
            </p>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="delete-token-input" className="text-xs font-bold text-[#111820]">
                Operator Token (Required)
              </label>
              <input
                id="delete-token-input"
                type="password"
                value={deleteOperatorToken}
                onChange={(e) => setDeleteOperatorToken(e.target.value)}
                placeholder="Enter EVENT_ADMIN_TOKEN..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F3EA] border border-[#11151C]/20 text-xs font-mono text-[#111820] focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {deleteError && (
              <p className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-lg border border-red-200">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setTeamToDelete(null);
                  setDeleteOperatorToken('');
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-full bg-[#F7F3EA] hover:bg-[#EFE9DD] text-[#111820] text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Delete Team</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default TeamsScreen;
