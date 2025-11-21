---
slug: debugging-ai-agents-langfuse-observability
title: "Debugging AI Agents with Langfuse: Observability & Evals That Actually Work"
authors: [bradtaylorsf]
tags: [ai-agents, debugging, observability, langfuse, evaluation, llm-ops]
description: "Learn how to debug AI agents effectively using Langfuse observability and evaluation tools. From trace analysis to LLM-as-judge evals, discover practical techniques that catch bugs before production."
---

**📚 AI Agent Evaluation Series - Part 4 of 5**

1. [Observability & Evals: Why They Matter ←](/blog/observability-evals-ai-agents-survival-tools-v2)
2. [Human-in-the-Loop Evaluation ←](/blog/human-at-the-center-building-reliable-ai-agents)
3. [Implementing Automated Evals ←](/blog/automated-evals-ai-agents-langfuse-answer-agent)
4. **Debugging AI Agents** ← You are here
5. [Human Review Training Guide →](/blog/human-review-training-scoring-ai-agents-langfuse)

---

# Debugging AI Agents with Langfuse: Observability & Evals That Actually Work

Building AI agents is exciting. Debugging them when they fail in production? Not so much.

Here's the problem: AI agents don't fail like traditional software. There's no stack trace pointing to line 47. Instead, you get vague responses, hallucinations, or worse—confidently incorrect answers. Your users see the failure, but you have no idea why the agent decided to call the wrong tool, ignore context, or make up facts.

**The solution? Observability and evaluation systems built specifically for AI.**

In this guide, we'll show you how to use **Langfuse** to debug AI agents effectively. You'll learn how to trace agent execution, analyze LLM calls, build evaluation datasets, and implement automated checks that catch issues before your users do. Whether you're running simple RAG pipelines or complex multi-agent systems, these techniques will help you ship reliable AI applications.

<div style={{position: 'relative', paddingBottom: '56.25%', height: 0, marginBottom: '2rem'}}>
  <iframe
    src="https://www.youtube.com/embed/TBNfRrvjbPc"
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    title="Debugging AI Agents with Langfuse"
  />
</div>

<!-- truncate -->

## Why Traditional Debugging Fails for AI Agents

Traditional debugging tools were built for deterministic systems. You write code, it executes the same way every time, and when something breaks, you get clear error messages. AI agents operate differently:

**Non-deterministic behavior**: The same input can produce different outputs. An agent might successfully retrieve documents one time and hallucinate the next, even with identical prompts and context.

**Opaque decision-making**: When an agent chooses to call a specific tool or ignore relevant context, understanding *why* requires visibility into the LLM's reasoning process—something traditional logs don't capture.

**Context complexity**: Modern agents handle long conversations with multiple tool calls, retrieval steps, and reasoning chains. A single user query might generate dozens of LLM calls across multiple components.

**Emergent failures**: Bugs often appear only when specific conditions align—particular user phrasing, edge cases in retrieved data, or subtle prompt variations. These issues are nearly impossible to catch with unit tests alone.

Consider this scenario: Your RAG agent answers "I don't have enough information" even though the relevant documents exist in your vector store. Is the problem with retrieval? Document chunking? The LLM's interpretation? Without observability, you're guessing.

This is where **Langfuse** becomes essential. It provides the visibility and evaluation tools specifically designed for debugging AI systems.

**[Struggling with non-deterministic failures? Let's discuss your debugging challenges →](https://calendly.com/brad-theanswer/answeragent-intro)**

## What is Langfuse? Your AI Observability Platform

[Langfuse](https://langfuse.com) is an open-source observability and evaluation platform built specifically for LLM applications. Think of it as your AI agent's flight recorder—capturing every decision, every API call, and every piece of context so you can understand exactly what happened and why.

### Core Capabilities

**Tracing & Sessions**: Langfuse captures complete execution traces of your AI agents. Every LLM call, tool invocation, and retrieval step is recorded with full context, inputs, outputs, and metadata. [Learn more about traces and sessions](https://langfuse.com/docs/tracing-features/sessions).

**Evaluation Framework**: Built-in support for human annotation, LLM-as-judge evaluations, and custom scoring functions. You can systematically measure agent performance and catch regressions before deployment. [Explore evaluation methods](https://langfuse.com/docs/evaluation/overview).

**Datasets & Experiments**: Create test datasets from production traces, run batch evaluations, and compare agent versions to ensure improvements don't introduce new bugs. [Dataset documentation](https://langfuse.com/docs/evaluation/experiments/datasets).

**Analytics & Dashboards**: Track token usage, latency, error rates, and custom metrics across your entire application. Identify performance bottlenecks and cost drivers. [Custom dashboards guide](https://langfuse.com/docs/metrics/features/custom-dashboards).

### Why Langfuse for Debugging?

Unlike generic logging tools, Langfuse understands the structure of LLM applications:

- **Nested traces**: Automatically groups related LLM calls into hierarchical traces, making it easy to follow complex agent workflows
- **Prompt management**: Track which prompt versions are used in production and correlate them with quality metrics
- **Cost tracking**: Monitor token usage and costs per trace, user, or feature
- **Open source**: Self-host for complete control over sensitive data, or use their cloud platform

**[Need help implementing observability for your AI agents? Schedule a consultation →](https://calendly.com/brad-theanswer/answeragent-intro)**

<div style={{position: 'relative', paddingBottom: '56.25%', height: 0, marginBottom: '2rem'}}>
  <iframe
    src="https://gamma.app/embed/w5phyd07x0ybbj6"
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none'}}
    allow="fullscreen"
    title="Debugging AI Agents with Langfuse - Presentation">
  </iframe>
</div>

## Setting Up Langfuse: Quick Integration Guide

Getting started with Langfuse takes minutes. Here's how to integrate it with your AI agents:

### Option 1: Cloud Platform (Fastest)

1. Sign up at [langfuse.com](https://langfuse.com)
2. Create a project and get your API keys
3. Install the SDK:

```bash
pip install langfuse
# or
npm install langfuse
```

4. Initialize in your code:

```python
from langfuse import Langfuse

langfuse = Langfuse(
    public_key="pk-lf-...",
    secret_key="sk-lf-...",
    host="https://cloud.langfuse.com"
)
```

### Option 2: Self-Hosted (Full Control)

For sensitive data or compliance requirements, self-host Langfuse:

```bash
# Docker Compose (recommended)
git clone https://github.com/langfuse/langfuse.git
cd langfuse
docker-compose up -d
```

Then point your SDK to your instance:

```python
langfuse = Langfuse(
    public_key="pk-lf-...",
    secret_key="sk-lf-...",
    host="https://your-domain.com"  # Your self-hosted URL
)
```

### Integration with Popular Frameworks

**LangChain/LangGraph**:

```python
from langfuse.callback import CallbackHandler

handler = CallbackHandler(
    public_key="pk-lf-...",
    secret_key="sk-lf-..."
)

# Use with any LangChain component
response = chain.invoke(
    {"input": "Your query"},
    config={"callbacks": [handler]}
)
```

**TheAnswer Platform**:

TheAnswer includes native Langfuse integration. Enable it in your chatflow settings:

1. Navigate to **Settings > Integrations**
2. Add your Langfuse credentials
3. Enable tracing for specific chatflows

All agent executions automatically send traces to Langfuse without code changes. [See TheAnswer integration docs](/docs/developers).

:::tip Production Best Practice
Set environment variables for API keys rather than hardcoding them:

```bash
export LANGFUSE_PUBLIC_KEY="pk-lf-..."
export LANGFUSE_SECRET_KEY="sk-lf-..."
export LANGFUSE_HOST="https://cloud.langfuse.com"
```

The SDK automatically reads these variables.
:::

**[Running into integration challenges? Get hands-on support for your setup →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Understanding Traces: Your Agent's Execution Timeline

Traces are the foundation of AI debugging. A trace represents a complete execution path through your agent system, capturing every step from user input to final response.

### Anatomy of a Trace

Each trace consists of:

**Spans**: Individual operations like LLM calls, tool executions, or retrieval steps. Spans can nest to show hierarchical relationships.

**Observations**: Specific events within spans—what was the input, what was the output, how long did it take, what did it cost?

**Metadata**: Custom tags, user IDs, session information, or any context you want to associate with the execution.

**Scores**: Evaluation results, user feedback, or automated quality metrics attached to the trace.

### Reading a Trace in Langfuse

When you open a trace in the Langfuse UI, you see:

```
Trace: User asks about pricing
├─ Span: Agent execution [2.3s, $0.012]
│  ├─ LLM Call: Route query [0.4s, $0.001]
│  │  └─ Input: "What's your pricing?"
│  │  └─ Output: "route: FAQ"
│  ├─ Retrieval: Search knowledge base [0.6s]
│  │  └─ Query: "pricing plans cost"
│  │  └─ Documents: [3 results]
│  └─ LLM Call: Generate response [1.3s, $0.011]
│     └─ Input: [prompt + context]
│     └─ Output: "We offer three plans..."
```

This hierarchical view shows exactly what your agent did and in what order. You can click any step to see full inputs, outputs, and metadata.

### Key Debugging Patterns

**1. Following the execution path**: When an agent gives an unexpected answer, trace the path to see which tools were called and what data was used.

**2. Identifying bottlenecks**: Spans show latency for each operation. Spot slow retrievals, expensive LLM calls, or unnecessary tool invocations.

**3. Comparing traces**: Look at traces side-by-side to understand why the same query sometimes succeeds and sometimes fails.

**4. Filtering by metadata**: Tag traces with user IDs, feature flags, or environment markers to analyze specific cohorts.

### Example: Debugging a RAG Failure

User complaint: "The agent said it doesn't know, but I know the info is in our docs."

**Step 1**: Find the trace using the user's session ID or timestamp.

**Step 2**: Examine the retrieval span:
```json
{
  "query": "customer refund policy",
  "results": [
    {"doc": "shipping-policy.pdf", "score": 0.72},
    {"doc": "returns-faq.pdf", "score": 0.68},
    {"doc": "warranty-info.pdf", "score": 0.65}
  ]
}
```

The correct document [refund-policy.pdf] didn't appear in results. The issue is retrieval, not the LLM.

**Step 3**: Check the embedding model and chunking strategy. The query "customer refund policy" wasn't matching the document titled "Refund Guidelines for Enterprise Customers."

**Fix**: Update document metadata to include common synonyms or adjust the retrieval threshold.

Without traces, you'd be guessing whether the problem was retrieval, prompts, or the LLM. With Langfuse, you pinpoint the issue in minutes.

:::warning Common Mistake
Don't instrument only successful paths. Make sure errors and exceptions also create traces, even if incomplete. Failures are your most valuable debugging opportunities.
:::

**[Want to master trace analysis for your agents? Let's walk through your use cases →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Using Langfuse Sessions for Multi-Turn Debugging

Individual traces show single interactions, but AI agents often handle conversations spanning multiple turns. **Sessions** group related traces together, giving you the full context of a user's journey.

### Why Sessions Matter

Consider a customer support agent handling this conversation:

**Turn 1**: "What's your return policy?"
**Turn 2**: "Can I return opened items?"
**Turn 3**: "How do I start a return?"

Each turn is a separate trace, but understanding failures requires seeing the entire conversation. Did the agent maintain context? Did earlier responses influence later confusion?

### Creating Sessions

Sessions are created by passing a consistent session ID across traces:

```python
from langfuse import Langfuse

langfuse = Langfuse()

# Start a conversation session
session_id = "user-123-conv-456"

# Turn 1
trace1 = langfuse.trace(
    name="Query: Return policy",
    session_id=session_id,
    user_id="user-123"
)
# ... log agent execution ...

# Turn 2 (same session)
trace2 = langfuse.trace(
    name="Query: Return opened items",
    session_id=session_id,
    user_id="user-123"
)
# ... log agent execution ...
```

In the Langfuse UI, click the **Sessions** tab to see all traces grouped by conversation. [Read more about session management](https://langfuse.com/docs/tracing-features/sessions).

### Debugging Multi-Turn Failures

**Pattern 1: Context loss**
Problem: Agent forgets earlier conversation details.

Check the traces: Is the conversation history properly passed to the LLM? Look at the input to each LLM call—does it include previous turns?

**Pattern 2: Conflicting information**
Problem: Agent contradicts itself across turns.

Compare the retrieval results for each turn. Are different documents retrieved that contain conflicting information? This indicates a knowledge base consistency issue, not an agent bug.

**Pattern 3: Escalating errors**
Problem: A small mistake in turn 1 compounds into complete failure by turn 3.

Walk through the session chronologically. Where did the agent first make an incorrect assumption? Fix that, and subsequent turns often self-correct.

### Session-Level Metrics

Langfuse aggregates metrics across sessions:

- **Average turns per session**: Indicates whether users find answers quickly
- **Total cost per session**: Track expensive conversations
- **Success rate**: Tag sessions as successful/failed to identify patterns
- **Session duration**: Long sessions might indicate user frustration

These metrics help identify systematic issues beyond individual failures.

**[Debugging multi-turn conversations? Get expert guidance on session-based analysis →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Evaluation Framework: Catching Bugs Before Production

Observability shows you *what* happened. Evaluation tells you if it's *correct*.

**For comprehensive evaluation implementation**, see [From Theory to Practice: Automated Evals](/blog/automated-evals-ai-agents-langfuse-answer-agent). That guide covers setup, LLM-as-judge, human annotation, datasets, and experiments in detail.

This section focuses on **using evaluations specifically for debugging workflows**:

### Using Evals to Identify Failure Patterns

When debugging, evaluations help you quickly identify patterns in failures:

**1. Human Annotation for Root Cause Analysis**

Nothing beats human judgment for understanding *why* something failed. Langfuse makes annotation workflows straightforward for debugging:

```python
# Add manual score via SDK
langfuse.score(
    trace_id="trace-abc-123",
    name="accuracy",
    value=0,  # Failed
    comment="Agent hallucinated product features not in source docs - retrieval issue"
)
```

**[Learn complete annotation workflows →](/blog/automated-evals-ai-agents-langfuse-answer-agent#human-annotation)**

**2. LLM-as-Judge for Debugging at Scale**

For detailed LLM-as-judge implementation, see the [Automated Evals guide](/blog/automated-evals-ai-agents-langfuse-answer-agent#llm-as-judge).

In debugging scenarios, LLM-as-judge helps you:
- **Scan 100+ recent traces** for specific failure patterns
- **Identify regressions** after code deployments
- **Validate fixes** across your regression test set

**Example debugging workflow:**

```python
# After identifying a bug pattern, evaluate recent traces
recent_traces = langfuse.fetch_traces(limit=100, order_by="desc")

for trace in recent_traces:
    if contains_failure_pattern(trace):
        score = llm_judge_evaluate(trace, criteria="[specific check]")
        if score < threshold:
            flag_for_investigation(trace.id)
```

**[See complete LLM-as-judge implementation →](/blog/automated-evals-ai-agents-langfuse-answer-agent#llm-as-judge)**

**Need help setting up evaluations? [Schedule a consultation →](https://calendly.com/brad-theanswer/answeragent-intro)**

### Datasets for Reproducing Bugs

Complete dataset creation guide: [Building Evaluation Datasets](/blog/automated-evals-ai-agents-langfuse-answer-agent#datasets).

**For debugging, datasets help you:**
- **Reproduce bugs consistently** across environments
- **Verify fixes** don't break existing cases
- **Track improvement** over time with regression tests

**Quick example:**

```python
# Add the failing case to your regression dataset
langfuse.create_dataset_item(
    dataset_name="bug-regression-tests",
    input={"user_query": "What's your return policy?"},
    expected_output={"should_mention": ["30 days", "original receipt"]},
    metadata={"bug_id": "ISSUE-123", "trace_id": failing_trace.id}
)
```

### Running Experiments to Validate Fixes

Complete experiments guide: [Running Experiments](/blog/automated-evals-ai-agents-langfuse-answer-agent#experiments).

**After fixing a bug, validate your fix:**

1. Run your regression test dataset
2. Compare scores before/after the fix
3. Verify the fix didn't introduce new issues

```python
# Test the fix against your regression dataset
dataset = langfuse.get_dataset("bug-regression-tests")

for item in dataset.items:
    result = fixed_agent.run(item.input)
    score = evaluate(result, item.expected_output)

    if score < 0.8:
        print(f"Fix verification failed for: {item.id}")
```

**[See complete experiment workflows →](/blog/automated-evals-ai-agents-langfuse-answer-agent#experiments)**

---

## Advanced: Debugging Complex Multi-Agent Systems

Single-agent debugging is straightforward. Multi-agent systems—where multiple agents collaborate or compete—require advanced techniques.

### Challenges in Multi-Agent Debugging

**Inter-agent communication**: Agents pass information between each other. Tracing these handoffs is critical to understanding failures.

**Cascading errors**: One agent's mistake propagates to downstream agents, compounding the problem.

**Coordination failures**: Agents might duplicate work, contradict each other, or fail to converge on a solution.

### Tracing Multi-Agent Workflows

Use nested spans to represent agent hierarchy:

```python
from langfuse import Langfuse

langfuse = Langfuse()

# Main trace for user request
trace = langfuse.trace(
    name="Multi-agent: Research query",
    input="What are the latest trends in AI observability?"
)

# Agent 1: Web search
span1 = trace.span(name="Agent 1: Search", input="query: AI observability")
search_results = agent1.search("AI observability")
span1.end(output=search_results)

# Agent 2: Summarization
span2 = trace.span(name="Agent 2: Summarize", input=search_results)
summary = agent2.summarize(search_results)
span2.end(output=summary)

# Agent 3: Quality check
span3 = trace.span(name="Agent 3: Verify", input=summary)
verified = agent3.verify(summary)
span3.end(output=verified)

trace.end(output=verified)
```

In Langfuse, this appears as:

```
Trace: Multi-agent: Research query
├─ Agent 1: Search [1.2s]
│  └─ Input: "query: AI observability"
│  └─ Output: [search results]
├─ Agent 2: Summarize [2.5s]
│  └─ Input: [search results]
│  └─ Output: [summary text]
└─ Agent 3: Verify [0.8s]
   └─ Input: [summary text]
   └─ Output: [verified summary]
```

### Debugging Patterns

**Pattern 1: Identify the failing agent**
When a multi-agent workflow fails, start by checking which agent's output deviates from expectations. Examine that agent's span inputs and outputs.

**Pattern 2: Trace information flow**
Verify that data passed between agents is complete and correctly formatted. Missing context or malformed outputs often cause downstream failures.

**Pattern 3: Check for infinite loops**
If agents are stuck, look for repeated spans with identical inputs/outputs. This indicates a coordination failure.

### Evaluation for Multi-Agent Systems

Evaluate not just final outputs but also intermediate steps:

```python
# Evaluate Agent 1's search quality
langfuse.score(
    trace_id=trace.id,
    observation_id=span1.id,  # Specific span
    name="search_relevance",
    value=0.85
)

# Evaluate Agent 2's summary quality
langfuse.score(
    trace_id=trace.id,
    observation_id=span2.id,
    name="summary_accuracy",
    value=0.92
)
```

This granular scoring helps pinpoint which agent in the chain needs improvement.

**[Building complex multi-agent systems? Let's discuss observability strategies for your architecture →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Metrics & Dashboards: Proactive Monitoring

Observability isn't just for debugging after failures—it's for preventing them. Langfuse dashboards give you real-time visibility into agent health.

### Key Metrics to Track

**Performance metrics**:
- **Latency**: p50, p95, p99 response times
- **Throughput**: Queries per second/minute
- **Error rate**: Percentage of failed traces

**Cost metrics**:
- **Token usage**: Input/output tokens per trace
- **Cost per query**: Average spend per user interaction
- **Model distribution**: Which models are used most [GPT-4 vs. GPT-3.5, etc.]

**Quality metrics**:
- **User satisfaction**: Thumbs up/down rates
- **Evaluation scores**: Automated or human-annotated quality ratings
- **Completion rate**: Percentage of queries fully answered vs. "I don't know" responses

### Creating Custom Dashboards

Langfuse supports custom dashboards using its Metrics API:

```python
# Track custom metric
langfuse.metric(
    name="incomplete_response_rate",
    value=0.15,  # 15% of responses were incomplete
    metadata={"date": "2025-11-14"}
)
```

In the UI, create dashboards that visualize:
- Trends over time [daily/weekly]
- Segmentation by user cohort, feature, or model
- Alerts when metrics exceed thresholds

[Custom dashboards guide](https://langfuse.com/docs/metrics/features/custom-dashboards) | [Metrics API reference](https://langfuse.com/docs/metrics/features/metrics-api).

### Setting Up Alerts

Proactive monitoring requires alerts. Integrate Langfuse with your monitoring stack:

**Example with Slack**:
```python
# Pseudo-code: Alert on high error rate
if error_rate > 0.10:
    send_slack_alert(
        channel="#ai-alerts",
        message=f"⚠️ Agent error rate: {error_rate:.0%}"
    )
```

**Example with PagerDuty**:
Track critical metrics [latency, cost spikes] and trigger incidents when thresholds are breached.

:::warning Don't Wait for User Complaints
Set up automated alerts for degraded performance. Catching issues before users report them dramatically improves trust and reliability.
:::

**[Ready to set up proactive monitoring? Get help designing your metrics and alerts →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Debugging Workflow: A Real-World Example

Let's walk through a complete debugging scenario using Langfuse.

### The Problem

**User complaint**: "The agent told me to contact support even though I asked a simple question about pricing."

### Step 1: Find the Trace

Search Langfuse by user ID or session:
- User: `user-789`
- Session: `sess-2025-11-14-789`

Found trace: `trace-abc-xyz` [timestamp: 2025-11-14 10:23 AM]

### Step 2: Examine the Trace

```
Trace: Pricing query
├─ LLM Call: Classify intent [0.3s, $0.001]
│  └─ Output: "intent: support_escalation"
├─ Tool: Query FAQ database [skipped]
└─ LLM Call: Generate fallback response [0.4s, $0.002]
   └─ Output: "Please contact support for assistance."
```

**Observation**: The intent classifier incorrectly labeled the query as "support_escalation" instead of "pricing_FAQ". This caused the agent to skip FAQ retrieval and go straight to a fallback response.

### Step 3: Check the Input

```json
{
  "query": "what do you charge for the pro plan",
  "user_id": "user-789",
  "session_history": []
}
```

The query is straightforward. Why was it misclassified?

### Step 4: Examine the Classifier Prompt

```
You are an intent classifier. Classify the user query into one of:
- pricing_FAQ
- technical_support
- support_escalation

Query: {query}
```

**Issue found**: The prompt lacks examples (few-shot learning). Edge cases like informal phrasing ["what do you charge"] aren't handled well.

### Step 5: Test a Fix

Update the prompt with examples:

```
You are an intent classifier. Classify the user query into one of:
- pricing_FAQ: Questions about costs, plans, pricing
- technical_support: Technical issues, bugs, errors
- support_escalation: Complex issues requiring human support

Examples:
- "What's your pricing?" → pricing_FAQ
- "How much does the pro plan cost?" → pricing_FAQ
- "My app crashed" → technical_support
- "I need a refund" → support_escalation

Query: {query}
```

Re-run the classifier on the same input in an experiment:

```python
dataset = [{"input": "what do you charge for the pro plan", "expected": "pricing_FAQ"}]

result = run_experiment(dataset, new_prompt)
# Result: 100% accuracy on test cases
```

### Step 6: Deploy and Monitor

Deploy the updated prompt. Monitor the metric `misclassification_rate` in Langfuse dashboards to ensure the fix holds in production.

### Step 7: Add to Evaluation Dataset

Add this trace to your evaluation dataset to prevent regression:

```python
langfuse.add_dataset_item(
    dataset_name="intent-classification-tests",
    input="what do you charge for the pro plan",
    expected_output="pricing_FAQ",
    metadata={"category": "edge-case"}
)
```

**[Want to apply this systematic debugging approach to your agents? Let's review your workflows →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Best Practices for Production AI Debugging

### 1. Instrument Everything

Log all LLM calls, tool invocations, and retrieval steps. Missing observability is the number one cause of unsolvable bugs.

### 2. Tag Traces with Rich Metadata

Include:
- User ID and session ID
- Feature flags or experiment variants
- Environment [dev, staging, production]
- Agent version

This context is invaluable when filtering and analyzing traces.

### 3. Evaluate Continuously

Don't wait for user complaints. Run automated evaluations daily or weekly on production datasets.

### 4. Build Feedback Loops

Integrate user feedback (thumbs up/down, comments) directly into Langfuse. Use this signal to prioritize debugging efforts.

```python
# Capture user feedback
langfuse.score(
    trace_id=trace.id,
    name="user_satisfaction",
    value=1 if user_clicked_thumbs_up else 0,
    comment=user_comment
)
```

### 5. Version Your Prompts

Track which prompt versions are used in production. Correlate prompt changes with quality metrics to understand impact.

### 6. Set Budget Alerts

Monitor token usage and costs. Runaway agent loops or inefficient prompts can quickly become expensive.

### 7. Use Staging Environments

Test agent changes in a staging environment with production-like data before deploying. Run experiments on your evaluation datasets.

### 8. Review Failed Traces Regularly

Schedule weekly reviews of high-error-rate traces. Patterns often emerge that point to systematic issues.

**[Preparing for production deployment? Get a readiness review of your observability setup →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Conclusion: Ship Reliable AI Agents with Confidence

AI agents are transforming how we build software, but their non-deterministic nature makes traditional debugging insufficient. **Observability and evaluation systems like Langfuse give you the visibility and tools to debug effectively.**

**Here's what we covered:**

✅ Why traditional debugging fails for AI agents
✅ How Langfuse provides tracing, sessions, and evaluation frameworks
✅ Techniques for analyzing traces and understanding agent behavior
✅ Building evaluation datasets from production data
✅ Running experiments to validate improvements
✅ Debugging multi-agent systems with nested traces
✅ Monitoring metrics and setting up proactive alerts
✅ A real-world debugging workflow from problem to fix

The bottom line: You can't ship reliable AI agents without observability. Langfuse makes it practical and scalable, whether you're building simple chatbots or complex multi-agent orchestrations.

**Ready to debug your AI agents with Langfuse?**

- [Sign up for Langfuse Cloud](https://langfuse.com) or [self-host](https://github.com/langfuse/langfuse)
- Integrate with TheAnswer for automatic tracing [see docs](/docs/developers)
- Start building evaluation datasets from production traces
- Set up dashboards and alerts for proactive monitoring

**Want help implementing observability in your AI agents?** [Book a consultation with our team](https://calendly.com/brad-theanswer/answeragent-intro) to discuss best practices and get hands-on support.

---

## Frequently Asked Questions

### What's the difference between Langfuse tracing and traditional application logs?

Traditional logs capture discrete events—errors, warnings, info messages—but lack the hierarchical structure needed to understand AI agent workflows. Langfuse traces capture the entire execution path as a tree of nested operations (LLM calls, tool invocations, retrievals), preserving the causal relationships between steps.

For example, a traditional log might show:
```
[INFO] LLM call completed in 1.2s
[INFO] Retrieved 3 documents
[INFO] Generated response
```

A Langfuse trace shows:
```
Agent Execution
├─ LLM Call: Classify intent [0.4s]
│  └─ Led to retrieval decision
├─ Retrieval: Search database [0.6s]
│  └─ Used 3 documents as context
└─ LLM Call: Generate response [1.2s]
   └─ Input included retrieval results
```

This hierarchical view makes it obvious how data flows through your agent. Additionally, Langfuse tracks token usage, costs, and allows you to attach evaluation scores—capabilities that standard logging libraries don't provide. [Learn more about Langfuse's data model](https://langfuse.com/docs/observability/data-model).

### Can I use Langfuse with frameworks other than LangChain?

Yes, absolutely. While Langfuse has first-class integrations with LangChain and LangGraph through callback handlers, it's framework-agnostic. You can instrument any Python or JavaScript application using the Langfuse SDK directly.

For example, with a custom agent built from scratch:

```python
from langfuse import Langfuse
import openai

langfuse = Langfuse()
trace = langfuse.trace(name="Custom Agent", input="User query")

# Your custom LLM call
response = openai.chat.completions.create(...)

# Log the span
span = trace.span(
    name="LLM Call",
    input=messages,
    output=response.choices[0].message.content,
    metadata={"model": "gpt-4", "tokens": response.usage.total_tokens}
)

trace.end(output=final_response)
```

Langfuse also integrates with frameworks like Haystack, Semantic Kernel, and custom agent architectures. The SDK gives you full control to instrument any workflow, regardless of the underlying framework.

### How do I handle sensitive data when using Langfuse?

Langfuse provides multiple options for handling sensitive data securely:

**1. Self-hosting**: Deploy Langfuse on your own infrastructure (Docker, Kubernetes, cloud VMs) to retain complete control over data. No information leaves your network.

**2. Data masking**: Before sending traces to Langfuse, sanitize inputs/outputs to remove PII, API keys, or confidential information:

```python
import re

def mask_sensitive_data(text):
    # Mask email addresses
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)
    # Mask credit card numbers
    text = re.sub(r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b', '[CARD]', text)
    return text

trace = langfuse.trace(
    name="Query",
    input=mask_sensitive_data(user_input),
    output=mask_sensitive_data(agent_output)
)
```

**3. Metadata-only logging**: Log trace structure (spans, timings, costs) without capturing full inputs/outputs. You still get valuable performance insights while preserving privacy.

**4. Access controls**: Langfuse supports role-based access control (RBAC). Restrict who can view traces containing sensitive data within your organization.

For regulated industries (healthcare, finance), self-hosting with encryption and audit logging is the standard approach.

### What's the cost of using Langfuse for observability?

Langfuse offers multiple pricing tiers:

**Cloud (Hobby)**: Free tier includes:
- Up to 50,000 traces/month
- 30-day data retention
- Community support

**Cloud (Pro/Team)**: Paid plans start around $99/month for higher trace volumes, extended retention, and team features. Pricing scales with usage.

**Self-hosted**: Open-source and free. You only pay for infrastructure costs (hosting, database, storage). Recommended for production workloads or sensitive data.

**Cost-benefit consideration**: The cost of Langfuse is typically negligible compared to the cost of debugging production issues without observability. A single critical bug that goes undetected can cost far more in lost revenue, user churn, or engineering time than a year of Langfuse Pro.

For most teams, the self-hosted option provides the best value, especially at scale. [See pricing details](https://langfuse.com).

### How do I evaluate subjective qualities like tone or empathy?

Subjective qualities are challenging to automate but critical for customer-facing agents. Use a hybrid approach:

**1. Human annotation**: Define clear rubrics for annotators. Example:

```
Empathy Score (1-5):
1 = Robotic, no acknowledgment of user emotion
3 = Acknowledges user but generic response
5 = Personalized, empathetic, and supportive
```

Annotators review traces and assign scores using Langfuse's UI. Export annotated data to train evaluation models or fine-tune agents.

**2. LLM-as-judge with detailed criteria**: GPT-4 can evaluate subjective qualities if given explicit instructions:

```
Evaluate the agent's response for empathy on a scale of 1-5.

Criteria:
- Does the response acknowledge the user's frustration or concern?
- Is the tone warm and supportive rather than clinical?
- Does it provide reassurance or next steps to help the user?

User query: "I've been waiting for hours and no one has helped me."
Agent response: "I'm sorry for the delay. Let me prioritize your request right now."

Score: [Your evaluation]
```

The judge LLM's output can be parsed and logged as a score in Langfuse.

**3. Validate judge accuracy**: Run the judge on a subset of traces and compare with human annotations. If agreement is above 80%, the judge is reliable. If not, refine the judge prompt with examples.

Subjective evaluation is an iterative process. Start with human annotation to establish ground truth, then scale with LLM-as-judge.

### Can Langfuse help debug hallucinations?

Yes, Langfuse is particularly useful for debugging hallucinations because it captures the full context provided to the LLM. Here's how:

**Step 1: Identify the hallucination**
User reports an incorrect fact in the agent's response. Find the trace in Langfuse.

**Step 2: Check the LLM input**
Examine the prompt and context sent to the LLM. Was the correct information included?

**Scenario A**: Context is missing or incomplete → Problem is retrieval or context assembly, not the LLM.

**Scenario B**: Context is correct but LLM output is wrong → Problem is the LLM's interpretation or prompt phrasing.

**Step 3: Trace back to retrieval**
If context is missing, check the retrieval span. What query was used? Were the right documents retrieved? What were the similarity scores?

Often, hallucinations stem from:
- Retrieval failure (correct documents not surfaced)
- Ambiguous prompts (LLM guesses when context is unclear)
- Outdated knowledge base (LLM falls back to pre-trained knowledge)

**Step 4: Implement guardrails**
Add a verification step to your agent workflow:

```python
def verify_response(response, context):
    # Check if response contains facts not in context
    verification_prompt = f"""
    Context: {context}
    Response: {response}

    Does the response contain any facts not present in the context?
    Answer: Yes or No
    """
    result = llm.complete(verification_prompt)
    return result
```

Log this verification as a score in Langfuse. If hallucinations are detected automatically, trigger alerts or fallback to safer responses.

### How do I debug slow agent responses?

Performance issues are immediately visible in Langfuse traces. Here's a systematic approach:

**Step 1: Find slow traces**
Filter traces by latency (e.g., >5 seconds). Examine the trace timeline:

```
Trace: Query [7.2s total]
├─ LLM Call: Intent classification [0.4s]
├─ Retrieval: Search database [5.8s] ⚠️ SLOW
└─ LLM Call: Generate response [1.0s]
```

**Bottleneck identified**: Retrieval took 5.8 seconds—80% of total time.

**Step 2: Investigate the slow operation**
For retrieval slowness:
- Check vector database performance (indexing, query optimization)
- Verify embedding model latency
- Look for large document sets without filters

For LLM slowness:
- Check token counts (long contexts slow down generation)
- Verify model choice (GPT-4 is slower than GPT-3.5)
- Check API rate limits or throttling

**Step 3: Optimize**
Common fixes:
- **Retrieval**: Add filters (by date, category) to reduce search space
- **LLM**: Use faster models (GPT-3.5-turbo) for non-critical steps
- **Parallel execution**: Run independent operations concurrently

**Step 4: Re-run experiments**
Use your evaluation dataset to test optimizations. Ensure latency improves without sacrificing accuracy:

```
Before: 95% accuracy, 7.2s avg latency
After:  95% accuracy, 2.1s avg latency ✅
```

Langfuse's span-level timing data makes performance debugging precise and actionable.

### What's the best way to handle multi-modal agents that process images, audio, or video?

Langfuse supports multi-modal tracing by allowing you to log inputs and outputs of any type. For media-heavy agents:

**1. Log references, not raw media**
Instead of logging entire images or videos, log metadata and references:

```python
trace = langfuse.trace(
    name="Image Analysis",
    input={
        "image_url": "s3://bucket/images/user-upload-123.jpg",
        "image_size": "1920x1080",
        "format": "JPEG"
    },
    output="The image contains a cat sitting on a couch."
)
```

This keeps traces lightweight while preserving debugging context.

**2. Include model outputs and confidence scores**
For vision models:

```python
span = trace.span(
    name="Vision Model: Object Detection",
    input={"image_id": "img-123"},
    output={
        "objects": [
            {"label": "cat", "confidence": 0.95},
            {"label": "couch", "confidence": 0.88}
        ]
    }
)
```

**3. Link to external storage for media**
Store images, audio, or video in S3 or similar storage. Include signed URLs in trace metadata for reviewers to access:

```python
trace.metadata = {
    "image_preview_url": "https://s3.../user-upload-123.jpg?signature=..."
}
```

**4. Evaluate multi-modal outputs**
Use LLM-as-judge to evaluate descriptions:

```
Image: [cat on couch]
Agent description: "A cat sitting on a couch."

Is the description accurate? Yes/No
```

Multi-modal debugging follows the same principles as text-based agents: capture structure, context, and outputs; evaluate systematically.

### How do Langfuse Datasets differ from traditional test suites?

Traditional test suites (unit tests, integration tests) validate deterministic behavior: given input X, expect output Y. AI agents are non-deterministic—same input can produce different outputs. Langfuse Datasets account for this:

**1. Ground truth as a range**
Instead of exact matches, evaluation checks semantic correctness:

```python
# Traditional test
assert output == "Our return policy is 30 days."

# Langfuse evaluation
assert evaluate_similarity(output, expected_output) > 0.85
```

**2. Real-world inputs**
Traditional tests use synthetic data. Langfuse Datasets capture actual user queries from production, including edge cases you wouldn't think to write manually.

**3. Continuous updates**
Test suites are static (written once, rarely updated). Datasets grow organically as you add challenging traces from production, creating a living benchmark.

**4. Evaluation is flexible**
You can re-evaluate the same dataset with different criteria as your agent evolves:

```python
# Initial evaluation: accuracy only
dataset.evaluate(criteria=["accuracy"])

# Later: accuracy + safety + tone
dataset.evaluate(criteria=["accuracy", "safety", "tone"])
```

Think of Datasets as regression test suites tailored for non-deterministic AI systems. [Learn more about Datasets](https://langfuse.com/docs/evaluation/experiments/datasets).

### Can I use Langfuse for A/B testing different agent versions?

Yes, Langfuse is excellent for A/B testing agents. Here's how:

**1. Tag traces by variant**
When deploying multiple agent versions, tag traces:

```python
# Variant A (current model)
trace_a = langfuse.trace(
    name="Query",
    input=user_query,
    metadata={"variant": "model-A", "user_id": user_id}
)

# Variant B (new model)
trace_b = langfuse.trace(
    name="Query",
    input=user_query,
    metadata={"variant": "model-B", "user_id": user_id}
)
```

**2. Random assignment**
Randomly assign users to variants:

```python
import random

variant = "model-A" if random.random() < 0.5 else "model-B"
agent = get_agent(variant)
response = agent.run(user_query)

trace = langfuse.trace(
    name="Query",
    input=user_query,
    output=response,
    metadata={"variant": variant}
)
```

**3. Compare metrics by variant**
In Langfuse, filter traces by `variant` metadata. Compare:
- Accuracy scores
- User satisfaction (thumbs up/down)
- Latency and cost
- Error rates

**4. Statistical significance**
Export metrics and run statistical tests (t-tests, chi-squared) to determine if differences are significant:

```python
import scipy.stats as stats

accuracy_a = [trace.scores['accuracy'] for trace in variant_a_traces]
accuracy_b = [trace.scores['accuracy'] for trace in variant_b_traces]

t_stat, p_value = stats.ttest_ind(accuracy_a, accuracy_b)
print(f"p-value: {p_value}")  # If p < 0.05, difference is significant
```

**5. Gradual rollout**
Start with 10% traffic on variant B, monitor metrics, and gradually increase if performance is better.

Langfuse provides the observability infrastructure for rigorous A/B testing of AI agents.

### How do I integrate Langfuse with TheAnswer platform?

TheAnswer includes built-in Langfuse integration, making setup straightforward:

**Step 1: Add Langfuse credentials**
Navigate to **Settings > Integrations** in TheAnswer dashboard. Add your Langfuse API keys:
- Public Key: `pk-lf-...`
- Secret Key: `sk-lf-...`
- Host: `https://cloud.langfuse.com` (or your self-hosted URL)

**Step 2: Enable per chatflow**
In your chatflow settings, toggle **Enable Langfuse Tracing**. All agent executions in that chatflow will automatically send traces to Langfuse—no code changes required.

**Step 3: View traces**
After running your agent, open the Langfuse dashboard. You'll see traces for each chatflow execution, complete with LLM calls, tool invocations, and retrieval steps.

**Step 4: Custom metadata (optional)**
For advanced use cases, add custom metadata via TheAnswer's API:

```javascript
// In your chatflow custom function
const metadata = {
  user_cohort: "premium",
  feature_flag: "new-retrieval-v2"
};

// Metadata automatically included in Langfuse trace
return { output: response, metadata };
```

**Benefits of native integration**:
- Zero code changes for observability
- Automatic session grouping for multi-turn conversations
- Seamless cost and latency tracking

[See TheAnswer integration docs](/docs/developers) for detailed setup instructions.

### What's the difference between Langfuse and other observability platforms like LangSmith or Weights & Biases?

All platforms provide tracing and evaluation for LLM applications, but they differ in focus and features:

**Langfuse**:
- **Open-source**: Self-host for complete data control
- **Evaluation-first**: Strong focus on datasets, experiments, and LLM-as-judge workflows
- **Cost transparency**: Granular token usage and cost tracking per trace
- **Community**: Growing ecosystem of integrations and templates

**LangSmith (by LangChain)**:
- **Tightly coupled with LangChain**: Best-in-class if you're using LangChain/LangGraph
- **Prompt playground**: Built-in tools for prompt iteration
- **Commercial focus**: Cloud-hosted, less emphasis on self-hosting

**Weights & Biases**:
- **ML-first**: Broader focus on traditional ML training, not just LLM inference
- **Experiment tracking**: Excellent for model training runs and hyperparameter tuning
- **Less LLM-specific**: Lacks native support for LLM-specific patterns like prompt versioning

**Which should you choose?**
- **Use Langfuse** if you want open-source, evaluation-heavy workflows, or need self-hosting
- **Use LangSmith** if you're heavily invested in LangChain and want seamless integration
- **Use Weights & Biases** if you're tracking traditional ML training alongside LLM apps

Many teams use multiple tools—e.g., Weights & Biases for training, Langfuse for inference observability.

### Can I export Langfuse data for custom analysis?

Yes, Langfuse provides multiple export options:

**1. API access**
Use the [Langfuse Metrics API](https://langfuse.com/docs/metrics/features/metrics-api) to programmatically fetch traces, scores, and aggregated metrics:

```python
from langfuse import Langfuse

langfuse = Langfuse()

# Fetch traces
traces = langfuse.get_traces(
    from_timestamp="2025-11-01",
    to_timestamp="2025-11-14",
    user_id="user-123"
)

# Export to CSV
import csv
with open('traces.csv', 'w') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'input', 'output', 'latency'])
    writer.writeheader()
    for trace in traces:
        writer.writerow({
            'id': trace.id,
            'input': trace.input,
            'output': trace.output,
            'latency': trace.latency
        })
```

**2. Webhook integration**
Configure webhooks to send trace data to external systems (data warehouses, BI tools, alerting platforms) in real-time.

**3. Database access (self-hosted)**
If self-hosting, query the Langfuse PostgreSQL database directly for advanced analytics:

```sql
SELECT
  trace_id,
  name,
  input,
  output,
  latency,
  total_cost
FROM traces
WHERE created_at >= '2025-11-01'
  AND user_id = 'user-123';
```

**4. Dashboard exports**
Export chart data from Langfuse dashboards as CSV or JSON for custom reporting.

Use these export options to integrate Langfuse data with existing analytics workflows, Jupyter notebooks, or business intelligence tools.

### How do I debug agents that call external APIs or tools?

External API calls are often the source of agent failures—rate limits, timeouts, unexpected responses. Langfuse helps by capturing tool execution as spans:

```python
from langfuse import Langfuse
import requests

langfuse = Langfuse()
trace = langfuse.trace(name="Agent: Check weather")

# Tool call: External weather API
span = trace.span(name="Tool: Weather API", input={"location": "San Francisco"})

try:
    response = requests.get("https://api.weather.com/...", timeout=5)
    response.raise_for_status()
    weather_data = response.json()

    span.end(output=weather_data, metadata={"status_code": response.status_code})

except requests.exceptions.Timeout:
    span.end(output=None, metadata={"error": "API timeout"})
    # Handle timeout gracefully

except requests.exceptions.HTTPError as e:
    span.end(output=None, metadata={"error": f"HTTP {e.response.status_code}"})
    # Handle API errors
```

**Debugging patterns**:

**Pattern 1: API failures**
Filter traces where tool spans have `error` metadata. Check status codes and error messages.

**Pattern 2: Rate limiting**
If you see repeated HTTP 429 errors, implement retry logic with exponential backoff. Monitor in Langfuse to verify retries succeed.

**Pattern 3: Unexpected API responses**
Log the full API response in span output. When agents behave incorrectly, check if the API returned malformed or unexpected data.

**Pattern 4: Slow APIs**
Span timing shows exactly how long each API call takes. If an external API is slow (>2s), consider caching results or switching providers.

By instrumenting tool calls as spans, you get complete visibility into external dependencies—critical for production reliability.

### What's the learning curve for integrating Langfuse?

Langfuse is designed for quick integration with minimal learning curve:

**Time to first trace: ~10 minutes**
Install SDK, add API keys, wrap your agent execution—done. You'll see traces in the Langfuse UI immediately.

**Time to useful debugging: ~1 hour**
Explore the UI, understand trace structure, filter by metadata, and analyze a few failed traces. You'll quickly grasp how to debug effectively.

**Time to evaluation workflows: ~1 day**
Build your first dataset, write a simple evaluation function, run an experiment. This requires understanding your agent's quality criteria.

**Time to production-grade observability: ~1 week**
Instrument all components, set up dashboards, configure alerts, establish evaluation pipelines in CI/CD. This is where you get the full value.

**Learning resources**:
- [Langfuse documentation](https://langfuse.com/docs) - Comprehensive guides and API references
- [Example notebooks](https://github.com/langfuse/langfuse) - Jupyter notebooks demonstrating common patterns
- Community Discord - Get help from Langfuse team and users

For teams familiar with observability concepts (tracing, metrics, dashboards), Langfuse feels intuitive. For teams new to observability, the investment pays off quickly as debugging becomes systematic rather than guesswork.