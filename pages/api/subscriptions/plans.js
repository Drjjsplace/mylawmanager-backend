// pages/api/subscriptions/plans.js - Get available subscription plans
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const subscriptionPlans = {
    free: {
      name: 'Free',
      price: 0,
      billing_period: 'monthly',
      features: [
        'View legal document library',
        'Basic search functionality',
        '5 AI queries per month',
        'Email support'
      ],
      limits: {
        ai_queries_per_month: 5,
        document_generation_per_month: 0,
        storage_gb: 0.1
      }
    },
    basic: {
      name: 'Basic',
      price: 49,
      billing_period: 'monthly',
      features: [
        'Everything in Free',
        'Unlimited AI queries',
        'Basic document generation (5 per month)',
        'Advanced search',
        'Priority email support',
        '1 GB document storage'
      ],
      limits: {
        ai_queries_per_month: -1, // unlimited
        document_generation_per_month: 5,
        storage_gb: 1
      }
    },
    professional: {
      name: 'Professional', 
      price: 149,
      billing_period: 'monthly',
      features: [
        'Everything in Basic',
        'Unlimited document generation',
        'Client management system',
        'Advanced AI legal analysis',
        'Phone support',
        'API access',
        '10 GB document storage'
      ],
      limits: {
        ai_queries_per_month: -1,
        document_generation_per_month: -1,
        storage_gb: 10,
        api_access: true
      }
    },
    enterprise: {
      name: 'Enterprise',
      price: 499,
      billing_period: 'monthly',
      features: [
        'Everything in Professional',
        'White-label options',
        'Custom integrations',
        'Dedicated support manager',
        'Advanced analytics',
        'Multi-user management',
        'Unlimited storage',
        'Priority feature requests'
      ],
      limits: {
        ai_queries_per_month: -1,
        document_generation_per_month: -1,
        storage_gb: -1, // unlimited
        api_access: true,
        white_label: true,
        multi_user: true
      }
    }
  };

  res.status(200).json({
    success: true,
    data: subscriptionPlans
  });
}
