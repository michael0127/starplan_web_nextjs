'use client';

import { useState } from 'react';
import { type CustomScreeningQuestion, type CustomQuestionType, type AnswerRequirement } from '@/lib/screeningOptions';
import styles from './CustomQuestionBuilder.module.css';

interface CustomQuestionBuilderProps {
  onSave: (question: CustomScreeningQuestion) => void;
  onCancel: () => void;
  initialQuestion?: CustomScreeningQuestion | null;
}

export function CustomQuestionBuilder({ onSave, onCancel, initialQuestion }: CustomQuestionBuilderProps) {
  const [questionText, setQuestionText] = useState(initialQuestion?.questionText || '');
  const [answerType, setAnswerType] = useState<CustomQuestionType>(initialQuestion?.answerType || 'short-text');
  const [options, setOptions] = useState<string[]>(initialQuestion?.options || ['']);
  const [mustAnswer, setMustAnswer] = useState(initialQuestion?.mustAnswer || false);
  const [idealAnswer, setIdealAnswer] = useState(initialQuestion?.idealAnswer || '');
  const [disqualifyIfNotIdeal, setDisqualifyIfNotIdeal] = useState(initialQuestion?.disqualifyIfNotIdeal || false);
  const [requirement, setRequirement] = useState<AnswerRequirement>(initialQuestion?.requirement || 'accept-any');

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSave = () => {
    const question: CustomScreeningQuestion = {
      id: initialQuestion?.id || Date.now().toString(),
      questionText,
      answerType,
      options: ['single', 'multiple'].includes(answerType) ? options.filter(o => o.trim()) : undefined,
      mustAnswer,
      idealAnswer: idealAnswer || undefined,
      disqualifyIfNotIdeal,
      requirement,
    };
    onSave(question);
  };

  const isValid = questionText.trim() && 
    (['single', 'multiple'].includes(answerType) ? options.some(o => o.trim()) : true);

  return (
    <div className={styles.builderContainer}>
      <div className={styles.builderHeader}>
        <h3>{initialQuestion ? 'Edit' : 'Add'} Custom Screening Question</h3>
      </div>

      <div className={styles.builderBody}>
        {/* Question Text */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Question Text <span className={styles.required}>*</span>
          </label>
          <textarea
            className={styles.textarea}
            placeholder="e.g., Do you have experience with cloud infrastructure (AWS/Azure/GCP)?"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={2}
          />
        </div>

        {/* Answer Type */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Answer Type <span className={styles.required}>*</span>
          </label>
          <select
            className={styles.select}
            value={answerType}
            onChange={(e) => {
              const newType = e.target.value as CustomQuestionType;
              setAnswerType(newType);
              // Reset ideal answer when changing answer type to prevent invalid values
              setIdealAnswer('');
            }}
          >
            <option value="short-text">Short Text Answer</option>
            <option value="yes-no">Yes/No</option>
            <option value="single">Single Choice</option>
            <option value="multiple">Multiple Choice</option>
          </select>
        </div>

        {/* Options for Single/Multiple Choice */}
        {['single', 'multiple'].includes(answerType) && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Options</label>
            {options.map((option, index) => (
              <div key={index} className={styles.optionRow}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
                {options.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeOptionBtn}
                    onClick={() => handleRemoveOption(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className={styles.addOptionBtn}
              onClick={handleAddOption}
            >
              + Add Option
            </button>
          </div>
        )}

        {/* Requirement Level */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Requirement Level</label>
          <div className={styles.requirementOptions}>
            <label className={`${styles.requirementOption} ${requirement === 'must-have' ? styles.requirementSelected : ''}`}>
              <input
                type="radio"
                name="requirement"
                value="must-have"
                checked={requirement === 'must-have'}
                onChange={() => setRequirement('must-have')}
              />
              <span className={styles.requirementIcon}>⭐</span>
              <span>Must Have</span>
            </label>
            <label className={`${styles.requirementOption} ${requirement === 'preferred' ? styles.requirementSelected : ''}`}>
              <input
                type="radio"
                name="requirement"
                value="preferred"
                checked={requirement === 'preferred'}
                onChange={() => setRequirement('preferred')}
              />
              <span className={styles.requirementIcon}>✓</span>
              <span>Preferred</span>
            </label>
            <label className={`${styles.requirementOption} ${requirement === 'accept-any' ? styles.requirementSelected : ''}`}>
              <input
                type="radio"
                name="requirement"
                value="accept-any"
                checked={requirement === 'accept-any'}
                onChange={() => setRequirement('accept-any')}
              />
              <span className={styles.requirementIcon}>○</span>
              <span>Accept Any</span>
            </label>
          </div>
        </div>

        {/* Must Answer Toggle */}
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={mustAnswer}
              onChange={(e) => setMustAnswer(e.target.checked)}
            />
            <span>Required Question (Candidates must answer)</span>
          </label>
        </div>

        {/* Ideal Answer */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Ideal Answer (Optional)</label>
          {answerType === 'yes-no' ? (
            <select
              className={styles.select}
              value={idealAnswer as string}
              onChange={(e) => setIdealAnswer(e.target.value)}
            >
              <option value="">-- Select Ideal Answer --</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          ) : (
            <input
              type="text"
              className={styles.input}
              placeholder="Specify the preferred answer"
              value={idealAnswer as string}
              onChange={(e) => setIdealAnswer(e.target.value)}
            />
          )}
          <span className={styles.hint}>
            Used for automatic screening or highlighting preferred candidates
          </span>
        </div>

        {/* Disqualify Toggle */}
        {idealAnswer && (
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={disqualifyIfNotIdeal}
                onChange={(e) => setDisqualifyIfNotIdeal(e.target.checked)}
              />
              <span>Automatically disqualify if answer doesn't match ideal</span>
            </label>
          </div>
        )}
      </div>

      <div className={styles.builderActions}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={handleSave}
          disabled={!isValid}
        >
          {initialQuestion ? 'Update' : 'Add'} Question
        </button>
      </div>
    </div>
  );
}
























