import { API_URL } from './api';
import type {
  LearningProfile,
  Track,
  MissionDefinition,
  MissionSession,
  SkillMasteryRecord,
  SkillGraphNode,
  EvidenceRecord,
  DriftAnalysisResult,
  CertificationRecord,
  PortfolioCompilation,
  CopilotMessage,
  SimulationResult
} from '../types/academy';

const BASE = `${API_URL}/learning`;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const err = await res.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch {
      // ignore
    }
    throw new Error(`API Error [${res.status}]: ${errorDetail}`);
  }
  return res.json();
}

export const academyApi = {
  // Profiles
  async getProfile(userId: string): Promise<LearningProfile> {
    const res = await fetch(`${BASE}/profile/${encodeURIComponent(userId)}`);
    return handleResponse<LearningProfile>(res);
  },

  async updateProfile(userId: string, data: Partial<LearningProfile>): Promise<LearningProfile> {
    const res = await fetch(`${BASE}/profile/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<LearningProfile>(res);
  },

  // Catalog
  async getTracks(): Promise<Track[]> {
    const res = await fetch(`${BASE}/tracks`);
    return handleResponse<Track[]>(res);
  },

  async getMissions(trackId?: string): Promise<MissionDefinition[]> {
    const url = trackId ? `${BASE}/missions?track_id=${encodeURIComponent(trackId)}` : `${BASE}/missions`;
    const res = await fetch(url);
    return handleResponse<MissionDefinition[]>(res);
  },

  async getMission(missionId: string): Promise<MissionDefinition> {
    const res = await fetch(`${BASE}/missions/${encodeURIComponent(missionId)}`);
    return handleResponse<MissionDefinition>(res);
  },

  async getSkillGraph(): Promise<{ nodes: SkillGraphNode[]; links: any[] }> {
    const res = await fetch(`${BASE}/skills/graph`);
    return handleResponse<{ nodes: SkillGraphNode[]; links: any[] }>(res);
  },

  // Sandbox & Missions
  async startSession(userId: string, missionId: string): Promise<MissionSession> {
    const res = await fetch(`${BASE}/sandbox/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, mission_id: missionId }),
    });
    return handleResponse<MissionSession>(res);
  },

  async getSession(sessionId: string): Promise<MissionSession> {
    const res = await fetch(`${BASE}/sandbox/${encodeURIComponent(sessionId)}`);
    return handleResponse<MissionSession>(res);
  },

  async updateSessionFlow(sessionId: string, flow: any): Promise<MissionSession> {
    const res = await fetch(`${BASE}/sandbox/${encodeURIComponent(sessionId)}/flow`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flow),
    });
    return handleResponse<MissionSession>(res);
  },

  async validateSessionFlow(sessionId: string): Promise<{ is_valid: boolean; blockers: any[]; warnings: any[]; all_findings: any[] }> {
    const res = await fetch(`${BASE}/sandbox/${encodeURIComponent(sessionId)}/validate`, {
      method: 'POST',
    });
    return handleResponse<any>(res);
  },

  async runSimulation(sessionId: string, inputPayload: any = {}): Promise<SimulationResult> {
    const res = await fetch(`${BASE}/sandbox/${encodeURIComponent(sessionId)}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_payload: inputPayload }),
    });
    return handleResponse<SimulationResult>(res);
  },

  async unlockHint(sessionId: string, level: number): Promise<{ level: number; hint_text: string; penalty_warning: string }> {
    const res = await fetch(`${BASE}/sandbox/${encodeURIComponent(sessionId)}/hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level }),
    });
    return handleResponse<any>(res);
  },

  async consultCopilot(sessionId: string, userQuery: string, pedagogicalRole: string = 'socratic_guide'): Promise<CopilotMessage> {
    const res = await fetch(`${BASE}/sandbox/${encodeURIComponent(sessionId)}/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_query: userQuery, pedagogical_role: pedagogicalRole }),
    });
    return handleResponse<CopilotMessage>(res);
  },

  async injectChaos(sessionId: string, scenarioId: string): Promise<{ status: string; scenario_id: string; message: string }> {
    const res = await fetch(`${BASE}/sandbox/${encodeURIComponent(sessionId)}/chaos/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
    return handleResponse<any>(res);
  },

  async submitReflection(sessionId: string, reflectionText: string, prompt?: string): Promise<any> {
    const res = await fetch(`${BASE}/sandbox/${encodeURIComponent(sessionId)}/reflection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reflection_text: reflectionText, prompt }),
    });
    return handleResponse<any>(res);
  },

  async completeMission(sessionId: string): Promise<{ status: string; session_id: string; score: number; mastery_updates: any[] }> {
    const res = await fetch(`${BASE}/sandbox/${encodeURIComponent(sessionId)}/complete`, {
      method: 'POST',
    });
    return handleResponse<any>(res);
  },

  async cloneToWorkspace(sessionId: string): Promise<{ status: string; flow_id: string; message: string }> {
    const res = await fetch(`${BASE}/sandbox/${encodeURIComponent(sessionId)}/clone-to-workspace`, {
      method: 'POST',
    });
    return handleResponse<any>(res);
  },

  // Drift Analysis
  async compareDrift(spec: any, builderFlow: any): Promise<DriftAnalysisResult> {
    const res = await fetch(`${BASE}/drift/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spec, builder_flow: builderFlow }),
    });
    return handleResponse<DriftAnalysisResult>(res);
  },

  // Mastery & Evidence
  async getUserMastery(userId: string): Promise<SkillMasteryRecord[]> {
    const res = await fetch(`${BASE}/mastery/${encodeURIComponent(userId)}`);
    return handleResponse<SkillMasteryRecord[]>(res);
  },

  async getUserEvidence(userId: string): Promise<EvidenceRecord[]> {
    const res = await fetch(`${BASE}/evidence/${encodeURIComponent(userId)}`);
    return handleResponse<EvidenceRecord[]>(res);
  },

  // Certification
  async auditCertification(userId: string, level: string): Promise<{ is_eligible: boolean; level: string; completed_missions: number; required_missions: number; blockers: string[] }> {
    const res = await fetch(`${BASE}/certification/audit/${encodeURIComponent(userId)}/${encodeURIComponent(level)}`);
    return handleResponse<any>(res);
  },

  async issueCertification(userId: string, level: string): Promise<CertificationRecord> {
    const res = await fetch(`${BASE}/certification/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, level }),
    });
    return handleResponse<CertificationRecord>(res);
  },

  async verifyCertificate(token: string): Promise<any> {
    const res = await fetch(`${BASE}/certification/verify/${encodeURIComponent(token)}`);
    return handleResponse<any>(res);
  },

  // Portfolio
  async getPortfolio(userId: string): Promise<PortfolioCompilation> {
    const res = await fetch(`${BASE}/portfolio/${encodeURIComponent(userId)}`);
    return handleResponse<PortfolioCompilation>(res);
  },

  async compilePortfolio(userId: string): Promise<PortfolioCompilation> {
    const res = await fetch(`${BASE}/portfolio/${encodeURIComponent(userId)}/compile`, {
      method: 'POST',
    });
    return handleResponse<PortfolioCompilation>(res);
  },
};
