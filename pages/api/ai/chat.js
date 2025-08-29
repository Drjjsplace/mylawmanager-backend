// pages/api/ai/chat.js - AI Chat endpoint with legal document constraints
import { authenticateUser } from '../../../lib/auth.js';
import { query } from '../../../lib/db.js';

const LEGAL_SYSTEM_PROMPT = `You are an expert Nevada legal assistant AI with access ONLY to the specific Nevada legal documents provided in this conversation. You must:

CRITICAL CONSTRAINTS:
1. NEVER reference cases, statutes, or rules that are not explicitly provided in the legal documents
2. NEVER search external sources or use your general legal knowledge
3. ONLY cite cases and authorities from the provided document library
4. If asked about something not in the provided documents, clearly state "This information is not available in the provided legal library"
5. Be direct and honest - tell the user if they are wrong or if their legal reasoning is flawed
6. Write in formal legal language but adapt to the user's writing style over time
7. Always provide specific citations with exact titles and sections when referencing documents

CAPABILITIES:
- Draft legal motions, oppositions, and replies
- Answer procedural questions
- Provide legal analysis and recommendations
- Create any legal documents requested
- Review and critique legal arguments

REMEMBER: You are constrained to ONLY the legal documents provided. No exceptions.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await authenticateUser(req);
    const { message, conversation_id, document_types = [] } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    // Search relevant documents based on the user's message
    let relevantDocs = [];
    if (message.length > 10) {
      const searchResult = await query(
        `SELECT id, title, description, category, content_text,
                ts_rank(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || content_text), 
                       plainto_tsquery('english', $1)) as relevance
         FROM legal_documents
         WHERE to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || content_text) 
               @@ plainto_tsquery('english', $1)
         ORDER BY relevance DESC
         LIMIT 10`,
        [message]
      );
      
      relevantDocs = searchResult.rows;
    }

    // Prepare document context for AI
    let documentContext = '';
    if (relevantDocs.length > 0) {
      documentContext = `\n\nRELEVANT LEGAL DOCUMENTS:\n\n`;
      relevantDocs.forEach((doc, index) => {
        documentContext += `DOCUMENT ${index + 1}:\n`;
        documentContext += `Title: ${doc.title}\n`;
        documentContext += `Category: ${doc.category}\n`;
        if (doc.description) {
          documentContext += `Description: ${doc.description}\n`;
        }
        documentContext += `Content:\n${doc.content_text.substring(0, 4000)}...\n\n`;
      });
    }

    // For now, return a simulated AI response until OpenAI is connected
    const aiResponse = `Based on your query: "${message}"

I have searched through ${relevantDocs.length} relevant Nevada legal documents in your library.

${relevantDocs.length > 0 ? 
  `Found relevant documents: ${relevantDocs.map(doc => doc.title).join(', ')}\n\n` : 
  'No specific documents found for this query.\n\n'
}

To complete the AI integration, you'll need to add your OpenAI API key. This system is designed to ONLY reference the Nevada legal documents you upload - no external sources or hallucinations.

System ready for: motions, oppositions, replies, legal analysis, and document generation.`;

    // Create conversation ID if not provided
    let finalConversationId = conversation_id || Date.now().toString();

    // Save conversation (simplified for now)
    await query(
      'INSERT INTO ai_conversations (conversation_id, user_id, role, content) VALUES ($1, $2, $3, $4)',
      [finalConversationId, user.id, 'user', message]
    );

    await query(
      'INSERT INTO ai_conversations (conversation_id, user_id, role, content) VALUES ($1, $2, $3, $4)',
      [finalConversationId, user.id, 'assistant', aiResponse]
    );

    res.status(200).json({
      success: true,
      data: {
        response: aiResponse,
        conversation_id: finalConversationId,
        documents_referenced: relevantDocs.length,
        referenced_documents: relevantDocs.map(doc => ({
          id: doc.id,
          title: doc.title,
          category: doc.category
        }))
      }
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI request failed: ' + error.message 
    });
  }
}
