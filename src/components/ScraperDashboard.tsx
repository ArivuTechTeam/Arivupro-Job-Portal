import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, Globe, CheckCircle2, ArrowRight, Layers, FileCode, Clock, Play, Terminal, Database, ShieldAlert, Cpu } from 'lucide-react';
import { ScraperSourceStatus, ScraperLog, JobListing } from '../types/index.ts';

interface ScraperDashboardProps {
  sources: ScraperSourceStatus[];
  onTriggerScrape: (sourceId?: string) => Promise<any>;
  totalScrapedJobs: number;
}

export const ScraperDashboard: React.FC<ScraperDashboardProps> = ({
  sources,
  onTriggerScrape,
  totalScrapedJobs
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [autoScrapeInterval, setAutoScrapeInterval] = useState('15');
  const [autoScrapeEnabled, setAutoScrapeEnabled] = useState(true);
  const [logs, setLogs] = useState<ScraperLog[]>([]);
  const [customUrl, setCustomUrl] = useState('https://www.linkedin.com/jobs/search?keywords=ACCA+Fresher+Bangalore');
  const [lastScrapeResult, setLastScrapeResult] = useState<any>(null);

  // Fetch scraper logs
  const fetchLogs = () => {
    fetch('/api/scrape/logs')
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRunScraper = async (sourceId?: string) => {
    setIsRunning(true);
    setLastScrapeResult(null);
    try {
      const res = await onTriggerScrape(sourceId);
      setLastScrapeResult(res);
      fetchLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Automated Career Board Scraper Engine</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300">Finance & Commerce Role Focus</span>
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight text-white font-display">
              Automated Job Scraping & Certification Classification
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Continuously crawls external career boards (LinkedIn, Naukri, Quintedge, Big 4 portals) for finance openings. An automated parser evaluates job requisitions against ArivuPro curriculum keywords (IFRS 15, US GAAP, Ind AS, Articleship, ICAI/ACCA) and tags opportunities automatically.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="p-3 rounded bg-slate-800 border border-slate-700 text-xs">
              <div className="text-slate-400 text-[11px]">Auto-Schedule</div>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={autoScrapeInterval}
                  onChange={(e) => setAutoScrapeInterval(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                >
                  <option value="15">Every 15 min</option>
                  <option value="30">Every 30 min</option>
                  <option value="60">Every 1 hour</option>
                  <option value="360">Every 6 hours</option>
                </select>
                <button
                  onClick={() => setAutoScrapeEnabled(!autoScrapeEnabled)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold ${
                    autoScrapeEnabled
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {autoScrapeEnabled ? 'Active' : 'Paused'}
                </button>
              </div>
            </div>

            <button
              onClick={() => handleRunScraper()}
              disabled={isRunning}
              className="px-4 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Crawling Boards...' : 'Run Scraper Now'}</span>
            </button>
          </div>
        </div>

        {/* Real-time result banner */}
        {lastScrapeResult && (
          <div className="mt-5 p-3 rounded bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {lastScrapeResult.message}: Fetched and categorized <span className="font-bold text-white font-mono">{lastScrapeResult.newJobsScraped}</span> new finance positions into active directory.
              </span>
            </div>
            <span className="font-mono text-[11px] text-emerald-300">HTTP 200 OK</span>
          </div>
        )}
      </div>

      {/* Scraper Sources Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">
            Connected Career Boards & Ingestion Streams
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Total Scraped Finance Jobs: <span className="font-bold text-slate-900">{totalScrapedJobs}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((src) => (
            <div
              key={src.id}
              className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{src.name}</h4>
                  <div className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
                    {src.url}
                  </div>
                </div>

                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                  src.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {src.status}
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-50 text-xs space-y-1">
                <div className="text-slate-500 text-[11px]">Primary Ingestion Filter:</div>
                <div className="text-slate-800 font-medium text-[11px]">{src.categoryFocus}</div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500 text-[11px]">
                  Last synced: <span className="text-slate-700">{src.lastRun}</span>
                </div>
                <button
                  onClick={() => handleRunScraper(src.id)}
                  disabled={isRunning}
                  className="text-amber-800 hover:text-amber-950 font-semibold text-[11px] flex items-center gap-1"
                >
                  <span>Sync Source</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parser & Automated Certification Criteria Filter Demo */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-slate-700" />
          <h3 className="text-base font-bold text-slate-900">
            ArivuPro Automated Certification Detection & Tagging Pipeline
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          How the scraper evaluates external unstructured job descriptions and extracts ArivuPro qualifications:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">1. External Requisition Ingest</div>
            <div className="text-slate-600">
              Scrapes role titles, employer name, locations, salary range, and candidate requirements from LinkedIn, Naukri, Big 4 portals.
            </div>
          </div>

          <div className="p-3 rounded bg-amber-50/70 border border-amber-200 space-y-1.5">
            <div className="font-bold text-amber-950">2. Pattern & Course Matching</div>
            <div className="text-amber-900">
              Regex & semantic rules detect keywords: <code className="bg-white px-1 py-0.5 rounded font-mono">ACCA</code>, <code className="bg-white px-1 py-0.5 rounded font-mono">US CPA</code>, <code className="bg-white px-1 py-0.5 rounded font-mono">Articleship</code>, <code className="bg-white px-1 py-0.5 rounded font-mono">IFRS 15</code>, <code className="bg-white px-1 py-0.5 rounded font-mono">CMA</code>.
            </div>
          </div>

          <div className="p-3 rounded bg-emerald-50/70 border border-emerald-200 space-y-1.5">
            <div className="font-bold text-emerald-950">3. Taxonomy Tagging & Score</div>
            <div className="text-emerald-900">
              Maps opening directly to ArivuPro student batches, calculates fit score against candidate profiles, and injects into student portal.
            </div>
          </div>
        </div>

        {/* Custom Scrape URL Tester */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-900 mb-1.5">
            Test Custom Career Board URL Crawler
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="https://..."
            />
            <button
              onClick={() => handleRunScraper()}
              disabled={isRunning}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Crawler</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scraper Logs Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">Crawler Ingestion Logs</h3>
          </div>
          <button
            onClick={fetchLogs}
            className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh Logs</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Career Board</th>
                <th className="py-2.5 px-3">Scanned</th>
                <th className="py-2.5 px-3">Valid Finance Roles</th>
                <th className="py-2.5 px-3">Tags Applied</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                    {log.source}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700">
                    {log.scannedCount}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-slate-900">
                    {log.parsedValidCount}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(log.qualificationsDetected).map(([k, count]) => (
                        <span key={k} className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded font-mono text-slate-700">
                          {k}: {count}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
