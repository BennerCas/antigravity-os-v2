import copy
from typing import Any

import jsonpatch
from schemas.authoring import CommandEnvelope


class Conflict(Exception):
    pass


def apply_pure(state: dict[str, Any], cmd: dict[str, Any]) -> dict[str, Any]:
    next_state = copy.deepcopy(state)
    cmd_type = cmd.get("t")

    if cmd_type == "node.update":
        patch = cmd.get("patch", [])
        if "nodes" not in next_state.get("graph", {}):
            next_state.setdefault("graph", {})["nodes"] = []

        nodes = next_state["graph"]["nodes"]
        node_id = cmd.get("id")

        # Find the node
        node_idx = next(
            (i for i, n in enumerate(nodes) if n.get("id") == node_id), None
        )
        if node_idx is not None:
            # Apply jsonpatch
            try:
                nodes[node_idx] = jsonpatch.apply_patch(nodes[node_idx], patch)
            except (jsonpatch.JsonPatchException, jsonpatch.JsonPointerException) as e:
                raise Conflict(f"Patch failed: {e!s}")
    elif cmd_type == "graph.batch":
        ops = cmd.get("ops", [])
        for op in ops:
            next_state = apply_pure(next_state, op)

    # For now, other commands can be implemented similarly
    return next_state


def validate_invariants(state: dict[str, Any]) -> bool:
    # Example invariant: No cycle check or schema check here
    return True


def reduce_state(
    state: dict[str, Any], env: CommandEnvelope
) -> tuple[dict[str, Any], dict[str, Any] | None]:
    """Reduces the state using the command envelope."""
    if env.expected_rev != state.get("rev", 0):
        return state, {"kind": "rev_conflict", "state_rev": state.get("rev", 0)}

    try:
        next_state = apply_pure(state, env.cmd)
    except Conflict as e:
        return state, {"kind": "conflict", "message": str(e)}

    if not validate_invariants(next_state):
        return state, {"kind": "invariant_violation"}

    next_state["rev"] = state.get("rev", 0) + 1
    return next_state, None
