const fs = require('fs');
const path = 'backend/routers/flows.py';
let content = fs.readFileSync(path, 'utf8');

content += `
@router.delete("/{flow_id}")
def delete_flow(flow_id: str):
    flows = load_flows()
    filtered_flows = [f for f in flows if f.get("id") != flow_id]
    save_flows(filtered_flows)
    return {"message": "Flow deleted"}
`;

fs.writeFileSync(path, content, 'utf8');
