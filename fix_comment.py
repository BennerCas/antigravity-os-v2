with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_str = '''          {activeTab === 'info' && selectedNode && (
                {/* Próxima recomendación panel */}
                <div className="flex-none mt-auto border-t border-gray-800 p-4 bg-black">'''

good_str = '''          {/* Próxima recomendación panel */}
          {activeTab === 'info' && selectedNode && (
                <div className="flex-none mt-auto border-t border-gray-800 p-4 bg-black">'''

new_content = content.replace(bad_str, good_str)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
