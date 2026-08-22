(function (global) {
  'use strict';

  const DAY = 86400000;
  const OPPORTUNITY_KINDS = new Set(['phd', 'internship', 'postbac', 'visiting', 'fellowship', 'funding']);
  const EVENT_KINDS = new Set(['conference', 'workshop', 'webinar']);

  function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function parseDate(value) {
    if (!value) return null;
    const date = new Date(String(value).length === 10 ? `${value}T12:00:00` : value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function daysBetween(a, b) {
    return Math.round((b.getTime() - a.getTime()) / DAY);
  }

  function freshnessScore(item, now, halfLifeDays) {
    const published = parseDate(item.publishedAt);
    if (!published) return 45;
    const age = Math.max(0, daysBetween(published, now));
    const halfLife = Math.max(3, Number(halfLifeDays) || 21);
    return clamp(100 * Math.pow(0.5, age / halfLife));
  }

  function topicScore(item, profile) {
    const interests = profile.interests || {};
    const topics = item.topics || [];
    if (!topics.length) return 35;
    const values = topics.map(topic => clamp((interests[topic] ?? 0.25) * 100));
    values.sort((a, b) => b - a);
    const primary = values[0] || 0;
    const secondary = values.slice(1, 3).reduce((sum, value) => sum + value, 0) / Math.max(1, Math.min(2, values.length - 1));
    return clamp(primary * 0.78 + secondary * 0.22);
  }

  function eligibilityScore(item, profile) {
    if (!OPPORTUNITY_KINDS.has(item.kind) && !EVENT_KINDS.has(item.kind)) return 65;
    const e = item.eligibility || {};
    const pref = profile.preferences || {};
    let score = 50;

    if (e.international === true) score += pref.internationalEligibilityBoost ? 30 : 18;
    if (e.international === false) score -= 48;
    if (e.international == null) score -= 4;

    const visa = String(e.visa || '').toLowerCase();
    if (/j-1|sponsor|paperwork support|visa support/.test(visa)) score += pref.visaSupportBoost ? 20 : 10;
    if (/excluded|ineligible|outside-us applicants excluded/.test(visa)) score -= 45;

    if ((e.careerStages || []).includes('undergraduate')) score += 5;
    if ((e.careerStages || []).includes('postbac')) score += 7;
    if ((e.careerStages || []).includes('masters') || (e.careerStages || []).includes('graduate')) score += 4;

    return clamp(score);
  }

  function deadlineUrgency(item, now) {
    const deadline = parseDate(item.deadlineAt);
    if (!deadline) return 55;
    const days = daysBetween(now, deadline);
    if (days < 0) return 0;
    if (days <= 7) return 100;
    if (days <= 30) return 93;
    if (days <= 60) return 82;
    if (days <= 120) return 70;
    if (days <= 240) return 58;
    return 45;
  }

  function accessScore(item, profile) {
    if (!profile.preferences?.openAccessBoost) return 60;
    return item.access?.openAccess ? 100 : 48;
  }

  function isOpportunity(item) {
    return OPPORTUNITY_KINDS.has(item.kind);
  }

  function isEvent(item) {
    return EVENT_KINDS.has(item.kind);
  }

  function score(item, profile, now = new Date()) {
    const topic = topicScore(item, profile);
    const base = clamp(item.signals?.baseRelevance ?? 65);
    const recency = freshnessScore(item, now, profile.preferences?.freshnessHalfLifeDays);
    const authority = clamp(item.signals?.authority ?? ((item.source?.authority || 3) * 20));
    const actionability = clamp(item.signals?.actionability ?? 55);
    const novelty = clamp(item.signals?.novelty ?? 55);
    const eligibility = eligibilityScore(item, profile);
    const deadline = deadlineUrgency(item, now);
    const access = accessScore(item, profile);

    let final;
    if (isOpportunity(item)) {
      final = topic * 0.24 + base * 0.13 + eligibility * 0.28 + actionability * 0.17 + deadline * 0.08 + recency * 0.05 + authority * 0.05;
    } else if (isEvent(item)) {
      final = topic * 0.27 + base * 0.13 + eligibility * 0.15 + actionability * 0.18 + deadline * 0.12 + recency * 0.08 + authority * 0.07;
    } else {
      final = topic * 0.33 + base * 0.19 + recency * 0.16 + novelty * 0.12 + authority * 0.10 + actionability * 0.06 + access * 0.04;
    }

    if (item.status === 'restricted') final = Math.min(final, 42);
    if (item.status === 'closed') final *= 0.75;

    const reasons = [];
    const bestTopic = (item.topics || []).sort((a, b) => (profile.interests?.[b] || 0) - (profile.interests?.[a] || 0))[0];
    if (bestTopic && (profile.interests?.[bestTopic] || 0) >= 0.85) reasons.push('핵심 관심 분야와 직접 일치');
    if (recency >= 85) reasons.push('최근 공개된 신규 항목');
    if (authority >= 90) reasons.push('source authority가 높음');
    if (item.access?.openAccess) reasons.push('즉시 원문 접근 가능');
    if (item.eligibility?.international === true) reasons.push('international applicant 가능');
    if (/j-1|sponsor|paperwork support|visa support/i.test(String(item.eligibility?.visa || ''))) reasons.push('visa/J-1 지원 정보 확인됨');
    if (item.eligibility?.international === false || item.status === 'restricted') reasons.push('현재 사용자 조건에서는 지원 제한');
    if (item.deadlineAt && deadline >= 82) reasons.push('마감 우선 검토 필요');

    return {
      final: Math.round(clamp(final)),
      breakdown: {
        topic: Math.round(topic),
        base: Math.round(base),
        recency: Math.round(recency),
        novelty: Math.round(novelty),
        authority: Math.round(authority),
        actionability: Math.round(actionability),
        eligibility: Math.round(eligibility),
        deadline: Math.round(deadline),
        access: Math.round(access)
      },
      reasons: reasons.slice(0, 4)
    };
  }

  global.RRScore = {
    score,
    parseDate,
    daysBetween,
    deadlineUrgency,
    isOpportunity,
    isEvent,
    clamp,
    OPPORTUNITY_KINDS,
    EVENT_KINDS
  };
})(window);
