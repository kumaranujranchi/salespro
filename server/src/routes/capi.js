import { Router } from 'express';
import { query } from '../db/index.js';
import { sendMetaCAPIEvent } from '../services/capiService.js';

const router = Router();

/**
 * 1. Test Event Endpoint
 * Allows a tenant to verify their Meta CAPI setup in real time
 * by sending a sample event with their test_event_code to Meta Events Manager.
 */
router.post('/test', async (req, res) => {
  try {
    const { pixelId, accessToken, testEventCode, tenantId } = req.body;

    if (!pixelId || !accessToken) {
      return res.status(400).json({
        error: 'Both Meta Pixel/Dataset ID and Access Token are required.',
      });
    }

    const sampleLead = {
      id: `test_${Date.now()}`,
      customer_name: 'Test Customer',
      mobile: '9876543210',
      email: 'test.customer@realsalepro.com',
      city: 'Mumbai',
      lead_status: 'Site Visit Done',
      metadata: {
        client_ip: req.ip || '127.0.0.1',
        user_agent: req.headers['user-agent'] || 'RealSalePro-CAPI-Test',
      }
    };

    const result = await sendMetaCAPIEvent({
      pixelId: pixelId.trim(),
      accessToken: accessToken.trim(),
      eventName: 'Site_Visit_Done',
      lead: sampleLead,
      testEventCode: testEventCode ? testEventCode.trim() : undefined,
      tenantId: tenantId || req.user?.tenant_id,
      customData: {
        value: 5000,
        currency: 'INR',
        lead_status: 'Site Visit Done (Test)',
        project_name: 'Sample Project'
      }
    });

    return res.json({
      success: true,
      message: 'Test event successfully sent to Meta Conversions API! Check your Meta Events Manager Test Events tab.',
      meta_response: result.response,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to dispatch test event to Meta CAPI',
    });
  }
});

/**
 * 2. Get Conversion Event Logs for Tenant
 */
router.get('/logs', async (req, res) => {
  try {
    const tenantId = req.query.tenant_id || req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenant_id is required' });
    }

    const result = await query(
      `SELECT * FROM capi_events_log 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [tenantId]
    );

    return res.json(result.rows.map(r => ({ ...r, _id: r.id })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
