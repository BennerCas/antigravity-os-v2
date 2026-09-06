const fs = require('fs');
const path = 'backend/routers/runtime.py';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /await websocket\.send_text\(f"\[DONE\] Process exited with code \{process\.returncode\}"\)/g,
  'await websocket.send_text(f"[DONE] Process exited with code {returncode}")'
);

fs.writeFileSync(path, content, 'utf8');
