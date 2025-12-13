// Work authorization options for different countries/regions

export const WORK_AUTH_OPTIONS = {
  Australia: [
    "I'm an Australian citizen",
    "I'm a permanent resident and/or NZ citizen",
    "I have a family/partner visa with no restrictions",
    "I have a graduate temporary work visa",
    "I have a holiday temporary work visa",
    "I have a temporary visa with restrictions on work location (e.g. skilled regional visa 491)",
    "I have a temporary protection or safe haven enterprise work visa",
    "I have a temporary visa with no restrictions (e.g. doctoral student)",
    "I have a temporary visa with restrictions on work hours (e.g. student visa, retirement visa)",
    "I have a temporary visa with restrictions on industry (e.g. temporary activity visa 408)",
    "I require sponsorship to work for a new employer (e.g. 482, 457)",
  ],
  
  'United States': [
    "I am a U.S. citizen",
    "I am a U.S. lawful permanent resident (Green Card holder)",
    "I am an asylee or refugee with unrestricted work authorization",
    "I have an Employment Authorization Document (EAD) with no restrictions (e.g., asylum pending, DACA)",
    "I hold an H-1B visa and am authorized to work for my current employer",
    "I require H-1B transfer sponsorship to work for a new employer",
    "I require initial H-1B sponsorship",
    "I am on F-1 OPT with work authorization",
    "I am on F-1 STEM OPT extension with work authorization",
    "I hold a J-1 visa with work authorization (please specify program if needed)",
    "I hold a J-1 visa and require a waiver to change employers",
    "I hold an L-1 intracompany transfer visa (L-1A / L-1B)",
    "I hold a TN visa (Canada or Mexico) with work authorization",
    "I hold an O-1 extraordinary ability visa",
    "I hold an E-3 (Australia) or H-1B1 (Chile/Singapore) specialty occupation visa",
    "I hold an E-2 treaty investor/employee visa",
    "I hold another temporary work visa with restrictions (please specify)",
    "I currently have no work authorization in the U.S.",
    "I require employer sponsorship for any U.S. work authorization",
  ],
  
  Singapore: [
    "I am a Singapore Citizen",
    "I am a Singapore Permanent Resident (PR)",
    "I hold an Employment Pass (EP)",
    "I hold an S Pass",
    "I hold a Work Permit (WP)",
    "I hold a Personalized Employment Pass (PEP)",
    "I hold an EntrePass",
    "I hold a Dependant's Pass (DP) with a Letter of Consent (LOC) allowing work",
    "I hold a Dependant's Pass (DP) but do not have a valid LOC (not authorized to work)",
    "I hold a Long-Term Visit Pass (LTVP/LTVP+) with a Letter of Consent (LOC) allowing work",
    "I hold a Long-Term Visit Pass (LTVP/LTVP+) but do not have a valid LOC",
    "I hold a Training Employment Pass (TEP)",
    "I hold a Training Work Permit (TWP)",
    "I will require employer sponsorship for an EP / S Pass to work in Singapore",
    "I currently do not have work authorization in Singapore",
    "I hold another pass type (please specify)",
  ],
  
  'Mainland China': [
    "我是中国大陆公民，可在中国大陆不受限制工作",
    "我是中国（内地）签发的永久居留身份证持有人（中国\"绿卡\"），可不受限制工作",
    "我是香港 / 澳门居民，持《港澳居民居住证》，可在中国大陆合法就业",
    "我是台湾居民，持《台湾居民居住证》，可在中国大陆合法就业",
    "我是外籍人员，持有有效的《外国人工作许可证》及与其对应的居留许可，已被授权在中国大陆全职工作（限当前雇主/岗位）",
    "我是外籍人员，当前持有《外国人工作许可证》，正在/计划变更雇主或岗位，需要新雇主配合办理变更手续",
    "我是外籍人员，目前在中国境内，持 Z / R 等工作类入境签证，尚在办理工作许可与居留许可过程中",
    "我是外籍人员，目前在中国境外，需要贵公司为我提供工作许可、工作签证及居留许可等完整办理支持 才能来华工作",
    "我在中国持学习类签证（X1 / X2 等），目前没有合法全职工作资格（仅限法规允许的校内兼职或实习）",
    "我在中国持访问 / 旅游 / 商务等短期签证（F / L / M 等），没有合法工作资格",
    "我目前在中国没有合法工作授权，但希望由雇主帮助办理工作许可和相关签证",
    "其他情况（请简要说明）：____________________",
  ],
  
  'HKSAR of China': [
    "I am a Hong Kong Permanent Resident (HKPR)",
    "I am a Hong Kong Resident with the Right of Abode",
    "I am a Hong Kong Resident with the Right to Land",
    "I hold a Hong Kong employment visa (General Employment Policy – GEP)",
    "I hold a Hong Kong employment visa (Admission Scheme for Mainland Talents and Professionals – ASMTP)",
    "I hold a Quality Migrant Admission Scheme (QMAS) visa",
    "I hold an Immigration Arrangements for Non-local Graduates (IANG) visa",
    "I hold a Dependant Visa with work rights",
    "I hold a Dependant Visa without work rights",
    "I hold a Training Visa",
    "I hold a Working Holiday Visa",
    "I hold a Student Visa (not authorized to work except under permitted part-time / internship rules)",
    "I require employer sponsorship for a Hong Kong employment visa (GEP / ASMTP)",
    "I currently do not have the legal right to work in Hong Kong",
    "I hold another visa type (please specify)",
  ],
  
  Remote: [
    "I can work remotely from any location",
    "I require specific work authorization for remote work",
  ],
};

// System screening questions with options
export const SYSTEM_SCREENING_QUESTIONS = [
  {
    id: 'programming_languages',
    question: 'Programming Languages',
    type: 'multiple' as const,
    options: [
      'Python',
      'JavaScript',
      'TypeScript',
      'Java',
      'C++',
      'C#',
      'Go',
      'Rust',
      'Ruby',
      'PHP',
      'Swift',
      'Kotlin',
      'Scala',
      'R',
      'MATLAB',
      'SQL',
      'Other',
    ],
  },
  {
    id: 'english_proficiency',
    question: 'English Proficiency',
    type: 'single' as const,
    options: [
      'Native or bilingual proficiency',
      'Full professional proficiency',
      'Professional working proficiency',
      'Limited working proficiency',
      'Elementary proficiency',
      'No proficiency',
    ],
  },
  {
    id: 'engineering_qualification',
    question: 'Engineering Qualification',
    type: 'single' as const,
    options: [
      'PhD in Computer Science or related field',
      'Master\'s degree in Computer Science or related field',
      'Bachelor\'s degree in Computer Science or related field',
      'Bachelor\'s degree in other field',
      'Some college coursework',
      'High school diploma or equivalent',
      'Self-taught / Bootcamp graduate',
    ],
  },
  {
    id: 'ml_experience',
    question: 'Machine Learning Experience',
    type: 'single' as const,
    options: [
      '5+ years of hands-on ML experience',
      '3-5 years of hands-on ML experience',
      '1-3 years of hands-on ML experience',
      'Less than 1 year of hands-on ML experience',
      'Academic ML projects only',
      'No ML experience',
    ],
  },
];

// Answer requirement types
export type AnswerRequirement = 'must-have' | 'preferred' | 'accept-any';

// Custom screening question answer types
export type CustomQuestionType = 'single' | 'multiple' | 'yes-no' | 'short-text';

export interface SystemScreeningAnswer {
  questionId: string;
  requirement: AnswerRequirement;
  selectedAnswers: string[];
}

export interface CustomScreeningQuestion {
  id: string;
  questionText: string;
  answerType: CustomQuestionType;
  options?: string[]; // For single/multiple choice
  mustAnswer: boolean;
  idealAnswer?: string | string[]; // For validation
  disqualifyIfNotIdeal: boolean;
}

