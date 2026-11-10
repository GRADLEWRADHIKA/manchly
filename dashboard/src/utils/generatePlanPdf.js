import jsPDF from "jspdf";


const COLOR_ORANGE = "#F5A623";
const COLOR_TEXT = "#1F2937";
const COLOR_SECONDARY = "#64748B";
const COLOR_BORDER = "#E2E8F0";
const COLOR_GREEN = "#22C55E";
const COLOR_WHITE = "#FFFFFF";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN *2;
const FOOTER_H = 14;

export function generatePlanPdf(plan, niche) {
    const doc = new jsPDF({unit: "mm", format: "a4"});
    let y = MARGIN;


    function ensureSpace(neededHeight){
        if(y + neededHeight > PAGE_H - FOOTER_H){
            doc.addPage();
            y = MARGIN;
        }
    }

    function sectionHeading(title, icon){
        ensureSpace(14);
        doc.setFillColor(COLOR_ORANGE);
        doc.rect(MARGIN, y, 3, 8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(COLOR_TEXT);
        doc.text(`${icon ? icon + "  " : ""}${title}`, MARGIN + 7, y + 6);
        y += 12;
        doc.setDrawColor(COLOR_BORDER);
        doc.setLineWidth(0.2);
       doc.line(MARGIN, y, PAGE_W - MARGIN, y);
        y += 6;
    }

    function label(text){
        ensureSpace(6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_SECONDARY);
        doc.text(text.toUpperCase(), MARGIN, y);
        y += 5;
    }

    function paragraph(text, opts={}){
        if(!text) return;
        const {fontSize = 10, color = COLOR_TEXT, bold = false, italic = false, indent = 0} = opts;
        doc.setFont("helvetica", bold ? "bold" : italic ? "italic" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(text, CONTENT_W - indent);
    const lineHeight = fontSize * 0.42; // mm per line, roughly matches jsPDF default leading
    for (const line of lines) {
      ensureSpace(lineHeight + 1);
      doc.text(line, MARGIN + indent, y);
      y += lineHeight;
    }
    y += 2; 
    }

   function bulletList(items, opts = {}) {
    if (!items?.length) return;
    const { fontSize = 9.5, color = COLOR_TEXT } = opts;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(color);
    for (const item of items) {
      const lines = doc.splitTextToSize(String(item), CONTENT_W - 6);
      const lineHeight = fontSize * 0.42;
      ensureSpace(lineHeight * lines.length + 1);
      doc.setTextColor(COLOR_ORANGE);
      doc.text("•", MARGIN, y);
      doc.setTextColor(color);
      lines.forEach((line, i) => {
        doc.text(line, MARGIN + 5, y + i * lineHeight);
      });
      y += lineHeight * lines.length + 1.5;
    }
    y += 2;
  }
  
  function spacer(mm = 4) {
    y += mm;
  }

  doc.setFillColor(COLOR_ORANGE);
  doc.rect(0, 0, PAGE_W, 3, "F"); // thin top accent strip

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLOR_ORANGE);
  doc.text("MANCHLY", MARGIN, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLOR_SECONDARY);
  doc.text("AI Course Growth Plan", MARGIN, y + 12);
  y += 24;

  doc.setDrawColor(COLOR_BORDER);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(COLOR_TEXT);
  const titleLines = doc.splitTextToSize(plan?.course_idea?.title || niche || "Course Growth Plan", CONTENT_W);
  titleLines.forEach((line) => {
    doc.text(line, MARGIN, y);
    y += 8.5;
  });
  y += 2;

  if (plan?.course_idea?.tagline) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11.5);
    doc.setTextColor(COLOR_SECONDARY);
    const tagLines = doc.splitTextToSize(plan.course_idea.tagline, CONTENT_W);
    tagLines.forEach((line) => {
      doc.text(line, MARGIN, y);
      y += 6;
    });
  }
  spacer(6);

  doc.setFillColor(COLOR_ORANGE + "1A"); // note: jsPDF doesn't support alpha hex — see caveat below
  y += 4;

  // ---- Course Idea ----
  sectionHeading("Course Idea", "\u{1F4A1}");
  if (plan?.course_idea?.why_it_sells) {
    label("Why This Will Sell");
    paragraph(plan.course_idea.why_it_sells);
  }
  spacer(6);

   // ---- Course Structure ----
  if (plan?.course_structure) {
    sectionHeading("Course Structure", "\u{1F4DA}");
    paragraph(
      `${plan.course_structure.total_modules ?? "-"} modules · ${plan.course_structure.total_lessons ?? "-"} lessons total`,
      { bold: true, color: COLOR_ORANGE }
    );
    (plan.course_structure.modules || []).forEach((m) => {
      ensureSpace(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(COLOR_TEXT);
      doc.text(`Module ${m.module_number}: ${m.module_title}`, MARGIN, y);
      y += 6;
      bulletList(m.lessons || []);
      spacer(2);
    });
    spacer(6);
  }

  // ---- Content Creation ----
  if (plan?.content_creation?.lessons?.length) {
    sectionHeading("Content Creation", "\u{1F3AC}");
    plan.content_creation.lessons.forEach((l) => {
      ensureSpace(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(COLOR_TEXT);
      doc.text(`Lesson ${l.lesson_number}: ${l.title}`, MARGIN, y);
      y += 6;

      if (l.hook) {
        label("Opening Hook");
        paragraph(l.hook, { italic: true, color: COLOR_ORANGE });
      }
      if (l.key_points?.length) {
        label("Key Teaching Points");
        bulletList(l.key_points);
      }
      if (l.retention_mechanism) {
        label("Retention Mechanism");
        paragraph(l.retention_mechanism, { fontSize: 9, color: COLOR_SECONDARY });
      }
      spacer(4);
    });
    spacer(4);
  }
  
  
   if (plan?.offer_creation) {
    sectionHeading("Offer Creation", "\u{1F3F7}\uFE0F");
    if (plan.offer_creation.headline) {
      paragraph(plan.offer_creation.headline, { bold: true, fontSize: 13, color: COLOR_ORANGE });
    }
    if (plan.offer_creation.subheadline) {
      paragraph(plan.offer_creation.subheadline, { color: COLOR_SECONDARY });
    }
    if (plan.offer_creation.description) {
      label("Sales Description");
      paragraph(plan.offer_creation.description);
    }
    ["low_ticket", "high_ticket"].forEach((tier) => {
      const t = plan.offer_creation.pricing_strategy?.[tier];
      if (!t) return;
      ensureSpace(20);
      label(tier === "high_ticket" ? "High Ticket" : "Low Ticket");
      paragraph(t.price || "", { bold: true, fontSize: 14, color: COLOR_TEXT });
      if (t.what_included) paragraph(`Included: ${t.what_included}`, { fontSize: 9 });
      if (t.psychology) paragraph(`Why it works: ${t.psychology}`, { fontSize: 9, color: COLOR_SECONDARY });
      spacer(3);
    });
     spacer(6);
  }

    // ---- Target Audience ----
  if (plan?.target_audience) {
    sectionHeading("Target Audience");
    const ta = plan.target_audience;
    if (ta.age_group || ta.gender_split) {
      paragraph(`${ta.age_group || ""}${ta.age_group && ta.gender_split ? " · " : ""}${ta.gender_split || ""}`, {
        bold: true,
        color: COLOR_ORANGE,
      });
    }
    if (ta.top_cities?.length) {
      label("Top Cities");
      paragraph(ta.top_cities.join(", "), { fontSize: 9.5 });
    }
    if (ta.meta_interests?.length) {
      label("Meta Interests");
      bulletList(ta.meta_interests);
    }
    if (ta.google_audiences?.length) {
      label("Google Audiences");
      bulletList(ta.google_audiences);
    }
    if (ta.pain_points?.length) {
      label("Core Pain Points");
      bulletList(ta.pain_points);
    }
    spacer(6);
  }

  // ---- Ad Strategy ----
  if (plan?.ad_strategy) {
    sectionHeading("Ad Strategy");

    label("Meta Ads");
    (plan.ad_strategy.meta?.creatives || []).forEach((c, i) => {
      ensureSpace(16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(COLOR_ORANGE);
      doc.text(`${c.angle || `Creative ${i + 1}`} Angle`, MARGIN, y);
      y += 5.5;
      if (c.hook) paragraph(c.hook, { italic: true, fontSize: 9.5 });
      if (c.copy) paragraph(c.copy, { fontSize: 9 });
      if (c.cta) paragraph(`CTA: ${c.cta}`, { fontSize: 9, bold: true, color: COLOR_SECONDARY });
      spacer(2);
    });

    const funnel = plan.ad_strategy.meta?.funnel;
    if (funnel) {
      label("Funnel Strategy");
      if (funnel.tof) paragraph(`TOF: ${funnel.tof}`, { fontSize: 9 });
      if (funnel.mof) paragraph(`MOF: ${funnel.mof}`, { fontSize: 9 });
      if (funnel.bof) paragraph(`BOF: ${funnel.bof}`, { fontSize: 9 });
    }

    spacer(3);
    label("Google Ads — Keyword Clusters");
    (plan.ad_strategy.google?.keyword_clusters || []).forEach((kc) => {
      ensureSpace(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(COLOR_TEXT);
      doc.text(kc.cluster_name || "", MARGIN, y);
      y += 5;
      paragraph((kc.keywords || []).join(", "), { fontSize: 8.5, color: COLOR_SECONDARY });
    });
    if (plan.ad_strategy.google?.intent_strategy) {
      label("Intent Strategy");
      paragraph(plan.ad_strategy.google.intent_strategy, { fontSize: 9 });
    }
    spacer(6);
  }

  // ---- Audience Sizing ----
  if (plan?.audience_sizing) {
    sectionHeading("Audience Sizing");
    const as = plan.audience_sizing;
    [
      ["TAM (Total Addressable Market)", as.tam],
      ["SAM (Serviceable Addressable Market)", as.sam],
      ["SOM (Year 1 Obtainable)", as.som],
      ["Est. Reachable (Year 1)", as.estimated_reachable],
      ["Meta Estimated Reach", as.meta_estimated_reach],
    ].forEach(([lbl, val]) => {
      if (!val) return;
      ensureSpace(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(COLOR_ORANGE);
      doc.text(`${lbl}: `, MARGIN, y);
      const lblWidth = doc.getTextWidth(`${lbl}: `);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLOR_TEXT);
      doc.text(String(val), MARGIN + lblWidth, y);
      y += 6;
    });
    if (as.logic) {
      spacer(2);
      label("Sizing Logic");
      paragraph(as.logic, { fontSize: 9 });
    }
    spacer(6);
  }

  // ---- Revenue Forecast (table) ----
  if (plan?.revenue_forecast) {
    sectionHeading("Revenue Forecast");
    const rf = plan.revenue_forecast;
    paragraph(
      `Assumed CTR: ${rf.assumed_ctr || "-"}   ·   Assumed CVR: ${rf.assumed_cvr || "-"}   ·   Cost/Lead: ${rf.cost_per_lead || "-"}   ·   Cost/Sale: ${rf.cost_per_sale || "-"}`,
      { fontSize: 9, color: COLOR_SECONDARY }
    );
    spacer(3);

    if (rf.budget_scenarios?.length) {
      const cols = ["Budget", "Leads", "Sales", "Revenue", "ROAS"];
      const colW = CONTENT_W / cols.length;
      const rowH = 8;

      ensureSpace(rowH * (rf.budget_scenarios.length + 1) + 4);

      // header row
      doc.setFillColor(COLOR_ORANGE);
      doc.rect(MARGIN, y, CONTENT_W, rowH, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(COLOR_WHITE);
      cols.forEach((c, i) => {
        doc.text(c, MARGIN + i * colW + 2, y + 5.5);
      });
      y += rowH;

      // data rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      rf.budget_scenarios.forEach((s, rowIdx) => {
        if (rowIdx % 2 === 1) {
          doc.setFillColor("#FAFAFA");
          doc.rect(MARGIN, y, CONTENT_W, rowH, "F");
        }
        doc.setTextColor(COLOR_TEXT);
        const vals = [s.budget, s.leads, s.sales, s.revenue, s.roas];
        vals.forEach((v, i) => {
          doc.text(String(v ?? "-"), MARGIN + i * colW + 2, y + 5.5);
        });
        y += rowH;
      });

      // outer border
      doc.setDrawColor(COLOR_BORDER);
      doc.rect(MARGIN, y - rowH * (rf.budget_scenarios.length + 1), CONTENT_W, rowH * (rf.budget_scenarios.length + 1));
    }
    spacer(6);
  }

  // ---- Scaling Plan ----
  if (plan?.scaling_plan) {
    sectionHeading("Scaling Plan");
    const sp = plan.scaling_plan;
    [
      ["Scale Trigger", sp.scale_trigger],
      ["Budget Allocation", sp.budget_allocation],
      ["Retargeting Logic", sp.retargeting_logic],
      ["LTV Optimization", sp.ltv_optimization],
    ].forEach(([lbl, val]) => {
      if (!val) return;
      label(lbl);
      paragraph(val, { fontSize: 9.5 });
      spacer(2);
    });
    spacer(4);
  }

  // ---- Growth Hacks ----
  if (plan?.growth_hacks?.length) {
    sectionHeading("Growth Hacks");
    plan.growth_hacks.forEach((h, i) => {
      ensureSpace(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(COLOR_ORANGE);
      doc.text(`${i + 1}. ${h.hack || ""}`, MARGIN, y);
      y += 6;
      if (h.mechanism) paragraph(h.mechanism, { fontSize: 9.5 });
      if (h.expected_impact) paragraph(`Expected Impact: ${h.expected_impact}`, { fontSize: 9, bold: true, color: COLOR_GREEN });
      spacer(3);
    });
  }

  // ---- Footer pass: page numbers on every page ----
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(COLOR_BORDER);
    doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLOR_SECONDARY);
    doc.text("Manchly · AI Course Growth Plan", MARGIN, PAGE_H - 7);
    doc.text(`Page ${i} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 7, { align: "right" });
  }

  // ---- Trigger download ----
  const safeName = (niche || "course-growth-plan")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  doc.save(`${safeName}-growth-plan.pdf`);

  return doc;
}