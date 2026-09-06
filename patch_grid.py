import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\pages\Flows.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

old_grid = 'className="flex-1 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-6 h-full pb-6"'
new_grid = 'className="flex-1 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 grid-rows-2 gap-6 h-full pb-6"'

if old_grid in content:
    content = content.replace(old_grid, new_grid)
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content)
    print('Grid updated successfully.')
else:
    print('Could not find the target string. Please check.')
