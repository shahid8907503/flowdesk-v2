const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../config/logger');

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  logger.info('Gemini AI Service initialized successfully with API Key');
} else {
  logger.warn('GEMINI_API_KEY is not defined. AI Service will operate in high-fidelity mock fallback mode.');
}

/**
 * Break down a card title/description into a list of structured subtasks
 */
const generateSubtasks = async (title, description = '') => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are a project manager. Given a task: "${title}". Description: "${description}". 
      Break it down into a JSON array of 3 to 5 realistic subtasks. 
      Each subtask object in the array MUST have the following keys EXACTLY:
      - "title": (string, short action title)
      - "storyPoints": (number, story point estimation like 1, 2, 3, 5)
      - "description": (string, brief 1-sentence implementation detail)
      
      Respond ONLY with the raw JSON array. Do not include markdown code block formatting (like \`\`\`json).`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      
      // Clean potential JSON markdown wraps
      const cleanJson = text.replace(/^```json/, '').replace(/```$/, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      logger.error('Gemini generateSubtasks error, running mock fallback:', error.message);
    }
  }

  // Smart Mock Fallback
  logger.info('Running offline fallback for AI subtasks generator');
  const normalizedTitle = title.toLowerCase();
  
  if (normalizedTitle.includes('login') || normalizedTitle.includes('auth') || normalizedTitle.includes('sign')) {
    return [
      { title: 'Design Glassmorphic Login & MFA screens', storyPoints: 2, description: 'Design inputs, error messages, and 2FA passcode input components.' },
      { title: 'Create JWT rotation & OTP verification endpoint', storyPoints: 3, description: 'Implement argon2 hashing, email-otp verification, and refresh-token rotation cookies.' },
      { title: 'Bind frontend actions with Redux toolkit api', storyPoints: 1, description: 'Wire client login form submission handlers with auth RTK Query endpoints.' },
      { title: 'Write integration test cases for auth state cycles', storyPoints: 2, description: 'Validate verification links, password resets, and session creations via Supertest.' }
    ];
  }

  if (normalizedTitle.includes('database') || normalizedTitle.includes('db') || normalizedTitle.includes('model')) {
    return [
      { title: 'Design optimized mongoose relational schema fields', storyPoints: 2, description: 'Map workspace references, column indexes, and due date timestamps.' },
      { title: 'Apply compound indexes for boards query lookups', storyPoints: 1, description: 'Add boardId, columnId, and position keys to accelerate draggable sorts.' },
      { title: 'Implement transactional rollback in batch operations', storyPoints: 3, description: 'Utilize MongoDB multi-document transaction sessions inside bulk-move handlers.' }
    ];
  }

  // Default generic subtasks
  return [
    { title: `Design UX mockups for "${title}"`, storyPoints: 2, description: 'Draw layouts matching the FlowDesk premium glassmorphism styling guides.' },
    { title: `Develop backend API endpoints & middleware handlers`, storyPoints: 3, description: 'Write Express routes, Zod validator rules, and RBAC auth checks.' },
    { title: `Wire frontend UI panels & Redux data slices`, storyPoints: 2, description: 'Assemble React views and bind mutations with real-time sockets listeners.' },
    { title: `Verify changes with unit tests and manual browser QA`, storyPoints: 1, description: 'Confirm responsiveness, animation ease-in, and compile correctly.' }
  ];
};

/**
 * Generate a sprint allocation and timelines suggestions report
 */
const generateSprintPlan = async (boardName, cards) => {
  const cardsSummary = cards.map(c => `- ${c.title} (Points: ${c.storyPoints || 1}, Priority: ${c.priority || 'Medium'}, Assignees: ${c.assignees?.map(a => a.name).join(', ') || 'Unassigned'})`).join('\n');

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are a project director. Given a sprint board named "${boardName}" containing the following cards:\n${cardsSummary}\n
      Generate an executive summary sprint plan in markdown format. Under 300 words. Address:
      1. Estimated Timeline & Story Points workload.
      2. Key bottleneck warnings (e.g. over-allocation, unassigned high-priority tasks).
      3. Practical recommendations to accelerate delivery.`;

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      logger.error('Gemini generateSprintPlan error, running mock fallback:', error.message);
    }
  }

  // Smart Mock Fallback
  logger.info('Running offline fallback for AI sprint planner');
  const totalPoints = cards.reduce((sum, c) => sum + (c.storyPoints || 0), 0);
  const unassignedCount = cards.filter(c => !c.assignees || c.assignees.length === 0).length;
  const highPriorityCount = cards.filter(c => c.priority === 'High').length;

  return `### AI Sprint Plan Summary for **${boardName}**

* **Total Commitment**: **${totalPoints} Story Points** distributed across **${cards.length} cards**.
* **Workload Allocation**: 
  * Unassigned Tasks: **${unassignedCount} tasks** need team assignment.
  * Risk Factor: **${highPriorityCount} High Priority** cards are active in this sprint.

#### ⚠️ Risk Analysis & Bottlenecks
${unassignedCount > 0 ? `- **Resource Gap**: ${unassignedCount} tasks are currently unassigned. Assign these immediately to avoid delay.` : '- **Allocation Status**: All tasks are assigned, but review developer workload to balance story points.'}
${highPriorityCount > 2 ? `- **Scope Pressure**: High density of High Priority cards (${highPriorityCount}) may threaten deadline compliance if sprint velocity dips.` : '- **Priority Distribution**: Priority density looks balanced.'}

#### 💡 Recommendations
1. **Critical Path**: Focus efforts on the **${highPriorityCount} High Priority** cards first.
2. **Load Balancing**: Distribute the unassigned items to developers with less than 5 active story points.
3. **Daily Syncs**: Use Socket.IO live indicators to track active time logs and unblock stuck tasks early.`;
};

module.exports = { generateSubtasks, generateSprintPlan };
