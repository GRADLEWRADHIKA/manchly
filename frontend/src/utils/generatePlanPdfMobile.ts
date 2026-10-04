import RNHTMLtoPDF from 'react-native-html-to-pdf'
import Share from 'react-native-share';

const COLOR_ORANGE = '#F5A623';
const COLOR_TEXT = '#1F2937';
const COLOR_SECONDARY = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_GREEN = '#22C55E';

// ---- small escaping helper — plan text comes from an LLM, never trust it raw in HTML ----
function esc(v: any): string {
  if (v == null) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function bulletList(items?: string[]): string {
  if (!items?.length) return '';
  return `<ul class="bullets">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

function section(title: string, innerHtml: string): string {
  return `
    <div class="section">
      <div class="section-heading">${esc(title)}</div>
      ${innerHtml}
    </div>`;
}

function buildHtml(plan: any, niche: string): string {
  const idea = plan.course_idea || {};
  const structure = plan.course_structure || {};
  const content = plan.content_creation || {};
  const offer = plan.offer_creation || {};
  const audience = plan.target_audience || {};
  const ads = plan.ad_strategy || {};
  const sizing = plan.audience_sizing || {};
  const revenue = plan.revenue_forecast || {};
  const scaling = plan.scaling_plan || {};
  const hacks: any[] = plan.growth_hacks || [];

  const structureHtml = (structure.modules || [])
    .map(
      (m: any) => `
      <div class="module">
        <div class="module-title">Module ${m.module_number}: ${esc(m.module_title)}</div>
        ${bulletList(m.lessons)}
      </div>`,
    )
    .join('');

  const contentHtml = (content.lessons || [])
    .map(
      (l: any) => `
      <div class="module">
        <div class="module-title">Lesson ${l.lesson_number}: ${esc(l.title)}</div>
        ${l.hook ? `<div class="hook"><div class="label">Opening Hook</div>${esc(l.hook)}</div>` : ''}
        ${l.key_points?.length ? `<div class="label">Key Teaching Points</div>${bulletList(l.key_points)}` : ''}
        ${l.retention_mechanism ? `<div class="label">Retention Mechanism</div><p class="small">${esc(l.retention_mechanism)}</p>` : ''}
      </div>`,
    )
    .join('');

  const pricingHtml = ['low_ticket', 'high_ticket']
    .map(tier => {
      const t = offer.pricing_strategy?.[tier];
      if (!t) return '';
      const isHigh = tier === 'high_ticket';
      return `
        <div class="price-card ${isHigh ? 'accent' : ''}">
          <div class="tier-tag">${isHigh ? 'HIGH TICKET' : 'LOW TICKET'}</div>
          <div class="price">${esc(t.price)}</div>
          <div class="label">Included</div><p class="small">${esc(t.what_included)}</p>
          <div class="label">Psychology</div><p class="small">${esc(t.psychology)}</p>
        </div>`;
    })
    .join('');

  const creativesHtml = (ads.meta?.creatives || [])
    .map(
      (c: any) => `
      <div class="module">
        <div class="tier-tag">${esc(c.angle)} ANGLE</div>
        ${c.hook ? `<p class="italic-orange">${esc(c.hook)}</p>` : ''}
        ${c.copy ? `<p class="small">${esc(c.copy)}</p>` : ''}
        ${c.cta ? `<p class="small"><b>CTA:</b> ${esc(c.cta)}</p>` : ''}
      </div>`,
    )
    .join('');

  const keywordClustersHtml = (ads.google?.keyword_clusters || [])
    .map(
      (kc: any) => `
      <div class="module">
        <div class="module-title">${esc(kc.cluster_name)}</div>
        <p class="small">${esc((kc.keywords || []).join(', '))}</p>
      </div>`,
    )
    .join('');

  const revenueRows = (revenue.budget_scenarios || [])
    .map(
      (s: any, i: number) => `
      <tr class="${i % 2 === 1 ? 'alt' : ''}">
        <td>${esc(s.budget)}</td>
        <td>${esc(s.leads)}</td>
        <td>${esc(s.sales)}</td>
        <td class="green">${esc(s.revenue)}</td>
        <td class="orange"><b>${esc(s.roas)}</b></td>
      </tr>`,
    )
    .join('');

  const hacksHtml = hacks
    .map(
      (h: any, i: number) => `
      <div class="module">
        <div class="module-title">${i + 1}. ${esc(h.hack)}</div>
        <p class="small">${esc(h.mechanism)}</p>
        ${h.expected_impact ? `<p class="small green"><b>Expected Impact:</b> ${esc(h.expected_impact)}</p>` : ''}
      </div>`,
    )
    .join('');

  return `
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Helvetica, Arial, sans-serif; color: ${COLOR_TEXT}; padding: 24px; font-size: 12px; }
      .brand { color: ${COLOR_ORANGE}; font-weight: bold; font-size: 14px; }
      .subbrand { color: ${COLOR_SECONDARY}; font-size: 11px; margin-bottom: 16px; }
      .title { font-size: 22px; font-weight: bold; margin: 10px 0 4px; }
      .tagline { font-style: italic; color: ${COLOR_SECONDARY}; margin-bottom: 16px; }
      hr { border: none; border-top: 1px solid ${COLOR_BORDER}; margin: 16px 0; }
      .section { margin-bottom: 22px; page-break-inside: avoid; }
      .section-heading { font-size: 15px; font-weight: bold; color: ${COLOR_TEXT}; border-left: 3px solid ${COLOR_ORANGE}; padding-left: 8px; margin-bottom: 10px; }
      .label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: ${COLOR_SECONDARY}; margin-top: 8px; }
      .small { font-size: 10.5px; color: ${COLOR_TEXT}; line-height: 1.5; }
      .italic-orange { font-style: italic; color: ${COLOR_ORANGE}; font-size: 10.5px; }
      .green { color: ${COLOR_GREEN}; }
      .orange { color: ${COLOR_ORANGE}; }
      .bullets { margin: 4px 0 8px 18px; padding: 0; }
      .bullets li { font-size: 10.5px; line-height: 1.6; }
      .module { background: #FAFAFA; border: 1px solid ${COLOR_BORDER}; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
      .module-title { font-weight: bold; font-size: 11.5px; margin-bottom: 6px; }
      .hook { background: #FFF7EC; border-radius: 6px; padding: 8px; margin-bottom: 8px; }
      .price-card { border: 1px solid ${COLOR_BORDER}; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
      .price-card.accent { background: #FFF7EC; border-color: ${COLOR_ORANGE}; }
      .tier-tag { font-size: 9px; font-weight: bold; color: ${COLOR_ORANGE}; margin-bottom: 6px; }
      .price { font-size: 18px; font-weight: bold; margin-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
      th { background: ${COLOR_ORANGE}; color: #fff; text-align: left; padding: 6px 8px; }
      td { padding: 6px 8px; border-bottom: 1px solid ${COLOR_BORDER}; }
      tr.alt { background: #FAFAFA; }
      .footer { text-align: center; color: ${COLOR_SECONDARY}; font-size: 9px; margin-top: 30px; }
    </style>
  </head>
  <body>
    <div class="brand">MANCHLY</div>
    <div class="subbrand">AI Course Growth Plan</div>
    <hr />
    <div class="title">${esc(idea.title || niche)}</div>
    ${idea.tagline ? `<div class="tagline">${esc(idea.tagline)}</div>` : ''}

    ${section('Course Idea', `<p class="small">${esc(idea.why_it_sells)}</p>`)}

    ${section(
      'Course Structure',
      `<p class="small"><b>${esc(structure.total_modules)}</b> modules · <b>${esc(structure.total_lessons)}</b> lessons total</p>${structureHtml}`,
    )}

    ${content.lessons?.length ? section('Content Creation', contentHtml) : ''}

    ${section(
      'Offer Creation',
      `
      <p class="small"><b>${esc(offer.headline)}</b></p>
      <p class="small">${esc(offer.subheadline)}</p>
      <p class="small">${esc(offer.description)}</p>
      ${pricingHtml}
    `,
    )}

    ${section(
      'Target Audience',
      `
      <p class="small"><b>${esc(audience.age_group)}</b> · ${esc(audience.gender_split)}</p>
      <div class="label">Top Cities</div><p class="small">${esc((audience.top_cities || []).join(', '))}</p>
      <div class="label">Meta Interests</div>${bulletList(audience.meta_interests)}
      <div class="label">Google Audiences</div>${bulletList(audience.google_audiences)}
      <div class="label">Core Pain Points</div>${bulletList(audience.pain_points)}
    `,
    )}

    ${section(
      'Ad Strategy',
      `
      <div class="label">Meta Ads</div>${creativesHtml}
      ${
        ads.meta?.funnel
          ? `<div class="label">Funnel</div>
             <p class="small">TOF: ${esc(ads.meta.funnel.tof)}</p>
             <p class="small">MOF: ${esc(ads.meta.funnel.mof)}</p>
             <p class="small">BOF: ${esc(ads.meta.funnel.bof)}</p>`
          : ''
      }
      <div class="label">Google Ads — Keyword Clusters</div>${keywordClustersHtml}
      ${ads.google?.intent_strategy ? `<div class="label">Intent Strategy</div><p class="small">${esc(ads.google.intent_strategy)}</p>` : ''}
    `,
    )}

    ${section(
      'Audience Sizing',
      `
      <p class="small"><b>TAM:</b> ${esc(sizing.tam)} · <b>SAM:</b> ${esc(sizing.sam)} · <b>SOM:</b> ${esc(sizing.som)}</p>
      <p class="small"><b>Est. Reachable:</b> ${esc(sizing.estimated_reachable)}</p>
      <p class="small"><b>Meta Est. Reach:</b> ${esc(sizing.meta_estimated_reach)}</p>
      ${sizing.logic ? `<div class="label">Sizing Logic</div><p class="small">${esc(sizing.logic)}</p>` : ''}
    `,
    )}

    ${section(
      'Revenue Forecast',
      `
      <p class="small">CTR: ${esc(revenue.assumed_ctr)} · CVR: ${esc(revenue.assumed_cvr)} · Cost/Lead: ${esc(revenue.cost_per_lead)} · Cost/Sale: ${esc(revenue.cost_per_sale)}</p>
      <table>
        <tr><th>Budget</th><th>Leads</th><th>Sales</th><th>Revenue</th><th>ROAS</th></tr>
        ${revenueRows}
      </table>
    `,
    )}

    ${section(
      'Scaling Plan',
      `
      <div class="label">Scale Trigger</div><p class="small">${esc(scaling.scale_trigger)}</p>
      <div class="label">Budget Allocation</div><p class="small">${esc(scaling.budget_allocation)}</p>
      <div class="label">Retargeting Logic</div><p class="small">${esc(scaling.retargeting_logic)}</p>
      <div class="label">LTV Optimization</div><p class="small">${esc(scaling.ltv_optimization)}</p>
    `,
    )}

    ${hacks.length ? section('Growth Hacks', hacksHtml) : ''}

    <div class="footer">Manchly · AI Course Growth Plan</div>
  </body>
  </html>`;
}

export async function exportPlanPdf(plan: any, niche: string): Promise<void> {
  const safeName = (niche || 'course-growth-plan')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const html = buildHtml(plan, niche);

  const file = await RNHTMLtoPDF.convert({
    html,
    fileName: `${safeName}-growth-plan`,
    base64: false,
  });

  if (!file?.filePath) {
    throw new Error('PDF generation returned no file path');
  }

  await Share.open({
    url: `file://${file.filePath}`,
    type: 'application/pdf',
    failOnCancel: false, // user backing out of the share sheet isn't an error
  });
}