
// Utility
function setProgress(percent) {
  document.getElementById('bar').style.width = percent + '%';
}

function addToHistory(summary) {
  const historyDiv = document.getElementById('history');
  const entry = document.createElement('div');
  entry.textContent = summary;
  entry.className = 'mono';
  historyDiv.prepend(entry);
}

function updateCharCount() {
  const summary = document.getElementById('summaryBox').textContent;
  document.getElementById('charCount').textContent = summary.length + ' chars';
}

// Main
document.addEventListener('DOMContentLoaded', () => {
  const summarizeBtn = document.getElementById('summarizeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const copyBtn = document.getElementById('copyBtn');
  const saveBtn = document.getElementById('saveBtn');
  const summaryBox = document.getElementById('summaryBox');
  const placeholder = document.getElementById('placeholder');
  const content = document.getElementById('content');
  const bar = document.getElementById('bar');

  // Null checks for all elements
  if (!summarizeBtn || !clearBtn || !copyBtn || !saveBtn || !summaryBox || !placeholder || !bar) {
    console.error('One or more required elements are missing from the DOM.');
    return;
  }

  summarizeBtn.addEventListener('click', () => {
    setProgress(30);
    placeholder.style.display = 'none';
    summaryBox.textContent = 'Summarizing...';
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: () => document.body.innerText,
        },
        (results) => {
          setProgress(60);
          chrome.runtime.sendMessage(
            { action: 'summarize', payload: { text: results[0].result } },
            (response) => {
              setProgress(100);
              if (chrome.runtime.lastError || !response || !response.summary) {
                summaryBox.textContent = 'Error: Could not summarize.';
                placeholder.style.display = 'block';
                setProgress(0);
                return;
              }
              summaryBox.textContent = response.summary;
              addToHistory(response.summary);
              updateCharCount();
              setTimeout(() => setProgress(0), 800);
            }
          );
        }
      );
    });
  });

  clearBtn.addEventListener('click', () => {
    summaryBox.textContent = '';
    placeholder.style.display = 'block';
    updateCharCount();
  });

  copyBtn.addEventListener('click', () => {
    const text = summaryBox.textContent;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
    });
  });

  saveBtn.addEventListener('click', () => {
    const text = summaryBox.textContent;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    saveBtn.textContent = 'Saved!';
    setTimeout(() => (saveBtn.textContent = 'Save'), 1200);
  });

  // Initial char count
  updateCharCount();
});
