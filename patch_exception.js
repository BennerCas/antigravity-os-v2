const fs = require('fs');
const path = 'backend/routers/runtime.py';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import traceback')) {
    content = content.replace('import sys', 'import sys\nimport traceback');
}

content = content.replace(
/    except Exception as e:\n        print\(f"Error during execution: \{e\}"\)\n        try:\n            await websocket\.send_text\(f"\[SYSTEM-ERROR\] \{e\}"\)\n        except:\n            pass/g,
`    except Exception as e:
        err_msg = traceback.format_exc()
        print(f"Error during execution: {err_msg}")
        try:
            await websocket.send_text(f"[SYSTEM-ERROR] {type(e).__name__}: {str(e)}")
        except:
            pass`
);

fs.writeFileSync(path, content, 'utf8');
