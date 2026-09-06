import asyncio
from backend.routers.execute import execute_task_endpoint, TaskNodeExecuteRequest, NodeData, EdgeData

async def test():
    # Scenario 1: Bare nodes
    req1 = TaskNodeExecuteRequest(
        task_description="A test",
        nodes=[NodeData(id="1", title="Bare Node", content="", role="Default Agent")],
        edges=[]
    )
    res1 = await execute_task_endpoint(req1)
    
    # Scenario 2: Expert nodes
    req2 = TaskNodeExecuteRequest(
        task_description="A test",
        nodes=[NodeData(id="1", title="Expert Node", content="This is a very long and detailed prompt that exceeds thirty characters for sure.", role="Security Expert")],
        edges=[]
    )
    res2 = await execute_task_endpoint(req2)
    
    return res1.updated_nodes[0].content, res2.updated_nodes[0].content

import os
import dotenv
dotenv.load_dotenv(r"C:\antigravityAS\BennerAI\.env")

async def run():
    out1, out2 = await test()
    print("Bare Node Result length:", len(out1))
    print("Expert Node Result:", out2)

asyncio.run(run())
