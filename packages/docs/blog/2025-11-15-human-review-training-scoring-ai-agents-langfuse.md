---
slug: human-review-training-scoring-ai-agents-langfuse
title: "Human Review Training: Scoring AI Agents in Langfuse for Better Evaluation"
authors: [bradtaylorsf]
tags: [ai-agents, evaluation, langfuse, human-in-the-loop, observability, training]
description: "Complete training guide for domain experts on how to review and score AI agent responses in Langfuse. Learn the 1-5 scoring rubric, annotation workflow, and best practices for human evaluation that improves agent performance."
---

**📚 AI Agent Evaluation Series - Part 5 of 5**

1. [Observability & Evals: Why They Matter ←](/blog/observability-evals-ai-agents-survival-tools-v2)
2. [Human-in-the-Loop Evaluation ←](/blog/human-at-the-center-building-reliable-ai-agents)
3. [Implementing Automated Evals ←](/blog/automated-evals-ai-agents-langfuse-answer-agent)
4. [Debugging AI Agents ←](/blog/debugging-ai-agents-langfuse-observability)
5. **Human Review Training Guide** ← You are here

---

# Human Review Training: Scoring AI Agents in Langfuse for Better Evaluation

If you're a domain expert who's been asked to review AI agent responses in Langfuse, this guide is for you. You don't need to be a technical expert or an AI specialist—you just need to bring your domain knowledge and judgment to help improve the AI system.

This is training content designed to help you understand exactly what to look for, how to score responses, and how to provide feedback that makes a real difference. Think of this as your handbook for becoming an effective AI reviewer.

**What you'll learn:**
- The exact 1-5 scoring rubric with real examples
- How to use Langfuse's annotation queue efficiently
- Copy-paste comment templates for common scenarios
- Best practices for consistent, high-quality reviews
- Why your 1-2 minutes of judgment matters more than spending hours

Let's get you ready to make a meaningful impact.

<!-- truncate -->

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <iframe
    width="560"
    height="315"
    src="https://www.youtube.com/embed/KdRboeJjUtc"
    title="Human Review Training for AI Agents"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
    style={{maxWidth: '100%', height: 'auto', aspectRatio: '16/9'}}
  ></iframe>
</div>

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <iframe
    src="https://gamma.app/embed/elka38sxaofmlgb"
    style={{width: '700px', maxWidth: '100%', height: '450px'}}
    allow="fullscreen"
    title="Human Review Training Presentation"
  ></iframe>
</div>

## Why Your Review Matters: You're Not Training a Replacement

Before we dive into the how-to, let's address the elephant in the room: "Am I training my replacement?"

**No. You're scaling your judgment.**

Think about it this way: you're a domain expert with years of experience. You can answer complex questions in your sleep. But you can only answer one question at a time, during business hours, when you're available.

The AI agent is learning from you to handle the routine questions—the ones that follow patterns you've seen hundreds of times. This frees you up to focus on the complex cases, the edge cases, the situations that truly require your expertise and judgment.

**Your role is evolving from:**
- Answering every single question → Reviewing patterns and training on the trickiest cases
- Being the bottleneck → Being the quality standard
- Doing repetitive work → Doing strategic, high-value work

Your reviews help the AI get better at the routine stuff so you can focus on what you do best: solving problems that require real human expertise.

**[Building a human-in-the-loop review system? Get training materials and workflow design support →](https://calendly.com/brad-theanswer/answeragent-intro)**

## The Goal: Quality Over Quantity

Here's a critical mindset shift: **You don't need to score every single response, and you don't need to spend 10 minutes on each one.**

**What works:**
- Review for 1-2 minutes per response
- Trust your gut—you're the domain expert
- Focus on clear wins (5s) and clear problems (1-2s)
- Let the 3s be quick "it's fine" assessments

**What doesn't work:**
- Overthinking every detail
- Trying to achieve 100% coverage
- Spending hours on single reviews
- Second-guessing your expertise

The AI systems learn from patterns. 20 high-quality, confident reviews are worth more than 100 wishy-washy ones where you weren't sure. Your judgment is valuable—trust it.

## Understanding the Annotation Workflow in Langfuse

Before we get to scoring, let's walk through the actual workflow in Langfuse. This is your daily tool, so let's make sure you're comfortable with it.

### Step 1: Accessing the Annotation Queue

1. **Log in to Langfuse** with your credentials
2. **Navigate to the Annotation Queue** (typically found in the left sidebar under "Evaluation" or "Annotations")
3. **You'll see a list of traces** waiting for review—these are AI agent interactions that need your expert judgment

:::tip What's a Trace?
A trace is a complete interaction between a user and the AI agent. It includes the user's question, the agent's response, any tool calls made, and metadata about the interaction. Think of it as one complete conversation thread.
:::

### Step 2: Reviewing a Trace

When you open a trace, you'll see:

- **User Question:** What the user asked
- **Agent Response:** What the AI replied with
- **Context Used:** What sources or tools the agent consulted
- **Metadata:** Timestamp, session info, any previous scores

**Your job:** Evaluate whether the agent's response was helpful, accurate, and appropriate for the user's question.

### Step 3: Adding Your Score

1. **Click the "Add Score" button** (usually in the top right or bottom of the trace view)
2. **Select the score type** (e.g., "Human Review" or "Expert Score")
3. **Enter your score** using the 1-5 rubric (detailed below)
4. **Add a comment** explaining your reasoning (templates provided below)
5. **Submit** the score

:::tip Quick Scores vs. Detailed Reviews
For clear 5s and 1s, a quick comment is fine. For 2s, 3s, and 4s, provide more detail—these are the learning opportunities for the AI team.
:::

### Step 4: Moving to the Next Item

- **Click "Next" or use keyboard shortcuts** (check Langfuse docs for your specific shortcuts)
- **Don't overthink it**—trust your domain expertise
- **Set a timer if it helps**—aim for 1-2 minutes per review

### Workflow Tips

- **Batch your reviews:** Set aside 30-60 minutes, review 20-30 traces in one session
- **Start with easy ones:** Build momentum with clear 5s and 1s before tackling the gray areas
- **Use filters:** If Langfuse allows filtering by topic, complexity, or agent type, use it to focus your reviews
- **Take breaks:** Your judgment is your value—don't burn out

**For detailed Langfuse annotation workflow:**
- [Langfuse Human Annotation Guide](https://langfuse.com/docs/evaluation/evaluation-methods/annotation)
- [Langfuse Manual Scores](https://langfuse.com/docs/scores/manually)

**[Need hands-on training for your review team? Get personalized onboarding sessions →](https://calendly.com/brad-theanswer/answeragent-intro)**

## The 1-5 Scoring Rubric: Your North Star

This is the heart of your review process. The rubric is designed to be clear, actionable, and consistent across reviewers. Let's break down each score level with concrete examples.

### Score 5: Excellent Response

**Definition:** This response is exactly what you would have provided. It's accurate, helpful, appropriate in tone, and uses the right sources.

**When to use:**
- The answer fully addresses the user's question
- The information is accurate and complete
- The tone is appropriate for the context
- Citations and sources are correct and relevant
- You wouldn't change anything meaningful

**Example:**

**User Question:** "What are the regulatory requirements for Class II medical devices in the US?"

**AI Response:** "Class II medical devices in the US require FDA 510(k) premarket notification under Section 510(k) of the FD&C Act. You must demonstrate that your device is substantially equivalent to a legally marketed predicate device. Key requirements include:

1. **Premarket Notification (510(k))**: Submit at least 90 days before marketing
2. **Quality System Regulation (QSR)**: Comply with 21 CFR Part 820
3. **Medical Device Reporting (MDR)**: Report adverse events under 21 CFR Part 803
4. **Establishment Registration**: Register your facility with FDA

Most 510(k)s are reviewed within 90 days. For detailed guidance, see FDA's 510(k) guidance document [FDA-2018-D-3039].

Source: FDA 21 CFR 807.87, QSR 21 CFR Part 820"

**Why it's a 5:**
- Accurate regulatory information
- Specific citations (21 CFR references)
- Structured for easy understanding
- Includes timeline expectations
- Points to authoritative sources

**Your comment template:**
```
Excellent response. Accurate information, appropriate detail level, and correct citations. Exactly what I would tell someone asking this question.
```

### Score 4: Good Response with Minor Issues

**Definition:** The response is mostly correct and helpful, but has minor inaccuracies, missing details, or could be slightly clearer. You'd provide this answer with small tweaks.

**When to use:**
- The core information is correct
- There are minor omissions or inaccuracies
- The tone is mostly appropriate
- Sources are generally correct but could be more specific
- 80-90% of what you'd say

**Example:**

**User Question:** "How long does a 510(k) review take?"

**AI Response:** "A 510(k) review typically takes about 90 days from submission. The FDA reviews your documentation to ensure your device is substantially equivalent to an existing device. If they need more information, they'll send an Additional Information request, which can extend the timeline."

**Why it's a 4:**
- Accurate on the 90-day baseline
- Missing: The 90-day clock *restarts* with Additional Information requests
- Missing: Mention of expedited review pathways
- Tone is appropriate but could be more specific

**What's missing:**
- "The 90-day clock restarts when you respond to Additional Information requests"
- "Some devices may qualify for expedited review programs"

**Your comment template:**
```
Good core information, but missing detail about [specific missing element]. Suggest adding: [brief suggestion]. Still helpful and mostly accurate.
```

### Score 3: Acceptable but Needs Improvement

**Definition:** The response is okay—it's not wrong, but it's not particularly helpful either. It's generic, lacks depth, or misses key context. You'd need to follow up with more information.

**When to use:**
- The answer is technically correct but surface-level
- It doesn't fully address the user's likely needs
- It's too generic or vague
- Important context or caveats are missing
- You'd need to add significantly more to make it useful

**Example:**

**User Question:** "What testing do I need for a Class II medical device?"

**AI Response:** "Class II medical devices typically require performance testing to demonstrate safety and effectiveness. You should conduct biocompatibility testing if the device contacts the body, and electrical safety testing for powered devices. Consult relevant FDA guidance documents for your device type."

**Why it's a 3:**
- Accurate but extremely generic
- Doesn't mention *which* standards (ISO 10993, IEC 60601, etc.)
- Doesn't address the specific device type in context
- "Consult guidance" is helpful but vague
- Missing risk-based testing approach

**What's needed:**
- Specific testing standards by device type
- Risk classification approach
- Common testing requirements (e.g., ISO 10993 series, IEC 60601 for electrical)
- Mention of predicate device testing comparison

**Your comment template:**
```
Too generic. Needs specific standards like [examples]. Should address [missing context]. Technically correct but not actionable enough for someone trying to comply.
```

### Score 2: Poor Response with Significant Issues

**Definition:** The response has significant problems—factual errors, inappropriate tone, wrong sources, or misleading information. You'd need to heavily correct or rewrite this.

**When to use:**
- Contains factual inaccuracies
- Misinterprets the user's question
- Uses wrong or irrelevant sources
- Tone is inappropriate (too casual, too formal, etc.)
- Could mislead the user

**Example:**

**User Question:** "Can I market my Class II device without FDA clearance?"

**AI Response:** "Class II devices have moderate risk, so you may be able to market with just registration and listing. Many Class II devices don't require premarket review. Check if your device qualifies for an exemption."

**Why it's a 2:**
- **Major error:** Most Class II devices *do* require 510(k) clearance
- Misleading on exemptions (exemptions are rare, not common)
- Could lead to regulatory violations
- Missing critical warning about illegal marketing

**What's wrong:**
- Incorrect blanket statement about exemptions
- Doesn't emphasize the legal requirement for 510(k) unless specifically exempt
- Tone is too casual for a compliance question

**Your comment template:**
```
Significant error: [specific inaccuracy]. This could mislead users into [potential consequence]. Needs correction to state [correct information]. Also inappropriate tone for compliance question.
```

### Score 1: Unacceptable Response

**Definition:** The response is wrong, harmful, completely off-topic, or dangerously misleading. This should never be shown to a user.

**When to use:**
- Completely incorrect information
- Dangerous advice (e.g., safety violations)
- Totally off-topic or irrelevant
- Inappropriate content (offensive, biased, etc.)
- Could cause harm if followed

**Example:**

**User Question:** "What are the regulatory requirements for Class II medical devices in the US?"

**AI Response:** "Class II devices don't require FDA approval in the US. You can start selling them directly after manufacturing. Just make sure your factory follows good manufacturing practices. Check with your state's business licensing office."

**Why it's a 1:**
- **Completely wrong:** Class II devices require 510(k) premarket notification
- Dangerous advice that could lead to illegal marketing
- Confuses FDA with state business licensing
- Could result in regulatory action against the user
- No accurate information

**Your comment template:**
```
Completely incorrect. [Specific wrong claim] is false. Correct answer: [brief correct answer]. This could lead to [serious consequence]. Do not use.
```

### Special Case: Irrelevant or Off-Topic Questions

**User Question:** "What's the best restaurant near the conference center?"

**AI Response:** "I'm here to help with medical device regulatory questions. For restaurant recommendations, I'd suggest checking Google Maps or Yelp for local reviews near your conference center."

**How to score:** This is a **5**.

**Why?** The agent correctly identified the question as out-of-scope and politely redirected. This is exactly what you want—the agent staying in its lane.

**Comment template:**
```
Correct handling of out-of-scope question. Agent appropriately redirected without attempting to answer outside its domain.
```

:::tip The "Snapchat Test"
If someone asks your medical device agent about Snapchat, you want it to say "I don't know about that, I'm here to help with medical device questions." That's a 5. If it tries to answer about Snapchat, that's a 1—even if the Snapchat answer is technically correct.
:::

**[Want custom rubrics designed for your domain? Get templates tailored to your use case →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Comment Templates: Copy, Paste, Customize

Good comments help the AI team understand *why* you scored something a particular way. Here are templates you can copy-paste and customize:

### For Score 5 (Excellent)

```
Excellent response. Accurate, complete, and appropriate tone. Exactly what I would provide.
```

```
Perfect answer. [Specific thing done well, e.g., "Included all relevant standards and citations"]. No changes needed.
```

```
This is the gold standard. Clear, accurate, actionable. Great use of [specific source or approach].
```

### For Score 4 (Good with Minor Issues)

```
Good response overall. Minor improvement: [specific suggestion]. Core information is accurate.
```

```
Mostly correct. Suggest adding [missing detail] for completeness. Still helpful as-is.
```

```
Solid answer but could be clearer on [specific point]. Consider rephrasing [specific part].
```

### For Score 3 (Acceptable but Needs Improvement)

```
Too generic. Needs specific examples like [examples]. User needs more actionable guidance.
```

```
Technically correct but lacks depth. Should include [missing key information]. Not sufficient for decision-making.
```

```
Misses important context about [context]. Add [specific information] to make this useful.
```

### For Score 2 (Poor with Significant Issues)

```
Significant error: [specific inaccuracy]. Correct information: [what it should say]. Could mislead users.
```

```
Wrong source cited. [Citation] doesn't support this claim. Should reference [correct source].
```

```
Inappropriate tone for [reason]. Needs to be [more formal/more casual/more cautious]. Content also needs [specific correction].
```

### For Score 1 (Unacceptable)

```
Completely incorrect. [Wrong claim] is false. This could lead to [serious consequence]. Do not use.
```

```
Off-topic response to a domain-specific question. Agent should recognize this is outside its scope.
```

```
Dangerous advice. [Specific harmful recommendation] could result in [safety/legal/compliance issue]. Requires complete rewrite.
```

### For Out-of-Scope Questions (Score 5 when handled correctly)

```
Correct handling of out-of-scope question. Agent stayed in its domain and redirected appropriately.
```

```
Perfect response to irrelevant question. Didn't attempt to answer outside expertise. This is what we want.
```

## Common Review Scenarios: What to Look For

Let's walk through common situations you'll encounter and how to handle them.

### Scenario 1: The Overly Cautious Response

**User Question:** "Can I reuse single-use medical devices?"

**AI Response:** "This is a complex regulatory area. You should consult with FDA, your regulatory team, your legal team, and review all applicable guidance documents before making any decisions about reprocessing single-use devices."

**Issue:** Technically correct but unhelpful. The user needs a clear answer.

**Better Response:** "No, devices labeled 'single-use' cannot be legally reused or reprocessed without FDA clearance. Reprocessing single-use devices requires a separate 510(k) clearance under FDA's reprocessing guidance. If you're considering reprocessing, you would need to establish a reprocessing protocol and submit for FDA review."

**Score:** 3 (for the overly cautious version)

**Why:** While it's not *wrong* to suggest consulting experts, the AI should provide the baseline answer first, then suggest expert consultation for implementation details.

### Scenario 2: The Confident but Wrong Response

**User Question:** "How often do I need to update my quality manual?"

**AI Response:** "FDA requires annual updates to quality manuals to maintain compliance with 21 CFR Part 820. You must submit updated manuals to FDA for review each year."

**Issue:** Completely false. FDA doesn't require annual manual updates or submissions.

**Correct Information:** Quality manuals should be updated as needed when processes change, regulations change, or non-conformances are identified. There's no fixed schedule. FDA doesn't review quality manuals unless during an inspection.

**Score:** 1

**Why:** Factually incorrect and could lead to wasted effort and confusion about actual requirements.

### Scenario 3: The "Close Enough" Response

**User Question:** "What's the difference between a 510(k) and a PMA?"

**AI Response:** "A 510(k) is for lower-risk devices and shows your device is similar to existing devices. A PMA is for higher-risk devices and requires more extensive testing to prove safety and effectiveness."

**Issue:** Accurate in spirit but lacks important details.

**Missing:**
- 510(k) is for Class I/II devices (mostly)
- PMA is for Class III devices
- 510(k) demonstrates "substantial equivalence"
- PMA requires clinical trials typically
- Timelines differ significantly (90 days vs. 180 days base)

**Score:** 4

**Why:** Core information is correct, but someone making a regulatory decision needs the specifics.

### Scenario 4: The Perfectly Scoped "I Don't Know"

**User Question:** "Should I invest in Bitcoin for my medical device startup?"

**AI Response:** "I specialize in medical device regulatory questions. For financial and investment advice, I recommend consulting with a financial advisor or startup mentor who can provide guidance specific to your business situation."

**Score:** 5

**Why:** Perfect. The agent stayed in its lane and redirected appropriately.

### Scenario 5: The Over-Detailed Response

**User Question:** "Do I need a quality manual?"

**AI Response:** [Provides 3 pages of text covering the entire history of quality system regulations, every subsection of 21 CFR Part 820, international harmonization efforts, ISO 13485 comparison, and detailed implementation steps]

**Issue:** Correct but overwhelming. User asked a simple yes/no question.

**Better Response:** "Yes, FDA requires a quality manual under 21 CFR Part 820. Your quality manual should document your quality system procedures, including management responsibilities, design controls, purchasing controls, and corrective/preventive actions. Most companies structure it following the QSR sections for ease of reference."

**Score:** 3

**Why:** Information overload. The response should match the question's complexity level.

## Best Practices: Dos and Don'ts

### Do:

✅ **Trust your expertise** - You're the domain expert. If something feels wrong, it probably is.

✅ **Be consistent** - Use the same standards across reviews. If you scored a similar response a 3 yesterday, score it a 3 today.

✅ **Provide specific feedback** - "Needs more detail" is less helpful than "Should include specific ISO standard numbers."

✅ **Review in batches** - Set aside focused time (30-60 minutes) rather than doing one-off reviews all day.

✅ **Use keyboard shortcuts** - Learn Langfuse shortcuts to speed up your workflow.

✅ **Focus on patterns** - After 10-15 reviews, you'll see patterns. Note these in comments so the AI team can address systematic issues.

✅ **Celebrate good responses** - When the AI nails it, say so! Positive feedback reinforces good patterns.

### Don't:

❌ **Overthink it** - Your initial gut reaction is usually correct. Don't spend 10 minutes debating between a 3 and a 4.

❌ **Be too harsh** - Remember, you're comparing to "what would be helpful" not "what would I write after 2 hours of research."

❌ **Be too lenient** - "It's close enough" is not the standard. If it's missing critical information, score accordingly.

❌ **Second-guess yourself** - If you scored it, move on. Don't go back and change scores unless you find new information.

❌ **Try to review everything** - Quality over quantity. 20 thoughtful reviews beat 100 rushed ones.

❌ **Ignore context** - Consider the user's question. A PhD-level response to a beginner question is a 2, not a 5.

❌ **Forget the goal** - You're training the AI to be helpful and accurate, not to pass a test.

**[Setting up your review workflow? Get best practices documentation and team training →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Common Pitfalls and How to Avoid Them

### Pitfall 1: "I'm Not Sure" Paralysis

**Problem:** You encounter a response where you're genuinely unsure if it's correct or not.

**Solution:**
- Skip it. Flag it for a more expert reviewer if possible.
- Don't guess or score it a 3 "to be safe"
- Your confident reviews are more valuable than uncertain ones

**In Langfuse:** Look for a "skip" or "flag for review" option. If not available, add a comment: "Unsure about accuracy—recommending expert review" and score conservatively (3).

### Pitfall 2: Scope Creep in Comments

**Problem:** You start writing a novel explaining everything that's wrong and how to fix it.

**Solution:**
- Limit comments to 2-3 sentences
- Focus on the most critical issue
- Trust the AI team to investigate based on your pointer

**Good comment:** "Incorrect claim about annual FDA submissions. QMS updates are as-needed, not scheduled. No FDA submission required."

**Too much comment:** [500 words on the history of quality system regulations, every scenario where updates might be needed, comparison with international standards, etc.]

### Pitfall 3: The "Technically Correct" Trap

**Problem:** The response is technically accurate but completely unhelpful for the user's actual need.

**Solution:**
- Score based on usefulness, not just accuracy
- A technically correct but useless answer is a 2 or 3, not a 4 or 5
- Ask yourself: "Would this help the person who asked the question?"

**Example:** User asks "How do I start the 510(k) process?" and gets a response defining what 510(k) stands for. Technically correct, completely unhelpful.

### Pitfall 4: Inconsistent Standards Between Sessions

**Problem:** On Monday you're feeling generous (lots of 4s and 5s). On Friday you're tired and critical (lots of 2s and 3s).

**Solution:**
- Review the rubric before each session
- Look at 2-3 of your previous reviews to calibrate
- If you're tired, don't review—your inconsistency hurts the training data

### Pitfall 5: Not Checking Sources

**Problem:** You assume the AI's sources are correct without verifying.

**Solution:**
- Spot-check citations, especially for scores 4 and 5
- If a source seems off, note it—even if the content is correct
- Wrong sources are a significant issue (drop from 5 to 4 or even 3)

## Domain-Specific Examples: Medical Device Regulatory

Let's apply the rubric to a real domain with detailed examples. This section serves as a template for how to think about scoring in your specific field.

### Example 1: Regulatory Pathway Question

**User Question:** "I'm developing a surgical robot. What regulatory pathway do I need?"

**Score 5 Response:**
"Surgical robots are typically classified as Class II or Class III devices depending on their intended use and risk profile. Most surgical assistance robots require a **510(k) premarket notification** (Class II) if you can demonstrate substantial equivalence to a predicate device, such as the da Vinci Surgical System.

However, if your robot performs novel functions with no predicate device, or is used in high-risk procedures, it may require **Premarket Approval (PMA)** as a Class III device.

**Recommended steps:**
1. Determine device classification using FDA's 21 CFR Part 862-892 or the Classification Database
2. Identify potential predicate devices if pursuing 510(k)
3. Conduct risk analysis per ISO 14971
4. Engage in Pre-Submission meeting with FDA

For novel devices with no predicate, expect PMA pathway. Contact FDA's Office of Surgical and Infection Control Devices for guidance.

Sources: FDA Device Classification, 21 CFR Part 878 (General and Plastic Surgery Devices)"

**Why it's a 5:** Specific, actionable, correct classification logic, clear next steps, appropriate sources.

---

**Score 3 Response:**
"Surgical robots are medical devices that require FDA clearance. You'll need to submit a 510(k) or PMA depending on your device's risk level. Contact FDA for more information about your specific device."

**Why it's a 3:** Technically correct but lacks actionable detail. Doesn't explain how to determine pathway, no specific guidance, generic "contact FDA."

---

**Score 1 Response:**
"Surgical robots are software-only devices, so they only require registration with FDA. No premarket submission is needed. Just register your company and you can start marketing."

**Why it's a 1:** Completely false. Surgical robots are hardware devices requiring significant premarket review. This could lead to illegal marketing.

### Example 2: Testing Requirements Question

**User Question:** "What biocompatibility testing do I need for an implantable sensor?"

**Score 5 Response:**
"Implantable sensors require comprehensive biocompatibility testing per **ISO 10993 series**, specifically for long-term implant contact (>30 days).

**Required tests for long-term implant:**
- Cytotoxicity (ISO 10993-5)
- Sensitization (ISO 10993-10)
- Irritation (ISO 10993-10)
- Acute systemic toxicity (ISO 10993-11)
- Subacute/subchronic toxicity (ISO 10993-11)
- Genotoxicity (ISO 10993-3)
- Implantation study (ISO 10993-6)
- Hemocompatibility if blood contact (ISO 10993-4)

**Additional considerations:**
- Material characterization and risk assessment per ISO 10993-1
- Sterilization validation per ISO 11135/11137
- Packaging validation per ISO 11607

FDA recognizes ISO 10993-1:2018 as a consensus standard. Use the risk-based approach outlined in the 2020 FDA guidance 'Use of International Standard ISO 10993-1.'

Sources: ISO 10993-1:2018, FDA Guidance on ISO 10993-1 (2020)"

**Why it's a 5:** Comprehensive, specific test list, appropriate standards, risk-based approach, current guidance referenced.

---

**Score 4 Response:**
"Implantable sensors need biocompatibility testing per ISO 10993. You'll need cytotoxicity, sensitization, irritation, systemic toxicity, and implantation studies because it's a long-term implant. Make sure to follow the ISO 10993-1 risk-based approach."

**Why it's a 4:** Core information correct but missing specific test part numbers, missing genotoxicity and hemocompatibility considerations, no mention of FDA guidance document.

---

**Score 2 Response:**
"All medical devices need biocompatibility testing. Run a cytotoxicity test and sensitization test—those are usually enough for FDA. ISO has some standards on this, so check those too."

**Why it's a 2:** Severely incomplete for an implantable device. "Usually enough" is dangerously misleading. Missing critical tests like implantation study and genotoxicity for an implant.

## Advanced Review Techniques: Leveling Up Your Impact

Once you're comfortable with basic reviews, these techniques will make you even more valuable.

### Technique 1: Pattern Recognition

After 20-30 reviews, you'll start seeing patterns:
- "The AI always cites the wrong FDA guidance document for X"
- "Responses to questions about Y are consistently too generic"
- "The AI struggles with international vs. US regulatory differences"

**How to document:**
- Add a summary comment every 20-25 reviews: "Pattern noticed: Agent consistently misses [specific detail] in questions about [topic]"
- Flag these for the AI team's attention
- This helps them make systematic improvements

### Technique 2: Comparative Analysis

When you see a score 3 or 4, think: "What would make this a 5?"

**Document the gap:**
- "To reach score 5, should include [specific missing element]"
- "Compare to previous response [reference] which had [better approach]"
- "Similar to trace [ID] but missing [key difference]"

This explicit comparison helps the AI team understand exactly what "good" looks like.

### Technique 3: User Intent Analysis

Sometimes the AI answers the question asked, but not the question meant.

**User Question:** "How long does a 510(k) take?"

**What they asked:** Timeline for FDA review

**What they meant:** "How long until I can start selling my device?" (includes prep time, potential delays, etc.)

**Score 5 response** addresses both:
- "FDA reviews 510(k)s within 90 days from acceptance. However, full timeline from submission to clearance is typically 6-9 months including:
  - Pre-submission preparation: 2-4 months
  - FDA review: 90 days (if no Additional Information requests)
  - Additional Information cycles: 1-3 months if needed
  - Post-clearance activities: 1-2 weeks

Plan for 6-9 months total from submission decision to market."

**Flag these in comments:** "Agent answered literal question but user likely needs [broader context]."

### Technique 4: Domain Edge Cases

Your expertise shines when you catch edge cases:
- "This answer is correct for US, but incorrect for EU MDR"
- "This applies to new devices, but not to device modifications"
- "This is true for Class II but answer should note Class III difference"

**Document assumptions:** "Answer assumes [assumption]. Should clarify or ask for specifics."

### Technique 5: Risk-Based Scoring

Not all errors are equal. A wrong citation is less critical than wrong safety information.

**High-risk errors (always score 1-2):**
- Safety-critical misinformation
- Compliance violations that could lead to FDA action
- Dangerous procedural errors

**Medium-risk errors (score 2-3):**
- Significant inaccuracies that could cause delays or wasted effort
- Missing critical caveats or warnings
- Wrong regulatory pathway guidance

**Low-risk errors (score 3-4):**
- Minor citation errors
- Slightly outdated terminology
- Missing nice-to-have context

**Note risk level in comments:** "Low-risk issue: [description]" or "High-risk: This could lead to [serious consequence]"

## Calibration: How to Stay Consistent

Consistency across reviewers and over time is critical for training AI systems. Here's how to maintain it.

### Weekly Calibration Session

If you're part of a review team, hold 30-minute calibration sessions:

1. **Review 5 traces together** - Score independently, then discuss
2. **Discuss discrepancies** - Why did you score it differently?
3. **Align on gray areas** - Reach consensus on borderline cases
4. **Update standards** - Adjust rubric if needed based on new patterns

**Solo reviewers:** Compare your current week's scores to previous weeks. Are you drifting more lenient or more harsh?

### The "Anchor" Method

Start each review session by scoring 2-3 "anchor" traces:
- One you previously scored 5
- One you previously scored 3
- One you previously scored 1

**Ask yourself:** "Would I still score these the same way today?"

If not, you're drifting. Recalibrate against the rubric before continuing.

### Scoring Distribution Check

Every 25-50 reviews, check your score distribution:

**Healthy distribution (roughly):**
- Score 5: 20-30%
- Score 4: 25-35%
- Score 3: 20-30%
- Score 2: 10-15%
- Score 1: 5-10%

**Warning signs:**
- Too many 3s (50%+): You're playing it safe, not using the full range
- Too many 5s (50%+): You're too lenient
- Too many 1-2s (40%+): You're too harsh, or the AI really needs work

:::tip Distribution Isn't a Target
Don't force your scores to match a distribution. If the AI is genuinely producing mostly 4s and 5s, that's great! But if your distribution looks weird, use it as a calibration check.
:::

### The "Would I Say This?" Test

When you're unsure about a score, ask: **"Would I say exactly this to someone who asked me this question?"**

- **Yes, word-for-word:** Score 5
- **Yes, with minor tweaks:** Score 4
- **The gist is right but I'd add more:** Score 3
- **No, I'd correct significant parts:** Score 2
- **No, this is wrong/harmful:** Score 1

This test cuts through overthinking and grounds you in your expertise.

## Integration with LLM-as-Judge: How Your Reviews Are Used

You might wonder: "If there's an LLM-as-Judge system, why do we need human reviewers?"

**Great question.** Here's how they work together:

:::info Learn More About LLM-as-Judge
For comprehensive details on implementing automated evaluations with LLM-as-Judge, see [From Theory to Practice: Automated Evals](/blog/automated-evals-ai-agents-langfuse-answer-agent). This post focuses on how *human reviews* integrate with that automated system.
:::

### The Two-Tier Evaluation System

**LLM-as-Judge (Automated):**
- Scores every single trace (100% coverage)
- Uses predefined criteria and rubrics
- Fast, consistent, scalable
- **Good at:** Detecting obvious issues, flagging outliers, measuring trends

**Human Reviews (You):**
- Scores a sample of traces (5-20%)
- Uses expert domain judgment
- Deep, nuanced evaluation
- **Good at:** Catching subtle errors, validating edge cases, setting the standard

### How Your Reviews Improve the System

Your human reviews serve three purposes:

1. **Ground Truth Labels:** Your scores become the "correct" answers that train and evaluate the LLM-Judge
2. **Judge Validation:** Your reviews help determine if the LLM-Judge is scoring accurately
3. **Edge Case Discovery:** You catch the subtle issues automated systems miss

**The Feedback Loop:**

```
You review traces → Your scores train LLM-Judge → LLM-Judge scores all traces →
High-disagreement traces flagged → You review those → Cycle repeats
```

### What This Means for You

**Focus your reviews on:**
- Traces where LLM-Judge is uncertain (low confidence scores)
- Traces that are borderline (LLM scored 2.5-3.5)
- Random sample of high-scoring traces (validation)
- Edge cases and unusual queries

**Don't worry about:**
- Reviewing every single trace
- Matching the LLM's scoring exactly
- Over-explaining obvious scores

**Your role is to set the standard, not to match an existing one.**

### Disagreement Is Good

If you score a trace differently than the LLM-Judge:
- **Don't change your score to match**
- **Trust your expertise**
- **Document why you scored differently**

Disagreements help the AI team identify where the LLM-Judge needs improvement. Your divergent opinion is valuable data.

**For more on LLM-as-Judge evaluation:**
- [Langfuse LLM-as-Judge Guide](https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge)
- [Langfuse Evaluation Overview](https://langfuse.com/docs/evaluation/overview)
- [Implementing Automated Evals (Full Guide)](/blog/automated-evals-ai-agents-langfuse-answer-agent)

**[Want to optimize the balance between automated and human review? Get a customized strategy →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Dataset Creation: Building Better Test Sets

As you review, you're not just scoring—you're building a dataset that will be used for ongoing evaluation.

### What Makes a Good Evaluation Dataset?

**Diversity:**
- Cover all major topic areas in your domain
- Include easy, medium, and hard questions
- Represent common and edge case queries

**Balance:**
- Mix of scores (not all 5s or all 1s)
- Various question types (factual, procedural, judgment-based)
- Different user personas (beginners, experts, cross-functional roles)

**Quality:**
- Clear correct answers (your scores + comments)
- Well-documented reasoning
- Consistent scoring standards

### How Your Reviews Contribute

Every review you complete adds to the evaluation dataset. After collecting 100-200 human-scored traces, the AI team can:

1. **Create benchmark datasets** for testing new models
2. **Measure improvement over time** by re-scoring old datasets
3. **Identify weak areas** where the AI needs more training
4. **Validate new features** by comparing against known-good examples

### Flagging High-Value Traces

Some traces are especially valuable for the dataset:

**Flag these (if Langfuse allows):**
- Perfect examples of score 5 responses (gold standard)
- Clear failures that illustrate common mistakes (score 1-2)
- Edge cases that are tricky but important
- Traces where AI handled ambiguity well
- Traces where AI correctly refused to answer (out of scope)

**Comment:** "Recommend adding to evaluation dataset: [reason]"

This helps the AI team prioritize which traces to include in benchmark sets.

**For more on datasets and experiments:**
- [Langfuse Datasets](https://langfuse.com/docs/evaluation/experiments/datasets)
- [Langfuse Experiments via SDK](https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk)
- [Langfuse Experiments via UI](https://langfuse.com/docs/evaluation/experiments/experiments-via-ui)
- [How Datasets and Experiments Work in Practice](/blog/automated-evals-ai-agents-langfuse-answer-agent) (Post #13)

**[Building evaluation datasets for your domain? Get guidance on dataset design and experiments →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Measuring Your Impact: What Success Looks Like

You're putting in time and effort. How do you know it's making a difference?

### Short-Term Indicators (Week 1-4)

**✅ You're making an impact if:**
- You can complete reviews in 1-2 minutes each
- Your scoring distribution is roughly balanced (not all 3s)
- You're using the comment templates consistently
- You're noticing patterns across multiple traces

**📊 Team metrics to watch:**
- Number of traces reviewed (target: 20-30 per week per reviewer)
- Reviewer agreement rate (if multiple reviewers)
- Time per review (target: 60-120 seconds)

### Medium-Term Indicators (Month 2-3)

**✅ The AI is improving if:**
- You're seeing more 4s and 5s in recent traces vs. older ones
- Common mistakes from month 1 are less frequent
- LLM-Judge scores correlate better with your scores
- Fewer "obvious" score 1-2 responses

**📊 Team metrics to watch:**
- Average score trend over time (should increase)
- Inter-rater reliability (multiple reviewers agreeing more)
- High-confidence LLM-Judge predictions matching human scores

### Long-Term Indicators (Month 4+)

**✅ The system is mature if:**
- 70%+ of traces score 4 or 5 (human reviews)
- LLM-Judge and human reviewers agree 80%+ of the time
- Edge cases are well-handled (you're seeing creative solutions)
- Users report higher satisfaction with AI responses

**📊 Team metrics to watch:**
- Production metrics (user satisfaction, task completion rates)
- Reduced need for human review volume (from 20% to 10% coverage)
- AI team deploying improvements based on your feedback

### Your Personal Impact

Track your own stats if Langfuse provides reviewer dashboards:
- Total traces reviewed
- Average review time
- Score distribution
- Agreement with other reviewers
- Patterns you've identified that led to system improvements

**Celebrate wins:** If the AI team makes a fix based on your feedback, that's a direct impact. You improved the system for all users.

**[Want metrics dashboards to track reviewer performance and AI improvements? Get custom analytics setup →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Troubleshooting Common Issues

### Issue: "I don't have time to review"

**Solution:**
- Batch reviews: 30 minutes, 2-3 times per week (20-30 traces)
- Integrate into existing workflows: Review during downtime, between meetings
- Quality over quantity: 10 thoughtful reviews > 50 rushed ones

**Communicate with your team:** If review volume is unsustainable, say so. The goal is high-quality reviews, not burnout.

### Issue: "I'm not sure if I'm scoring correctly"

**Solution:**
- Request calibration session with another reviewer or the AI team
- Review your past scores—are you consistent?
- Use the "Would I say this?" test
- Start with clear 5s and 1s to build confidence, then tackle gray areas

**Ask for feedback:** Request that the AI team review your reviews. Are your comments helpful? Are your scores aligned with expectations?

### Issue: "The AI keeps making the same mistakes"

**Solution:**
- Document the pattern in comments: "Same error as traces [X, Y, Z]"
- Flag for AI team attention
- Continue scoring accurately—don't "give up" and score lenient

**Remember:** Your feedback informs fixes. Repeated errors you document will eventually be addressed.

### Issue: "Langfuse interface is confusing"

**Solution:**
- Request training or documentation from your team
- Check Langfuse's docs: [Langfuse Human Annotation Guide](https://langfuse.com/docs/evaluation/evaluation-methods/annotation)
- Learn keyboard shortcuts to speed up workflow
- Ask for interface customization if available

**Power user tip:** Many tools allow custom views or filters. Set up a view that shows only unscored traces in your domain.

### Issue: "I disagree with other reviewers' scores"

**Solution:**
- Schedule calibration session to discuss discrepancies
- Review the rubric together—are you interpreting it differently?
- Accept some variability—exact agreement isn't necessary, but general alignment is
- Focus on your own consistency

**Healthy disagreement range:** If two reviewers are within 1 point on the 1-5 scale, that's fine. If you're consistently 2+ points apart, calibration is needed.

### Issue: "I'm seeing offensive or harmful content"

**Solution:**
- **Score 1 immediately**
- **Flag for urgent review** (use Langfuse flagging or contact your team directly)
- **Document specifically:** What was harmful and why
- **Do not ignore:** Even if rare, these need immediate attention

**Comment template:** "URGENT: Harmful content. [Specific issue]. Recommend immediate review and removal."

## Next Steps: Getting Started

You've read the guide. Now what?

### Your First Review Session (30 minutes)

**Minutes 1-5: Setup**
1. Log in to Langfuse
2. Navigate to annotation queue
3. Open first trace
4. Have this guide open in another tab

**Minutes 6-35: Review 10-15 traces**
1. Read user question and AI response
2. Ask: "Would I say this?"
3. Score using rubric (trust your gut)
4. Add comment (use templates)
5. Submit and move to next

**Minutes 36-40: Reflect**
- How did it feel?
- Were any scores difficult?
- Note patterns you're seeing
- Identify questions for your team

### After Your First Session

- **Share feedback with your team:** What worked? What was confusing?
- **Review your scores:** Do they feel consistent?
- **Ask for calibration:** Request a more experienced reviewer to spot-check your work
- **Schedule next session:** Consistency matters—plan regular review times

### Week 1 Goals

- Complete 20-30 reviews
- Get comfortable with the rubric
- Use comment templates
- Identify at least one pattern across multiple traces
- Ask any clarifying questions

### Month 1 Goals

- Complete 80-120 reviews total
- Reduce average time per review to 1-2 minutes
- Participate in calibration session
- See improvement trends in AI responses
- Feel confident in your scoring decisions

**[Ready to launch your review program? Get a complete implementation roadmap and training plan →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Resources and Further Reading

### Langfuse Documentation

**Essential Guides:**
- [Human Annotation in Langfuse](https://langfuse.com/docs/evaluation/evaluation-methods/annotation) - Detailed workflow guide
- [Manual Scores](https://langfuse.com/docs/scores/manually) - How to add scores in Langfuse
- [Evaluation Overview](https://langfuse.com/docs/evaluation/overview) - Complete evaluation system

**Advanced Topics:**
- [LLM-as-Judge](https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge) - Understanding automated evaluation
- [Datasets](https://langfuse.com/docs/evaluation/experiments/datasets) - How your reviews build datasets
- [Experiments via UI](https://langfuse.com/docs/evaluation/experiments/experiments-via-ui) - Testing new models

**Observability:**
- [Traces & Sessions](https://langfuse.com/docs/tracing-features/sessions) - Understanding the data you're reviewing
- [Custom Dashboards](https://langfuse.com/docs/metrics/features/custom-dashboards) - Tracking review metrics
- [Metrics API](https://langfuse.com/docs/metrics/features/metrics-api) - Programmatic access to your review data

### TheAnswer Resources

**Getting Started:**
- [TheAnswer Documentation](/docs/intro) - Platform overview and setup
- [Agents Overview](/agents) - Understanding AI agents
- [Chat Interface](/chat) - Try the AI assistant

**For Technical Teams:**
- [Developer Guide](/docs/developers) - Building with TheAnswer
- [API Reference](/docs/api) - Integration documentation

**Community:**
- [Join our Discord](https://discord.gg/X54ywt8pzj) - Connect with other users and reviewers

### Schedule a Demo

Want to see how human review fits into the bigger picture of AI agent evaluation?

**[Schedule a demo with TheAnswer team](https://calendly.com/brad-theanswer/answeragent-intro)**

We'll show you:
- Complete evaluation workflow (human + automated)
- Best practices from successful review teams
- How your reviews drive continuous improvement
- Advanced Langfuse features for reviewers

## Frequently Asked Questions (FAQs)

### General Human Review Questions

#### What is human review and why is it necessary for AI agents?

Human review is the process of domain experts evaluating AI agent responses to determine accuracy, helpfulness, and appropriateness. While AI agents can be powerful, they lack the nuanced judgment, domain expertise, and contextual understanding that humans possess.

**Why it's necessary:**
1. **Ground Truth:** Humans provide the "correct" answers that train and validate AI systems
2. **Edge Cases:** Automated systems miss subtle errors that domain experts catch immediately
3. **Domain Expertise:** Only subject matter experts can judge if information is accurate, current, and appropriate for the context
4. **Safety:** Human oversight prevents harmful or misleading responses from reaching users

Think of it like quality control in manufacturing: automated systems catch most defects, but human inspectors catch the subtle issues that machines miss. Your expertise is irreplaceable in evaluating complex, domain-specific responses.

**For more on evaluation methods:** [Langfuse Evaluation Overview](https://langfuse.com/docs/evaluation/overview)

#### How much time should I spend reviewing each AI response?

**Target: 1-2 minutes per trace.** This is the sweet spot for efficient, high-quality reviews.

**Time breakdown:**
- 30 seconds: Read user question and AI response
- 30 seconds: Make scoring decision based on rubric
- 30-60 seconds: Write comment explaining your reasoning

**Why not longer?**
- Your initial gut reaction is usually correct—you're the expert
- Overthinking leads to inconsistency and burnout
- 20 focused reviews beat 5 over-analyzed ones

**When to spend more time (5-10 minutes):**
- Truly ambiguous cases where you need to verify facts
- Edge cases that require consulting reference materials
- Cases where you want to document a detailed pattern for the AI team

**Red flag:** If you're regularly spending 5+ minutes per review, you may be overthinking or lacking confidence in the rubric. Request calibration with your team.

#### Am I training my replacement by reviewing AI agent responses?

**No. You're scaling your expertise, not replacing it.**

Here's the reality: AI agents handle the routine, repetitive questions that follow patterns you've seen hundreds of times. This frees you to focus on high-value work that requires genuine expertise:

**What AI takes off your plate:**
- Repetitive FAQ-style questions
- Straightforward information lookups
- After-hours and weekend inquiries
- Volume overflow during busy periods

**What stays on your plate (where you add most value):**
- Complex, multi-faceted problems
- Situations requiring judgment and experience
- Edge cases and exceptions
- Strategic decision-making
- Building relationships and trust with clients/users

**Your role is evolving:** From answering every question → Setting standards, handling complex cases, and ensuring quality. This is a career upgrade, not replacement.

Real-world example: Customer service teams using AI agents see human agents shift to handling escalations, VIP customers, and complex problem-solving—higher satisfaction and more interesting work.

#### How many responses do I need to review to make an impact?

**Quality matters more than quantity.** Here's a realistic framework:

**Minimum effective dose:**
- 20-30 reviews per week (about 30-60 minutes total)
- Consistent weekly reviews for 4-6 weeks
- Focused on diverse examples (not all similar questions)

**Why this works:**
- Provides enough data points for pattern recognition
- Balances thoroughness with sustainable time commitment
- Allows AI team to identify and fix systematic issues

**Higher impact volume (if you have time):**
- 50-100 reviews per week
- Accelerates AI improvements
- Builds robust evaluation dataset faster

**Remember:** 20 confident, well-documented reviews are worth more than 100 rushed, uncertain ones. Your expertise and consistency are the value, not raw volume.

**Coverage note:** You don't need to review every AI response. Even reviewing 5-10% of production traffic provides massive value for training and evaluation.

### Scoring and Rubric Questions

#### What's the difference between a score of 3 and a score of 4?

The key difference is **actionability and completeness.**

**Score 4 (Good with minor issues):**
- Core information is correct and useful
- Minor details missing or could be slightly clearer
- User can take action based on this response
- You'd provide this answer with small tweaks
- 80-90% of what you'd say

**Example:** Answer about 510(k) timeline mentions the 90-day review period and possibility of delays, but doesn't explain that the clock restarts with Additional Information requests.

**Score 3 (Acceptable but needs improvement):**
- Technically correct but too generic or surface-level
- Missing important context or details
- User would need to follow up for clarification
- Not actionable enough for decision-making
- 50-70% of what you'd say

**Example:** Answer about 510(k) timeline says "it varies depending on your device and FDA workload" without providing any specific timeframes or factors.

**Rule of thumb:** If the user could reasonably act on the response without follow-up, it's at least a 4. If they'd need more information, it's a 3 or lower.

#### How do I score a response that's partially correct?

Score based on the **most significant issue** and the **overall usefulness** of the response.

**Decision framework:**

**If the correct parts are useful and the incorrect parts are minor:**
- Score 4 if the error doesn't materially impact the user's understanding
- Add comment: "Mostly correct but [specific error]."

**If the incorrect parts could mislead the user:**
- Score 2 if significant misinformation exists
- Add comment: "Contains important error: [specific issue]. Correct information: [brief correction]."

**If the response is half right, half wrong:**
- Score 2-3 depending on severity
- Consider: Would the correct half help the user enough to offset the wrong half?
- Usually not—score 2

**Example:**
- Question: "What testing is required for a Class II surgical device?"
- Response: Correctly describes biocompatibility testing (ISO 10993) but incorrectly states that clinical trials are always required
- Score: 2 (clinical trial claim is seriously wrong for Class II)
- Comment: "Biocompatibility info is correct, but Class II devices rarely require clinical trials—only PMA (Class III) devices typically do. This misinformation could lead to unnecessary cost and delays."

**Rule of thumb:** When in doubt, score conservatively. A partially correct response that misleads is worse than an "I don't know" response.

#### Should I score out-of-scope questions as 1 (unacceptable) or 5 (excellent)?

**Score 5 when the AI correctly identifies and handles out-of-scope questions.**

**Example of correct handling (Score 5):**
- User asks: "What's the best restaurant near the conference center?"
- AI responds: "I specialize in medical device regulatory questions. For restaurant recommendations, I suggest checking Google Maps or Yelp for reviews near your location."
- **Why it's a 5:** The agent stayed in its lane, didn't make up an answer, and politely redirected

**Score 1 when the AI attempts to answer outside its domain:**
- User asks: "What's the best restaurant near the conference center?"
- AI responds: "Based on reviews, I recommend Joe's Italian Bistro at 123 Main St. They have excellent pasta and..."
- **Why it's a 1:** The agent should not be answering restaurant questions when it's a medical device regulatory agent—even if the restaurant recommendation is technically correct

**The principle:** An AI agent that knows its boundaries and communicates them clearly is doing exactly what it should. This is excellent behavior that should be reinforced with a high score.

**Comment template for correct out-of-scope handling:** "Perfect response to out-of-scope question. Agent correctly identified topic outside its domain and redirected appropriately. This is the desired behavior."

#### What if I'm genuinely unsure about the accuracy of a response?

**Don't guess.** Uncertain reviews hurt the training data. Here's what to do:

**Option 1: Skip the trace**
- If Langfuse has a "skip" or "defer" option, use it
- Move to the next trace
- Your confident reviews are more valuable than uncertain ones

**Option 2: Flag for expert review**
- Add comment: "Outside my area of expertise—recommend review by [specific expert type]"
- Score conservatively (usually 3 if it seems okay but you're unsure)
- Don't score 5 if you're not confident

**Option 3: Quick fact-check (if you can verify in 2-3 minutes)**
- Check authoritative sources (FDA website, official standards documents)
- Verify specific claims rather than trying to validate everything
- If you can't quickly verify, use Option 1 or 2

**When uncertainty happens often:**
- Request calibration session with your team
- May indicate you need more domain-specific training
- May indicate the traces assigned to you don't match your expertise area

**Important:** Never score something as 4 or 5 if you're not confident it's correct. False positives (scoring wrong answers as correct) are worse than false negatives (scoring correct answers too harshly).

#### How do I handle responses where the AI's tone is inappropriate but the information is correct?

**Tone matters.** Score based on both accuracy and appropriateness. An inappropriately toned response can be as harmful as an incorrect one.

**Scoring guidance:**

**Overly casual tone for serious topics (regulatory, safety, legal):**
- Score 2-3 depending on severity
- Example: "Yeah, you totally need a 510(k) for that lol. Just submit the forms and you're good!"
- Comment: "Information is accurate but tone is too casual for a regulatory compliance question. Should be professional and clear about legal requirements."

**Overly formal/robotic tone when user is informal:**
- Score 3-4 depending on how much it impacts usefulness
- Example: User asks "Do I need a 510(k)?" and gets a 500-word academic treatise
- Comment: "Accurate but overly formal. User asked a simple question and needs a direct yes/no with brief explanation, not a dissertation."

**Dismissive or condescending tone:**
- Score 1-2 always
- Example: "This is a basic question you should already know the answer to..."
- Comment: "Unacceptable tone. Dismissive language is inappropriate regardless of accuracy. User should feel respected and supported."

**Perfect tone examples:**
- Professional but friendly for business contexts
- Clear and direct for compliance questions
- Empathetic for problem-solving questions
- Appropriately cautious for high-stakes scenarios

**Rule of thumb:** Ask yourself, "Would I say this to the user in this exact tone?" If not, drop the score accordingly and explain in your comment.

### Workflow and Practical Questions

#### What's the best way to batch my reviews for efficiency?

**Optimal batching strategy: 30-60 minute focused sessions, 2-3 times per week.**

**Sample schedule:**
- **Monday morning:** 30 minutes, review 20-25 traces (start week fresh)
- **Wednesday afternoon:** 45 minutes, review 25-30 traces (mid-week catch-up)
- **Friday end-of-day:** 30 minutes, review 15-20 traces (wrap up week)

**Total:** 60-75 reviews per week in just 1.5-2 hours

**Why this works:**
- **Consistency:** Regular cadence prevents backlog buildup
- **Focus:** Dedicated time blocks = higher quality reviews
- **Sustainability:** Short sessions prevent burnout
- **Pattern recognition:** Reviewing multiple traces in one session helps you spot patterns

**Tips for effective batches:**
1. **Eliminate distractions:** Close email, Slack, etc.
2. **Have this guide open:** Quick reference for rubric and templates
3. **Use keyboard shortcuts:** Speed up navigation in Langfuse
4. **Start with easy ones:** Score obvious 5s and 1s first to build momentum
5. **Set a timer:** Aim for 1-2 minutes per review

**Advanced technique—"The Power Hour":**
- 60 minutes, goal: 30-40 reviews
- Minutes 0-5: Warm up with 3-4 obvious scores
- Minutes 5-50: Main review sprint
- Minutes 50-60: Review your own work—did you stay consistent?

#### How do I provide helpful comments without writing a novel?

**Target: 2-3 sentences maximum.** Follow this formula:

**Formula: [What + Why + What's needed]**

1. **What** - Identify the main issue or strength
2. **Why** - Briefly explain why it's a problem or a win
3. **What's needed** - Suggest specific improvement (for scores 2-4)

**Examples:**

**Score 5 comment:**
```
Excellent response [What]. Includes all required regulatory citations and specific timelines [Why]. No changes needed.
```

**Score 4 comment:**
```
Good core information [What] but missing detail about clock restart with Additional Information requests [What's needed]. Otherwise accurate and helpful [Why].
```

**Score 3 comment:**
```
Too generic [What]. User needs specific ISO standard numbers and risk-based testing approach [What's needed]. Current answer doesn't provide actionable guidance [Why].
```

**Score 2 comment:**
```
Significant error: claims annual FDA submissions required [What]. This is incorrect—QMS updates are as-needed, not scheduled [Why + What's needed]. Could mislead users into unnecessary compliance activities.
```

**Score 1 comment:**
```
Completely false information [What]. Class II devices require 510(k) premarket clearance, not just registration [What's needed]. This could lead to illegal marketing [Why].
```

**Time-saving tips:**
- Use comment templates from this guide as starting points
- Don't explain *how* to fix—just identify what needs fixing
- Trust the AI team to investigate based on your pointer
- For score 5, one sentence is fine: "Perfect response, no issues."

#### Can I review traces in any order or should I follow the queue?

**Best practice: Follow the queue order when possible, but prioritize strategically when needed.**

**Why follow the queue:**
- Ensures coverage across different topics and difficulty levels
- Prevents cherry-picking easy reviews
- Helps you see the full range of AI performance
- Langfuse queue is often prioritized by the system (e.g., high-uncertainty traces first)

**When to prioritize differently:**

**1. High-impact traces:**
- Production incidents or user complaints
- Traces flagged by automated systems as potentially problematic
- High-stakes scenarios (safety, compliance, legal)

**2. Your expertise sweet spot:**
- If traces are categorized by topic, focus on your strongest areas
- Skip or defer traces outside your domain knowledge
- Quality in your wheelhouse > quantity across all topics

**3. Calibration needs:**
- Intentionally review a mix of easy (obvious 5s and 1s) and hard (ambiguous 3s)
- Periodically review traces other reviewers have scored to calibrate

**4. Pattern investigation:**
- If you notice an issue in one trace, review several similar traces to confirm it's a pattern
- Document the pattern in comments for AI team

**Practical approach:**
- **80% of the time:** Follow the queue as presented
- **20% of the time:** Use filters or search to target specific types when you notice patterns or have limited time

**Ask your team:** Does your organization have priority guidance? Some teams want reviewers to focus on specific categories or recent production traces.

#### What should I do if I notice the AI is consistently making the same mistake?

**Document the pattern and flag it for the AI team.** Here's the step-by-step:

**Step 1: Confirm the pattern (review 3-5 similar traces)**
Don't flag after one instance. Review a few more traces on the same topic to verify it's systematic, not a one-off error.

**Step 2: Document clearly in comments**
On each trace where you see the pattern, add:
```
Pattern identified: Agent consistently [describes error] in questions about [topic]. See also traces [list 2-3 trace IDs]. This is systematic, not isolated.
```

**Step 3: Create a summary comment (if possible)**
Some systems allow you to add a general note or flag. Use it to write:
```
PATTERN ALERT: [Name of the issue]
- Occurs in: [Type of questions/topics]
- Error: [Specific mistake being made]
- Frequency: [How often—10%, 50%, every time?]
- Impact: [High/Medium/Low] - [Why this matters]
- Example traces: [List 3-5 trace IDs]
- Recommendation: [What should change]
```

**Step 4: Inform your team lead**
Send a quick message:
"I've identified a pattern in the reviews: [brief description]. Flagged in traces [IDs]. This impacts [topic area] and occurs in approximately [frequency]. Recommend prioritizing a fix."

**Step 5: Continue scoring accurately**
Don't change your scoring to be more lenient just because it's a known issue. Keep scoring honestly—this data helps quantify the problem and measure improvement after fixes.

**Example:**
- Pattern: Agent always cites FDA guidance from 2015, but there's an updated 2020 version
- Impact: Medium—information is mostly correct but outdated
- Frequency: Every time this topic comes up
- Your action: Score each instance as 3 or 4 (depending on how outdated the advice is), document the pattern in comments, alert the team

**Result:** AI team can make a targeted fix (update the knowledge base with 2020 guidance), and you'll see improvement in future reviews.

### Technical and Integration Questions

#### How does my scoring integrate with LLM-as-Judge evaluations?

**Your reviews and LLM-as-Judge work together in a two-tier system.** Here's how:

**LLM-as-Judge (Tier 1 - Automated):**
- Scores 100% of traces automatically
- Uses predefined rubrics and criteria
- Fast, consistent, scalable
- Good at detecting obvious issues and measuring trends

**Human Review (Tier 2 - You):**
- Scores 5-20% of traces (strategic sample)
- Provides expert domain judgment
- Serves as ground truth to train and validate LLM-Judge
- Catches subtle errors automation misses

**Integration flow:**

1. **Training:** Your scores train the LLM-Judge model
   - Your human scores become the "correct" answers
   - LLM learns to predict scores similar to yours
   - More human reviews = better LLM-Judge accuracy

2. **Validation:** Your scores validate LLM-Judge performance
   - Traces where LLM-Judge is uncertain get human review
   - High disagreement between LLM and humans indicates areas needing improvement
   - Agreement rate (e.g., 80%+) shows LLM-Judge is reliable

3. **Prioritization:** LLM-Judge flags traces for human review
   - Low-confidence scores → human review queue
   - Edge cases → human review queue
   - Random sample → human review (validation)

**Your role:** You're setting the standard that LLM-Judge tries to match. Your expertise is the benchmark, not the LLM's.

**For more on LLM-as-Judge:** [Langfuse LLM-as-Judge Guide](https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge)

#### What happens if my score disagrees with the LLM-as-Judge score?

**Disagreement is valuable data—don't change your score to match the LLM.**

**Why disagreements matter:**
1. **Identifies weaknesses in LLM-Judge:** If the LLM scored 5 and you scored 2, that's a false positive the AI team needs to address
2. **Improves the model:** Your divergent score becomes training data to improve LLM-Judge
3. **Reveals edge cases:** Systematic disagreements often highlight edge cases or nuance the LLM misses

**What to do when you disagree:**

**1. Trust your expertise**
- You're the domain expert—your judgment is the standard
- Don't second-guess yourself to match the LLM
- Score what you believe is correct

**2. Document why you scored differently**
- If you can see the LLM-Judge score in the interface, note the disagreement:
  ```
  LLM-Judge scored this [X], but I score it [Y] because [specific reason]. The issue the LLM missed is [specific detail].
  ```

**3. Flag high-disagreement cases** (if scoring differs by 2+ points)
- LLM scored 5, you scored 2 → Major disagreement, flag for review
- LLM scored 3, you scored 4 → Minor disagreement, no flag needed

**Healthy disagreement patterns:**
- **Within 1 point:** Normal variation (LLM scored 4, you scored 3 or 5)
- **Within 2 points occasionally:** Expected for edge cases
- **2+ points frequently:** Indicates LLM-Judge needs retraining or you need calibration

**What the AI team does with disagreements:**
- Analyzes patterns in high-disagreement traces
- Retrains LLM-Judge on cases where it was wrong
- May request more human reviews in specific areas where disagreement is high

**Remember:** You're not competing with the LLM-Judge. You're teaching it. Disagreements are learning opportunities for the system.

#### How are my reviews used to improve the AI agent's performance?

**Your reviews drive improvements in multiple ways:**

**1. Direct feedback to training pipeline**
- Your scores identify which responses are good (score 4-5) and which are bad (score 1-2)
- AI team uses this to fine-tune the agent: reinforce good patterns, suppress bad ones
- Over time, the agent learns to produce more responses similar to your 5s and fewer like your 1s

**2. Knowledge base updates**
- Comments highlighting missing or wrong information → Updates to the knowledge base
- Example: You note "Agent always cites 2015 guidance, but 2020 version is current" → Team updates knowledge base with 2020 guidance

**3. Prompt engineering improvements**
- Patterns in your reviews reveal prompt weaknesses
- Example: You score many responses as 3 for "too generic" → Team updates system prompt to encourage specificity

**4. Evaluation dataset creation**
- Your scored traces become benchmark datasets
- Used to test new models or features before deployment
- "Does the new model perform better than the old one?" → Measured by scoring your evaluation set

**5. Guardrails and safety**
- Score 1-2 responses with serious errors → Team adds guardrails or validation rules
- Example: Agent keeps confusing Class II and Class III requirements → Team adds validation step or clarifying prompt

**Timeline for impact:**
- **Immediate (days):** Critical issues you flag (score 1, harmful content) can trigger urgent fixes
- **Short-term (weeks):** Patterns you identify lead to knowledge base updates and prompt improvements
- **Medium-term (months):** Your review dataset trains improved models
- **Long-term (quarters):** Evaluation benchmarks you help create measure progress over time

**How you'll see improvements:**
- More score 4-5 responses in your reviews over time
- Fewer repeated mistakes on topics you've flagged
- AI team sharing: "We fixed [issue you identified]—thanks for the feedback!"

#### What data does Langfuse capture when I review a trace?

**Langfuse captures your scoring data and metadata for evaluation and analysis.** Here's what's recorded:

**Directly captured:**
- **Your score** (1-5)
- **Your comment** (free text)
- **Trace ID** (links your review to the specific AI interaction)
- **Timestamp** (when you submitted the review)
- **Reviewer ID** (your user ID, for attribution and inter-rater reliability analysis)
- **Score type** (e.g., "Human Review," "Expert Score"—may vary by configuration)

**Associated with the trace (already in Langfuse):**
- User question and AI response (the content you reviewed)
- Metadata: session ID, user ID (anonymized typically), timestamp of interaction
- Model information: which AI model generated the response
- Tool calls and context: what sources or tools the agent used
- Other scores: LLM-as-Judge score, automated metric scores

**What's NOT captured (typically):**
- Personally identifiable information about you beyond your reviewer ID
- Time spent reviewing (unless Langfuse has this feature—check your interface)
- Traces you viewed but didn't score (if you skipped them)

**Privacy considerations:**
- User data in traces is typically anonymized or pseudonymized
- Your reviews are internal—not shared publicly
- Your reviewer ID allows the team to track inter-rater reliability and calibration needs

**Data usage:**
- Training LLM-as-Judge models
- Creating evaluation datasets
- Measuring AI agent improvement over time
- Analyzing reviewer agreement and calibration

**Questions to ask your team:**
- Is user data in traces anonymized?
- How long are reviews retained?
- Who has access to review data?
- Are reviews used outside the immediate team?

**For more on Langfuse data model:** [Langfuse Data Model](https://langfuse.com/docs/observability/data-model)

#### Can I see how my reviews compare to other reviewers?

**This depends on your Langfuse configuration and team setup.** Here's what's typically available:

**Common features in Langfuse:**

**1. Inter-rater reliability reports**
- Shows agreement between reviewers on the same traces
- Useful for calibration (are you aligned with other reviewers?)
- Typically available to team leads, may be shared with reviewers

**2. Reviewer dashboards (if configured)**
- Your total reviews completed
- Average score you assign (e.g., mean score of 3.8)
- Score distribution (how many 1s, 2s, 3s, 4s, 5s)
- Time period statistics (this week vs. last week)

**3. Calibration sessions (manual comparison)**
- Team reviews the same set of traces independently
- Compares scores and discusses discrepancies
- Helps align standards across reviewers

**What you might NOT see (without team lead access):**
- Other reviewers' individual scores on traces you haven't reviewed
- Performance rankings or comparisons between reviewers
- Detailed agreement metrics (e.g., "You agree with Reviewer B 85% of the time")

**How to get comparative feedback:**

**Ask your team lead:**
- "How does my scoring compare to other reviewers?"
- "Am I consistent with the team's standards?"
- "Are there areas where I should calibrate better?"

**Request a calibration session:**
- Review 10-15 traces independently alongside another reviewer
- Compare scores and discuss differences
- Align on borderline cases

**Check Langfuse documentation:**
- Your organization may have custom dashboards
- Look for "Reviewer Analytics" or "Evaluation Dashboard" sections
- [Langfuse Custom Dashboards](https://langfuse.com/docs/metrics/features/custom-dashboards)

**Why comparison matters:**
- Ensures consistency across the review team
- Identifies if you're systematically more harsh or more lenient than others
- Helps you calibrate to team standards

**Target agreement:** 80%+ agreement (within 1 point on the scale) is healthy. Perfect agreement isn't necessary—domain judgment has some natural variability.

### Domain-Specific and Edge Case Questions

#### How do I score responses for highly specialized or niche topics within my domain?

**Apply the same rubric with increased scrutiny on technical accuracy.**

**Key considerations for niche topics:**

**1. Accuracy is paramount**
- Niche topics have fewer authoritative sources and less room for error
- Even small inaccuracies can mislead users significantly
- Be more conservative: if unsure, score 3 (not 4 or 5)

**2. Context is critical**
- Niche questions often require understanding user's specific situation
- Evaluate: Did the AI ask clarifying questions if needed?
- Generic answers to niche questions are usually score 2-3

**3. Citations matter more**
- For specialized topics, proper sourcing is essential
- Score 4 or 5 only if sources are specific and authoritative
- Vague sources ("industry standards," "best practices") are insufficient for niche topics

**4. Admit ignorance gracefully**
- If the AI correctly recognizes a question is beyond its training → Score 5
- If the AI guesses or provides generic info for a niche question → Score 2
- "I don't have specific information on [niche topic], but here's related info..." → Score 3-4 depending on quality of related info

**Example - Medical Device Regulatory (Niche: Combination Products):**

**User Question:** "What's the regulatory pathway for a drug-device combination product where the device is the primary mode of action?"

**Score 5 Response:**
"For combination products where the device is the primary mode of action, FDA's Office of Combination Products (OCP) will likely assign the lead review center as CDRH (Center for Devices and Radiological Health). You'll follow a **device pathway** (510(k) or PMA) with additional drug component review.

Key steps:
1. Submit RFD (Request for Designation) to OCP to confirm lead center
2. Pre-submission meeting with CDRH (device) and CDER (drug) reviewers
3. Device pathway (510(k) or PMA) with integrated drug data
4. Comply with cGMP (drug) AND QSR (device) manufacturing requirements

The device pathway applies, but you'll need to demonstrate safety and compatibility of the drug component. See FDA's Combination Products guidance and 21 CFR 3.2(e) for PMOA determination.

Source: 21 CFR Part 3, FDA Combination Products Policy, CDRH/CDER Intercenter Agreement"

**Why it's a 5:** Specific to the exact niche scenario (PMOA = primary mode of action), correct regulatory pathway, mentions OCP and RFD process, cites specific regulations.

---

**Score 2 Response:**
"Combination products require approval from both CDRH and CDER. You'll need to submit for both device and drug approval. Check with FDA about which center should review your product."

**Why it's a 2:** Oversimplified and misleading. Doesn't mention OCP, RFD process, or PMOA. Incorrectly implies dual separate approvals rather than integrated review.

**Scoring guidance for niche topics:**
- **5:** Demonstrates deep knowledge of the niche area
- **4:** Correct but missing some niche-specific details
- **3:** Generic information that may apply but lacks niche specificity
- **2:** Oversimplified or misleading for the niche scenario
- **1:** Completely wrong or dangerously misleading for specialized context

#### What if the AI response is correct for one jurisdiction but the user is in a different regulatory environment?

**Context matters.** Score based on whether the response is appropriate for the user's actual jurisdiction.

**Decision framework:**

**Case 1: User specifies jurisdiction clearly**
- Question: "What are the regulatory requirements in the EU for Class IIa devices?"
- AI responds with FDA (US) requirements
- **Score:** 1-2 (completely wrong jurisdiction, not helpful)

**Case 2: User's jurisdiction is implicit or contextual**
- Previous conversation indicates user is in Canada
- AI responds with US FDA requirements
- **Score:** 2 (wrong jurisdiction based on context)

**Case 3: User doesn't specify jurisdiction, AI assumes or defaults**
- Question: "What are the regulatory requirements for medical devices?"
- AI assumes US/FDA (most common default)
- AI states: "In the US, medical devices are regulated by FDA under 21 CFR..."
- **Score:** 4-5 if AI explicitly states assumption and info is accurate

**Case 4: AI covers multiple jurisdictions**
- AI provides requirements for US, EU, Canada
- Clearly delineates differences
- **Score:** 5 if comprehensive and accurate, 4 if missing major jurisdiction

**Best practice responses for global questions:**

**Option 1: Ask clarifying question**
"Could you specify which regulatory jurisdiction you're in (US/FDA, EU/MDR, Canada/Health Canada, etc.)? Requirements vary significantly by region."

**Option 2: Default with disclaimer**
"In the US, FDA regulates medical devices under 21 CFR. Note: If you're in a different jurisdiction (EU, Canada, etc.), requirements will differ. Please specify your location for region-specific guidance."

**Option 3: Provide global overview**
"Regulatory requirements vary by jurisdiction:
- **US (FDA):** 510(k) or PMA, 21 CFR Part 820 QSR
- **EU (MDR):** CE marking, MDR 2017/745, Notified Body approval
- **Canada (Health Canada):** Medical Device Licenses, CMDCAS

Which jurisdiction are you in? I can provide more specific guidance."

**How to comment when jurisdiction is wrong:**
```
Wrong jurisdiction. User context indicates [Country/Region], but AI provided [Wrong Country/Region] requirements. Should [ask for clarification OR provide correct jurisdiction info].
```

**Scoring guideline:**
- Wrong jurisdiction with no disclaimer → Score 1-2
- Right jurisdiction, accurate info → Score 4-5
- Multiple jurisdictions covered well → Score 5
- Asks for clarification when ambiguous → Score 5

#### How should I score AI responses that admit uncertainty or lack of knowledge?

**"I don't know" responses can be excellent—it depends on how they're handled.**

**Score based on:**
1. **Is the admission appropriate?** (Topic truly outside domain or insufficient data)
2. **Does the AI redirect helpfully?** (Suggests where to find info or who to ask)
3. **Does the AI guess when it shouldn't?** (Major penalty)

**Scoring framework:**

**Score 5: Appropriate admission with helpful redirection**

Example:
"I don't have specific information about the 2024 changes to [niche regulation] in the database I was trained on. For the most current guidance, I recommend:
1. Checking [Official Source URL]
2. Contacting [Relevant Agency/Expert]
3. Consulting [Specific Documentation]

If you have general questions about [related topic I do know about], I'm happy to help with that."

**Why it's a 5:**
- Admits limitation clearly
- Doesn't guess or provide outdated info
- Provides actionable next steps
- Offers help within its actual capability

---

**Score 4: Appropriate admission, less helpful redirection**

Example:
"I'm not certain about the specific requirements for that scenario. I recommend consulting with a regulatory expert or checking the relevant FDA guidance documents for the most accurate information."

**Why it's a 4:**
- Admits uncertainty (good)
- Redirects appropriately
- Could be more specific about which guidance docs or types of experts

---

**Score 3: Admits uncertainty but provides generic potentially-related info**

Example:
"I don't have detailed information on that specific requirement, but generally, Class II devices require 510(k) clearance and compliance with quality system regulations..."

**Why it's a 3:**
- Admits limitation (good)
- Provides generic info that may or may not be relevant
- Could mislead user into thinking generic info answers their specific question

---

**Score 2: Provides answer despite clear uncertainty**

Example:
"I'm not completely sure, but I believe you need to submit a 510(k) for that type of device. It's best to verify with FDA."

**Why it's a 2:**
- "I'm not sure but..." is dangerous—don't guess on regulatory matters
- Hedges with "verify with FDA" but already made a claim
- User might act on the uncertain claim

---

**Score 1: Confidently wrong when it should admit uncertainty**

Example:
[AI provides detailed, confident answer about something it clearly has no accurate data on, citing made-up sources or outdated info]

**Why it's a 1:**
- Should have admitted uncertainty
- Confidently wrong is worse than admitting "I don't know"
- Actively misleading

**Key principle: "I don't know" is a valid and often excellent response when appropriate.**

**Comment template for good "I don't know" responses:**
```
Excellent handling of knowledge limitation. Agent appropriately admitted uncertainty and provided actionable next steps for finding accurate information. This is the correct behavior.
```

#### What if the AI provides the right answer but uses the wrong source or citation?

**Score 3-4 depending on severity. Wrong sources matter, even if the answer is correct.**

**Why wrong sources are a problem:**
- **Trust:** Users need to verify information; wrong sources break that trust
- **Auditability:** In regulated industries, audit trails require correct sources
- **Precedent:** If the AI learns to cite wrong sources, this error propagates

**Scoring framework:**

**Case 1: Minor citation error (Score 4)**
- Correct answer
- Source is related but not the most authoritative or specific
- Example: Cites a general FDA guidance when a more specific guidance exists

**Comment:**
```
Accurate information but cited [Generic Source] instead of more specific [Better Source]. Content is correct, but citation should be more precise for auditability.
```

---

**Case 2: Significant citation error (Score 3)**
- Correct answer
- Source doesn't actually support the claim (even if the claim is true)
- Example: Cites 21 CFR Part 820.30 (Design Controls) for a claim about adverse event reporting (actually 21 CFR Part 803)

**Comment:**
```
Correct information but wrong source. [Claim] is not supported by [Wrong Citation]. Correct citation should be [Correct Citation]. Users need accurate sources for regulatory compliance.
```

---

**Case 3: Fabricated or inaccessible source (Score 2-3)**
- Correct answer
- Source doesn't exist or is not publicly accessible
- Example: Cites "FDA Guidance Document XYZ-2023" that doesn't exist

**Comment:**
```
Answer appears correct but source [Citation] does not exist or is not accessible. If information is accurate, should cite [Actual Source]. Fabricated citations are a serious issue.
```

---

**Case 4: Completely wrong source, answer happens to be right (Score 2)**
- Correct answer
- Source is irrelevant to the topic
- Example: Answers a medical device question correctly but cites pharmaceutical regulations

**Comment:**
```
Information is accurate but source [Wrong Source] is irrelevant to [Topic]. Should cite [Relevant Source]. Correct sources are essential for trust and verification.
```

**When wrong sources matter most:**
- Regulatory compliance questions (users may need to cite sources in submissions)
- Legal or policy questions (precedent matters)
- High-stakes decisions (safety, financial, strategic)

**When wrong sources matter less:**
- General educational questions
- Conceptual explanations where sources are for further reading
- User explicitly said "no need for sources"

**Rule of thumb:** If the user would need to cite the source in their work, wrong citations are a major issue (drop to score 3). If sources are just for reference, it's a minor issue (score 4).

---

## Conclusion: You're Ready to Make an Impact

You've read the complete training guide. You understand the rubric, the workflow, the best practices, and the nuances of effective AI agent review. Now it's time to start.

**Remember the core principles:**
- **Trust your expertise** - You're the domain expert, not the AI
- **Quality over quantity** - 20 thoughtful reviews > 100 rushed ones
- **1-2 minutes per review** - Your gut reaction is usually right
- **You're scaling your judgment** - Not training your replacement
- **Consistency matters** - Use the rubric, calibrate regularly

**Your first steps:**
1. Log in to Langfuse and open the annotation queue
2. Review 5-10 traces using this guide for reference
3. Share feedback with your team about the process
4. Schedule regular review sessions on your calendar

**You're not just scoring responses—you're improving an AI system that will help thousands of users get better, faster, more accurate information.**

Your domain expertise is irreplaceable. Your judgment is the benchmark. Your reviews are the foundation of better AI.

**Let's get started.**

Ready to see the bigger picture of AI agent evaluation? **[Schedule a demo with TheAnswer team](https://calendly.com/brad-theanswer/answeragent-intro)** to learn how human review integrates with automated evaluation, observability, and continuous improvement.

Have questions or feedback on this guide? [Join our Discord community](https://discord.gg/X54ywt8pzj) or reach out to your team lead.

**Thank you for being part of the solution. Your reviews make AI better for everyone.**
