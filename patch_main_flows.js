const fs = require('fs');
const path = 'backend/main.py';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /from routers import execute, search, prompts, builder_actions, vault, compiler, runtime/,
  'from routers import execute, search, prompts, builder_actions, vault, compiler, runtime, flows'
);
content = content.replace(
  /app\.include_router\(runtime\.router, prefix="\/api\/v1"\)/,
  'app.include_router(runtime.router, prefix="/api/v1")\napp.include_router(flows.router)'
);

fs.writeFileSync(path, content, 'utf8');
