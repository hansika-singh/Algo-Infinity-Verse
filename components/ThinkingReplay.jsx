import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const ThinkingReplay = ({ problemId }) => {
  const [replayData, setReplayData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchReplay();
    return () => clearInterval(intervalRef.current);
  }, [problemId]);

  const fetchReplay = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/replay/replay/${problemId}`);
      setReplayData(response.data.data);
      if (response.data.data?.timeline) {
        setCurrentStep(0);
      }
    } catch (error) {
      console.error('Failed to fetch replay:', error);
    } finally {
      setLoading(false);
    }
  };

  const play = () => {
    if (!replayData?.timeline) return;
    setIsPlaying(true);
    const totalSteps = replayData.timeline.length;

    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          clearInterval(intervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
  };

  const pause = () => {
    setIsPlaying(false);
    clearInterval(intervalRef.current);
  };

  const reset = () => {
    pause();
    setCurrentStep(0);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm opacity-70">Analyzing thinking process...</span>
      </div>
    );
  }

  if (!replayData?.timeline?.length) {
    return (
      <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
        <p className="opacity-60">No replay data available for this problem.</p>
        <p className="text-sm opacity-50 mt-2">Solve more problems to generate replay!</p>
      </div>
    );
  }

  const currentEvent = replayData.timeline[currentStep] || replayData.timeline[0];
  const progress = ((currentStep + 1) / replayData.timeline.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          🧠 <span>Thinking Process</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            ⏮ Reset
          </button>
          {isPlaying ? (
            <button
              onClick={pause}
              className="px-3 py-1.5 text-sm rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition"
            >
              ⏸ Pause
            </button>
          ) : (
            <button
              onClick={play}
              disabled={!replayData?.timeline?.length}
              className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
            >
              ▶ Play
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-4">
        <div
          className="absolute h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Timeline Steps */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-4">
        {replayData.timeline.map((event, index) => (
          <button
            key={index}
            onClick={() => {
              pause();
              setCurrentStep(index);
            }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm transition ${
              index === currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {event.strategy || `Step ${index + 1}`}
          </button>
        ))}
      </div>

      {/* Current Step */}
      {currentEvent && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-mono opacity-60">{formatTime(currentEvent.timestamp)}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              currentEvent.strategy?.toLowerCase().includes('accepted') 
                ? 'bg-green-500 text-white'
                : currentEvent.strategy?.toLowerCase().includes('failed') || currentEvent.strategy?.toLowerCase().includes('error')
                ? 'bg-red-500 text-white'
                : currentEvent.strategy?.toLowerCase().includes('optimized')
                ? 'bg-purple-500 text-white'
                : 'bg-blue-500 text-white'
            }`}>
              {currentEvent.strategy}
            </span>
            {currentEvent.performance && (
              <span className="text-xs opacity-60">
                ⏱ {currentEvent.performance.time} | 💾 {currentEvent.performance.space}
              </span>
            )}
          </div>
          <p className="text-sm opacity-80">{currentEvent.reasoning || 'Working on solution...'}</p>
          {currentEvent.code && (
            <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded text-xs overflow-x-auto max-h-32">
              {currentEvent.code}
            </pre>
          )}
        </div>
      )}

      {/* AI Summary */}
      {replayData.reasoningSummary && (
        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            🤖 <span>AI Reasoning Summary</span>
          </h4>
          <p className="text-sm opacity-80 mt-1">{replayData.reasoningSummary}</p>
        </div>
      )}

      {/* Strategy Comparison */}
      {replayData.strategyComparison && (
        <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-sm mb-2">📊 Strategy Comparison</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <div className="p-2 bg-white dark:bg-slate-800 rounded">
              <span className="opacity-60">From</span>
              <p className="font-semibold">{replayData.strategyComparison.from}</p>
            </div>
            <div className="p-2 bg-white dark:bg-slate-800 rounded">
              <span className="opacity-60">To</span>
              <p className="font-semibold">{replayData.strategyComparison.to}</p>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <span className="opacity-60">Improvement</span>
              <p className="font-semibold text-green-600 dark:text-green-400">{replayData.strategyComparison.improvement}</p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Analysis */}
      {replayData.performanceAnalysis && (
        <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-sm mb-2">⚡ Performance Analysis</h4>
          <div className="text-sm space-y-1">
            <p><span className="opacity-60">Time:</span> {replayData.performanceAnalysis.timeComplexity}</p>
            <p><span className="opacity-60">Space:</span> {replayData.performanceAnalysis.spaceComplexity}</p>
            {replayData.performanceAnalysis.optimizations?.length > 0 && (
              <div>
                <span className="opacity-60">Optimizations:</span>
                <ul className="mt-1 space-y-1">
                  {replayData.performanceAnalysis.optimizations.map((opt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500">✅</span>
                      <span>{opt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {replayData.performanceAnalysis.suggestions?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                <span className="opacity-60">💡 Suggestions:</span>
                <ul className="mt-1 space-y-1">
                  {replayData.performanceAnalysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-yellow-500">💡</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThinkingReplay;