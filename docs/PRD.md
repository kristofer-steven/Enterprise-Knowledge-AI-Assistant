# Product Requirements Document (PRD)
# Enterprise Knowledge AI Assistant

**Document Status:** Draft  
**Version:** 0.1  
**Project Type:** Portfolio / Technical Demonstration  
**Primary Goal:** Demonstrate a production-oriented implementation of RAG, MCP, A2A, workflow orchestration, and vector database technology.

---

## 1. Product Overview

### 1.1 Product Name

**Enterprise Knowledge AI Assistant**

Alternative names:

- KnowledgeFlow AI
- Enterprise RAG Assistant
- AgentKnowledge
- AI Knowledge Hub

### 1.2 Product Summary

Enterprise Knowledge AI Assistant is a full-stack AI application that allows users to ask questions against a company knowledge base.

The system uses:

- **RAG** for retrieving relevant information from documents.
- **Pinecone** as the vector database.
- **MCP** as the standardized interface between AI agents and tools/data.
- **A2A** for communication between specialized AI agents.
- **n8n** as the workflow orchestration layer.
- **LLM** for reasoning and response generation.
- **Next.js/React** as the frontend.

Example:

> "What is the maximum reimbursement for an overseas hotel?"

The system retrieves relevant information from the knowledge base and returns a grounded answer with source citations.

---

# 2. Problem Statement

Company information is often distributed across many documents:

- HR Policy
- Finance Policy
- Travel Policy
- Security Policy
- Engineering Handbook
- Remote Work Policy

Users have to search these documents manually.

### Problems

1. Information is distributed across multiple documents.
2. Keyword search does not always find semantically relevant information.
3. Users need answers quickly.
4. LLMs can hallucinate when answers are not grounded in source documents.
5. Users need transparency regarding the source of an answer.
6. Modern AI systems need standardized ways to access tools and communicate between agents.

---

# 3. Product Goals

The system should:

1. Upload knowledge-base documents.
2. Extract and preprocess document content.
3. Chunk documents.
4. Generate embeddings.
5. Store embeddings in Pinecone.
6. Perform semantic search.
7. Generate answers using RAG.
8. Display answer sources.
9. Expose knowledge-base functionality through MCP.
10. Support communication between specialized agents using A2A.
11. Use n8n as the orchestration layer.
12. Provide a simple web-based chat interface.
13. Provide basic observability and evaluation capabilities.
14. Be runnable locally using Docker.

---

# 4. Non-Goals

The MVP will not include:

- Fine-tuning an LLM.
- Training a custom embedding model.
- Multi-region deployment.
- Kubernetes.
- Complex enterprise SSO.
- Advanced RBAC.
- Voice assistant.
- Mobile application.
- Real-time collaborative editing.
- Autonomous actions with significant side effects.
- Production-scale infrastructure.

The primary focus is demonstrating the architecture and engineering concepts.

---

# 5. Target Users

## 5.1 Employee

Employees can ask questions about company policies and documentation.

Examples:

- "How much can I claim for an overseas hotel?"
- "How many vacation days do I have?"
- "Can I work remotely from another city?"

## 5.2 HR / Finance

HR and Finance users can quickly retrieve relevant policy information.

## 5.3 Administrator

Administrators manage the knowledge base:

- Upload documents
- View documents
- Re-index documents
- Manage document metadata

## 5.4 Technical Reviewer

For portfolio purposes, technical reviewers can inspect:

- RAG architecture
- MCP implementation
- A2A communication
- n8n workflows
- Pinecone integration
- Testing
- Evaluation

---

# 6. System Scope

The system consists of the following components:

```text
                    ┌──────────────────┐
                    │    Next.js UI    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │      n8n         │
                    │  Orchestrator    │
                    └────────┬─────────┘
                             │
                   ┌─────────┴─────────┐
                   ▼                   ▼
            Router Agent          MCP Server
                   │                   │
             ┌─────┴─────┐             ▼
             ▼           ▼         Pinecone
       Knowledge      Policy          │
         Agent         Agent          │
             │           │             │
             └─────┬─────┘             │
                   │                   │
                   └─────────┬─────────┘
                             ▼
                            LLM
                             │
                             ▼
                          Response
```

---

# 7. Functional Requirements

## FR-001 — User Chat

Users can submit natural-language questions through the frontend.

Example:

```text
User:
What is the maximum international hotel reimbursement?
```

Expected response:

```text
AI:
The maximum reimbursement is $150 per night.

Source:
Travel Policy — Section 3.2
```

---

# 8. Document Management

## FR-002 — Upload Document

Administrators can upload:

- PDF
- TXT
- Markdown

### MVP

PDF support is required.

### Document Metadata

```json
{
  "document_id": "travel-policy",
  "title": "Travel Policy",
  "category": "finance",
  "version": "1.0",
  "uploaded_at": "2026-09-01"
}
```

---

## FR-003 — Document Processing

After upload:

```text
Upload
  ↓
Extract Text
  ↓
Clean Text
  ↓
Split Into Chunks
  ↓
Generate Embeddings
  ↓
Store in Pinecone
```

---

# 9. RAG Requirements

## FR-004 — Semantic Retrieval

The system must search the knowledge base using semantic similarity.

Example:

User:

> "How much money can I get for a hotel abroad?"

Knowledge base:

> "Employees traveling internationally may claim hotel expenses up to $150 per night."

Semantic search should identify the relationship between these two statements.

---

## FR-005 — Top-K Retrieval

Default:

```text
top_k = 5
```

Configurable range:

```text
top_k = 3–10
```

---

## FR-006 — Similarity Threshold

The system should support a minimum similarity threshold.

Example:

```text
similarity >= 0.70
```

If no result meets the threshold:

```text
I couldn't find reliable information in the knowledge base.
```

This is intended to reduce hallucination.

---

# 10. RAG Generation

## FR-007 — Grounded Answer

The LLM should use retrieved context as the primary source for answering.

Example system instruction:

```text
You are an enterprise knowledge assistant.

Answer the user's question using ONLY the provided context.

If the answer cannot be found in the context,
say that the information is unavailable.

Always provide the source document.
```

---

# 11. Source Citation

## FR-008 — Citation

Every grounded answer should include its source.

Example:

```json
{
  "answer": "International hotel reimbursement is limited to $150 per night.",
  "sources": [
    {
      "document": "Travel Policy",
      "section": "3.2",
      "page": 5
    }
  ]
}
```

Frontend representation:

```text
Answer
────────────────────────────

International hotel reimbursement
is limited to $150 per night.

Sources
────────────────────────────
📄 Travel Policy
   Section 3.2
   Page 5
```

---

# 12. MCP Requirements

## FR-009 — MCP Server

The system must provide an MCP server exposing knowledge-base functionality.

Minimum tools:

```text
search_documents
get_document
list_documents
```

---

## FR-010 — search_documents

### Input

```json
{
  "query": "international hotel reimbursement",
  "top_k": 5
}
```

### Output

```json
{
  "results": [
    {
      "document": "Travel Policy",
      "section": "3.2",
      "content": "...",
      "score": 0.92
    }
  ]
}
```

---

## FR-011 — get_document

### Input

```json
{
  "document_id": "travel-policy"
}
```

### Output

```json
{
  "document_id": "travel-policy",
  "title": "Travel Policy",
  "content": "..."
}
```

---

## FR-012 — list_documents

### Output

```json
{
  "documents": [
    {
      "id": "travel-policy",
      "title": "Travel Policy"
    },
    {
      "id": "remote-work",
      "title": "Remote Work Policy"
    }
  ]
}
```

---

# 13. A2A Requirements

The system contains at least two specialized agents.

## Agent 1 — Knowledge Agent

Responsibilities:

- General company knowledge
- Technical documentation
- Engineering handbook
- Security documentation

## Agent 2 — Policy Agent

Responsibilities:

- HR policy
- Finance policy
- Travel policy
- Remote work policy

---

# 14. Agent Router

The system contains a routing mechanism that selects the appropriate agent.

```text
Question
   │
   ▼
Router Agent
   │
   ├── Finance ───────► Policy Agent
   │
   ├── HR ────────────► Policy Agent
   │
   ├── Engineering ──► Knowledge Agent
   │
   └── Security ─────► Knowledge Agent
```

---

# 15. A2A Communication

Agents should be able to communicate with other agents.

Example:

```text
User
 │
 ▼
Knowledge Agent
 │
 │ "This looks like a finance policy question."
 │
 ▼
Policy Agent
 │
 ▼
MCP
 │
 ▼
Pinecone
 │
 ▼
Policy Agent
 │
 ▼
Knowledge Agent
 │
 ▼
User
```

The A2A layer should support, at minimum:

- Agent discovery
- Task request
- Task response
- Task status

For the MVP, HTTP/JSON communication can be used while following A2A concepts and message structures.

---

# 16. n8n Requirements

n8n is the primary workflow orchestration layer.

Minimum workflows:

1. Document ingestion
2. Question answering
3. Agent routing
4. A2A communication

---

## Workflow 1 — Document Ingestion

```text
Webhook
  ↓
Receive PDF
  ↓
Extract Text
  ↓
Chunk
  ↓
Generate Embedding
  ↓
Pinecone Upsert
  ↓
Return Status
```

---

## Workflow 2 — Question Answering

```text
Webhook
  ↓
Receive Question
  ↓
Router
  ↓
Select Agent
  ↓
Agent
  ↓
MCP Tool
  ↓
Pinecone
  ↓
LLM
  ↓
Response
```

---

## Workflow 3 — A2A

```text
Agent A
  ↓
A2A Request
  ↓
n8n Webhook
  ↓
Agent B
  ↓
MCP
  ↓
Pinecone
  ↓
Response
```

---

# 17. Frontend Requirements

Frontend should provide a minimal web application.

## 17.1 Chat Page

```text
┌────────────────────────────────────────────┐
│ Enterprise Knowledge Assistant            │
├────────────────────────────────────────────┤
│                                            │
│ User:                                      │
│ What is the overseas hotel reimbursement? │
│                                            │
│ AI:                                        │
│ The maximum is $150/night.                 │
│                                            │
│ Sources:                                   │
│ 📄 Travel Policy — Section 3.2             │
│                                            │
├────────────────────────────────────────────┤
│ Ask something...                    [Send] │
└────────────────────────────────────────────┘
```

## 17.2 Document Page

```text
Documents

[ Upload Document ]

Travel Policy
Finance Policy
Remote Work Policy
Security Handbook
```

## 17.3 Trace Page

For portfolio purposes, a trace/debug page is recommended.

Example:

```text
Request
  ↓
Router Agent
  ↓
Policy Agent
  ↓
MCP: search_documents
  ↓
Pinecone
  ↓
5 chunks retrieved
  ↓
LLM
  ↓
Final Answer
```

---

# 18. API Requirements

Minimum API endpoints:

```text
POST /api/chat

POST /api/documents

GET /api/documents

GET /api/documents/:id

GET /api/health
```

## POST /api/chat

### Request

```json
{
  "message": "What is the international hotel reimbursement limit?"
}
```

### Response

```json
{
  "answer": "The maximum is $150 per night.",
  "agent": "policy-agent",
  "sources": [
    {
      "document": "travel-policy",
      "section": "3.2"
    }
  ]
}
```

---

# 19. Data Model

## 19.1 Document

```text
Document
──────────────
id
title
filename
category
version
created_at
updated_at
```

## 19.2 Document Chunk

```text
DocumentChunk
──────────────
id
document_id
content
page
section
embedding_id
metadata
```

## 19.3 Pinecone Metadata

```json
{
  "document_id": "travel-policy",
  "category": "finance",
  "page": 5,
  "section": "3.2"
}
```

---

# 20. Security Requirements

The MVP should implement the following security practices:

- API keys must never be exposed to the frontend.
- Use environment variables for secrets.
- Store Pinecone credentials in server-side configuration.
- Store LLM API keys securely.
- Never commit `.env` files.
- Validate uploaded documents.
- Restrict file size.
- Validate user input.
- Sanitize data before displaying it in the frontend.

Example `.env`:

```text
PINECONE_API_KEY=
LLM_API_KEY=
N8N_WEBHOOK_URL=
```

Example `.gitignore`:

```text
.env
.env.*
```

---

# 21. Non-Functional Requirements

## 21.1 Performance

MVP target:

```text
Average response time < 10 seconds
```

The target is for portfolio demonstration rather than production SLA.

## 21.2 Reliability

If Pinecone is unavailable:

```text
HTTP 503
Knowledge base temporarily unavailable.
```

If no relevant context is found:

```text
No reliable information was found in the knowledge base.
```

## 21.3 Observability

Each request should record:

```text
request_id
timestamp
agent
retrieval_count
retrieval_scores
llm_model
latency
status
```

Example:

```json
{
  "request_id": "req-123",
  "agent": "policy-agent",
  "retrieval_count": 5,
  "top_score": 0.92,
  "latency_ms": 4200,
  "status": "success"
}
```

---

# 22. Evaluation Requirements

A small evaluation dataset should be created.

Example structure:

```text
evaluation/
└── questions.json
```

Example:

```json
[
  {
    "question": "What is the international hotel reimbursement limit?",
    "expected_answer": "$150 per night",
    "expected_source": "travel-policy"
  },
  {
    "question": "How many vacation days are employees entitled to?",
    "expected_answer": "12 days",
    "expected_source": "leave-policy"
  }
]
```

## Retrieval Metrics

- Precision@K
- Recall@K
- Mean Reciprocal Rank (MRR)

## Generation Metrics

- Faithfulness
- Answer relevance
- Context relevance
- Citation accuracy

---

# 23. QA / Testing Requirements

The project should contain multiple testing levels.

## 23.1 Unit Tests

Test:

- Document chunking
- Metadata generation
- Prompt construction
- Response parsing
- Agent routing

## 23.2 Integration Tests

Test:

```text
MCP
 ↓
Pinecone
```

and:

```text
n8n
 ↓
MCP
 ↓
Pinecone
```

## 23.3 End-to-End Tests

Test the complete flow:

```text
Frontend
 ↓
API
 ↓
n8n
 ↓
Agent
 ↓
MCP
 ↓
Pinecone
 ↓
LLM
 ↓
Answer
```

## 23.4 Negative Tests

Example:

```text
User:
What is the company's policy regarding Mars colonization?
```

Expected:

```text
Information not available in the knowledge base.
```

The system must not fabricate an answer.

---

# 24. Deployment Architecture

## Local MVP

```text
┌──────────────────────────┐
│       Browser            │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Next.js                  │
│ Frontend                 │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ n8n Community Edition    │
│ Docker                   │
└────────────┬─────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
 MCP Server      A2A Agents
      │             │
      └──────┬──────┘
             ▼
        ┌───────────┐
        │ Pinecone  │
        └───────────┘
             │
             ▼
            LLM
```

---

# 25. Environment

## Local

```text
Docker
├── n8n
├── MCP Server
├── A2A Server
└── Next.js
```

## Cloud Services

```text
Pinecone
LLM API
```

The MVP does not require AWS.

---

# 26. MVP Definition of Done

The project is considered MVP-complete when:

- [ ] User can open the chat UI.
- [ ] User can submit a question.
- [ ] Question reaches n8n.
- [ ] Router selects an agent.
- [ ] Agent can use MCP.
- [ ] MCP can perform semantic search.
- [ ] Pinecone stores document embeddings.
- [ ] LLM generates a grounded answer.
- [ ] Answer includes citations.
- [ ] At least two agents exist.
- [ ] A2A communication works.
- [ ] Document ingestion works.
- [ ] Basic logging exists.
- [ ] Basic automated tests exist.
- [ ] Project runs using Docker.
- [ ] README documents the architecture.

---

# 27. Future Improvements

## Phase 2 — Better RAG

- Hybrid search
- Reranking
- Conversation memory
- Streaming responses

## Phase 3 — Enterprise Features

- Authentication
- RBAC
- Document versioning
- Multi-tenancy
- Audit logging

## Phase 4 — AI Engineering

- Automated RAG evaluation
- Agent evaluation
- LLM observability
- Cost tracking
- Prompt management

## Phase 5 — Cloud / Production

- AWS deployment
- CI/CD
- Load testing
- Auto scaling
- Production monitoring

---

# 28. Success Metrics

The following are engineering targets for the MVP:

| Metric | Target |
|---|---:|
| Retrieval Recall@5 | > 80% |
| Correct Answer Rate | > 80% |
| Citation Accuracy | > 90% |
| Unsupported Answer Rate | < 10% |
| Successful E2E Requests | > 95% |
| Average Response Time | < 10 sec |

These are targets to be measured during evaluation, not guaranteed results.

---

# 29. Portfolio Deliverables

The final GitHub repository should contain:

```text
GitHub Repository
│
├── Application
├── n8n Workflows
├── MCP Server
├── A2A Agents
├── Pinecone Integration
├── Docker Configuration
├── Test Suite
├── Evaluation Dataset
├── Architecture Diagram
├── API Documentation
└── README
```

README should explain:

```text
Problem
   ↓
Architecture
   ↓
RAG Pipeline
   ↓
MCP Architecture
   ↓
A2A Architecture
   ↓
n8n Workflows
   ↓
Evaluation
   ↓
Demo
```

---

# 30. Recommended Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript |
| UI | Tailwind CSS |
| Workflow Orchestration | n8n Community Edition |
| RAG | Custom RAG Pipeline |
| Vector Database | Pinecone |
| Embedding | Pinecone Inference / Free-tier Embedding Provider |
| LLM | Gemini / Other Suitable Free-tier LLM |
| MCP | TypeScript/Python MCP Server |
| A2A | TypeScript/Python HTTP Implementation |
| Containerization | Docker |
| Testing | Vitest/Jest + Playwright |
| API | REST / Webhook |
| Documentation | Markdown |
| CI | GitHub Actions |

---

# 31. Development Roadmap

## Week 1 — RAG Foundation

```text
Project Setup
      ↓
Docker
      ↓
n8n
      ↓
Pinecone
      ↓
Document Ingestion
```

Deliverable:

- Documents can be indexed into Pinecone.

---

## Week 2 — RAG

```text
User Question
      ↓
Embedding
      ↓
Semantic Search
      ↓
Retrieved Context
      ↓
LLM
      ↓
Grounded Answer
```

Deliverable:

- Working RAG pipeline with citations.

---

## Week 3 — MCP

```text
Agent
  ↓
MCP
  ↓
search_documents()
  ↓
Pinecone
```

Deliverable:

- Working MCP server.
- Agent can use MCP tools.

---

## Week 4 — A2A

```text
Router Agent
      │
      ├── Knowledge Agent
      │
      └── Policy Agent
```

Deliverable:

- Two specialized agents.
- Agent-to-agent communication.

---

## Week 5 — Frontend

Implement:

- Chat UI
- Document UI
- Source display
- Trace/debug UI

---

## Week 6 — QA & Documentation

Implement:

- Unit tests
- Integration tests
- E2E tests
- RAG evaluation
- Architecture documentation
- GitHub Actions
- README
- Demo

---

# 32. Architecture Principles

The project should follow clear separation of responsibilities.

| Component | Responsibility |
|---|---|
| Next.js | Presentation |
| n8n | Workflow orchestration |
| Router Agent | Intent/agent routing |
| Knowledge Agent | General knowledge |
| Policy Agent | Policy-specific knowledge |
| MCP | Agent ↔ tools/data |
| A2A | Agent ↔ agent communication |
| Pinecone | Vector storage/retrieval |
| Embedding Model | Text → vector |
| LLM | Reasoning/generation |

The architecture should avoid adding technologies only for demonstration.

Each technology must have a clearly defined responsibility.

---

# 33. Example End-to-End Scenario

### User

```text
How much can I claim for a hotel during international travel?
```

### Step 1 — Frontend

Next.js sends:

```json
{
  "message": "How much can I claim for a hotel during international travel?"
}
```

### Step 2 — n8n

n8n receives the request.

### Step 3 — Router

Router identifies:

```text
Category: Finance / Travel Policy
Agent: Policy Agent
```

### Step 4 — A2A

If necessary:

```text
Router Agent
      ↓
Policy Agent
```

### Step 5 — MCP

Policy Agent invokes:

```text
search_documents()
```

### Step 6 — Pinecone

Pinecone returns:

```text
Travel Policy
Section 3.2
Similarity: 0.92
```

### Step 7 — LLM

LLM receives:

```text
Question:
How much can I claim for a hotel during international travel?

Context:
Employees traveling internationally may claim hotel
expenses up to $150 per night.
```

### Step 8 — Response

```text
The maximum international hotel reimbursement is
$150 per night.

Source:
Travel Policy — Section 3.2
```

### Step 9 — Frontend

The UI displays:

```text
┌────────────────────────────────────┐
│ Answer                             │
│                                    │
│ Maximum: $150/night                │
│                                    │
│ Source                             │
│ 📄 Travel Policy                   │
│    Section 3.2                     │
│                                    │
│ Agent: Policy Agent                │
│ Retrieval Score: 0.92              │
└────────────────────────────────────┘
```

---

# 34. Portfolio Positioning

The project should be presented as:

> **A full-stack enterprise AI knowledge assistant demonstrating RAG, MCP, A2A, vector search, and workflow orchestration using n8n and Pinecone.**

Suggested resume bullet:

> **Built a full-stack AI knowledge assistant using RAG, Pinecone, n8n, MCP, and A2A, implementing semantic document retrieval, specialized multi-agent routing, grounded responses with source citations, automated document ingestion, and E2E evaluation.**

---

# 35. Final MVP Architecture

```text
                         USER
                           │
                           ▼
                  ┌────────────────┐
                  │    Next.js     │
                  │    Frontend   │
                  └───────┬────────┘
                          │
                          ▼
                  ┌────────────────┐
                  │      n8n       │
                  │  Orchestrator  │
                  └───────┬────────┘
                          │
                          ▼
                  ┌────────────────┐
                  │  Router Agent  │
                  └───────┬────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
       ┌────────────────┐  ┌────────────────┐
       │ Knowledge Agent│  │  Policy Agent  │
       └───────┬────────┘  └───────┬────────┘
               │                   │
               └─────────┬─────────┘
                         │
                    MCP Protocol
                         │
                         ▼
                ┌─────────────────┐
                │   MCP Server    │
                │                 │
                │ search_documents│
                │ get_document    │
                │ list_documents  │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │    Pinecone     │
                │ Vector Database │
                └────────┬────────┘
                         │
                         ▼
                    Retrieved
                     Context
                         │
                         ▼
                    ┌─────────┐
                    │   LLM   │
                    └────┬────┘
                         │
                         ▼
                   Grounded Answer
                         │
                         ▼
                      Next.js
                         │
                         ▼
                        USER
```

---

# 36. Definition of a Successful Portfolio Project

The project is successful when a reviewer can clone the repository, run the application, upload sample company documents, ask a question, and observe:

```text
Question
   ↓
n8n
   ↓
Router Agent
   ↓
Specialized Agent
   ↓
A2A (when required)
   ↓
MCP Tool
   ↓
Pinecone
   ↓
Retrieved Context
   ↓
LLM
   ↓
Grounded Answer
   ↓
Source Citation
```

The primary portfolio value is not the complexity of the UI. It is demonstrating that the developer understands **how RAG, vector search, agent tooling, agent-to-agent communication, and workflow orchestration fit together into one coherent system**.
