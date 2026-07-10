import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { X, CheckCircle, XCircle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { aiCall } from '../../utils/aiApi';
import AiButton from '../AiButton';

type Question = {
  q: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  topic: string;
  lessonText?: string;
};

const QuizModal: React.FC<Props> = ({ visible, onClose, topic, lessonText }) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const generate = async () => {
    setLoading(true);
    setAnswers({});
    setSubmitted(false);
    try {
      const data = await aiCall('/ai/course/quiz', {
        topic,
        ...(lessonText ? { lesson_text: lessonText } : {}),
        count: 5,
      });
      setQuestions(data.questions || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to generate quiz', position: 'bottom' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    onClose();
  };

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0), 0,
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Quiz</Text>
          <TouchableOpacity onPress={handleClose}>
            <X size={wp(22)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {questions.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.subtitle}>Generate a quiz on:</Text>
              <Text style={styles.topicName}>{topic}</Text>
              <AiButton label="Generate Quiz" onPress={generate} loading={loading} />
            </View>
          ) : (
            <>
              {submitted && (
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreText}>
                    Score: {score}/{questions.length}
                  </Text>
                </View>
              )}

              {questions.map((q, qi) => {
                const selected = answers[qi];
                return (
                  <View key={qi} style={styles.questionCard}>
                    <Text style={styles.qText}>
                      {qi + 1}. {q.q}
                    </Text>
                    {q.options.map((opt, oi) => {
                      const isSelected = selected === oi;
                      const isCorrect = q.correct_index === oi;
                      let optStyle = styles.option;
                      if (submitted && isCorrect) optStyle = styles.optionCorrect;
                      else if (submitted && isSelected && !isCorrect) optStyle = styles.optionWrong;
                      else if (isSelected) optStyle = styles.optionSelected;

                      return (
                        <TouchableOpacity
                          key={oi}
                          style={optStyle}
                          onPress={() => {
                            if (!submitted) setAnswers(prev => ({ ...prev, [qi]: oi }));
                          }}
                          disabled={submitted}
                        >
                          <Text style={[
                            styles.optText,
                            (isSelected || (submitted && isCorrect)) && { color: colors.white },
                          ]}>
                            {opt}
                          </Text>
                          {submitted && isCorrect && (
                            <CheckCircle size={wp(16)} color={colors.white} />
                          )}
                          {submitted && isSelected && !isCorrect && (
                            <XCircle size={wp(16)} color={colors.white} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                    {submitted && q.explanation && (
                      <Text style={styles.explanation}>{q.explanation}</Text>
                    )}
                  </View>
                );
              })}

              {!submitted ? (
                <TouchableOpacity
                  style={[styles.submitBtn, Object.keys(answers).length < questions.length && { opacity: 0.5 }]}
                  onPress={() => setSubmitted(true)}
                  disabled={Object.keys(answers).length < questions.length}
                >
                  <Text style={styles.submitText}>Submit Answers</Text>
                </TouchableOpacity>
              ) : (
                <AiButton label="Regenerate Quiz" onPress={generate} loading={loading} />
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default QuizModal;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: wp(16), borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  title: { fontSize: fp(18), fontWeight: '700', color: colors.text },
  scroll: { padding: wp(16), paddingBottom: hp(40) },
  center: { alignItems: 'center', paddingTop: hp(40), gap: hp(12) },
  subtitle: { fontSize: fp(14), color: colors.textSecondary },
  topicName: { fontSize: fp(16), fontWeight: '700', color: colors.text, textAlign: 'center' },
  scoreCard: {
    backgroundColor: colors.info, borderRadius: wp(12), padding: wp(16),
    alignItems: 'center', marginBottom: hp(16),
  },
  scoreText: { fontSize: fp(18), fontWeight: '800', color: colors.white },
  questionCard: {
    backgroundColor: colors.white, borderRadius: wp(12), padding: wp(14),
    marginBottom: hp(14), borderWidth: 1, borderColor: colors.borderLight,
  },
  qText: { fontSize: fp(14), fontWeight: '600', color: colors.text, marginBottom: hp(10) },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: wp(12), borderRadius: wp(8), marginBottom: hp(6),
    borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface,
  },
  optionSelected: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: wp(12), borderRadius: wp(8), marginBottom: hp(6),
    backgroundColor: colors.info, borderWidth: 1, borderColor: colors.info,
  },
  optionCorrect: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: wp(12), borderRadius: wp(8), marginBottom: hp(6),
    backgroundColor: colors.success, borderWidth: 1, borderColor: colors.success,
  },
  optionWrong: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: wp(12), borderRadius: wp(8), marginBottom: hp(6),
    backgroundColor: colors.error, borderWidth: 1, borderColor: colors.error,
  },
  optText: { fontSize: fp(13), color: colors.text, flex: 1 },
  explanation: {
    fontSize: fp(12), color: colors.textSecondary, marginTop: hp(8),
    fontStyle: 'italic', lineHeight: fp(18),
  },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: wp(12),
    paddingVertical: hp(14), alignItems: 'center', marginTop: hp(8),
  },
  submitText: { fontSize: fp(15), fontWeight: '700', color: colors.white },
});
