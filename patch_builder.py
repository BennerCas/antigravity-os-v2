import codecs
import re

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\pages\Builder.tsx'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Add templateFlow
content = content.replace(
    'const incomingPrompt = location.state?.prompt;',
    'const templateFlow = location.state?.templateFlow;\n  const incomingPrompt = location.state?.prompt;'
)

# Patch buildInitialNodes
old_nodes_logic = '''  const buildInitialNodes = (): Node[] => {
    if (incomingChain && incomingChain.length > 0) {'''
new_nodes_logic = '''  const buildInitialNodes = (): Node[] => {
    if (templateFlow && templateFlow.nodes) return templateFlow.nodes;
    if (incomingChain && incomingChain.length > 0) {'''
content = content.replace(old_nodes_logic, new_nodes_logic)

# Patch buildInitialEdges
old_edges_logic = '''  const buildInitialEdges = (): Edge[] => {
    if (incomingChain && incomingChain.length > 1) {'''
new_edges_logic = '''  const buildInitialEdges = (): Edge[] => {
    if (templateFlow && templateFlow.edges) return templateFlow.edges;
    if (incomingChain && incomingChain.length > 1) {'''
content = content.replace(old_edges_logic, new_edges_logic)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Builder patched to handle templateFlow")
