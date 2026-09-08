import re

with open("src/index.css", "r", encoding="utf-8") as f:
    css = f.read()

blue_card_css = """
/* =====================================================
   ACTIVE CARD BLUE — dark blue selected state
   ===================================================== */
.active-card-blue {
  background-color: #0b1120 !important; /* Very dark blue */
  background-image: none !important;
  border: 1px solid #1e3a8a !important; /* Blue 900 */
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.active-card-blue h1,
.active-card-blue h2,
.active-card-blue h3,
.active-card-blue h4,
.active-card-blue p,
.active-card-blue span:not(.active-card-exempt),
.active-card-blue label {
  color: #93c5fd !important; /* Blue 300 */
  transition: color 0.2s ease;
}

.active-card-blue button,
.active-card-blue .active-card-exempt {
  background-color: #151515 !important;
  border-color: #2A2A2A !important;
  color: #FFFFFF !important;
}
"""

# Insert it after the existing .active-card block
css = css.replace(".active-card .active-card-exempt {\n  background-color: #151515 !important;\n  border-color: #2A2A2A !important;\n  color: #FFFFFF !important;\n}", 
                  ".active-card .active-card-exempt {\n  background-color: #151515 !important;\n  border-color: #2A2A2A !important;\n  color: #FFFFFF !important;\n}\n" + blue_card_css)

with open("src/index.css", "w", encoding="utf-8") as f:
    f.write(css)

print("CSS updated!")

