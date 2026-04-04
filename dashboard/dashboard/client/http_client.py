
from dotenv import load_dotenv
import requests
import os

load_dotenv()

# TODO dataclass - agent mode
URI = os.environ.get("SERVER_URL", "http://localhost:8000")
API = '/api/agent-mode'


def set_agent_mode(mode: str) -> dict:
    state_map = {
        "Call Transfer": "normal",
        "Out Of Office": "out-of-office"
    }

    mode = state_map.get(mode, "")

    if mode in state_map.values():
        body = {"mode": mode}

        response = requests.post(
            URI + API,
            json=body
        )

        response_body = response.json()["status"]

        return {
            "success": response.status_code == 200,
            "response": response_body
        }
    return {
        "success": False,
        "response": "invalid mode"
    }


def get_agent_mode() -> str:
    state_map_inv = {
        "normal": "Call Transfer",
        "out-of-office": "Out Of Office"
    }

    response = requests.get(
        URI + API
    )

    return state_map_inv.get(response.json()["mode"], "Call Transfer")
