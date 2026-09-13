import os
import time

for file in os.listdir('.'):
    if 'KnowledgeGraph3D' in file:
        print(file, os.path.getsize(file), time.ctime(os.path.getmtime(file)))
