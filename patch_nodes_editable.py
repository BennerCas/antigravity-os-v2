import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\components\BuilderNodes.tsx'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Make MainPromptNode Editable
main_old = '''export const MainPromptNode = ({ id, data, selected }: any) => {
  const isVariant = data.isVariant;'''
main_new = '''export const MainPromptNode = ({ id, data, selected }: any) => {
  const [textContent, setTextContent] = useState(data.content || data.prompt || "");
  const isVariant = data.isVariant;'''
content = content.replace(main_old, main_new)

main_div_old = '''<div className="text-sm overflow-hidden text-ellipsis mb-4 whitespace-pre-wrap">
        {data.content || data.prompt || "No prompt provided"}
      </div>'''
main_div_new = '''<textarea 
        className="w-full h-[120px] bg-black/10 border border-transparent rounded p-2 text-sm resize-none outline-none scrollbar-none whitespace-pre-wrap"
        style={{ scrollbarWidth: 'none' }}
        value={textContent}
        onChange={(e) => {
          setTextContent(e.target.value);
          data.content = e.target.value;
        }}
        placeholder="Escribe el prompt aquí..."
      />'''
content = content.replace(main_div_old, main_div_new)


# Make ActionNode Editable
action_old = '''export const ActionNode = ({ id, data, selected }: any) => {
  const isVariant = data.isVariant;'''
action_new = '''export const ActionNode = ({ id, data, selected }: any) => {
  const [textContent, setTextContent] = useState(data.content || "");
  const isVariant = data.isVariant;'''
content = content.replace(action_old, action_new)

action_div_old = '''<div className="text-sm mb-4">
        {data.content || "Generating content..."}
      </div>'''
action_div_new = '''<textarea 
        className="w-full h-[120px] bg-black/10 border border-transparent rounded p-2 text-sm resize-none outline-none scrollbar-none whitespace-pre-wrap"
        style={{ scrollbarWidth: 'none' }}
        value={textContent}
        onChange={(e) => {
          setTextContent(e.target.value);
          data.content = e.target.value;
        }}
        placeholder="Definir acción aquí..."
      />'''
content = content.replace(action_div_old, action_div_new)


# Make LogicaNode Editable
logica_old = '''export const LogicaNode = ({ id, data, selected }: any) => {
  const isVariant = data.isVariant;'''
logica_new = '''export const LogicaNode = ({ id, data, selected }: any) => {
  const [textContent, setTextContent] = useState(data.content || "");
  const isVariant = data.isVariant;'''
content = content.replace(logica_old, logica_new)

logica_div_old = '''<div className="text-sm mb-4 whitespace-pre-wrap opacity-90">
        {data.content || "Explicación del prompt..."}
      </div>'''
logica_div_new = '''<textarea 
        className="w-full h-[100px] bg-black/10 border border-transparent rounded p-2 text-sm resize-none outline-none scrollbar-none whitespace-pre-wrap opacity-90"
        style={{ scrollbarWidth: 'none' }}
        value={textContent}
        onChange={(e) => {
          setTextContent(e.target.value);
          data.content = e.target.value;
        }}
        placeholder="Explicación o lógica..."
      />'''
content = content.replace(logica_div_old, logica_div_new)

# Also fix actionType bug in ActionNode where it used data.actionType instead of data.title
content = content.replace('{data.actionType}', '{data.title || data.actionType || "Action Node"}')

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Nodes made editable successfully")
