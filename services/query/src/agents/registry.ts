import { AgentCapability, AgentId } from './types.js';

export class AgentRegistry {
    private static agents: Map<AgentId, AgentCapability> = new Map([
        [
            'policy-agent',
            {
                id: 'policy-agent',
                name: 'Enterprise Policy Agent',
                description: 'Specializes in corporate rules, HR guidelines, travel expenses, hotel allowances, and remote work policies.',
                domain: ['finance', 'hr', 'travel', 'remote-work', 'expense', 'reimbursement', 'leave'],
                supportedTools: ['search_documents', 'get_document']
            }
        ],
        [
            'knowledge-agent',
            {
                id: 'knowledge-agent',
                name: 'Technical Knowledge Agent',
                description: 'Specializes in engineering architecture, security protocols, API references, handbook guidelines, and IT operations.',
                domain: ['engineering', 'security', 'it', 'architecture', 'infrastructure', 'compliance', 'handbook'],
                supportedTools: ['search_documents', 'get_document', 'list_documents']
            }
        ]
    ]);

    public static getAgent(id: AgentId): AgentCapability | undefined {
        return this.agents.get(id);
    }

    public static getAllAgents(): AgentCapability[] {
        return Array.from(this.agents.values());
    }

    public static findAgentForDomain(domainKeyword: string): AgentCapability | undefined {
        const lower = domainKeyword.toLowerCase();
        for (const agent of this.agents.values()) {
            if (agent.domain.some((d) => lower.includes(d) || d.includes(lower))) {
                return agent;
            }
        }
        return undefined;
    }
}