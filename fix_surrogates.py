with open('rewrite_component.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(r"\u269B\uFE0F", "⚛️")
text = text.replace(r"\uD83D\uDCA1", "💡")
text = text.replace(r"\uD83D\uDEE0\uFE0F", "🛠️")
text = text.replace(r"\u2699\uFE0F", "⚙️")
text = text.replace(r"\uD83D\uDCD0", "📐")
text = text.replace(r"\uD83D\uDC51", "👑")

with open('rewrite_component.py', 'w', encoding='utf-8') as f:
    f.write(text)
