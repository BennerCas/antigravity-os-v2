import subprocess
import os

PROMTER_DIR = r"C:\antigravityAS\HUMAN AI\External\promter"

def generate_prompt_from_preset(preset_name: str) -> str:
    """
    Calls the Promter CLI to generate a full prompt from modular concepts.
    Returns the generated markdown string.
    """
    if not preset_name:
        preset_name = "saas-landing"
        
    cli_path = os.path.join(PROMTER_DIR, "cli", "generate-site.js")
    
    if not os.path.exists(cli_path):
        return f"[MOCK] Modular concepts from Promter for preset '{preset_name}'. (Promter CLI not found at {cli_path})"
    
    try:
        # Run node cli/generate-site.js <preset> --stdout
        result = subprocess.run(
            ["node", cli_path, preset_name, "--stdout"],
            cwd=PROMTER_DIR,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error executing Promter CLI: {e.stderr}")
        return f"Error generating prompt: {e.stderr}"
    except FileNotFoundError:
        return "[MOCK] Node.js is not installed or available in PATH. Returning mock Promter concepts."
