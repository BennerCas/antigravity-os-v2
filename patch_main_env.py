import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\backend\main.py'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

new_content = "import os\nimport dotenv\ndotenv.load_dotenv(r'C:\\antigravityAS\\BennerAI\\.env')\n" + content

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(new_content)
