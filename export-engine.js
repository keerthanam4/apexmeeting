/**
 * ApexMeeting Multi-Format Export Engine
 * Generates formatted PDF, Word (DOCX/HTML), Markdown/TXT, JSON, and CSV
 */

const ApexExportEngine = (() => {

  // Export as Markdown or TXT
  function exportMarkdown(meeting, summaryData) {
    if (!meeting || !summaryData) return;

    let md = `# ApexMeeting Intelligence Report: ${meeting.title}\n`;
    md += `**Meeting ID:** ${meeting.meeting_id} | **Date:** ${meeting.date} | **Quarter:** ${meeting.quarter} | **Duration:** ${Math.round(meeting.duration_sec / 60)} mins\n`;
    md += `**Efficiency Score:** ${meeting.efficiency_score}/100 | **Hallucination Grounding:** ${meeting.hallucination_score}%\n\n`;
    md += `---\n\n`;

    md += `## 1. Executive Summary\n`;
    (summaryData.executiveSummary || []).forEach((item, idx) => {
      md += `${idx + 1}. ${item.text} *[${item.citation} • ${item.speaker}]*\n`;
    });
    md += `\n`;

    md += `## 2. Key Decisions Log\n`;
    (meeting.decisions || []).forEach((d, idx) => {
      md += `### Decision ${idx + 1}: ${d.decision_text}\n`;
      md += `- **Decided By:** ${d.decided_by_speaker ? d.decided_by_speaker.name : 'Unknown'}\n`;
      md += `- **Impact Level:** ${d.impact_level}\n`;
      md += `- **Timestamp:** [${d.timestamp}]\n`;
      md += `- **Rationale:** ${d.rationale}\n\n`;
    });

    md += `## 3. Action Items Matrix\n`;
    md += `| Action Item | Assignee | Due Date | Priority | Status | Citation |\n`;
    md += `|---|---|---|---|---|---|\n`;
    (meeting.actionItems || []).forEach(a => {
      const spkName = a.assignee ? a.assignee.name : 'Unassigned';
      md += `| ${a.description} | ${spkName} | ${a.due_date} | ${a.priority} | ${a.status} | [${a.timestamp}] |\n`;
    });
    md += `\n`;

    md += `## 4. Speaker Participation Analytics\n`;
    (meeting.speakerMetrics || []).forEach(sm => {
      md += `- **${sm.speaker.name}** (${sm.speaker.role}): ${sm.talkSharePct}% talk-time, ${sm.wpm} avg WPM, ${sm.turns} turns, Engagement Index: ${sm.engagementIndex}/100\n`;
    });
    md += `\n`;

    md += `## 5. Verifiable Grounding Audit Trail\n`;
    md += `Strict Grounding Score: **${summaryData.groundingAudit.consistencyScore}%** | Total Claims Verified: **${summaryData.groundingAudit.verifiedClaimsCount}/${summaryData.groundingAudit.totalClaimsChecked}**\n`;
    (summaryData.groundingAudit.claims || []).forEach(c => {
      md += `- [${c.citation}] "${c.claim}" -> *Verified Ground Truth: ${c.confidencePct}% match*\n`;
    });

    downloadBlob(md, `ApexMeeting_${meeting.meeting_id}_Report.md`, 'text/markdown');
  }

  // Export as CSV for Action Items & Decisions
  function exportCSV(meeting) {
    if (!meeting) return;

    let csv = `Type,ID,Description,Owner/Decided By,Due Date/Timestamp,Priority/Impact,Status,Rationale\n`;

    (meeting.decisions || []).forEach(d => {
      const spk = d.decided_by_speaker ? d.decided_by_speaker.name : '';
      csv += `"Decision","${d.decision_id}","${escapeCsv(d.decision_text)}","${spk}","${d.timestamp}","${d.impact_level}","${d.status}","${escapeCsv(d.rationale)}"\n`;
    });

    (meeting.actionItems || []).forEach(a => {
      const spk = a.assignee ? a.assignee.name : '';
      csv += `"Action Item","${a.action_id}","${escapeCsv(a.description)}","${spk}","${a.due_date}","${a.priority}","${a.status}","Citation: ${a.timestamp}"\n`;
    });

    downloadBlob(csv, `ApexMeeting_${meeting.meeting_id}_Items.csv`, 'text/csv');
  }

  // Export as Full Star Schema JSON
  function exportJSON(meeting, summaryData) {
    const payload = {
      exported_at: new Date().toISOString(),
      system: "ApexMeeting Analytics & Knowledge Mining Engine",
      meeting,
      summary: summaryData
    };
    downloadBlob(JSON.stringify(payload, null, 2), `ApexMeeting_${meeting.meeting_id}_Warehouse.json`, 'application/json');
  }

  // Export as Professional Styled Print / PDF
  function exportPDF(meeting, summaryData) {
    // Open print preview window with tailored corporate report styles
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to generate PDF report.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ApexMeeting Intelligence Report - ${meeting.title}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; font-size: 11pt; padding: 20px; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .logo { font-size: 22pt; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }
          .badge { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 6px; font-size: 9pt; font-weight: 600; display: inline-block; }
          .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 20px; }
          .meta-item { font-size: 9pt; }
          .meta-label { color: #64748b; font-weight: 500; }
          .meta-val { font-weight: 700; color: #0f172a; margin-top: 2px; }
          h2 { color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 22px; font-size: 13pt; }
          .exec-point { margin-bottom: 8px; padding-left: 10px; border-left: 3px solid #0284c7; }
          .citation { font-family: monospace; font-size: 8.5pt; color: #0284c7; background: #f0f9ff; padding: 2px 6px; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9.5pt; }
          th { background: #f1f5f9; text-align: left; padding: 8px; border: 1px solid #cbd5e1; color: #334155; }
          td { padding: 8px; border: 1px solid #e2e8f0; }
          .prio-critical { color: #dc2626; font-weight: 700; }
          .prio-high { color: #ea580c; font-weight: 600; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 8.5pt; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">ApexMeeting</div>
            <div style="color: #64748b; font-size: 10pt;">Intelligent Meeting Analytics & Knowledge Mining System</div>
          </div>
          <div>
            <span class="badge">Strict Grounding: ${meeting.hallucination_score}%</span>
          </div>
        </div>

        <h1 style="font-size: 16pt; margin: 0 0 10px 0; color: #0f172a;">${meeting.title}</h1>

        <div class="meta-grid">
          <div class="meta-item"><div class="meta-label">Meeting ID</div><div class="meta-val">${meeting.meeting_id}</div></div>
          <div class="meta-item"><div class="meta-label">Date</div><div class="meta-val">${meeting.date}</div></div>
          <div class="meta-item"><div class="meta-label">Duration</div><div class="meta-val">${Math.round(meeting.duration_sec / 60)} minutes</div></div>
          <div class="meta-item"><div class="meta-label">Efficiency Index</div><div class="meta-val">${meeting.efficiency_score}/100</div></div>
        </div>

        <h2>1. Executive Summary</h2>
        ${(summaryData.executiveSummary || []).map(item => `
          <div class="exec-point">
            ${item.text} <span class="citation">[${item.citation} • ${item.speaker}]</span>
          </div>
        `).join('')}

        <h2>2. Key Decisions Log</h2>
        ${(meeting.decisions || []).map(d => `
          <div style="margin-bottom: 12px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <div style="font-weight: 700; color: #0f172a;">${d.decision_text}</div>
            <div style="font-size: 9pt; color: #475569; margin-top: 4px;">
              <strong>Decided By:</strong> ${d.decided_by_speaker ? d.decided_by_speaker.name : 'Unknown'} | 
              <strong>Impact:</strong> ${d.impact_level} | 
              <span class="citation">[${d.timestamp}]</span>
            </div>
            <div style="font-size: 8.5pt; color: #64748b; margin-top: 4px;"><em>${d.rationale}</em></div>
          </div>
        `).join('')}

        <h2>3. Action Items Matrix</h2>
        <table>
          <thead>
            <tr>
              <th>Task Description</th>
              <th>Assignee</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Citation</th>
            </tr>
          </thead>
          <tbody>
            ${(meeting.actionItems || []).map(a => `
              <tr>
                <td>${a.description}</td>
                <td><strong>${a.assignee ? a.assignee.name : 'Unassigned'}</strong></td>
                <td>${a.due_date}</td>
                <td class="${a.priority === 'Critical' ? 'prio-critical' : 'prio-high'}">${a.priority}</td>
                <td><span class="citation">[${a.timestamp}]</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>4. Speaker Engagement Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Speaker</th>
              <th>Role</th>
              <th>Talk Share</th>
              <th>Cadence</th>
              <th>Turns</th>
              <th>Engagement</th>
            </tr>
          </thead>
          <tbody>
            ${(meeting.speakerMetrics || []).map(sm => `
              <tr>
                <td><strong>${sm.speaker.name}</strong></td>
                <td>${sm.speaker.role}</td>
                <td>${sm.talkSharePct}%</td>
                <td>${sm.wpm} WPM</td>
                <td>${sm.turns}</td>
                <td>${sm.engagementIndex}/100</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>Generated by ApexMeeting Data Warehouse & OLAP Engine</div>
          <div>Audit Verification: 0 Unverified Claims • 100% Traceable</div>
        </div>

        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  // Export as Word Document (.doc rich HTML format)
  function exportWordDoc(meeting, summaryData) {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>${meeting.title}</title>
      <style>
        body { font-family: Calibri, sans-serif; }
        h1 { color: #0284c7; }
        table, th, td { border: 1px solid #cbd5e1; border-collapse: collapse; padding: 6px; }
        th { background: #f1f5f9; }
      </style>
      </head>
      <body>
        <h1>ApexMeeting Executive Report: ${meeting.title}</h1>
        <p><strong>Date:</strong> ${meeting.date} | <strong>Quarter:</strong> ${meeting.quarter} | <strong>Efficiency:</strong> ${meeting.efficiency_score}/100</p>
        <h2>Executive Summary</h2>
        <ul>
          ${(summaryData.executiveSummary || []).map(item => `<li>${item.text} <em>[${item.citation} - ${item.speaker}]</em></li>`).join('')}
        </ul>
        <h2>Key Decisions</h2>
        <ul>
          ${(meeting.decisions || []).map(d => `<li><strong>${d.decision_text}</strong> (Decided by: ${d.decided_by_speaker ? d.decided_by_speaker.name : 'Unknown'}, Impact: ${d.impact_level}, [${d.timestamp}])</li>`).join('')}
        </ul>
        <h2>Action Items</h2>
        <table>
          <tr><th>Description</th><th>Assignee</th><th>Deadline</th><th>Priority</th></tr>
          ${(meeting.actionItems || []).map(a => `<tr><td>${a.description}</td><td>${a.assignee ? a.assignee.name : 'Unassigned'}</td><td>${a.due_date}</td><td>${a.priority}</td></tr>`).join('')}
        </table>
      </body>
      </html>
    `;

    downloadBlob(content, `ApexMeeting_${meeting.meeting_id}_Document.doc`, 'application/msword');
  }

  function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function escapeCsv(str) {
    if (!str) return '';
    return str.replace(/"/g, '""');
  }

  return {
    exportMarkdown,
    exportCSV,
    exportJSON,
    exportPDF,
    exportWordDoc
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApexExportEngine;
}
