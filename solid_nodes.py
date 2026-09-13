with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad = '''        const geometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: node.color || "#ffffff", 
            transparent: true, 
            opacity: 0.25
        });
        const sphere = new THREE.Mesh(geometry, material);
        
        const innerGeometry = new THREE.SphereGeometry(sphereRadius * 0.8, 32, 32);
        const innerMaterial = new THREE.MeshBasicMaterial({ color: node.color || "#ffffff", transparent: false, opacity: 1.0 });
        const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
        
        group.add(sphere);
        group.add(innerSphere);'''

good = '''        const geometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: node.color || "#ffffff", 
            transparent: false, 
            opacity: 1.0
        });
        const sphere = new THREE.Mesh(geometry, material);
        
        group.add(sphere);'''

content = content.replace(bad, good)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
