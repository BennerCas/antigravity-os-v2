import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

// Mock academyApi before importing Academy component
vi.mock('../lib/academyApi', () => ({
  academyApi: {
    getProfile: vi.fn().mockResolvedValue({
      user_id: 'learner_default',
      level: 'foundation',
      current_mission_id: 'mission_01',
      completed_missions: ['mission_00'],
      diagnostic_completed: true,
      preferences: { mode: 'rigorous' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    getTracks: vi.fn().mockResolvedValue([
      {
        id: 'track_01_fundamentals',
        title: 'Fundamentos de Conexión & Grafo',
        description: 'Misiones de cableado inicial',
        category: 'graph_fundamentals',
        order: 1,
        color: '#22C55E',
        mission_count: 4
      }
    ]),
    getMissions: vi.fn().mockResolvedValue([
      {
        id: 'mission_01',
        track_id: 'track_01_fundamentals',
        sequence_order: 1,
        title: 'Primer flujo funcional',
        difficulty: 'beginner',
        estimated_minutes: 10,
        prerequisites: [],
        skills_trained: ['graph_connections'],
        problem_statement: 'Conecta el inicio con el clasificador y este al final',
        success_criteria: ['Sin nodos huérfanos'],
        rubric: [],
        hints: {
          level_1_conceptual: 'Conceptual',
          level_2_directional: 'Directional',
          level_3_structural: 'Structural',
          level_4_solution_clue: 'Clue',
          level_5_code_snippet: 'Snippet'
        },
        starter_flow: { nodes: [], edges: [] },
        solution_flow: { nodes: [], edges: [] },
        failure_scenarios: [],
        verification_suite: {}
      }
    ]),
    getUserMastery: vi.fn().mockResolvedValue([
      {
        user_id: 'learner_default',
        skill_id: 'graph_connections',
        mastery_score: 0.85,
        state: 'INDEPENDENT',
        attempts: 1,
        successes: 1,
        hints_taken: 0,
        last_evaluated_at: new Date().toISOString(),
        dimensions: {
          correctness: 0.9,
          independence: 1.0,
          transfer: 0.8,
          reliability: 0.8,
          comprehension: 0.8,
          consistency: 0.8,
          complexity: 0.8,
          safety: 0.9
        }
      }
    ]),
    getUserEvidence: vi.fn().mockResolvedValue([
      {
        id: 'ev_01',
        user_id: 'learner_default',
        mission_id: 'mission_01',
        artifact_type: 'flow_topology',
        payload: {},
        hash_sha256: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
        timestamp: new Date().toISOString()
      }
    ]),
    auditCertification: vi.fn().mockResolvedValue({ is_eligible: false, blockers: [] }),
    getSkillGraph: vi.fn().mockResolvedValue({
      nodes: [{ id: 'graph_connections', name: 'Conexión de Grafos', category: 'Topology', prerequisites: [], depth: 0 }],
      links: []
    }),
    getPortfolio: vi.fn().mockResolvedValue({
      user_id: 'learner_default',
      profile: {},
      certifications: [],
      portfolio_items: [],
      signature: 'HUMAN AI SYNERGY BY BENNER CASTILLO - 2026®'
    }),
    validateSessionFlow: vi.fn().mockResolvedValue({
      is_valid: true,
      blockers: [],
      warnings: [],
      all_findings: []
    }),
    compilePortfolio: vi.fn().mockResolvedValue({
      signature: 'HUMAN AI SYNERGY BY BENNER CASTILLO - 2026®'
    })
  }
}));

import Academy from '../pages/Academy';

describe('Antigravity Academy V3 Learning Operating System', () => {
  it('App.tsx contains lazy-loaded route for /academy', () => {
    const appPath = path.resolve(__dirname, '..', 'App.tsx');
    const source = fs.readFileSync(appPath, 'utf8');

    expect(source).toContain("import('./pages/Academy')");
    expect(source).toContain("path === '/academy'");
  });

  it('Sidebar.tsx contains Academy link with icon', () => {
    const sidebarPath = path.resolve(__dirname, '..', 'components', 'Sidebar.tsx');
    const source = fs.readFileSync(sidebarPath, 'utf8');

    expect(source).toContain("path: '/academy'");
    expect(source).toContain("label: 'Academy'");
  });

  it('renders Academy header, context indicator, and mandatory footer signature', async () => {
    render(<Academy />);

    // Check Header
    expect(screen.getAllByText(/ANTIGRAVITY ACADEMY V3/i).length).toBeGreaterThan(0);

    // Check Context Indicator
    expect(
      screen.getByText(/\[Contexto Cargado: Arquitecto_Sistemas \+ Ingeniero_Fullstack \+ Auditor_Industrial\]/i)
    ).toBeInTheDocument();

    // Wait for initial async load to finish
    await waitFor(() => {
      expect(screen.queryByText(/Sincronizando estado/i)).not.toBeInTheDocument();
    });

    // Check mandatory footer signature
    expect(screen.getByText(/HUMAN AI SYNERGY BY BENNER CASTILLO - 2026®/i)).toBeInTheDocument();
  });

  it('renders all 7 functional tabs for the Learning OS', async () => {
    render(<Academy />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Hub General/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Rutas & Misiones/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Interactive Sandbox/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Skill Graph & Mastery/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Drift Studio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Certificaciones/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Portfolio Ledger/i })).toBeInTheDocument();
  });
});
