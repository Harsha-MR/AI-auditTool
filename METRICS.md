# Metrics

The North Star metric for Credex is qualified audits completed, defined as audits that include at least two tools, a valid team size, and a generated recommendation. This reflects real product value delivered and correlates with lead capture and downstream revenue.

Input metrics:
1) Audit start rate: percent of landing visitors who begin the spend form. Target 25%+. This measures clarity of value proposition and CTA effectiveness.
2) Audit completion rate: percent of started audits that reach results. Target 70%+. This captures friction within the form and how clear the inputs are.
3) Lead capture rate: percent of audit results that submit email capture. Target 20%+. This measures perceived value after seeing recommendations.

Supporting metrics:
- Share link creation rate: percent of audits that generate a public URL. Target 30%+. This indicates report shareability and virality potential.
- Email delivery success rate: percent of leads that receive the report email. Target 98%+. This monitors deliverability and configuration errors.
- LLM summary success rate: percent of summary requests that return an LLM response vs fallback. Target 90%+. This helps manage costs and API reliability.

Instrumentation plan:
- Track events: landing_view, audit_start, audit_step_completed, audit_completed, share_link_created, lead_submitted, email_sent, summary_generated, summary_fallback.
- Capture dimensions: primary use case, team size bracket, tool count, top recommendation action.

Pivot trigger metric:
- If audit completion rate stays below 50% for two weeks, prioritize UX simplification and remove optional inputs.
- If lead capture stays below 10% with strong completion, improve report clarity and CTA placement.
- If share link creation stays below 15%, add stronger incentive and visual cues on the share panel.
