// modules/thinkingReplay.js
export class ThinkingReplay {
    constructor(containerId, problemId) {
        this.container = document.getElementById(containerId);
        this.problemId = problemId;
        this.replayData = null;
        this.currentStep = 0;
        this.isPlaying = false;
        this.intervalId = null;
        this.init();
    }

    async init() {
        await this.fetchReplay();
        this.render();
    }

    async fetchReplay() {
        try {
            const response = await fetch(`/api/replay/replay/${this.problemId}`);
            const data = await response.json();
            this.replayData = data.data;
            if (this.replayData?.timeline) {
                this.currentStep = 0;
            }
        } catch (error) {
            console.error('Failed to fetch replay:', error);
        }
    }

    render() {
        if (!this.container) return;
        
        if (!this.replayData?.timeline?.length) {
            this.container.innerHTML = `
                <div class="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                    <p class="opacity-60">No replay data available for this problem.</p>
                    <p class="text-sm opacity-50 mt-2">Solve more problems to generate replay!</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = this.getHTML();
        this.bindEvents();
        this.updateStep();
    }

    getHTML() {
        const currentEvent = this.replayData.timeline[this.currentStep] || this.replayData.timeline[0];
        const progress = ((this.currentStep + 1) / this.replayData.timeline.length) * 100;

        return `
            <div class="w-full max-w-4xl mx-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold flex items-center gap-2">
                        🧠 <span>Thinking Process</span>
                    </h3>
                    <div class="flex gap-2">
                        <button onclick="window.thinkingReplay.reset()" class="px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                            ⏮ Reset
                        </button>
                        <button id="playBtn" class="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
                            ▶ Play
                        </button>
                    </div>
                </div>

                <div class="relative w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-4">
                    <div class="absolute h-full bg-blue-500 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                </div>

                <div class="flex overflow-x-auto gap-2 pb-2 mb-4" id="stepButtons">
                    ${this.replayData.timeline.map((event, index) => `
                        <button class="step-btn flex-shrink-0 px-3 py-1.5 rounded-lg text-sm transition ${index === this.currentStep ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}" data-index="${index}">
                            ${event.strategy || `Step ${index + 1}`}
                        </button>
                    `).join('')}
                </div>

                <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3">
                    <div class="flex items-center gap-3 flex-wrap">
                        <span class="text-sm font-mono opacity-60">${this.formatTime(currentEvent.timestamp)}</span>
                        <span class="px-3 py-1 rounded-full text-xs font-semibold ${this.getStrategyClass(currentEvent.strategy)}">
                            ${currentEvent.strategy}
                        </span>
                        ${currentEvent.performance ? `
                            <span class="text-xs opacity-60">
                                ⏱ ${currentEvent.performance.time} | 💾 ${currentEvent.performance.space}
                            </span>
                        ` : ''}
                    </div>
                    <p class="text-sm opacity-80">${currentEvent.reasoning || 'Working on solution...'}</p>
                    ${currentEvent.code ? `
                        <pre class="mt-2 p-3 bg-slate-900 text-slate-100 rounded text-xs overflow-x-auto max-h-32">${currentEvent.code}</pre>
                    ` : ''}
                </div>

                ${this.replayData.reasoningSummary ? `
                    <div class="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                        <h4 class="font-semibold text-sm flex items-center gap-2">🤖 <span>AI Reasoning Summary</span></h4>
                        <p class="text-sm opacity-80 mt-1">${this.replayData.reasoningSummary}</p>
                    </div>
                ` : ''}

                ${this.replayData.strategyComparison ? `
                    <div class="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <h4 class="font-semibold text-sm mb-2">📊 Strategy Comparison</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                            <div class="p-2 bg-white dark:bg-slate-800 rounded">
                                <span class="opacity-60">From</span>
                                <p class="font-semibold">${this.replayData.strategyComparison.from}</p>
                            </div>
                            <div class="p-2 bg-white dark:bg-slate-800 rounded">
                                <span class="opacity-60">To</span>
                                <p class="font-semibold">${this.replayData.strategyComparison.to}</p>
                            </div>
                            <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                <span class="opacity-60">Improvement</span>
                                <p class="font-semibold text-green-600 dark:text-green-400">${this.replayData.strategyComparison.improvement}</p>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    bindEvents() {
        // Play button
        const playBtn = this.container.querySelector('`#playBtn`');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.togglePlay());
        }

        // Step buttons
        this.container.querySelectorAll('.step-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.pause();
                this.currentStep = parseInt(btn.dataset.index);
                this.updateStep();
            });
        });
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (!this.replayData?.timeline) return;
        this.isPlaying = true;
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.textContent = '⏸ Pause';

        this.intervalId = setInterval(() => {
            if (this.currentStep >= this.replayData.timeline.length - 1) {
                this.pause();
                return;
            }
            this.currentStep++;
            this.updateStep();
        }, 2000);
    }

    pause() {
        this.isPlaying = false;
        clearInterval(this.intervalId);
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.textContent = '▶ Play';
    }

    reset() {
        this.pause();
        this.currentStep = 0;
        this.updateStep();
    }

    updateStep() {
        this.container.innerHTML = this.getHTML();
        this.bindEvents();
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getStrategyClass(strategy) {
        if (!strategy) return 'bg-blue-500 text-white';
        const s = strategy.toLowerCase();
        if (s.includes('accepted')) return 'bg-green-500 text-white';
        if (s.includes('failed') || s.includes('error')) return 'bg-red-500 text-white';
        if (s.includes('optimized')) return 'bg-purple-500 text-white';
        return 'bg-blue-500 text-white';
    }
}
