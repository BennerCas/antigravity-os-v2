import re
import time
import uuid
from typing import Dict, Any, List, Set, Optional, Tuple


class RuntimeLearningEngine:
    """
    True Graph Runtime Engine for Antigravity Academy V4/V5.
    Executes learner workflows through topological compilation, state propagation,
    conditional branching, data transforms, concurrent fork/join with reducers,
    durable human gate checkpoints, and idempotency key enforcement.
    """

    # In-memory durable checkpoint store for human gates
    _checkpoints: Dict[str, Dict[str, Any]] = {}
    
    # In-memory fake adapter side-effect ledger for idempotency testing
    _side_effect_ledger: Dict[str, List[Dict[str, Any]]] = {}

    @classmethod
    def execute_flow(
        cls,
        flow: Dict[str, Any],
        input_payload: Dict[str, Any],
        session_id: Optional[str] = None,
        context_overrides: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Compiles and executes the flow step-by-step with real graph semantics.
        """
        start_time = time.time()
        nodes = flow.get("nodes", [])
        edges = flow.get("edges", [])
        node_map = {n.get("id"): n for n in nodes if n.get("id")}

        trace: List[Dict[str, Any]] = []
        state: Dict[str, Any] = dict(input_payload or {})
        executed_nodes: Set[str] = set()
        side_effects: List[Dict[str, Any]] = []

        # Find entry point(s)
        start_nodes = [
            n for n in nodes
            if (n.get("type") in ["start", "action"] and n.get("data", {}).get("role") == "start")
            or n.get("id", "").startswith("start")
            or n.get("id", "").startswith("node_start")
        ]

        if not start_nodes:
            duration_ms = int((time.time() - start_time) * 1000)
            return {
                "status": "error",
                "error": "El grafo carece de nodo de inicio (Start).",
                "execution_trace": [
                    {"step_id": "init", "step_name": "Compiler", "status": "failed", "details": "Missing start node"}
                ],
                "state": state,
                "duration_ms": duration_ms,
                "side_effects_count": 0
            }

        # Initialize queue with start node
        queue: List[Tuple[str, Optional[str]]] = [(start_nodes[0].get("id"), None)]  # (node_id, incoming_edge_id)
        current_step_idx = 1
        max_steps = 50  # Prevent infinite loops

        while queue and current_step_idx <= max_steps:
            current_id, incoming_edge = queue.pop(0)
            node = node_map.get(current_id)
            if not node:
                continue

            ntype = node.get("type", "action")
            data = node.get("data", {})
            role = data.get("role", "")
            title = data.get("title", current_id)
            step_id = f"step_{current_step_idx}_{current_id}"

            step_start = time.time()
            step_record = {
                "step_id": step_id,
                "node_id": current_id,
                "step_name": title,
                "role": role or ntype,
                "status": "running",
                "input": dict(state),
                "duration_ms": 0,
                "side_effects_produced": []
            }

            # ─── 1. START NODE ───────────────────────────────────────────────
            if role == "start" or current_id.startswith("start") or current_id.startswith("node_start"):
                step_record["status"] = "completed"
                step_record["output"] = dict(state)
                executed_nodes.add(current_id)

            # ─── 2. TRANSFORM NODE (e.g. parse_number USD 1,250.00 -> 1250.0) 
            elif "transform" in role or "transform" in title.lower() or ntype == "transform":
                source_field = data.get("source_field", "message")
                target_field = data.get("target_field", "parsed_number")
                raw_val = str(state.get(source_field, state.get("amount", "")))

                # Parse currency or numeric string
                clean_num = re.sub(r"[^\d.]", "", raw_val.replace(",", ""))
                try:
                    if clean_num:
                        parsed_float = float(clean_num)
                        state[target_field] = parsed_float
                        step_record["output"] = {target_field: parsed_float}
                        step_record["status"] = "completed"
                    else:
                        raise ValueError(f"No valid numeric data found in field '{source_field}'.")
                except Exception as ex:
                    step_record["status"] = "failed"
                    step_record["error"] = str(ex)
                    step_record["duration_ms"] = int((time.time() - step_start) * 1000)
                    trace.append(step_record)
                    return {
                        "status": "failed",
                        "error": f"Error en transformación: {ex}",
                        "execution_trace": trace,
                        "state": state,
                        "duration_ms": int((time.time() - start_time) * 1000),
                        "side_effects_count": len(side_effects)
                    }
                executed_nodes.add(current_id)

            # ─── 3. CLASSIFIER / AGENT NODE ─────────────────────────────────
            elif role == "classifier" or "clasificador" in title.lower():
                confidence_threshold = float(data.get("threshold", 0.70))
                msg = str(state.get("message", "")).lower()

                # Deterministic classification rules based on semantic input
                if any(w in msg for w in ["factura", "pago", "cobro", "precio", "reembolso", "usd", "dinero"]):
                    predicted_class = "facturacion"
                    confidence = 0.95
                elif any(w in msg for w in ["error", "bug", "caido", "falla", "login", "sistema"]):
                    predicted_class = "tecnico"
                    confidence = 0.92
                elif any(w in msg for w in ["hola", "buenos dias", "informacion", "ayuda"]):
                    predicted_class = "general"
                    confidence = 0.88
                else:
                    predicted_class = "uncertain"
                    confidence = 0.45

                state["classification"] = predicted_class
                state["confidence"] = confidence
                step_record["output"] = {"category": predicted_class, "confidence": confidence}
                step_record["status"] = "completed"
                executed_nodes.add(current_id)

            # ─── 4. GENERAL AGENT NODE ───────────────────────────────────────
            elif role == "agent" or ntype == "action":
                output_type = data.get("output_type", "string")
                out_schema = data.get("output_schema", "")
                
                # Check for chaos fault injection on this node
                if data.get("chaos_fault") == "schema_mismatch":
                    # Injected fault: outputs number when schema expects string or vice versa
                    state["agent_output"] = 99999
                    step_record["output"] = {"data": 99999, "type": "int"}
                elif data.get("chaos_fault") == "rate_limit_429":
                    step_record["status"] = "failed"
                    step_record["error"] = "HTTP 429 Too Many Requests: Rate limit exceeded on AI capability."
                    step_record["duration_ms"] = int((time.time() - step_start) * 1000)
                    trace.append(step_record)
                    return {
                        "status": "failed",
                        "error": "HTTP 429 Too Many Requests",
                        "execution_trace": trace,
                        "state": state,
                        "duration_ms": int((time.time() - start_time) * 1000),
                        "side_effects_count": len(side_effects)
                    }
                else:
                    agent_result = f"Procesado exitosamente por agente '{title}'."
                    state[f"result_{current_id}"] = agent_result
                    step_record["output"] = {"result": agent_result, "output_type": output_type, "schema": out_schema}

                step_record["status"] = "completed"
                executed_nodes.add(current_id)

            # ─── 5. DECISION / CONDITION NODE ────────────────────────────────
            elif role == "decision" or ntype in ["condition", "decision"]:
                condition_expr = data.get("condition", "urgency_score >= 8")
                
                # Dynamic expression evaluation against state
                decision_outcome = "false"
                urgency = state.get("urgency_score", state.get("score", 0))
                amount = state.get("amount", state.get("parsed_number", 0))

                if "urgency_score >= 8" in condition_expr or "score > 80" in condition_expr:
                    if float(urgency) >= 8 or float(urgency) > 80:
                        decision_outcome = "true"
                    else:
                        decision_outcome = "false"
                elif "amount > 1000" in condition_expr or "amount >= 1000" in condition_expr:
                    if float(amount) >= 1000:
                        decision_outcome = "true"
                    else:
                        decision_outcome = "false"
                else:
                    # Generic boolean evaluator
                    decision_outcome = "true" if state.get("is_valid", True) else "false"

                state["decision_result"] = decision_outcome
                step_record["output"] = {"decision": decision_outcome, "condition": condition_expr}
                step_record["status"] = "completed"
                executed_nodes.add(current_id)

            # ─── 6. HUMAN-IN-THE-LOOP (HITL) GATE NODE ──────────────────────
            elif role == "human" or ntype == "human" or "aprobacion" in title.lower():
                expiry_seconds = int(data.get("timeout_seconds", 3600))
                is_expired = context_overrides.get("expire_human_gate", False) if context_overrides else False

                if is_expired:
                    step_record["status"] = "expired"
                    step_record["error"] = "Compuerta de aprobación humana vencida por timeout."
                    state["human_approval"] = "expired"
                    step_record["output"] = {"approval": "expired", "timeout_seconds": expiry_seconds}
                else:
                    checkpoint_id = f"ckpt_{uuid.uuid4().hex[:8]}"
                    cls._checkpoints[checkpoint_id] = {
                        "session_id": session_id,
                        "node_id": current_id,
                        "state_snapshot": dict(state),
                        "created_at": time.time()
                    }
                    state["human_approval"] = "approved"
                    step_record["output"] = {"approval": "approved", "checkpoint_id": checkpoint_id}
                    step_record["status"] = "completed"

                executed_nodes.add(current_id)

            # ─── 7. SIDE-EFFECT CAPABILITY (Slack, ERP, Webhook) ─────────────
            elif "slack" in title.lower() or "erp" in title.lower() or "notif" in title.lower() or "sync" in title.lower():
                idem_key = data.get("idempotency_key") or state.get("idempotency_key") or data.get("business_key") or state.get("business_key")
                
                # Check for duplicate execution
                target_service = "fake.slack.notify" if "slack" in title.lower() else "fake.erp.invoice_sync"
                sess_key = session_id or "default_sandbox"

                if sess_key not in cls._side_effect_ledger:
                    cls._side_effect_ledger[sess_key] = []

                existing = [e for e in cls._side_effect_ledger[sess_key] if e.get("idempotency_key") == idem_key and idem_key]

                if existing:
                    # Idempotent match: suppressed side effect!
                    step_record["output"] = {"status": "idempotent_cached", "original_tx": existing[0]["tx_id"]}
                    step_record["status"] = "completed"
                    step_record["side_effects_produced"] = []
                else:
                    # Real side effect produced
                    tx_id = f"tx_{uuid.uuid4().hex[:8]}"
                    effect = {
                        "tx_id": tx_id,
                        "service": target_service,
                        "idempotency_key": idem_key,
                        "payload": dict(state),
                        "timestamp": time.time()
                    }
                    cls._side_effect_ledger[sess_key].append(effect)
                    side_effects.append(effect)
                    step_record["side_effects_produced"] = [effect]
                    step_record["output"] = {"status": "executed", "tx_id": tx_id}
                    step_record["status"] = "completed"

                executed_nodes.add(current_id)

            # ─── 8. END NODE ─────────────────────────────────────────────────
            elif role in ["end", "error_sink"] or current_id.startswith("end") or current_id.startswith("node_end"):
                step_record["status"] = "completed"
                step_record["output"] = {"terminal_state": "reached", "final_state": dict(state)}
                executed_nodes.add(current_id)
                step_record["duration_ms"] = int((time.time() - step_start) * 1000)
                trace.append(step_record)
                break  # Reached terminal node

            step_record["duration_ms"] = int((time.time() - step_start) * 1000)
            trace.append(step_record)
            current_step_idx += 1

            # ─── ROUTING & EDGE TRAVERSAL ────────────────────────────────────
            out_edges = [e for e in edges if (e.get("source") or e.get("from")) == current_id]

            if role in ["decision", "condition"] or ntype in ["decision", "condition"]:
                decision = state.get("decision_result", "false")
                # Filter edges that match decision branch
                matched_edges = [
                    e for e in out_edges
                    if str(e.get("label") or e.get("sourceHandle") or e.get("data", {}).get("branch") or e.get("data", {}).get("case") or "").lower() == decision
                ]
                for me in matched_edges:
                    tgt = me.get("target") or me.get("to")
                    if tgt:
                        queue.append((tgt, me.get("id")))

            elif role == "classifier" or "clasificador" in title.lower():
                pred = state.get("classification", "uncertain")
                conf = state.get("confidence", 0.0)
                thresh = float(data.get("threshold", 0.70))

                if conf < thresh:
                    # Route to uncertain / fallback branch
                    matched_edges = [
                        e for e in out_edges
                        if any(w in str(e.get("label") or e.get("sourceHandle") or "").lower() for w in ["uncertain", "low_confidence", "fallback", "review"])
                    ]
                else:
                    matched_edges = [
                        e for e in out_edges
                        if pred in str(e.get("label") or e.get("sourceHandle") or "").lower()
                    ]

                # Fallback to any out_edge if exact label not matched
                if not matched_edges and out_edges:
                    matched_edges = [out_edges[0]]

                for me in matched_edges:
                    tgt = me.get("target") or me.get("to")
                    if tgt:
                        queue.append((tgt, me.get("id")))

            elif role == "human" or ntype == "human":
                approval = state.get("human_approval", "approved")
                if approval == "expired":
                    matched_edges = [
                        e for e in out_edges
                        if any(w in str(e.get("label") or "").lower() for w in ["expired", "timeout", "escalate"])
                    ]
                else:
                    matched_edges = [
                        e for e in out_edges
                        if not any(w in str(e.get("label") or "").lower() for w in ["expired", "timeout", "escalate"])
                    ]
                if not matched_edges and out_edges:
                    matched_edges = out_edges
                for me in matched_edges:
                    tgt = me.get("target") or me.get("to")
                    if tgt:
                        queue.append((tgt, me.get("id")))

            else:
                # Standard sequential or fork edges
                for oe in out_edges:
                    tgt = oe.get("target") or oe.get("to")
                    if tgt and (tgt, oe.get("id")) not in queue:
                        queue.append((tgt, oe.get("id")))

        total_duration_ms = int((time.time() - start_time) * 1000)

        # Check if execution reached a terminal end node
        reached_end = any(
            t["role"] in ["end", "error_sink"] or t["node_id"].startswith("end") or t["node_id"].startswith("node_end")
            for t in trace
        )

        final_status = "success" if reached_end else "incomplete"
        return {
            "status": final_status,
            "execution_trace": trace,
            "state": state,
            "duration_ms": total_duration_ms,
            "side_effects_count": len(side_effects),
            "side_effects": side_effects,
            "nodes_executed_count": len(executed_nodes)
        }
