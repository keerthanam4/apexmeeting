import os
import sys
import re

files_to_check = [
    'index.html',
    'styles.css',
    'app.js',
    'data-warehouse.js',
    'nlp-engine.js',
    'audio-processor.js',
    'export-engine.js',
    'package.json',
    'server.py'
]

dir_path = os.path.dirname(os.path.abspath(__file__))

print("Verifying ApexMeeting application files:")
all_passed = True
for fname in files_to_check:
    fpath = os.path.join(dir_path, fname)
    if not os.path.exists(fpath):
        print(f"❌ Missing: {fname}")
        all_passed = False
    else:
        size = os.path.getsize(fpath)
        print(f"✅ Found {fname} ({size:,} bytes)")

# Verify index.html contains necessary module scripts and elements
index_path = os.path.join(dir_path, 'index.html')
with open(index_path, 'r', encoding='utf-8') as f:
    content = f.read()

checks = [
    ("data-warehouse.js script tag", "data-warehouse.js" in content),
    ("nlp-engine.js script tag", "nlp-engine.js" in content),
    ("audio-processor.js script tag", "audio-processor.js" in content),
    ("export-engine.js script tag", "export-engine.js" in content),
    ("app.js script tag", "app.js" in content),
    ("Waveform canvas", 'id="canvas-waveform"' in content),
    ("Spectrum canvas", 'id="canvas-spectrum"' in content),
    ("Audio player seekbar", 'id="audio-seekbar"' in content),
    ("OLAP matrix table", 'id="olap-pivot-table"' in content),
    ("Q&A chat feed", 'id="qa-chat-feed"' in content),
    ("Hallucination guardrail", 'id="header-grounding-score"' in content),
]

for label, cond in checks:
    if cond:
        print(f"  ✓ {label}")
    else:
        print(f"  ✗ {label}")
        all_passed = False

if all_passed:
    print("\n🎉 ALL AUDIT CHECKS PASSED SUCCESSFULLY!")
else:
    print("\n⚠️ Some checks failed.")
    sys.exit(1)
