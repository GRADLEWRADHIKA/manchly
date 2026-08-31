import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { X, Download } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { aiCall } from '../../utils/aiApi';
import AiButton from '../AiButton';
import CustomTextInput from '../CustomInput';
import { exportPlanPdf } from '../../utils/generatePlanPdfMobile';

type Props = { visible: boolean; onClose: () => void };

const SECTIONS = [
  { key: 'course_idea', label: 'Course Idea' },
  { key: 'course_structure', label: 'Structure' },
  { key: 'content_creation', label: 'Content' },
  { key: 'offer_creation', label: 'Offer' },
  { key: 'target_audience', label: 'Audience' },
  { key: 'ad_strategy', label: 'Ad Strategy' },
  { key: 'audience_sizing', label: 'Sizing' },
  { key: 'revenue_forecast', label: 'Revenue' },
  { key: 'scaling_plan', label: 'Scaling' },
  { key: 'growth_hacks', label: 'Growth Hacks' },
];

const CoursePlannerModal: React.FC<Props> = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [niche, setNiche] = useState('');
  const [activeSection, setActiveSection] = useState('course_idea');

  const CourseIdeaSection = ({ data }: { data: any }) => {
    if (!data) return null;
    return (
      <View>
        <View style={[s.card, s.cardAccent]}>
          <Text style={s.label}>COURSE TITLE</Text>
          <Text style={s.cardTitleLarge}>{data.title}</Text>
          <Text style={s.italic}>{data.tagline}</Text>
        </View>
        <View style={s.card}>
          <Text style={s.label}>WHY THIS WILL SELL</Text>
          <Text style={s.body}>{data.why_it_sells}</Text>
        </View>
      </View>
    );
  };

  const CourseStructureSection = ({ data }: { data: any }) => {
    if (!data) return null;
    return (
      <View>
        <View style={s.metricRow}>
          <View style={s.metricBox}>
            <Text style={s.metricValue}>{data.total_modules}</Text>
            <Text style={s.metricLabel}>Modules</Text>
          </View>
          <View style={s.metricBox}>
            <Text style={s.metricValue}>{data.total_lessons}</Text>
            <Text style={s.metricLabel}>Total Lessons</Text>
          </View>
        </View>
        {data.modules?.map((m: any) => (
          <View key={m.module_number} style={s.card}>
            <Text style={s.cardTitle}>
              Module {m.module_number}: {m.module_title}
            </Text>
            {m.lessons?.map((l: string, i: number) => (
              <Text key={i} style={s.bullet}>
                {i + 1}. {l}
              </Text>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const ContentCreationSection = ({ data }: { data: any }) => {
    if (!data?.lessons?.length) return null;
    return (
      <View>
        {data.lessons.map((l: any) => (
          <View key={l.lesson_number} style={s.card}>
            <Text style={s.cardTitle}>
              Lesson {l.lesson_number}: {l.title}
            </Text>
            {l.hook && (
              <View style={s.hookBox}>
                <Text style={s.label}>OPENING HOOK</Text>
                <Text style={s.italicOrange}>{l.hook}</Text>
              </View>
            )}
            {l.key_points?.length > 0 && (
              <>
                <Text style={s.label}>KEY TEACHING POINTS</Text>
                {l.key_points.map((pt: string, i: number) => (
                  <Text key={i} style={s.bullet}>
                    {'\u2022'} {pt}
                  </Text>
                ))}
              </>
            )}
            {l.retention_mechanism && (
              <>
                <Text style={s.label}>RETENTION MECHANISM</Text>
                <Text style={s.bodySmall}>{l.retention_mechanism}</Text>
              </>
            )}
          </View>
        ))}
      </View>
    );
  };

  const OfferCreationSection = ({ data }: { data: any }) => {
    if (!data) return null;
    return (
      <View>
        <View style={[s.card, s.cardAccent, { alignItems: 'center' }]}>
          <Text style={s.label}>COURSE HEADLINE</Text>
          <Text style={[s.cardTitleLarge, { textAlign: 'center' }]}>
            {data.headline}
          </Text>
          <Text style={[s.bodySmall, { textAlign: 'center' }]}>
            {data.subheadline}
          </Text>
        </View>
        <View style={s.card}>
          <Text style={s.label}>SALES DESCRIPTION</Text>
          <Text style={s.body}>{data.description}</Text>
        </View>
        {['low_ticket', 'high_ticket'].map(tier => {
          const t = data.pricing_strategy?.[tier];
          if (!t) return null;
          const isGold = tier === 'high_ticket';
          return (
            <View key={tier} style={[s.card, isGold && s.cardAccent]}>
              <Text style={s.tierTag}>
                {isGold ? 'HIGH TICKET' : 'LOW TICKET'}
              </Text>
              <Text style={s.priceText}>{t.price}</Text>
              <Text style={s.label}>INCLUDED</Text>
              <Text style={s.bodySmall}>{t.what_included}</Text>
              <Text style={s.label}>PSYCHOLOGY</Text>
              <Text style={s.bodySmall}>{t.psychology}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const TargetAudienceSection = ({ data }: { data: any }) => {
    if (!data) return null;
    return (
      <View>
        <View style={s.metricRow}>
          <View style={s.metricBox}>
            <Text style={s.metricValueSmall}>{data.age_group}</Text>
            <Text style={s.metricLabel}>Age Group</Text>
          </View>
          <View style={s.metricBox}>
            <Text style={s.metricValueSmall}>{data.gender_split}</Text>
            <Text style={s.metricLabel}>Gender Split</Text>
          </View>
        </View>
        {data.top_cities?.length > 0 && (
          <View style={s.card}>
            <Text style={s.label}>TOP CITIES</Text>
            <View style={s.pillRow}>
              {data.top_cities.map((c: string) => (
                <View key={c} style={s.pill}>
                  <Text style={s.pillText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {data.meta_interests?.length > 0 && (
          <View style={s.card}>
            <Text style={s.label}>META INTERESTS</Text>
            {data.meta_interests.map((x: string, i: number) => (
              <Text key={i} style={s.bullet}>
                {'\u2022'} {x}
              </Text>
            ))}
          </View>
        )}
        {data.google_audiences?.length > 0 && (
          <View style={s.card}>
            <Text style={s.label}>GOOGLE AUDIENCES</Text>
            {data.google_audiences.map((x: string, i: number) => (
              <Text key={i} style={s.bullet}>
                {'\u2022'} {x}
              </Text>
            ))}
          </View>
        )}
        {data.pain_points?.length > 0 && (
          <View style={s.card}>
            <Text style={s.label}>CORE PAIN POINTS</Text>
            {data.pain_points.map((p: string, i: number) => (
              <Text key={i} style={s.bullet}>
                ⚡ {p}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const AdStrategySection = ({ data }: { data: any }) => {
    if (!data) return null;
    return (
      <View>
        <Text style={s.groupHeading}>META ADS</Text>
        {data.meta?.creatives?.map((c: any, i: number) => (
          <View key={i} style={s.card}>
            <Text style={s.tierTag}>
              {(c.angle || `CREATIVE ${i + 1}`).toUpperCase()} ANGLE
            </Text>
            {c.hook && <Text style={s.italic}>{c.hook}</Text>}
            {c.copy && (
              <Text style={[s.bodySmall, { marginTop: hp(6) }]}>
                {c.copy}
              </Text>
            )}
            {c.cta && (
              <View style={[s.pill, { alignSelf: 'flex-start', marginTop: hp(8) }]}>
                <Text style={s.pillText}>{c.cta}</Text>
              </View>
            )}
          </View>
        ))}

        {data.meta?.funnel && (
          <View style={s.card}>
            <Text style={s.label}>FUNNEL STRATEGY</Text>
            {data.meta.funnel.tof && (
              <Text style={s.bodySmall}>TOF: {data.meta.funnel.tof}</Text>
            )}
            {data.meta.funnel.mof && (
              <Text style={[s.bodySmall, { marginTop: hp(4) }]}>
                MOF: {data.meta.funnel.mof}
              </Text>
            )}
            {data.meta.funnel.bof && (
              <Text style={[s.bodySmall, { marginTop: hp(4) }]}>
                BOF: {data.meta.funnel.bof}
              </Text>
            )}
          </View>
        )}

        <Text style={s.groupHeading}>GOOGLE ADS</Text>
        {data.google?.keyword_clusters?.map((kc: any, i: number) => (
          <View key={i} style={s.card}>
            <Text style={s.cardTitle}>{kc.cluster_name}</Text>
            <View style={s.pillRow}>
              {kc.keywords?.map((k: string) => (
                <View key={k} style={[s.pill, { backgroundColor: colors.inputBg }]}>
                  <Text style={[s.pillText, { color: colors.textMuted }]}>
                    {k}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
        {data.google?.intent_strategy && (
          <View style={s.card}>
            <Text style={s.label}>INTENT STRATEGY</Text>
            <Text style={s.bodySmall}>{data.google.intent_strategy}</Text>
          </View>
        )}
      </View>
    );
  };

  const AudienceSizingSection = ({ data }: { data: any }) => {
    if (!data) return null;
    return (
      <View>
        <View style={s.metricRow}>
          {[
            ['TAM', data.tam],
            ['SAM', data.sam],
            ['SOM', data.som],
          ].map(([lbl, val]) => (
            <View key={lbl} style={s.metricBox}>
              <Text style={s.metricValueSmall}>{val}</Text>
              <Text style={s.metricLabel}>{lbl}</Text>
            </View>
          ))}
        </View>
        <View style={[s.card, s.cardAccent]}>
          <Text style={s.label}>META ESTIMATED REACH</Text>
          <Text style={s.cardTitle}>{data.meta_estimated_reach}</Text>
          <Text style={[s.label, { marginTop: hp(8) }]}>YEAR 1 REACHABLE</Text>
          <Text style={s.bodySmall}>{data.estimated_reachable}</Text>
        </View>
        {data.logic && (
          <View style={s.card}>
            <Text style={s.label}>SIZING LOGIC</Text>
            <Text style={s.bodySmall}>{data.logic}</Text>
          </View>
        )}
      </View>
    );
  };

  const RevenueForecastSection = ({ data }: { data: any }) => {
    if (!data) return null;
    return (
      <View>
        <View style={s.metricRow}>
          {[
            ['CTR', data.assumed_ctr],
            ['CVR', data.assumed_cvr],
          ].map(([lbl, val]) => (
            <View key={lbl} style={s.metricBox}>
              <Text style={s.metricValueSmall}>{val}</Text>
              <Text style={s.metricLabel}>{lbl}</Text>
            </View>
          ))}
        </View>
        <View style={s.metricRow}>
          {[
            ['Cost/Lead', data.cost_per_lead],
            ['Cost/Sale', data.cost_per_sale],
          ].map(([lbl, val]) => (
            <View key={lbl} style={s.metricBox}>
              <Text style={s.metricValueSmall}>{val}</Text>
              <Text style={s.metricLabel}>{lbl}</Text>
            </View>
          ))}
        </View>

        <Text style={s.label}>BUDGET SCENARIOS</Text>
        {data.budget_scenarios?.map((sc: any, i: number) => (
          <View key={i} style={s.tableRow}>
            <Text style={s.tableCellBold}>{sc.budget}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.tableCellSmall}>Leads: {sc.leads}</Text>
              <Text style={s.tableCellSmall}>Sales: {sc.sales}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.tableCellGreen}>{sc.revenue}</Text>
              <Text style={s.tableCellGold}>{sc.roas}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const ScalingPlanSection = ({ data }: { data: any }) => {
    if (!data) return null;
    const items = [
      ['Scale Trigger', data.scale_trigger],
      ['Budget Allocation', data.budget_allocation],
      ['Retargeting Logic', data.retargeting_logic],
      ['LTV Optimization', data.ltv_optimization],
    ];
    return (
      <View>
        {items.map(([lbl, val]) =>
          val ? (
            <View key={lbl} style={s.card}>
              <Text style={s.cardTitle}>{lbl}</Text>
              <Text style={s.bodySmall}>{val}</Text>
            </View>
          ) : null,
        )}
      </View>
    );
  };

  const GrowthHacksSection = ({ data }: { data: any[] }) => {
    if (!data?.length) return null;
    return (
      <View>
        {data.map((h: any, i: number) => (
          <View key={i} style={s.card}>
            <View style={{ flexDirection: 'row', gap: wp(10) }}>
              <View style={s.hackNum}>
                <Text style={s.hackNumText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{h.hack}</Text>
                <Text style={s.bodySmall}>{h.mechanism}</Text>
                {h.expected_impact && (
                  <Text
                    style={[
                      s.bodySmall,
                      { color: colors.gold, fontWeight: '700', marginTop: hp(6) },
                    ]}
                  >
                    Impact: {h.expected_impact}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const generate = async () => {
    if (!niche.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Niche is required',
        position: 'top',
      });
      return;
    }
    setLoading(true);
    try {
      const data = await aiCall('/ai/course/plan', { niche: niche.trim() });
      setPlan(data);
      setActiveSection('course_idea');
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed to generate plan',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!plan) return;
    setExporting(true);
    try {
      await exportPlanPdf(plan, niche);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Could not create PDF',
        position: 'top',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleClose = () => {
    setPlan(null);
    setNiche('');
    setActiveSection('course_idea');
    onClose();
  };

  function renderSection(key: string, planData: any) {
    switch (key) {
      case 'course_idea':
        return <CourseIdeaSection data={planData.course_idea} />;
      case 'course_structure':
        return <CourseStructureSection data={planData.course_structure} />;
      case 'content_creation':
        return <ContentCreationSection data={planData.content_creation} />;
      case 'offer_creation':
        return <OfferCreationSection data={planData.offer_creation} />;
      case 'target_audience':
        return <TargetAudienceSection data={planData.target_audience} />;
      case 'ad_strategy':
        return <AdStrategySection data={planData.ad_strategy} />;
      case 'audience_sizing':
        return <AudienceSizingSection data={planData.audience_sizing} />;
      case 'revenue_forecast':
        return <RevenueForecastSection data={planData.revenue_forecast} />;
      case 'scaling_plan':
        return <ScalingPlanSection data={planData.scaling_plan} />;
      case 'growth_hacks':
        return <GrowthHacksSection data={planData.growth_hacks} />;
      default:
        return null;
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>AI Course Planner</Text>
          <View style={{ flexDirection: 'row', gap: wp(14), alignItems: 'center' }}>
            {plan && (
              <TouchableOpacity onPress={handleDownload} disabled={exporting}>
                <Download size={wp(20)} color={colors.white} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleClose}>
              <X size={wp(22)} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {!plan ? (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            <View style={s.center}>
              <Text style={s.subtitle}>
                Turn any niche into a full go-to-market plan — curriculum, ad
                creatives, audience sizing & revenue forecast.
              </Text>
              <Text style={s.label}>Course Niche *</Text>
              <CustomTextInput
                inputContainerStyle={s.input}
                inputStyle={s.inputText}
                placeholder="e.g. Instagram Reels for Coaches"
                placeholderTextColor={colors.subtext}
                value={niche}
                onChange={setNiche}
              />
              <AiButton
                label="Generate Plan"
                onPress={generate}
                loading={loading}
              />
            </View>
          </ScrollView>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tabBar}
              style={s.tabBarWrap}
            >
              {SECTIONS.map(sec => (
                <TouchableOpacity
                  key={sec.key}
                  onPress={() => setActiveSection(sec.key)}
                  style={[s.tab, activeSection === sec.key && s.tabActive]}
                >
                  <Text
                    style={[
                      s.tabText,
                      activeSection === sec.key && s.tabTextActive,
                    ]}
                  >
                    {sec.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
              {renderSection(activeSection, plan)}
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
};

export default CoursePlannerModal;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.primaryDark,
  },
  title: { fontSize: fp(18), fontWeight: '700', color: colors.white },
  scroll: { padding: wp(16), paddingBottom: hp(40) },
  center: { paddingTop: hp(20), gap: hp(8) },
  subtitle: {
    fontSize: fp(14),
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: hp(16),
  },
  label: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: hp(4),
  },
  input: {
    borderRadius: wp(10),
    paddingHorizontal: wp(12),
    height: hp(44),
    width: '100%',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: hp(12),
  },
  inputText: { color: colors.textPrimary, fontSize: fp(14) },
  tabBarWrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.primaryDark,
  },
  tabBar: { paddingHorizontal: wp(12), paddingVertical: hp(10), gap: wp(8) },
  tab: {
    paddingHorizontal: wp(14),
    paddingVertical: hp(8),
    borderRadius: wp(20),
    backgroundColor: colors.inputBg,
  },
  tabActive: { backgroundColor: colors.gold },
  tabText: {
    fontSize: fp(12.5),
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: { color: colors.black },
  body: { fontSize: fp(14), color: colors.textSecondary, lineHeight: fp(22) },
  bullet: {
    fontSize: fp(13),
    color: colors.textSecondary,
    lineHeight: fp(20),
    marginBottom: hp(4),
  },
  card: {
    backgroundColor: colors.primaryDark,
    borderRadius: wp(14),
    padding: wp(16),
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardAccent: {
    backgroundColor: colors.goldDim,
    borderColor: colors.gold,
  },
  cardTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: hp(8),
  },
  cardTitleLarge: {
    fontSize: fp(19),
    fontWeight: '800',
    color: colors.textPrimary,
    marginVertical: hp(6),
  },
  italic: {
    fontSize: fp(13.5),
    fontStyle: 'italic',
    color: colors.textMuted,
    lineHeight: fp(20),
  },
  italicOrange: {
    fontSize: fp(13),
    fontStyle: 'italic',
    color: colors.gold,
    lineHeight: fp(19),
  },
  bodySmall: {
    fontSize: fp(12.5),
    color: colors.textMuted,
    lineHeight: fp(19),
  },
  hookBox: {
    backgroundColor: colors.goldDim,
    borderRadius: wp(10),
    padding: wp(12),
    marginBottom: hp(10),
  },
  metricRow: { flexDirection: 'row', gap: wp(10), marginBottom: hp(12) },
  metricBox: {
    flex: 1,
    backgroundColor: colors.goldDim,
    borderRadius: wp(12),
    padding: wp(14),
    alignItems: 'center',
  },
  metricValue: { fontSize: fp(20), fontWeight: '800', color: colors.gold },
  metricValueSmall: {
    fontSize: fp(14),
    fontWeight: '800',
    color: colors.gold,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: fp(10),
    color: colors.subtext,
    marginTop: hp(4),
    textTransform: 'uppercase',
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(6) },
  pill: {
    backgroundColor: colors.goldDim,
    borderRadius: wp(20),
    paddingHorizontal: wp(12),
    paddingVertical: hp(5),
  },
  pillText: { fontSize: fp(11.5), color: colors.gold, fontWeight: '600' },
  tierTag: {
    fontSize: fp(10.5),
    fontWeight: '700',
    color: colors.gold,
    marginBottom: hp(6),
  },
  priceText: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: hp(8),
  },
  groupHeading: {
    fontSize: fp(12),
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 0.6,
    marginTop: hp(14),
    marginBottom: hp(8),
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: wp(10),
    padding: wp(12),
    marginBottom: hp(8),
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableCellBold: { fontSize: fp(13), fontWeight: '700', color: colors.textPrimary, flex: 1 },
  tableCellSmall: { fontSize: fp(11), color: colors.textMuted },
  tableCellGreen: { fontSize: fp(13), fontWeight: '700', color: colors.gold },
  tableCellGold: { fontSize: fp(14), fontWeight: '800', color: colors.gold },
  hackNum: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(8),
    backgroundColor: colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hackNumText: { fontSize: fp(13), fontWeight: '800', color: colors.gold },
});