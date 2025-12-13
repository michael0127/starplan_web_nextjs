// Job categories and skills mapping from ai_tech_categories_skill_list.csv

export interface CategoryWithSkills {
  category: string;
  skills: string[];
}

export const JOB_CATEGORIES_WITH_SKILLS: CategoryWithSkills[] = [
  // Artificial Intelligence / Machine Learning
  {
    category: 'Machine Learning Engineer (Artificial Intelligence / Machine Learning)',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'JAX', 'LLMs', 'RAG', 'Fine-tuning', 'Multi-agent systems', 'Classical ML', 'Model evaluation', 'Feature engineering', 'Data pipelines', 'MLOps', 'Vector DBs', 'Cloud AI', 'Responsible AI', 'AI Safety'],
  },
  {
    category: 'Deep Learning Engineer (Artificial Intelligence / Machine Learning)',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'JAX', 'CNN/RNN', 'Transformers', 'GPU acceleration', 'Model evaluation', 'Data pipelines', 'MLOps'],
  },
  {
    category: 'Generative AI Engineer (Artificial Intelligence / Machine Learning)',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'RAG', 'Prompt engineering', 'Fine-tuning', 'Embeddings', 'MLOps', 'Responsible AI'],
  },
  {
    category: 'Multi-Agent Systems Engineer (Artificial Intelligence / Machine Learning)',
    skills: ['Python', 'Multi-agent frameworks', 'Orchestration', 'Task planning', 'RL', 'Simulation', 'Debugging', 'MLOps'],
  },
  {
    category: 'Reinforcement Learning Engineer (Artificial Intelligence / Machine Learning)',
    skills: ['Python', 'RLlib', 'Gym', 'RL algorithms', 'Policy gradient', 'Q-learning', 'Simulation', 'Model evaluation'],
  },
  {
    category: 'NLP Engineer (Artificial Intelligence / Machine Learning)',
    skills: ['Python', 'NLP libraries (spaCy, HuggingFace)', 'Transformers', 'Tokenization', 'Embeddings', 'RAG', 'Text preprocessing', 'Fine-tuning'],
  },
  {
    category: 'Computer Vision Engineer (Artificial Intelligence / Machine Learning)',
    skills: ['Python', 'OpenCV', 'PyTorch', 'CNNs', 'Object detection', 'Segmentation', 'Image augmentation', 'Data pipelines'],
  },
  {
    category: 'Speech/Audio AI Engineer (Artificial Intelligence / Machine Learning)',
    skills: ['Python', 'PyTorch', 'Librosa', 'Speech recognition', 'Audio processing', 'TTS', 'ASR', 'Signal processing'],
  },
  {
    category: 'AI Research Scientist (Artificial Intelligence / Machine Learning)',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'Research methodology', 'Experimentation', 'Publishing', 'Model evaluation', 'RL', 'NLP', 'CV'],
  },
  {
    category: 'Applied AI Scientist (Artificial Intelligence / Machine Learning)',
    skills: ['Python', 'ML libraries', 'Model deployment', 'Business problem solving', 'Data pipelines', 'MLOps'],
  },
  {
    category: 'AI Ethics & Policy Specialist (Artificial Intelligence / Machine Learning)',
    skills: ['AI ethics', 'Policy frameworks', 'Governance', 'Risk assessment', 'Bias detection', 'Responsible AI'],
  },
  {
    category: 'AI Product Manager (Artificial Intelligence / Machine Learning)',
    skills: ['Product management', 'AI concepts', 'Roadmapping', 'Stakeholder management', 'Data pipelines', 'ML lifecycle'],
  },
  {
    category: 'AI Data Curator / Data Labeling Ops (Artificial Intelligence / Machine Learning)',
    skills: ['Data labeling', 'Data quality', 'Dataset management', 'Annotation tools', 'Data pipelines'],
  },
  {
    category: 'AI Infrastructure Engineer (MLOps/LLMOps) (Artificial Intelligence / Machine Learning)',
    skills: ['MLOps', 'Docker', 'Kubernetes', 'ML deployment', 'Monitoring', 'Pipelines', 'Cloud AI platforms'],
  },
  
  // Data Science & Analytics
  {
    category: 'Data Scientist (Data Science & Analytics)',
    skills: ['Python', 'R', 'SQL', 'Statistical modelling', 'EDA', 'Experiment design', 'Forecasting', 'BI', 'Visualization', 'Causal inference'],
  },
  {
    category: 'Data Analyst (Data Science & Analytics)',
    skills: ['SQL', 'Python', 'Excel', 'Tableau', 'PowerBI', 'Data cleaning', 'Reporting', 'KPI tracking'],
  },
  {
    category: 'Quantitative Analyst (Data Science & Analytics)',
    skills: ['Python', 'R', 'Statistics', 'Econometrics', 'Modelling', 'Forecasting', 'Risk analysis'],
  },
  {
    category: 'BI Analyst (Data Science & Analytics)',
    skills: ['SQL', 'BI tools', 'Data visualization', 'Dashboard creation', 'KPI monitoring'],
  },
  {
    category: 'Statistician (Data Science & Analytics)',
    skills: ['R', 'Python', 'Probability', 'Hypothesis testing', 'Regression', 'Experimentation'],
  },
  {
    category: 'Data Visualization Engineer (Data Science & Analytics)',
    skills: ['Python', 'D3.js', 'Tableau', 'PowerBI', 'Data storytelling', 'Dashboard design'],
  },
  {
    category: 'Experimentation / Causal Inference Scientist (Data Science & Analytics)',
    skills: ['Python', 'R', 'Statistics', 'Experiment design', 'A/B testing', 'Causal inference'],
  },
  {
    category: 'Decision Scientist (Data Science & Analytics)',
    skills: ['Python', 'R', 'Data modeling', 'Decision optimization', 'Simulation', 'Business analytics'],
  },
  
  // Data Engineering
  {
    category: 'Data Engineer (Data Engineering)',
    skills: ['Python', 'SQL', 'Scala', 'ETL/ELT', 'Data pipelines', 'Warehousing', 'Spark', 'Kafka', 'Airflow', 'Data modeling'],
  },
  {
    category: 'Big Data Engineer (Data Engineering)',
    skills: ['Python', 'Spark', 'Hadoop', 'Data lakes', 'Streaming pipelines', 'ETL', 'SQL', 'Kafka'],
  },
  {
    category: 'ETL Developer (Data Engineering)',
    skills: ['Python', 'SQL', 'ETL frameworks', 'Data integration', 'Scheduling', 'Airflow', 'Data validation'],
  },
  {
    category: 'Database Engineer (Data Engineering)',
    skills: ['SQL', 'NoSQL', 'Database design', 'Query optimization', 'Indexing', 'Replication', 'Backup'],
  },
  {
    category: 'Analytics Engineer (Data Engineering)',
    skills: ['SQL', 'Data modeling', 'BI integration', 'Data pipelines', 'Data quality'],
  },
  {
    category: 'Data Platform Engineer (Data Engineering)',
    skills: ['Python', 'Cloud data services', 'ETL', 'Data lakehouse', 'Monitoring', 'Data pipelines'],
  },
  
  // Software Engineering
  {
    category: 'Backend Engineer (Software Engineering)',
    skills: ['Python', 'Java', 'Go', 'Node.js', 'APIs', 'Database', 'Microservices', 'CI/CD', 'Docker', 'Kubernetes'],
  },
  {
    category: 'Frontend Engineer (Software Engineering)',
    skills: ['JavaScript', 'TypeScript', 'React', 'Vue', 'HTML/CSS', 'UI frameworks', 'Webpack', 'Testing'],
  },
  {
    category: 'Full Stack Engineer (Software Engineering)',
    skills: ['Python', 'JS/TS', 'React', 'Node.js', 'Databases', 'API design', 'CI/CD', 'Docker', 'Kubernetes'],
  },
  {
    category: 'Systems Engineer (Software Engineering)',
    skills: ['Linux', 'C/C++', 'Networking', 'System design', 'DevOps', 'Monitoring'],
  },
  {
    category: 'Embedded Engineer (Software Engineering)',
    skills: ['C/C++', 'RTOS', 'Microcontrollers', 'Hardware interfacing', 'Debugging'],
  },
  {
    category: 'Cloud Software Engineer (Software Engineering)',
    skills: ['Python', 'Java', 'Cloud platforms', 'APIs', 'Microservices', 'CI/CD', 'Docker/K8s'],
  },
  {
    category: 'Mobile Engineer (iOS/Android) (Software Engineering)',
    skills: ['Swift', 'Kotlin', 'React Native', 'Mobile SDKs', 'APIs', 'UI frameworks'],
  },
  {
    category: 'API Engineer (Software Engineering)',
    skills: ['REST', 'GraphQL', 'API design', 'Authentication', 'Documentation', 'Backend integration'],
  },
  {
    category: 'DevOps Engineer (Software Engineering)',
    skills: ['CI/CD', 'Docker', 'Kubernetes', 'Terraform', 'Monitoring', 'Automation', 'Cloud platforms'],
  },
  {
    category: 'Site Reliability Engineer (SRE) (Software Engineering)',
    skills: ['SRE principles', 'Monitoring', 'Incident response', 'Scaling', 'Cloud', 'CI/CD'],
  },
  {
    category: 'Platform Engineer (Software Engineering)',
    skills: ['Microservices', 'Kubernetes', 'Cloud infra', 'CI/CD', 'APIs', 'Observability'],
  },
  
  // Cloud & Infrastructure
  {
    category: 'Cloud Architect (Cloud & Infrastructure)',
    skills: ['AWS', 'GCP', 'Azure', 'Architecture', 'IaC', 'Networking', 'Security', 'Scalability'],
  },
  {
    category: 'Cloud Engineer (Cloud & Infrastructure)',
    skills: ['AWS', 'Azure', 'GCP', 'Cloud services', 'CI/CD', 'Monitoring'],
  },
  {
    category: 'Cloud Security Engineer (Cloud & Infrastructure)',
    skills: ['Cloud security', 'IAM', 'Encryption', 'Compliance', 'Monitoring', 'Incident response'],
  },
  {
    category: 'Infrastructure Engineer (Cloud & Infrastructure)',
    skills: ['Linux', 'Windows', 'Networking', 'Virtualization', 'Cloud', 'Automation'],
  },
  {
    category: 'Network Engineer (Cloud & Infrastructure)',
    skills: ['Networking', 'Routing', 'Switching', 'Security', 'VPN', 'Firewalls'],
  },
  {
    category: 'Kubernetes Engineer (Cloud & Infrastructure)',
    skills: ['Kubernetes', 'Docker', 'Deployment', 'Scaling', 'Observability', 'Helm', 'CI/CD'],
  },
  
  // Security & Cybersecurity
  {
    category: 'Cybersecurity Engineer (Security & Cybersecurity)',
    skills: ['Pen-testing', 'Vulnerability assessment', 'Network security', 'Secure coding', 'SIEM', 'Incident response'],
  },
  {
    category: 'Security Analyst (Security & Cybersecurity)',
    skills: ['Threat analysis', 'SIEM', 'Monitoring', 'Incident response', 'Risk assessment'],
  },
  {
    category: 'Security Architect (Security & Cybersecurity)',
    skills: ['Network security', 'Application security', 'Architecture', 'IAM', 'Encryption', 'Risk management'],
  },
  {
    category: 'Penetration Tester / Ethical Hacker (Security & Cybersecurity)',
    skills: ['Pen-testing tools', 'Exploits', 'Network assessment', 'Security audits'],
  },
  {
    category: 'Threat Intelligence Analyst (Security & Cybersecurity)',
    skills: ['Threat research', 'Malware analysis', 'SIEM', 'Reporting', 'Incident response'],
  },
  {
    category: 'Application Security Engineer (Security & Cybersecurity)',
    skills: ['Secure coding', 'Code review', 'Vulnerability scanning', 'OWASP', 'DevSecOps'],
  },
  {
    category: 'Cloud Security Specialist (Security & Cybersecurity)',
    skills: ['Cloud security', 'IAM', 'Compliance', 'Monitoring', 'Encryption'],
  },
  {
    category: 'Governance Risk & Compliance (GRC) (Security & Cybersecurity)',
    skills: ['Compliance frameworks', 'Policies', 'Risk management', 'Audit'],
  },
  
  // Product & Project Roles
  {
    category: 'Technical Product Manager (Product & Project Roles)',
    skills: ['Product strategy', 'Roadmapping', 'Stakeholder mgmt', 'Requirements', 'Agile', 'Data-driven'],
  },
  {
    category: 'AI Product Manager (Product & Project Roles)',
    skills: ['AI knowledge', 'Product management', 'Roadmap', 'ML lifecycle', 'Stakeholder mgmt'],
  },
  {
    category: 'Technical Program Manager (Product & Project Roles)',
    skills: ['Project management', 'Agile', 'Coordination', 'Roadmaps', 'Risk mgmt'],
  },
  {
    category: 'Scrum Master (Product & Project Roles)',
    skills: ['Scrum', 'Agile', 'Facilitation', 'Backlog management', 'Team coaching'],
  },
  {
    category: 'Product Analyst (Product & Project Roles)',
    skills: ['Data analysis', 'Reporting', 'Requirements', 'Metrics', 'Dashboarding'],
  },
  {
    category: 'UX Researcher (Product & Project Roles)',
    skills: ['User research', 'Interviews', 'Usability testing', 'Personas', 'Analytics'],
  },
  {
    category: 'UI/UX Designer (Product & Project Roles)',
    skills: ['Figma', 'Sketch', 'Wireframing', 'Prototyping', 'Visual design', 'Interaction design'],
  },
  {
    category: 'Service Designer (Product & Project Roles)',
    skills: ['Service blueprint', 'Journey mapping', 'Process design', 'User research'],
  },
  
  // Robotics & Autonomous Systems
  {
    category: 'Robotics Engineer (Robotics & Autonomous Systems)',
    skills: ['ROS/ROS2', 'C++', 'Python', 'Control systems', 'Kinematics', 'Path planning', 'Sensor fusion', 'Embedded systems'],
  },
  {
    category: 'Autonomous Systems Engineer (Robotics & Autonomous Systems)',
    skills: ['ROS', 'Python', 'C++', 'SLAM', 'Path planning', 'Sensors', 'Algorithms', 'Simulation'],
  },
  {
    category: 'Mechatronics Engineer (Robotics & Autonomous Systems)',
    skills: ['Mechanical design', 'Electronics', 'Control systems', 'Embedded systems'],
  },
  {
    category: 'Sensor Fusion Engineer (Robotics & Autonomous Systems)',
    skills: ['Python', 'C++', 'Sensor calibration', 'Kalman filter', 'Data fusion'],
  },
  {
    category: 'Robot Learning Engineer (Robotics & Autonomous Systems)',
    skills: ['Python', 'RL', 'Simulation', 'Control', 'Multi-agent', 'Computer vision'],
  },
  {
    category: 'Hardware/Embedded Robotics Engineer (Robotics & Autonomous Systems)',
    skills: ['Embedded C/C++', 'Microcontrollers', 'Sensors', 'Real-time systems', 'Robotics integration'],
  },
  
  // Hardware & Semiconductor
  {
    category: 'Hardware Engineer (Hardware & Semiconductor)',
    skills: ['PCB design', 'Circuit analysis', 'Debugging', 'Embedded systems', 'FPGA', 'ASIC'],
  },
  {
    category: 'FPGA Engineer (Hardware & Semiconductor)',
    skills: ['Verilog', 'VHDL', 'FPGA toolchains', 'Simulation', 'Timing analysis'],
  },
  {
    category: 'ASIC Engineer (Hardware & Semiconductor)',
    skills: ['RTL design', 'Verification', 'Timing', 'Synthesis', 'ASIC flows'],
  },
  {
    category: 'Chip Design Engineer (Hardware & Semiconductor)',
    skills: ['Digital design', 'RTL', 'Verification', 'Simulation', 'Timing analysis'],
  },
  {
    category: 'Computer Architect (Hardware & Semiconductor)',
    skills: ['Microarchitecture', 'CPU/GPU design', 'Performance modeling'],
  },
  {
    category: 'Embedded Systems Engineer (Hardware & Semiconductor)',
    skills: ['C/C++', 'Microcontrollers', 'RTOS', 'Hardware interfacing'],
  },
  {
    category: 'IoT Engineer (Hardware & Semiconductor)',
    skills: ['Sensors', 'Microcontrollers', 'Networking', 'MQTT', 'Embedded systems'],
  },
  
  // Tech Leadership
  {
    category: 'CTO (Tech Leadership)',
    skills: ['Technical architecture', 'Team mgmt', 'Strategy', 'Roadmapping', 'Budget', 'Mentorship', 'Stakeholder alignment'],
  },
  {
    category: 'VP Engineering (Tech Leadership)',
    skills: ['Engineering management', 'Strategy', 'Team growth', 'Process improvement', 'Roadmapping'],
  },
  {
    category: 'Head of AI (Tech Leadership)',
    skills: ['AI strategy', 'Research oversight', 'Team mgmt', 'Project prioritization'],
  },
  {
    category: 'Head of Product (Tech Leadership)',
    skills: ['Product strategy', 'Roadmap', 'Stakeholder mgmt', 'Team leadership'],
  },
  {
    category: 'Chief Data Officer (Tech Leadership)',
    skills: ['Data strategy', 'Governance', 'Analytics oversight', 'Team mgmt'],
  },
  {
    category: 'Chief Information Security Officer (Tech Leadership)',
    skills: ['Security strategy', 'Risk mgmt', 'Compliance', 'Team leadership'],
  },
  {
    category: 'AI Team Lead / Engineering Manager (Tech Leadership)',
    skills: ['Team management', 'Project planning', 'Mentorship', 'AI stack knowledge'],
  },
  {
    category: 'Tech Lead / Staff Engineer / Principal Engineer (Tech Leadership)',
    skills: ['System design', 'Technical leadership', 'Mentorship', 'Code quality', 'Architecture'],
  },
  
  // IT & Systems
  {
    category: 'Systems Administrator (IT & Systems)',
    skills: ['Windows/Linux admin', 'Networking', 'Monitoring', 'Backup', 'Security', 'Troubleshooting'],
  },
  {
    category: 'IT Support / Helpdesk (IT & Systems)',
    skills: ['End-user support', 'Troubleshooting', 'Ticketing', 'Hardware/software support'],
  },
  {
    category: 'Network Administrator (IT & Systems)',
    skills: ['Networking', 'Firewall', 'VPN', 'Routing', 'Switching', 'Monitoring'],
  },
  {
    category: 'IT Operations Specialist (IT & Systems)',
    skills: ['ITIL', 'System monitoring', 'Incident response', 'Automation'],
  },
  {
    category: 'Systems Analyst (IT & Systems)',
    skills: ['Requirements gathering', 'System design', 'Testing', 'Documentation'],
  },
  {
    category: 'ERP/CRM Engineer (IT & Systems)',
    skills: ['ERP/CRM configuration', 'Customization', 'Integration', 'Reporting'],
  },
  
  // Tech in Business Functions
  {
    category: 'AI for Finance (Tech in Business Functions)',
    skills: ['Finance domain', 'AI workflows', 'Automation', 'Risk analysis', 'Reporting', 'Compliance'],
  },
  {
    category: 'AI in Marketing (Tech in Business Functions)',
    skills: ['Marketing analytics', 'Personalization', 'Segmentation', 'AI tools', 'Campaign optimization'],
  },
  {
    category: 'AI in Operations (Tech in Business Functions)',
    skills: ['Process automation', 'Optimization', 'Analytics', 'Workflow management', 'AI tools'],
  },
  {
    category: 'AI in HR (Tech in Business Functions)',
    skills: ['HR analytics', 'Talent acquisition', 'AI workflow', 'Reporting', 'Automation'],
  },
  {
    category: 'AI in Supply Chain (Tech in Business Functions)',
    skills: ['Supply chain analytics', 'Optimization', 'Forecasting', 'Automation', 'AI systems'],
  },
  
  // GenerativeAI
  {
    category: 'LLM Application Developer (GenerativeAI)',
    skills: ['LLM development', 'API integration', 'Prompt engineering', 'Fine-tuning', 'Embeddings', 'RAG', 'MLOps'],
  },
  {
    category: 'AI Agent Engineer (GenerativeAI)',
    skills: ['Multi-agent frameworks', 'Orchestration', 'Task planning', 'Python', 'RL', 'Evaluation metrics'],
  },
  {
    category: 'AI Workflow Automation Engineer (GenerativeAI)',
    skills: ['Automation', 'RPA', 'LLM', 'Workflow orchestration', 'API integration'],
  },
  {
    category: 'Prompt Engineer (GenerativeAI)',
    skills: ['Prompt design', 'LLM tuning', 'Evaluation', 'Chain-of-thought', 'Prompt testing'],
  },
  {
    category: 'Synthetic Data Engineer (GenerativeAI)',
    skills: ['Data simulation', 'Generation', 'Privacy', 'Augmentation', 'ML integration'],
  },
  {
    category: 'Digital Twin Engineer (GenerativeAI)',
    skills: ['Modeling', 'Simulation', 'IoT integration', 'Analytics', 'Visualization'],
  },
  {
    category: 'AI Safety & Alignment Researcher (GenerativeAI)',
    skills: ['Safety testing', 'Alignment metrics', 'Red-teaming', 'RLHF', 'Policy design'],
  },
  {
    category: 'Human-AI Interaction Engineer (GenerativeAI)',
    skills: ['UX', 'HCI', 'AI agent design', 'Feedback loops', 'Evaluation'],
  },
  {
    category: 'AI Quality & Evaluation Engineer (GenerativeAI)',
    skills: ['Metrics', 'Benchmarking', 'Evaluation pipelines', 'Bias detection', 'Model testing'],
  },
  {
    category: 'Autonomous Agent Safety Analyst (GenerativeAI)',
    skills: ['Safety testing', 'Simulation', 'Monitoring', 'Evaluation', 'Multi-agent systems'],
  },
  {
    category: 'AI Compliance / Audit Engineer (GenerativeAI)',
    skills: ['AI governance', 'Compliance', 'Auditing', 'Risk assessment', 'Documentation'],
  },
  
  // Design
  {
    category: 'Product Designer (Design)',
    skills: ['Design thinking', 'Wireframing', 'Prototyping', 'Figma', 'User research', 'UX principles', 'UI design'],
  },
  {
    category: 'UX Designer (Design)',
    skills: ['User research', 'Usability testing', 'Wireframing', 'Prototyping', 'Interaction design', 'Analytics'],
  },
  {
    category: 'UI Designer (Design)',
    skills: ['Visual design', 'Typography', 'Color theory', 'Layout', 'Figma/Sketch', 'Design systems'],
  },
  {
    category: 'Interaction Designer (Design)',
    skills: ['Interaction patterns', 'User flows', 'Wireframing', 'Prototyping', 'Motion design'],
  },
  {
    category: 'Visual Designer (Design)',
    skills: ['Typography', 'Branding', 'Layout', 'Illustration', 'Photoshop/Illustrator'],
  },
  {
    category: 'Design Researcher (Design)',
    skills: ['User interviews', 'Surveys', 'Analytics', 'Personas', 'Usability testing', 'Journey mapping'],
  },
  {
    category: 'Design Systems Designer (Design)',
    skills: ['Component libraries', 'Figma/Sketch', 'UI consistency', 'Tokens', 'Style guides'],
  },
  {
    category: 'Motion Designer (Design)',
    skills: ['Animation principles', 'After Effects', 'Prototyping', 'Storyboarding'],
  },
  {
    category: 'Creative Technologist (Design)',
    skills: ['Coding', 'Prototyping', 'Interactive media', 'AR/VR', 'Creative software'],
  },
  {
    category: 'AI UX Designer (Design)',
    skills: ['AI integration', 'Prompt flows', 'Multi-agent UX', 'Human-AI interaction', 'Testing'],
  },
];

// Legacy: Simple category list for backward compatibility
export const JOB_CATEGORIES = JOB_CATEGORIES_WITH_SKILLS.map(item => item.category);

export type JobCategory = typeof JOB_CATEGORIES[number];

/**
 * Get all job category names
 */
export const getAllCategoryNames = (): string[] => {
  return JOB_CATEGORIES;
};

/**
 * Get skills for a specific category
 */
export const getSkillsForCategory = (category: string): string[] => {
  const found = JOB_CATEGORIES_WITH_SKILLS.find(item => item.category === category);
  return found ? found.skills : [];
};

/**
 * Check if a category is a custom (user-defined) category
 */
export const isCustomCategory = (category: string): boolean => {
  return category.trim().length > 0 && !JOB_CATEGORIES.includes(category);
};

/**
 * Format a custom category name
 */
export const formatCustomCategory = (category: string): string => {
  return category.trim();
};

/**
 * Search categories by keyword
 */
export const searchCategories = (query: string): string[] => {
  if (!query || query.trim().length === 0) {
    return JOB_CATEGORIES;
  }
  
  const lowerQuery = query.toLowerCase();
  return JOB_CATEGORIES.filter(cat => 
    cat.toLowerCase().includes(lowerQuery)
  );
};
