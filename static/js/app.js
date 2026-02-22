/**
 * Agentic Vendor Evaluation System — Frontend Application
 * Handles view routing, API communication, SSE streaming, and UI updates.
 */

// ─── State ──────────────────────────────────────────
const state = {
    currentView: 'dashboard',
    evalId: null,
    eventSource: null,
    systemInfo: null,
    rankings: null,
    requirements: null,
    logStartTime: null,
};

// ─── Initialize ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadSystemInfo();
});

// ─── View Navigation ────────────────────────────────
function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    // Show target view
    const view = document.getElementById(`view-${viewName}`);
    if (view) view.classList.add('active');

    const btn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
    if (btn) btn.classList.add('active');

    state.currentView = viewName;
}

// ─── Load System Info ───────────────────────────────
async function loadSystemInfo() {
    try {
        const res = await fetch('/api/system/info');
        const data = await res.json();
        state.systemInfo = data;

        // Update info cards
        document.getElementById('info-requirements').textContent =
            data.has_requirements ? '✓ Found' : '✗ Missing';

        document.getElementById('info-vendors').textContent =
            `${data.vendors.length} found`;

        // Populate vendor list
        const body = document.getElementById('vendor-list-body');
        if (data.vendors.length === 0) {
            body.innerHTML = '<div class="log-empty">No vendor proposals found in vendor_proposals/</div>';
            return;
        }

        const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899'];
        body.innerHTML = data.vendors.map((v, i) => `
            <div class="vendor-item">
                <div class="vendor-avatar" style="background: ${colors[i % colors.length]}">
                    ${v.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <div class="vendor-name">${v.name}</div>
                    <div class="vendor-file">${v.file}</div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Failed to load system info:', err);
    }
}

// ─── Start Evaluation ───────────────────────────────
async function startEvaluation() {
    const btn = document.getElementById('start-eval-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Starting Pipeline...';

    try {
        const res = await fetch('/api/evaluate/start', { method: 'POST' });
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || 'Failed to start evaluation');
        }

        state.evalId = data.eval_id;
        state.logStartTime = Date.now();

        // Reset pipeline UI
        resetPipelineUI();

        // Switch to progress view
        showView('progress');
        document.getElementById('progress-subtitle').textContent =
            `Evaluating ${data.vendors_total} vendors...`;

        // Start SSE stream
        connectSSE(data.eval_id);

        showToast(`Evaluation started (ID: ${data.eval_id})`);

    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
        btn.disabled = false;
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start AI Evaluation`;
    }
}

// ─── SSE Connection ─────────────────────────────────
function connectSSE(evalId) {
    if (state.eventSource) {
        state.eventSource.close();
    }

    const logContainer = document.getElementById('log-container');
    logContainer.innerHTML = '';

    state.eventSource = new EventSource(`/api/evaluate/${evalId}/stream`);

    state.eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleSSEEvent(data);
    };

    state.eventSource.onerror = () => {
        state.eventSource.close();
        const liveBadge = document.getElementById('live-badge');
        if (liveBadge) {
            liveBadge.innerHTML = '<span style="color:var(--text-muted)">ENDED</span>';
        }
    };
}

// ─── Handle SSE Events ──────────────────────────────
function handleSSEEvent(data) {
    // Add to log
    addLogEntry(data);

    // Update pipeline steps
    updatePipelineSteps(data);

    // Update progress ring
    if (data.vendors_total > 0) {
        const vendorProgress = data.vendors_completed / data.vendors_total;
        let totalProgress = 0;

        switch (data.status) {
            case 'parsing_requirements': totalProgress = 0.1; break;
            case 'evaluating_vendors': totalProgress = 0.1 + vendorProgress * 0.6; break;
            case 'generating_report': totalProgress = 0.75; break;
            case 'awaiting_review': totalProgress = 0.85; break;
            case 're_evaluating': totalProgress = 0.1 + vendorProgress * 0.6; break;
            case 'complete': totalProgress = 1.0; break;
            default: totalProgress = 0;
        }

        updateProgressRing(totalProgress);
    }

    // Handle view transitions
    if (data.status === 'awaiting_review' && data.data?.rankings) {
        state.rankings = data.data.rankings;
        renderResults(data.data.rankings);
        renderReview(data.data.rankings);

        // Enable nav buttons
        document.getElementById('nav-results').classList.add('has-badge');
        document.getElementById('nav-review').classList.add('has-badge');

        showToast('Evaluation complete! Review rankings.');
    }

    if (data.status === 'complete' || data.level === 'complete') {
        updateProgressRing(1.0);
        document.getElementById('progress-subtitle').textContent = 'Pipeline complete!';
        const liveBadge = document.getElementById('live-badge');
        if (liveBadge) {
            liveBadge.innerHTML = '<span style="color:var(--green)">COMPLETE</span>';
        }

        // Re-enable start button
        const btn = document.getElementById('start-eval-btn');
        btn.disabled = false;
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start New Evaluation`;

        if (state.eventSource) {
            state.eventSource.close();
        }

        // Fetch final results
        fetchFinalResults();
    }
}

// ─── Add Log Entry ──────────────────────────────────
function addLogEntry(data) {
    const container = document.getElementById('log-container');
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const elapsed = state.logStartTime
        ? ((Date.now() - state.logStartTime) / 1000).toFixed(1)
        : '0.0';

    const levelClass = data.level ? `log-${data.level}` : '';

    entry.innerHTML = `
        <span class="log-time">${elapsed}s</span>
        <span class="log-msg ${levelClass}">${data.message || data.status || ''}</span>
    `;

    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

// ─── Update Pipeline Steps ──────────────────────────
function updatePipelineSteps(data) {
    const steps = {
        'parsing_requirements': 'requirements',
        'evaluating_vendors': 'vendors',
        're_evaluating': 'vendors',
        'generating_report': 'ranking',
        'awaiting_review': 'review',
    };

    const activeStep = steps[data.status];
    if (!activeStep) return;

    const stepOrder = ['requirements', 'vendors', 'ranking', 'review'];
    const activeIdx = stepOrder.indexOf(activeStep);

    stepOrder.forEach((step, idx) => {
        const el = document.getElementById(`step-${step}`);
        if (!el) return;
        const icon = el.querySelector('.step-icon');

        if (idx < activeIdx) {
            icon.className = 'step-icon step-complete';
            icon.innerHTML = '✓';
        } else if (idx === activeIdx) {
            icon.className = 'step-icon step-active';
            icon.textContent = (idx + 1).toString();
        } else {
            icon.className = 'step-icon step-pending';
            icon.textContent = (idx + 1).toString();
        }
    });

    // Update vendor step description
    if (data.status === 'evaluating_vendors' || data.status === 're_evaluating') {
        const desc = document.getElementById('step-vendors-desc');
        if (desc && data.vendor) {
            desc.textContent = `Processing: ${data.vendor} (${data.vendors_completed}/${data.vendors_total})`;
        }
    }
}

// ─── Update Progress Ring ───────────────────────────
function updateProgressRing(progress) {
    const circle = document.getElementById('progress-circle');
    const pct = document.getElementById('progress-pct');
    if (!circle || !pct) return;

    const circumference = 163.36;
    const offset = circumference * (1 - progress);
    circle.style.strokeDashoffset = offset;
    pct.textContent = `${Math.round(progress * 100)}%`;
}

// ─── Reset Pipeline UI ─────────────────────────────
function resetPipelineUI() {
    const steps = ['requirements', 'vendors', 'ranking', 'review'];
    steps.forEach((step, idx) => {
        const el = document.getElementById(`step-${step}`);
        if (el) {
            const icon = el.querySelector('.step-icon');
            icon.className = 'step-icon step-pending';
            icon.textContent = (idx + 1).toString();
        }
    });

    updateProgressRing(0);
    document.getElementById('log-container').innerHTML = '';

    const liveBadge = document.getElementById('live-badge');
    if (liveBadge) {
        liveBadge.innerHTML = '<span class="live-dot"></span>LIVE';
    }

    document.getElementById('step-vendors-desc').textContent = 'Parse, audit, and score each vendor';
}

// ─── Render Results ─────────────────────────────────
function renderResults(rankings) {
    const container = document.getElementById('results-content');
    if (!rankings || rankings.length === 0) return;

    container.innerHTML = rankings.map((v, i) => {
        const rank = i + 1;
        const budget = v.budget_limit_usd || 850000;
        const overBudget = v.proposed_price_usd > budget;

        return `
        <div class="result-card rank-${rank}">
            <div class="result-rank">
                <div class="rank-number" style="color: ${rank === 1 ? 'var(--green)' : rank === 2 ? 'var(--blue)' : 'var(--amber)'}">#${rank}</div>
                <div class="rank-label">${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}</div>
            </div>
            <div class="result-main">
                <div style="display:flex;align-items:center">
                    <span class="result-vendor-name">${v.vendor_name}</span>
                    ${rank === 1 ? '<span class="recommended-badge">★ RECOMMENDED</span>' : ''}
                </div>
                <div class="result-price">
                    $${v.proposed_price_usd?.toLocaleString() || 'N/A'}
                    ${overBudget ? '<span class="over-budget"> ● OVER BUDGET</span>' : ''}
                </div>
                <div class="result-scores">
                    <div class="score-block">
                        <div class="score-label">Technical</div>
                        <div class="score-bar-bg"><div class="score-bar tech" style="width:${v.technical_score}%"></div></div>
                        <div class="score-value">${v.technical_score}/100</div>
                    </div>
                    <div class="score-block">
                        <div class="score-label">Compliance</div>
                        <div class="score-bar-bg"><div class="score-bar comply" style="width:${v.compliance_score}%"></div></div>
                        <div class="score-value">${v.compliance_score}/100</div>
                    </div>
                    <div class="score-block">
                        <div class="score-label">Price</div>
                        <div class="score-bar-bg"><div class="score-bar price" style="width:${v.price_score}%"></div></div>
                        <div class="score-value">${v.price_score}/100</div>
                    </div>
                </div>
            </div>
            <div class="result-overall">
                <div class="overall-score">${v.overall_score}</div>
                <div class="overall-label">Overall</div>
            </div>
        </div>`;
    }).join('');
}

// ─── Render Review Panel ────────────────────────────
function renderReview(rankings) {
    const container = document.getElementById('review-content');
    if (!rankings || rankings.length === 0) return;

    const budget = rankings[0]?.budget_limit_usd || 850000;

    container.innerHTML = `
        <div class="review-summary">
            <h3>Vendor Rankings Summary</h3>
            <table class="review-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Vendor</th>
                        <th>Overall</th>
                        <th>Technical</th>
                        <th>Compliance</th>
                        <th>Price Score</th>
                        <th>Quoted Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${rankings.map((v, i) => `
                        <tr>
                            <td style="font-weight:700">#${i + 1}</td>
                            <td>${v.vendor_name}</td>
                            <td style="font-weight:700;color:var(--blue)">${v.overall_score}/100</td>
                            <td>${v.technical_score}</td>
                            <td>${v.compliance_score}</td>
                            <td>${v.price_score}</td>
                            <td>$${v.proposed_price_usd?.toLocaleString() || 'N/A'}
                                ${v.proposed_price_usd > budget ? '<span style="color:var(--red);font-size:11px"> OVER</span>' : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="review-actions">
            <h3>Manager Decision</h3>
            <p>Review the rankings above. Approve to finalize, or provide feedback to re-evaluate with adjusted priorities.</p>
            <textarea class="feedback-input" id="feedback-input"
                placeholder="e.g., Prioritize the vendor with lowest cost, or Give more weight to technical compliance..."></textarea>
            <div class="review-btns">
                <button class="btn btn-success" onclick="submitReview('approve')" id="approve-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Approve Rankings
                </button>
                <button class="btn btn-outline" onclick="submitReview('feedback')" id="feedback-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                    Re-evaluate with Feedback
                </button>
            </div>
        </div>
    `;
}

// ─── Submit Review ──────────────────────────────────
async function submitReview(action) {
    if (!state.evalId) return;

    const feedback = document.getElementById('feedback-input')?.value?.trim();

    if (action === 'feedback' && !feedback) {
        showToast('Please enter feedback before re-evaluating.', 'warning');
        return;
    }

    const approveBtn = document.getElementById('approve-btn');
    const feedbackBtn = document.getElementById('feedback-btn');
    if (approveBtn) approveBtn.disabled = true;
    if (feedbackBtn) feedbackBtn.disabled = true;

    try {
        const res = await fetch(`/api/evaluate/${state.evalId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: action,
                feedback: action === 'feedback' ? feedback : null,
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to submit review');
        }

        if (action === 'approve') {
            showToast('Rankings approved! Finalizing...');
            showView('results');
        } else {
            showToast(`Re-evaluating with feedback: "${feedback}"`);
            // Reset and reconnect
            state.logStartTime = Date.now();
            resetPipelineUI();
            showView('progress');
            document.getElementById('progress-subtitle').textContent = 'Re-evaluating with adjusted priorities...';
            connectSSE(state.evalId);
        }

    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
        if (approveBtn) approveBtn.disabled = false;
        if (feedbackBtn) feedbackBtn.disabled = false;
    }
}

// ─── Fetch Final Results ────────────────────────────
async function fetchFinalResults() {
    if (!state.evalId) return;

    try {
        const res = await fetch(`/api/evaluate/${state.evalId}/status`);
        const data = await res.json();

        if (data.rankings) {
            renderResults(data.rankings);
            state.rankings = data.rankings;
        }
    } catch (err) {
        console.error('Failed to fetch final results:', err);
    }
}

// ─── Toast Notification ─────────────────────────────
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';

    const colors = {
        info: 'var(--blue)',
        success: 'var(--green)',
        warning: 'var(--amber)',
        error: 'var(--red)',
    };

    toast.style.borderLeft = `3px solid ${colors[type] || colors.info}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
}
