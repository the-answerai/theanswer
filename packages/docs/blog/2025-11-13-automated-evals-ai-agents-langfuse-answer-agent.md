---
slug: automated-evals-ai-agents-langfuse-answer-agent
title: "From Theory to Practice: Automated Evals for AI Agents with Langfuse"
authors: [bradtaylorsf]
tags: [ai-agents, evals, langfuse, automation, continuous-improvement]
description: "Stop guessing if your AI agent is improving. Learn how to set up automated evaluations with Langfuse to measure quality, catch regressions, and iterate with confidence."
---

**📚 AI Agent Evaluation Series - Part 3 of 5**

1. [Observability & Evals: Why They Matter ←](/blog/observability-evals-ai-agents-survival-tools-v2)
2. [Human-in-the-Loop Evaluation ←](/blog/human-at-the-center-building-reliable-ai-agents)
3. **Implementing Automated Evals** ← You are here
4. [Debugging AI Agents →](/blog/debugging-ai-agents-langfuse-observability)
5. [Human Review Training Guide →](/blog/human-review-training-scoring-ai-agents-langfuse)

---

# From Theory to Practice: Automated Evals for AI Agents with Langfuse

We covered [why observability and evals matter for AI agents](/blog/observability-evals-ai-agents-survival-tools-v2) in Part 1 of this series. Now let's get practical: how do you actually implement automated evaluations that run continuously, catch regressions before users do, and give you the confidence to ship faster?

This guide walks through setting up automated evals with Langfuse—from basic quality checks to sophisticated LLM-as-a-judge evaluations. And if you're using Answer Agent, you're already halfway there: Langfuse tracing is built-in, so you can skip the instrumentation headache and jump straight to measuring quality.

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <iframe
    width="560"
    height="315"
    src="https://www.youtube.com/embed/4w7H0p11DYs"
    title="Automated Evals for AI Agents Tutorial"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
    style={{maxWidth: '100%', height: 'auto', aspectRatio: '16/9'}}
  ></iframe>
</div>

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <iframe
    src="https://gamma.app/embed/wld7xrzjwu9jn8x"
    style={{width: '700px', maxWidth: '100%', height: '450px'}}
    allow="fullscreen"
    title="Automated Evals Implementation Guide"
  ></iframe>
</div>

<!-- truncate -->

## The Evaluation Mindset: Continuous Improvement Over Perfection

Before diving into implementation, let's establish the right mental model. Automated evals aren't about achieving perfection on day one—they're about building a system that gets better every week.

Here's the mindset shift:

**Old way (waterfall):**
1. Build agent
2. Test manually
3. Deploy
4. Hope for the best
5. React to user complaints

**New way (continuous improvement):**
1. Build agent with basic observability
2. Collect real traces from production
3. Define eval criteria based on actual failures
4. Automate evaluation on new traces
5. Iterate on prompts, tools, and models with data-driven insights
6. Repeat weekly

The key difference? You're not trying to predict every failure mode upfront. You're building a feedback loop that learns from real usage and systematically eliminates issues over time.

**[Need help setting up your continuous improvement loop? Let's design your evaluation strategy →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Why Langfuse for Automated Evals?

Langfuse has become the de facto standard for AI agent observability and evals. Here's why it stands out:

### 1. **Unified Platform**
One tool handles both observability (traces, spans, generations) and evaluations (scores, experiments, datasets). You're not stitching together multiple systems.

### 2. **Flexible Evaluation Methods**
- **LLM-as-a-judge**: Use Claude, GPT-4, or any model to evaluate quality
- **Manual annotation**: Human reviewers score production traces
- **Custom Python evaluators**: Write your own scoring logic
- **Deterministic checks**: Rule-based validation (format, length, required fields)

### 3. **Production-Ready Infrastructure**
- Self-hosted or cloud
- Handles millions of traces
- Real-time dashboards
- API access for custom integrations

### 4. **Built for Iteration**
- Datasets for regression testing
- Experiments for A/B testing prompts
- Version tracking for prompts and models
- Time-series metrics to track improvement

### 5. **Framework Agnostic**
Works with LangChain, LlamaIndex, raw OpenAI calls, Anthropic SDK—anything that generates traces.

**[Evaluating which observability platform fits your stack? Get a comparison analysis →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Answer Agent Users: You're Already Set Up

If you're using Answer Agent, here's the good news: **Langfuse tracing is already built into every agent you run**. No instrumentation code needed.

Answer Agent automatically captures:
- All LLM calls with full prompts and completions
- Tool invocations with inputs and outputs
- Agent reasoning steps and decision chains
- Token usage and latency metrics
- Session grouping for multi-turn conversations

### How It Works Behind the Scenes

Answer Agent's Langfuse integration happens at the framework level. When you configure a Langfuse credential in the UI, the system:

1. **Injects callback handlers** into every LangChain execution
2. **Traces all components** (agents, tools, retrievers, chains)
3. **Groups by session** to track full conversations
4. **Adds metadata** (user ID, organization ID, agent version)
5. **Handles errors gracefully** (tracing failures don't break your agent)

Here's what the code looks like under the hood:

```typescript
// Answer Agent automatically creates Langfuse handlers for all agents
import CallbackHandler from 'langfuse-langchain'
import { Langfuse } from 'langfuse'

// When you add Langfuse credentials in the UI, Answer Agent does this:
const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: 'https://cloud.langfuse.com',
  sdkIntegration: 'Flowise'
})

const handler = new CallbackHandler({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: 'https://cloud.langfuse.com',
  sessionId: chatflowId,
  userId: userId,
  metadata: {
    organizationId: organizationId,
    agentVersion: '1.0',
    environment: 'production'
  }
})

// This handler is automatically passed to all LangChain components
const agent = await createAgent({
  callbacks: [handler, ...otherCallbacks]
})
```

**Translation:** You just configure credentials in the UI. Answer Agent handles the rest. Every agent run is automatically traced, with zero code from you.

### Setting Up Langfuse in Answer Agent

1. **Get Langfuse credentials:**
   - Sign up at [cloud.langfuse.com](https://cloud.langfuse.com) or self-host
   - Create a new project
   - Copy your Public Key and Secret Key

2. **Add credentials in Answer Agent:**
   - Go to Credentials → Add Credential
   - Select "Langfuse API"
   - Enter Public Key, Secret Key, and Endpoint
   - Save

3. **Attach to your agent:**
   - Open your agent/chatflow
   - Add the "LangFuse" analytics node
   - Connect your saved credential
   - Deploy

That's it. Every conversation from now on appears in your Langfuse dashboard with full trace detail.

**[Using Answer Agent and need help with Langfuse setup? Get a configuration walkthrough →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Setting Up Your First Automated Eval

Now that traces are flowing into Langfuse, let's set up automated quality checks. We'll start simple and build up to sophisticated evaluations.

### Step 1: Define What "Good" Looks Like

Before writing any code, answer these questions:

- **What does success look like for this agent?**
  - Example: "Agent provides accurate product recommendations based on user preferences"
- **What are common failure modes?**
  - Example: "Agent hallucinates product features" or "Agent recommends out-of-stock items"
- **How would a human evaluate quality?**
  - Example: "Check if recommended products match the user's stated preferences"

Write these down. This is your evaluation criteria, and it will evolve as you learn more about production behavior.

### Step 2: Create a Dataset from Production Traces

Langfuse lets you curate datasets from real production data. Here's how:

**In the Langfuse UI:**

1. Go to **Traces** and filter for interesting examples:
   - Traces with low user satisfaction scores
   - Traces where the agent used tools incorrectly
   - Edge cases that surprised you

2. Click on a trace → **Add to Dataset**

3. Name your dataset (e.g., "Product Recommendation Test Cases")

4. Add expected outputs or evaluation criteria

**Via the API:**

```python
from langfuse import Langfuse

langfuse = Langfuse(
  secret_key="sk-lf-...",
  public_key="pk-lf-...",
  host="https://cloud.langfuse.com"
)

# Create a dataset
langfuse.create_dataset(name="product-recommendations")

# Add production traces to dataset
langfuse.create_dataset_item(
  dataset_name="product-recommendations",
  input={
    "user_query": "I need a laptop for video editing under $2000",
    "user_preferences": {
      "budget": 2000,
      "use_case": "video_editing"
    }
  },
  expected_output={
    "should_include": ["GPU specs", "RAM >= 16GB", "price < $2000"],
    "should_not_include": ["out_of_stock_items", "gaming_laptops"]
  },
  metadata={
    "original_trace_id": "trace-abc-123",
    "user_feedback": "helpful"
  }
)
```

**Pro tip:** Start with 20-30 representative examples. You can always add more later as you discover new edge cases.

### Step 3: Write Your First Evaluator

Let's start with a simple LLM-as-a-judge evaluator that checks if the agent's response matches the user's preferences.

```python
from langfuse import Langfuse
from langfuse.decorators import observe
from openai import OpenAI

langfuse = Langfuse()
openai = OpenAI()

@observe(as_type="generation")
def evaluate_product_recommendation(input_query: str, agent_output: str, expected_criteria: dict) -> dict:
    """
    Evaluates if the agent's product recommendation matches user preferences.
    Returns a score from 0-10 and reasoning.
    """

    eval_prompt = f"""You are an expert evaluator assessing an AI agent's product recommendation.

User Query: {input_query}

Agent's Recommendation: {agent_output}

Evaluation Criteria:
- Must include: {expected_criteria.get('should_include', [])}
- Must not include: {expected_criteria.get('should_not_include', [])}

Rate the recommendation on a scale of 0-10 where:
- 10 = Perfect match, all criteria met
- 7-9 = Good match, minor issues
- 4-6 = Partial match, some criteria missed
- 0-3 = Poor match, major issues

Respond in JSON format:
{{
  "score": <number 0-10>,
  "reasoning": "<brief explanation>",
  "criteria_met": [<list of met criteria>],
  "criteria_missed": [<list of missed criteria>]
}}"""

    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an expert evaluator. Always respond with valid JSON."},
            {"role": "user", "content": eval_prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.2
    )

    result = response.choices[0].message.content
    return eval(result)  # Parse JSON string to dict

# Run evaluation on a dataset item
dataset_item = langfuse.get_dataset_item("product-recommendations", "item-1")

eval_result = evaluate_product_recommendation(
    input_query=dataset_item.input["user_query"],
    agent_output="[Agent's actual response]",
    expected_criteria=dataset_item.expected_output
)

# Send score back to Langfuse
langfuse.score(
    trace_id=dataset_item.metadata["original_trace_id"],
    name="product_recommendation_quality",
    value=eval_result["score"],
    comment=eval_result["reasoning"]
)
```

### Step 4: Automate Evaluation with Langfuse SDK

Now let's run this evaluator automatically on all new production traces:

```python
import os
from langfuse import Langfuse
from openai import OpenAI

# Initialize clients
langfuse = Langfuse(
    secret_key=os.environ["LANGFUSE_SECRET_KEY"],
    public_key=os.environ["LANGFUSE_PUBLIC_KEY"],
    host="https://cloud.langfuse.com"
)
openai = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def evaluate_trace(trace_id: str):
    """Evaluate a specific trace and add score to Langfuse."""

    # Fetch trace details
    trace = langfuse.fetch_trace(trace_id)

    # Extract input and output
    user_input = trace.input
    agent_output = trace.output

    # Run LLM-as-judge evaluation
    eval_prompt = f"""Evaluate this AI agent interaction for quality.

User Input: {user_input}
Agent Output: {agent_output}

Rate from 0-10 based on:
- Accuracy: Is the information correct?
- Relevance: Does it address the user's question?
- Helpfulness: Does it provide actionable guidance?

Respond with JSON: {{"score": <0-10>, "reasoning": "<explanation>"}}"""

    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": eval_prompt}],
        response_format={"type": "json_object"},
        temperature=0.2
    )

    result = eval(response.choices[0].message.content)

    # Send score to Langfuse
    langfuse.score(
        trace_id=trace_id,
        name="quality_score",
        value=result["score"],
        comment=result["reasoning"]
    )

    return result

# Evaluate recent traces
traces = langfuse.fetch_traces(limit=10, order_by="desc")
for trace in traces:
    eval_result = evaluate_trace(trace.id)
    print(f"Trace {trace.id}: Score {eval_result['score']}/10")
```

### Step 5: Run Evaluations on a Schedule

To catch regressions early, run evaluations automatically on a schedule (e.g., every hour or after every 100 new traces).

**Option A: Simple cron job**

```bash
# crontab -e
0 * * * * /usr/bin/python3 /path/to/run_evals.py
```

**Option B: GitHub Actions (for dataset regression testing)**

```yaml
name: Run Langfuse Evals

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install langfuse openai

      - name: Run evaluations
        env:
          LANGFUSE_SECRET_KEY: ${{ secrets.LANGFUSE_SECRET_KEY }}
          LANGFUSE_PUBLIC_KEY: ${{ secrets.LANGFUSE_PUBLIC_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          python scripts/run_evals.py

      - name: Post results
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Eval Regression Detected',
              body: 'Automated evals failed. Check Langfuse dashboard for details.'
            })
```

**Option C: AWS Lambda (serverless)**

```python
import json
import os
from langfuse import Langfuse

def lambda_handler(event, context):
    """AWS Lambda function to evaluate recent traces."""

    langfuse = Langfuse(
        secret_key=os.environ["LANGFUSE_SECRET_KEY"],
        public_key=os.environ["LANGFUSE_PUBLIC_KEY"]
    )

    # Fetch traces from the last hour
    traces = langfuse.fetch_traces(
        from_timestamp=datetime.now() - timedelta(hours=1)
    )

    results = []
    for trace in traces:
        score = evaluate_trace(trace.id)
        results.append({"trace_id": trace.id, "score": score})

    # Alert on low scores
    low_scores = [r for r in results if r["score"] < 5]
    if low_scores:
        # Send alert via SNS, Slack, etc.
        send_alert(f"Found {len(low_scores)} traces with quality issues")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'evaluated': len(results),
            'low_quality': len(low_scores)
        })
    }
```

## Advanced Eval Patterns

Once you have basic evals running, here are some advanced patterns to level up your evaluation strategy.

### Pattern 1: Multi-Criteria Evaluation

Instead of a single quality score, evaluate multiple dimensions:

```python
def evaluate_multi_criteria(trace_id: str):
    """Evaluate trace across multiple quality dimensions."""

    trace = langfuse.fetch_trace(trace_id)

    criteria = {
        "accuracy": "Is the information factually correct?",
        "relevance": "Does it answer the user's question?",
        "clarity": "Is the response clear and well-structured?",
        "safety": "Does it avoid harmful or biased content?",
        "completeness": "Does it provide enough detail?"
    }

    for criterion_name, criterion_prompt in criteria.items():
        score = evaluate_single_criterion(
            trace,
            criterion_name,
            criterion_prompt
        )

        langfuse.score(
            trace_id=trace_id,
            name=f"eval_{criterion_name}",
            value=score["value"],
            comment=score["reasoning"]
        )
```

This gives you granular insights: "Accuracy is great, but clarity needs work."

### Pattern 2: Comparative Evaluation (A/B Testing)

Test if your new prompt actually improves quality:

```python
from langfuse import Langfuse

langfuse = Langfuse()

# Run experiment with two prompt versions
experiment = langfuse.create_experiment(
    name="prompt-optimization-v2",
    dataset_name="product-recommendations"
)

# Version A: Current prompt
results_a = []
for item in dataset:
    output_a = run_agent_with_prompt(item.input, prompt_version="v1")
    score_a = evaluate_output(item.input, output_a, item.expected)
    results_a.append(score_a)

    experiment.log_run(
        variant="prompt_v1",
        input=item.input,
        output=output_a,
        scores={"quality": score_a}
    )

# Version B: New prompt
results_b = []
for item in dataset:
    output_b = run_agent_with_prompt(item.input, prompt_version="v2")
    score_b = evaluate_output(item.input, output_b, item.expected)
    results_b.append(score_b)

    experiment.log_run(
        variant="prompt_v2",
        input=item.input,
        output=output_b,
        scores={"quality": score_b}
    )

# Compare results
avg_a = sum(results_a) / len(results_a)
avg_b = sum(results_b) / len(results_b)

print(f"Prompt v1 average score: {avg_a}")
print(f"Prompt v2 average score: {avg_b}")
print(f"Improvement: {((avg_b - avg_a) / avg_a * 100):.2f}%")
```

View side-by-side comparisons in Langfuse's experiment UI.

### Pattern 3: Retrieval Quality Evaluation (for RAG agents)

If your agent uses RAG (retrieval-augmented generation), evaluate retrieval quality separately:

```python
def evaluate_retrieval_quality(trace_id: str):
    """Evaluate if retrieved documents are relevant to the query."""

    trace = langfuse.fetch_trace(trace_id)

    # Extract retrieval span
    retrieval_span = [s for s in trace.spans if s.name == "retrieval"][0]

    query = retrieval_span.input["query"]
    retrieved_docs = retrieval_span.output["documents"]

    # LLM-as-judge: Rate each document's relevance
    relevance_scores = []
    for doc in retrieved_docs:
        eval_prompt = f"""Rate how relevant this document is to the query.

Query: {query}

Document: {doc['content'][:500]}...

Score 0-10 where 10 = perfectly relevant, 0 = completely irrelevant.

JSON response: {{"score": <0-10>, "reasoning": "<explanation>"}}"""

        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": eval_prompt}],
            response_format={"type": "json_object"}
        )

        result = eval(response.choices[0].message.content)
        relevance_scores.append(result["score"])

    # Average relevance score
    avg_relevance = sum(relevance_scores) / len(relevance_scores)

    langfuse.score(
        trace_id=trace_id,
        name="retrieval_relevance",
        value=avg_relevance,
        comment=f"Avg relevance of {len(retrieved_docs)} documents"
    )

    return avg_relevance
```

### Pattern 4: User Feedback as Ground Truth

The gold standard: let real users tell you what's good.

```python
# When user provides feedback (thumbs up/down)
@app.post("/feedback")
def record_feedback(trace_id: str, feedback: str, user_comment: str = ""):
    """Record user feedback as a score in Langfuse."""

    score_value = 1.0 if feedback == "thumbs_up" else 0.0

    langfuse.score(
        trace_id=trace_id,
        name="user_satisfaction",
        value=score_value,
        comment=user_comment,
        data_type="BOOLEAN"
    )

    # If negative feedback, flag for review
    if score_value == 0.0:
        langfuse.add_to_dataset(
            dataset_name="negative-feedback",
            trace_id=trace_id
        )

    return {"status": "recorded"}
```

Then correlate user feedback with your automated eval scores to validate that your evals predict real-world satisfaction.

## Monitoring Eval Results: Dashboards and Alerts

Langfuse provides built-in dashboards, but you can also build custom monitoring:

### Dashboard Metrics to Track

1. **Average eval score over time** (are you improving?)
2. **Score distribution** (how consistent is quality?)
3. **Percentage of traces below threshold** (e.g., score < 7)
4. **Eval score by agent version** (did the latest change help or hurt?)
5. **Eval score by user segment** (do power users get better results?)
6. **Correlation between eval scores and user feedback** (do your evals match reality?)

### Setting Up Alerts

```python
import os
from slack_sdk import WebClient

slack = WebClient(token=os.environ["SLACK_TOKEN"])

def check_quality_regression():
    """Check if recent quality scores dropped below threshold."""

    # Fetch eval scores from last 24 hours
    recent_scores = langfuse.get_scores(
        name="quality_score",
        from_timestamp=datetime.now() - timedelta(days=1)
    )

    avg_score = sum(s.value for s in recent_scores) / len(recent_scores)

    # Alert if average drops below 7.0
    if avg_score < 7.0:
        slack.chat_postMessage(
            channel="#ai-agent-alerts",
            text=f"🚨 Quality regression detected! Avg score: {avg_score:.2f}/10 (threshold: 7.0)\n\nView traces: https://cloud.langfuse.com/project/[id]/traces"
        )
```

Run this check hourly via cron or AWS EventBridge.

## Real-World Eval Workflow: Week-by-Week Iteration

Here's what continuous improvement looks like in practice:

### Week 1: Baseline
- Deploy agent with Langfuse tracing
- Collect 1000+ production traces
- Review traces manually, note failure patterns
- Create first dataset (20-30 examples)
- Write first evaluator (simple quality check)
- Baseline score: **6.8/10**

### Week 2: Fix Low-Hanging Fruit
- Identify top 3 failure modes from evals
- Fix obvious bugs (tool config, prompt issues)
- Re-run evals on dataset
- New score: **7.4/10** ⬆️

### Week 3: Prompt Optimization
- Run A/B test: current prompt vs. improved version
- Evaluator shows v2 is 12% better
- Deploy v2 to production
- New score: **7.9/10** ⬆️

### Week 4: Add Multi-Criteria Evals
- Break quality into dimensions (accuracy, relevance, clarity)
- Discover: accuracy is great [8.5], but clarity needs work [6.2]
- Focus optimization on response structure
- New clarity score: **7.8/10** ⬆️
- Overall score: **8.2/10** ⬆️

### Week 5+: Continuous Monitoring
- Evals run automatically on all production traces
- Alert fires if score drops below 7.5
- Dataset grows to 100+ examples from real edge cases
- Regression testing prevents new changes from breaking old fixes
- Steady improvement continues...

## Common Pitfalls and How to Avoid Them

### Pitfall 1: Over-Optimizing for Your Evals
**Problem:** You improve eval scores but user satisfaction doesn't change.

**Solution:** Always validate eval scores against real user feedback. If your eval says 9/10 but users complain, your eval criteria are wrong.

### Pitfall 2: Dataset Drift
**Problem:** Your dataset becomes stale as your agent evolves.

**Solution:** Continuously add new edge cases from production. Aim to add 5-10 new examples per week.

### Pitfall 3: Ignoring Statistical Significance
**Problem:** You declare victory after testing on 5 examples.

**Solution:** Use at least 30+ examples for meaningful comparisons. Calculate confidence intervals.

```python
from scipy import stats

def compare_with_confidence(scores_a, scores_b):
    """Compare two sets of eval scores with statistical test."""
    t_stat, p_value = stats.ttest_ind(scores_a, scores_b)

    if p_value < 0.05:
        print(f"Statistically significant improvement (p={p_value:.4f})")
    else:
        print(f"No significant difference (p={p_value:.4f})")
```

### Pitfall 4: Eval Prompt Ambiguity
**Problem:** Your LLM-as-judge gives inconsistent scores because the eval prompt is vague.

**Solution:** Be extremely specific in eval prompts. Include examples of 10/10, 5/10, and 0/10 responses.

### Pitfall 5: Ignoring Cost
**Problem:** Running evals on every production trace with GPT-4 costs $500/day.

**Solution:**
- Use cheaper models for evals (GPT-4o-mini, Claude Haiku)
- Sample traces (e.g., evaluate 10% randomly)
- Use deterministic checks where possible (cheaper than LLM calls)

## Next Steps: Building Your Eval Strategy

**This week:**
1. Set up Langfuse tracing (or verify it's working in Answer Agent)
2. Collect 100+ production traces
3. Manually review traces and document 3-5 failure patterns
4. Create your first dataset with 20 examples

**Next week:**
1. Write your first evaluator (start simple: single quality score)
2. Run it on your dataset
3. Calculate baseline average score
4. Identify 2-3 specific improvements to make

**Month 1:**
1. Automate evaluation on new traces (hourly cron job)
2. Set up alerts for quality regressions
3. Grow dataset to 50+ examples
4. Run your first A/B test (prompt optimization)

**Month 2+:**
1. Add multi-criteria evals (accuracy, relevance, safety, etc.)
2. Implement user feedback collection
3. Correlate eval scores with real user satisfaction
4. Build custom dashboards for your team

**[Want a personalized roadmap for your evaluation strategy? Book a planning session →](https://calendly.com/brad-theanswer/answeragent-intro)**

## What's Next in the Series?

Now that you have automated evals running, you'll need to debug when things go wrong and train human reviewers to validate quality. Here's where to go next:

### 🐛 Debugging When Evals Fail

**[Debugging AI Agents with Langfuse →](/blog/debugging-ai-agents-langfuse-observability)**

Learn to trace failures step-by-step, analyze root causes using spans and observations, and validate that your fixes actually work. This post covers:
- Understanding traces and sessions for multi-turn debugging
- Using evaluation data to identify systematic failures
- Real-world debugging workflows from problem to fix

**[Need help debugging production issues? Let's talk →](https://calendly.com/brad-theanswer/answeragent-intro)**

### 👥 Training Human Reviewers

**[Human Review Training Guide →](/blog/human-review-training-scoring-ai-agents-langfuse)**

Your automated evals need human validation. This complete training manual shows domain experts how to:
- Score AI outputs using the 1-5 rubric
- Provide feedback that improves the system
- Balance efficiency with quality (1-2 minutes per review)

### 🔄 Understanding Human-in-the-Loop

**[Human at the Center →](/blog/human-at-the-center-building-reliable-ai-agents)**

See how human expertise and automated evals work together to create reliable AI systems. Learn the feedback loop that turns sporadic wins into consistent performance.

---

## Conclusion: Evals Are Your Competitive Advantage

Automated evaluations transform AI agents from unpredictable black boxes into systems you can confidently improve and deploy. While your competitors are manually testing and hoping for the best, you're systematically measuring, iterating, and compounding improvements every week.

Langfuse provides the infrastructure. Answer Agent gives you the tracing for free. The only thing left is defining what "good" means for your use case—and that's the valuable, differentiated work that only you can do.

Start small. Add one evaluator this week. Measure one thing. Then build on it. In three months, you'll have a robust eval system that catches regressions before users do and guides every architectural decision with data.

**Ready to implement automated evals for your AI agents?** [Schedule a demo](https://calendly.com/brad-theanswer/answeragent-intro) to see how Answer Agent + Langfuse can accelerate your agent development.

---

## Frequently Asked Questions

### What's the difference between observability and evals?

**Observability** tells you **what happened** in your agent's execution: which tools were called, what prompts were sent, what responses came back, and how long each step took. It's about understanding the mechanics of your system.

**Evals (evaluations)** tell you **how well it happened**: was the response accurate? Did it follow instructions? Was it helpful? Evals measure quality and outcomes.

Think of observability as your car's dashboard (speed, RPM, fuel level) and evals as a driving instructor grading your performance (did you follow traffic rules, drive smoothly, arrive safely?).

Together, they create a feedback loop: observability shows you what to improve, and evals measure if your improvements actually worked.

### How many evaluation examples do I need in my dataset?

Start with **20-30 representative examples** to cover your main use cases and common edge cases. This is enough to:
- Catch major regressions when you change prompts or models
- Identify obvious failure patterns
- Get a directional signal on quality improvements

As you grow, aim for **50-100+ examples** to:
- Achieve statistical significance in A/B tests
- Cover long-tail edge cases
- Build confidence in automated decisions

**Key principle:** Continuously add new examples from production failures. Your dataset should evolve as your agent evolves. Budget 30 minutes per week to review production traces and add 5-10 new test cases.

### Should I use GPT-4 or GPT-4o-mini for LLM-as-a-judge evaluations?

**GPT-4o-mini is usually the right choice** for these reasons:

1. **Cost:** 15x cheaper than GPT-4 ($0.15/1M input tokens vs. $2.50/1M)
2. **Speed:** 2-3x faster responses
3. **Quality:** Sufficient for most evaluation tasks (rating 0-10, checking criteria)

**Use GPT-4 or Claude Sonnet when:**
- Evaluating complex reasoning chains
- Judging nuanced quality dimensions (e.g., tone, empathy)
- Your eval accuracy must match expert human reviewers

**Pro tip:** Start with GPT-4o-mini. If you find eval scores don't correlate with user feedback, upgrade to GPT-4 for that specific evaluator. Most teams run 80%+ of evals on cheaper models.

### How often should automated evals run?

It depends on your production volume and iteration speed:

**High-volume production (1000+ traces/day):**
- Run evals every 1-6 hours
- Evaluate a **random sample** (10-20%) to control costs
- Alert immediately on quality drops below threshold

**Medium volume (100-1000 traces/day):**
- Run evals once or twice daily
- Evaluate most or all traces
- Review dashboard daily for trends

**Low volume / development phase:**
- Run evals on-demand after each deployment
- Evaluate all traces
- Manually review results before next iteration

**Regression testing (dataset-based):**
- Run on every code/prompt change (CI/CD)
- Run daily as a safety check
- Run before production deploys (gate)

**Key principle:** Evals should run frequently enough to catch regressions before users do, but not so frequently that cost becomes prohibitive.

### What's the difference between Langfuse datasets and production traces?

**Production traces** are real user interactions captured automatically as your agent runs. They show actual usage patterns, edge cases, and failures that happen in the wild. Every conversation is a trace.

**Datasets** are curated collections of examples used for regression testing and experiments. You create datasets by:
1. Selecting interesting production traces
2. Manually creating test cases
3. Importing examples from other sources

Think of datasets as your "unit tests" for agent quality—stable, versioned examples you run repeatedly to ensure changes don't break existing behavior.

**Use production traces for:**
- Discovering new failure modes
- Monitoring real-world quality trends
- Understanding actual user needs

**Use datasets for:**
- A/B testing prompt changes
- Preventing regressions
- Validating improvements against known cases

### Can I use custom Python code for evaluators, or do I have to use LLM-as-a-judge?

**You can absolutely use custom Python code** for evaluations. In fact, you should use a mix of evaluation methods:

**Deterministic/Rule-based evaluators (Python code):**
```python
def evaluate_response_format(output: str) -> dict:
    """Check if output matches required format."""
    score = 0.0
    issues = []

    # Check required fields
    if "recommendation:" in output.lower():
        score += 0.5
    else:
        issues.append("Missing 'recommendation' section")

    # Check length
    if 100 <= len(output) <= 500:
        score += 0.5
    else:
        issues.append(f"Length {len(output)} outside range 100-500")

    return {
        "score": score,
        "issues": issues
    }
```

**Best for:** Format validation, length checks, required field detection, deterministic criteria.

**LLM-as-judge evaluators:**
Best for: Semantic quality, relevance, accuracy, tone, nuanced judgments.

**Recommendation:** Use deterministic checks for what you *can* check deterministically (cheaper, faster, more reliable), and use LLM-as-judge for subjective quality assessments.

### How do I handle evaluation disagreements when using LLM-as-a-judge?

LLM evaluators can be inconsistent, especially with vague criteria. Here's how to improve reliability:

**1. Use temperature 0.0-0.2** for evaluation calls (more deterministic).

**2. Provide explicit scoring rubrics** in your eval prompt:
```
Rate from 0-10 where:
- 10: Perfect response, all criteria met, no issues
- 8-9: High quality, minor issues only
- 6-7: Acceptable, some issues but usable
- 4-5: Below standard, multiple issues
- 0-3: Unacceptable, major problems
```

**3. Use structured output** (JSON mode) to force consistent format:
```python
response_format={"type": "json_object"}
```

**4. Run multiple evaluators** and average scores (ensemble approach):
```python
scores = [
    gpt4_mini_evaluator(trace),
    claude_haiku_evaluator(trace),
    gpt4_evaluator(trace)
]
final_score = sum(scores) / len(scores)
```

**5. Validate against human judgments:** Periodically have humans score the same traces and check correlation. If correlation < 0.7, your eval prompt needs work.

### What if my eval scores look great but users are still unhappy?

This is a critical signal that **your evaluation criteria don't match real user needs**. Here's how to diagnose and fix it:

**Step 1: Collect user feedback**
Add thumbs up/down buttons to your agent interface and record explicit user satisfaction:
```python
langfuse.score(
    trace_id=trace_id,
    name="user_satisfaction",
    value=1.0 if thumbs_up else 0.0
)
```

**Step 2: Correlate eval scores with user feedback**
```python
# Fetch traces with both eval scores and user feedback
traces_with_both = fetch_traces_with_scores(
    eval_score_name="quality_score",
    user_score_name="user_satisfaction"
)

# Calculate correlation
eval_scores = [t.eval_score for t in traces_with_both]
user_scores = [t.user_score for t in traces_with_both]

correlation = pearson_correlation(eval_scores, user_scores)
print(f"Correlation: {correlation}")  # Should be > 0.7
```

**Step 3: Investigate mismatches**
Find traces where eval score is high but user feedback is negative:
```python
mismatches = [
    t for t in traces_with_both
    if t.eval_score > 8.0 and t.user_score == 0.0
]

# Manually review these traces to understand the gap
```

**Step 4: Update evaluation criteria**
Based on what you learn, adjust your eval prompts to match what users actually care about. Often, the mismatch reveals that you're optimizing for the wrong things (e.g., verbosity when users want conciseness).

### Should I evaluate every production trace or just a sample?

**Sample if:**
- You have high volume (1000+ traces/day)
- Eval costs are significant (using GPT-4 or complex multi-step evals)
- You need real-time dashboards but don't need per-trace scores

**Evaluate everything if:**
- Volume is manageable (< 500 traces/day)
- Using cheap evaluators (GPT-4o-mini, Claude Haiku, or deterministic checks)
- You want per-trace scores for debugging or user support

**Sampling strategies:**
1. **Random sampling:** Evaluate 10-20% of traces uniformly
2. **Stratified sampling:** Ensure you sample across different user segments, times of day, agent versions
3. **Intelligent sampling:** Evaluate 100% of traces with negative user feedback, low confidence scores, or error flags + 10% of others

**Code example:**
```python
import random

def should_evaluate(trace: dict) -> bool:
    """Decide if this trace should be evaluated."""

    # Always evaluate if user gave negative feedback
    if trace.get("user_feedback") == "negative":
        return True

    # Always evaluate if agent had low confidence
    if trace.get("confidence_score", 1.0) < 0.7:
        return True

    # Otherwise, sample 10% randomly
    return random.random() < 0.10
```

### How do I evaluate multi-turn conversations vs. single interactions?

For single-turn interactions (one user input → one agent response), evaluate the final output directly.

For multi-turn conversations, you have three approaches:

**Approach 1: Evaluate each turn independently**
```python
for turn in conversation.turns:
    score = evaluate_single_turn(turn.user_input, turn.agent_output)
    langfuse.score(trace_id=turn.trace_id, name="turn_quality", value=score)

# Average across turns
avg_score = sum(scores) / len(scores)
```

**Approach 2: Evaluate conversation outcomes**
```python
# Did the full conversation achieve the user's goal?
eval_prompt = f"""
User's initial goal: {conversation.first_message}

Full conversation: {conversation.all_turns}

Did the agent successfully help the user achieve their goal? Rate 0-10.
"""
```

**Approach 3: Hybrid (turn quality + overall outcome)**
```python
# Evaluate each turn (did the agent respond appropriately?)
turn_scores = [evaluate_turn(t) for t in conversation.turns]

# Evaluate overall outcome (did conversation succeed?)
outcome_score = evaluate_conversation_outcome(conversation)

# Combined score
final_score = 0.7 * outcome_score + 0.3 * avg(turn_scores)
```

**Recommendation:** For task-oriented agents (e.g., customer support, booking systems), focus on **overall outcome**. For open-ended agents (e.g., brainstorming, coaching), evaluate **per-turn quality**.

### Can I use Langfuse if I'm not using LangChain or LlamaIndex?

**Yes!** Langfuse is framework-agnostic. While it has first-class integrations with LangChain and LlamaIndex, you can use it with:

- **Raw OpenAI SDK calls**
- **Anthropic SDK (Claude)**
- **Custom agent frameworks**
- **Any Python/TypeScript code**

**How to trace custom code:**

```python
from langfuse import Langfuse
from langfuse.decorators import observe

langfuse = Langfuse()

@observe()
def my_custom_agent(user_input: str) -> str:
    """Custom agent logic without LangChain."""

    # Your custom code here
    prompt = build_custom_prompt(user_input)

    # Trace the LLM call
    with langfuse.generation(name="llm_call") as gen:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        gen.end(output=response.choices[0].message.content)

    # Trace tool calls
    with langfuse.span(name="tool_execution") as span:
        result = execute_custom_tool(response)
        span.end(output=result)

    return result
```

**Answer Agent's advantage:** If you're using Answer Agent with its built-in Langfuse integration, all tracing happens automatically regardless of framework. But if you're building custom agents, you can still use Langfuse—it just requires manual instrumentation.

### How do I prevent eval scores from being gamed or manipulated?

If your evals directly influence decisions (e.g., bonuses, promotions, product launches), there's risk of gaming the system. Here's how to maintain integrity:

**1. Use multiple evaluation methods** (can't game them all):
- LLM-as-judge scores
- Deterministic checks
- User feedback
- Expert human review (gold standard)

**2. Don't rely solely on automated evals** for high-stakes decisions. Use them to *guide* decisions, not make them.

**3. Randomly audit eval results** with human reviewers:
```python
# Randomly select 5% of traces for human review
audit_sample = random.sample(evaluated_traces, k=int(len(evaluated_traces) * 0.05))

# Compare human scores to automated scores
for trace in audit_sample:
    human_score = get_human_review(trace.id)
    auto_score = trace.eval_score

    if abs(human_score - auto_score) > 2.0:
        flag_for_investigation(trace.id, "Large human-auto score discrepancy")
```

**4. Monitor for suspicious patterns:**
- Sudden spikes in eval scores without corresponding user feedback improvement
- Eval scores that are always exactly 10/10 (suspiciously perfect)
- Scores that don't correlate with downstream metrics (retention, NPS, etc.)

**5. Use hidden test sets** that developers don't have access to (like Kaggle's public vs. private leaderboards).

### What's the relationship between Langfuse scores and Answer Agent analytics?

**Langfuse** is a dedicated observability and evaluation platform. It provides:
- Detailed trace capture (every LLM call, tool use, reasoning step)
- Evaluation infrastructure (LLM-as-judge, datasets, experiments)
- Long-term trend analysis
- Custom dashboards

**Answer Agent** provides built-in analytics for operational monitoring:
- Chatflow execution counts
- Token usage and costs
- Error rates
- Basic performance metrics

**How they work together:**

Answer Agent automatically sends all traces to Langfuse (when configured). Langfuse provides the deep evaluation and quality analysis layer on top of Answer Agent's operational metrics.

Think of it as:
- **Answer Agent analytics:** "Is my agent running? How many requests? Any errors?"
- **Langfuse:** "Is my agent providing high-quality responses? Where are the quality issues? Are improvements working?"

You use both. Answer Agent for real-time ops monitoring, Langfuse for quality deep dives and continuous improvement.

### How do I get started with evals if I'm completely new to this?

**Week 1: Foundation**

Day 1-2: Set up tracing
- If using Answer Agent: Add Langfuse credential, attach to agent
- If custom code: Instrument with Langfuse SDK
- Verify traces appear in Langfuse dashboard

Day 3-4: Collect data
- Run your agent with real or test queries
- Aim for 50-100 traces
- Manually review traces in Langfuse UI

Day 5: Identify patterns
- Note 3-5 examples of good responses
- Note 3-5 examples of bad responses
- Write down what makes them good or bad

**Week 2: First Evaluator**

Day 1-2: Create dataset
- Add 10 good examples to a Langfuse dataset
- Add 10 bad examples
- Write expected criteria for each

Day 3-4: Write evaluator
- Start with a simple LLM-as-judge evaluator
- Use the code examples from this article
- Test on your 20 examples manually

Day 5: Calculate baseline
- Run evaluator on all 20 examples
- Calculate average score
- This is your baseline (e.g., 6.5/10)

**Week 3: First Improvement**

Day 1-2: Identify one improvement
- Based on eval results, pick one specific thing to fix
- Example: "Agent is too verbose" or "Agent misses key details"

Day 3-4: Make the change
- Modify prompt, adjust settings, or fix bug
- Re-run evaluator on dataset

Day 5: Measure impact
- Compare new scores to baseline
- If improved, deploy to production
- If not, try something else

**Week 4+: Automate and Expand**

- Set up automated eval runs (cron job)
- Add more examples to dataset (aim for 50+)
- Add more evaluators (multi-criteria)
- Monitor trends over time

**Key principle:** Start small and simple. One evaluator, 20 examples, one metric. Build from there.

### How much does running automated evals cost?

Cost depends on your evaluation strategy, but here are realistic estimates:

**Low-cost setup (recommended for most teams):**
- Evaluator: GPT-4o-mini ($0.15 per 1M input tokens)
- Eval prompt length: ~500 tokens per evaluation
- Cost per eval: ~$0.0001 (0.01 cents)
- 1000 evals/day: **$0.10/day or $3/month**

**Medium-cost setup (high quality):**
- Evaluator: GPT-4 ($2.50 per 1M input tokens)
- Eval prompt length: ~500 tokens per evaluation
- Cost per eval: ~$0.0015 (0.15 cents)
- 1000 evals/day: **$1.50/day or $45/month**

**High-volume production:**
- 10,000 traces/day
- Sample 10% for eval (1000 evals/day)
- Using GPT-4o-mini
- **$3/month**

**Optimization strategies:**

1. **Use cheaper models** for simple checks (GPT-4o-mini, Claude Haiku)
2. **Sample traces** instead of evaluating 100%
3. **Cache eval results** for dataset regression tests
4. **Use deterministic checks** where possible (free!)
5. **Batch evaluations** to reduce API overhead

**Bottom line:** For most teams, eval costs are $10-50/month—negligible compared to the value of catching quality issues before users do.

### Can I run Langfuse on-premises or do I have to use the cloud?

**You can self-host Langfuse** on your own infrastructure. This is common for:
- Enterprise teams with strict data residency requirements
- Highly regulated industries (healthcare, finance)
- Organizations that can't send data to third-party clouds

**Self-hosting options:**

1. **Docker Compose** (simple local/small deployments)
2. **Kubernetes** (production-grade, scalable)
3. **Cloud VMs** (AWS, GCP, Azure)

See [Langfuse self-hosting docs](https://langfuse.com/docs/deployment/self-host) for detailed setup guides.

**Cloud vs. self-hosted trade-offs:**

| Feature | Langfuse Cloud | Self-Hosted |
|---------|----------------|-------------|
| **Setup** | 5 minutes | Hours to days |
| **Maintenance** | Zero (managed) | Ongoing (you manage) |
| **Scaling** | Automatic | Manual |
| **Cost** | Free tier + usage-based | Infrastructure + eng time |
| **Data control** | On Langfuse servers | On your infrastructure |
| **SLA** | Langfuse's uptime | Your uptime |

**Recommendation:** Start with Langfuse Cloud (free tier) to validate the eval workflow. If data residency becomes a requirement later, migrate to self-hosted. Don't prematurely optimize infrastructure.

### What happens if my evaluator gives false positives (rates bad outputs as good)?

False positives are a serious problem—they give you false confidence and let quality issues slip through. Here's how to detect and fix them:

**Detection:**

1. **Compare eval scores to user feedback:**
   - Find traces where eval score > 8 but user feedback is negative
   - Manually review those traces to understand what the evaluator missed

2. **Spot check high scores:**
   - Randomly review traces that scored 9-10/10
   - If you disagree with the score, your eval criteria are too loose

3. **Look for suspiciously perfect scores:**
   - If everything scores 10/10, your evaluator isn't discriminating
   - Good evals should show a distribution (some 6s, some 7s, some 9s)

**Fixes:**

1. **Tighten eval criteria:**
```python
# Before (too loose)
"Rate the response quality from 0-10"

# After (more specific)
"Rate from 0-10 based on:
- Accuracy: All facts must be verifiable (0 = hallucinations present)
- Completeness: Must address every part of user's question
- Format: Must use requested structure (bullet points, numbered list, etc.)

Deduct 2 points for any hallucination.
Deduct 1 point for missing any part of the question."
```

2. **Use multiple evaluators:**
```python
# Require consensus from multiple models
scores = [
    gpt4_mini_eval(trace),
    claude_haiku_eval(trace),
    gpt4_eval(trace)
]

# Flag if there's disagreement
if max(scores) - min(scores) > 3:
    flag_for_human_review(trace)
```

3. **Add ground truth checks:**
```python
# If you have reference materials, check grounding
def evaluate_with_ground_truth(output: str, reference_docs: list):
    """Verify claims against source documents."""
    claims = extract_claims(output)

    for claim in claims:
        if not verify_claim_in_docs(claim, reference_docs):
            return {"score": 0, "reason": f"Unverified claim: {claim}"}

    return {"score": 10, "reason": "All claims verified"}
```

**Key principle:** Validate your evaluators regularly against human judgment. Evals are only valuable if they accurately reflect real quality.

### How do I evaluate agent behavior that requires domain expertise to judge?

For specialized domains (medical, legal, technical, etc.), generic LLM-as-judge evaluators may not have the expertise to accurately evaluate quality. Here are strategies:

**Strategy 1: Build domain-specific eval prompts**
```python
eval_prompt = f"""You are a medical professional evaluating an AI health assistant's response.

Patient question: {user_input}
AI response: {agent_output}

Evaluate based on these medical criteria:
- Medical accuracy: Are diagnoses/treatments evidence-based?
- Safety: Does it include appropriate disclaimers (not medical advice, see doctor)?
- Completeness: Does it address symptoms, potential causes, and next steps?
- Clarity: Is medical terminology explained for laypersons?

Rate 0-10 and cite specific medical issues if score < 8.

Note: You are evaluating medical correctness, NOT providing medical advice to the patient.
"""
```

**Strategy 2: Use expert human reviewers**
- Select a subset of traces for expert review
- Have domain experts score them
- Use these expert scores to:
  1. Validate automated eval accuracy
  2. Train more accurate evaluators
  3. Build a "gold standard" dataset

**Strategy 3: Use retrieval-augmented evaluation**
```python
def evaluate_with_domain_knowledge(output: str, knowledge_base: list):
    """Evaluate agent output against authoritative domain sources."""

    # Retrieve relevant authoritative sources
    relevant_sources = retrieve_sources(output, knowledge_base)

    # LLM-as-judge with domain context
    eval_prompt = f"""You are evaluating an AI assistant's response for technical accuracy.

AI Response: {output}

Authoritative Sources:
{format_sources(relevant_sources)}

Rate technical accuracy 0-10. Deduct points for any claims that contradict authoritative sources.
"""

    score = llm_evaluate(eval_prompt)
    return score
```

**Strategy 4: Multi-stage evaluation**
1. **Stage 1:** Automated check for obvious issues (format, safety disclaimers, length)
2. **Stage 2:** LLM-as-judge for general quality
3. **Stage 3:** Human expert review for traces that pass stages 1-2 but are borderline (score 6-8)

**Recommendation:** Start with automated evals to catch obvious issues (90% of problems). Use expert review for the remaining 10% where nuance matters.
