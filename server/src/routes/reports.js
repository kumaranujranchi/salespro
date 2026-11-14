import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// GET /api/reports
router.get('/', async (req, res) => {
  try {
    const { tenant_id, startDate, endDate, sourceFilter } = req.query;
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id required' });

    const params = [tenant_id];
    let dateFilterLeads = '';
    let dateFilterSales = '';
    let dateFilterVisits = '';

    if (startDate && endDate) {
      params.push(startDate, endDate);
      const startIdx = params.length - 1;
      const endIdx = params.length;
      dateFilterLeads = ` AND (l.lead_date >= $${startIdx} AND l.lead_date <= $${endIdx})`;
      dateFilterSales = ` AND (s.sale_date >= $${startIdx} AND s.sale_date <= $${endIdx})`;
      dateFilterVisits = ` AND (sv.visit_date >= $${startIdx} AND sv.visit_date <= $${endIdx})`;
    }

    let sourceFilterSql = '';
    if (sourceFilter && sourceFilter !== 'All Sources') {
      params.push(sourceFilter);
      sourceFilterSql = ` AND l.lead_source = $${params.length}`;
    }

    // 1. SITE VISITS REPORT & ODOMETER ANALYTICS
    const visitsSql = `
      SELECT sv.*,
        p.full_name as executive_name,
        d.full_name as driver_name,
        d.phone as driver_phone,
        l.customer_name as lead_customer_name,
        l.mobile as lead_mobile,
        pr.name as project_name
      FROM site_visits sv
      LEFT JOIN profiles p ON sv.requested_by = p.id
      LEFT JOIN profiles d ON sv.driver_id = d.id
      LEFT JOIN leads l ON sv.lead_id = l.id
      LEFT JOIN projects pr ON l.project_id = pr.id
      WHERE sv.tenant_id = $1 ${dateFilterVisits}
      ORDER BY sv.visit_date DESC, sv.visit_time ASC
    `;

    const visitsRes = await query(visitsSql, startDate && endDate ? [tenant_id, startDate, endDate] : [tenant_id]);
    const visitsList = visitsRes.rows || [];

    let totalKmDriven = 0;
    let completedVisitsCount = 0;
    const dailyMap = {};

    const visitsDetailedRegister = visitsList.map(v => {
      const startKm = parseFloat(v.start_odometer) || 0;
      const endKm = parseFloat(v.end_odometer) || 0;
      const isCompleted = ['completed', 'trip_completed'].includes(String(v.status || '').toLowerCase());
      const tripKm = (isCompleted && endKm > startKm) ? Math.max(0, endKm - startKm) : 0;

      if (isCompleted) {
        completedVisitsCount++;
        totalKmDriven += tripKm;
      }

      // Daily Grouping
      const visitDate = v.visit_date || (v.created_at ? new Date(v.created_at).toISOString().split('T')[0] : 'Unknown');
      if (!dailyMap[visitDate]) {
        dailyMap[visitDate] = {
          date: visitDate,
          totalVisits: 0,
          completedVisits: 0,
          totalKm: 0,
          drivers: new Set(),
          executives: new Set(),
        };
      }
      dailyMap[visitDate].totalVisits += 1;
      if (isCompleted) {
        dailyMap[visitDate].completedVisits += 1;
        dailyMap[visitDate].totalKm += tripKm;
      }
      if (v.driver_name) dailyMap[visitDate].drivers.add(v.driver_name);
      if (v.executive_name) dailyMap[visitDate].executives.add(v.executive_name);

      return {
        id: v.id,
        customerName: v.customer_name || v.lead_customer_name || 'Customer',
        mobile: v.mobile || v.lead_mobile || '',
        projectName: v.project_name || v.pickup_location || 'Site Location',
        pickupLocation: v.pickup_location || '',
        executiveName: v.executive_name || 'Unassigned',
        driverName: v.driver_name || 'Unassigned',
        driverPhone: v.driver_phone || '',
        visitDate: v.visit_date,
        visitTime: v.visit_time,
        status: v.status,
        startOdometer: v.start_odometer || '-',
        endOdometer: v.end_odometer || '-',
        totalKm: Math.round(tripKm * 10) / 10,
      };
    });

    const dailySummary = Object.values(dailyMap).map(d => ({
      date: d.date,
      totalVisits: d.totalVisits,
      completedVisits: d.completedVisits,
      totalKm: Math.round(d.totalKm * 10) / 10,
      driversCount: d.drivers.size,
      driversList: Array.from(d.drivers),
      executivesCount: d.executives.size,
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const siteVisitsReport = {
      totalVisits: visitsList.length,
      scheduled: visitsList.filter(v => ['pending', 'approved', 'trip_started'].includes(v.status)).length,
      done: completedVisitsCount,
      completed: completedVisitsCount,
      totalKmDriven: Math.round(totalKmDriven * 10) / 10,
      averageKmPerTrip: completedVisitsCount > 0 ? Math.round((totalKmDriven / completedVisitsCount) * 10) / 10 : 0,
      dailySummary,
      detailedRegister: visitsDetailedRegister,
    };

    // 2. LEADS REPORT
    const leadsSql = `
      SELECT l.*, p.full_name as executive_name, pr.name as project_name
      FROM leads l
      LEFT JOIN profiles p ON l.sales_executive_id = p.id
      LEFT JOIN projects pr ON l.project_id = pr.id
      WHERE l.tenant_id = $1 ${dateFilterLeads} ${sourceFilterSql}
      ORDER BY l.created_at DESC
    `;
    const leadsRes = await query(leadsSql, params);
    const leadsList = leadsRes.rows || [];

    const convertedCount = leadsList.filter(l => (l.lead_status || '').toLowerCase().includes('convert')).length;
    const leadsDetailedRegister = leadsList.map(l => ({
      id: l.id,
      leadId: l.lead_id || l.id.slice(0, 8),
      customerName: l.customer_name,
      mobile: l.mobile,
      source: l.lead_source || 'Direct',
      status: l.lead_status || 'New',
      date: l.lead_date || (l.created_at ? new Date(l.created_at).toISOString().split('T')[0] : ''),
      projectName: l.project_name || 'General',
      executiveName: l.executive_name || 'Unassigned',
    }));

    const leadsReport = {
      totalLeadsImported: leadsList.length,
      convertedLeads: convertedCount,
      siteVisitsScheduled: visitsList.length,
      detailedRegister: leadsDetailedRegister,
    };

    // 3. SALES & REVENUE REPORT
    const salesSql = `
      SELECT s.*, 
        p.full_name as executive_name, 
        pr.name as project_name,
        l.customer_name as lead_customer_name
      FROM sales s
      LEFT JOIN profiles p ON s.sales_executive_id = p.id
      LEFT JOIN projects pr ON s.project_id = pr.id
      LEFT JOIN leads l ON s.customer_id = l.id
      WHERE s.tenant_id = $1 ${dateFilterSales}
      ORDER BY s.sale_date DESC
    `;
    const salesParams = startDate && endDate ? [tenant_id, startDate, endDate] : [tenant_id];
    const salesRes = await query(salesSql, salesParams);
    const salesList = salesRes.rows || [];

    const totalSalesValue = salesList.reduce((acc, s) => acc + (Number(s.total_revenue) || 0), 0);
    const totalBookings = salesList.length;
    const averageRevenue = totalBookings > 0 ? totalSalesValue / totalBookings : 0;

    const salesDetailedRegister = salesList.map(s => ({
      id: s.id,
      customerName: s.customer_name || s.lead_customer_name || (s.metadata && s.metadata.customer_name) || 'Customer',
      projectName: s.project_name || 'Property Project',
      unitNumber: s.unit_number || '-',
      areaSqft: Number(s.area_sqft) || 0,
      totalRevenue: Number(s.total_revenue) || 0,
      bookingAmount: Number(s.booking_amount) || 0,
      date: s.sale_date,
      executiveName: s.executive_name || 'Unassigned',
    }));

    const salesReport = {
      totalSalesValue,
      totalBookings,
      averageRevenue,
      detailedRegister: salesDetailedRegister,
    };

    // 4. EXECUTIVE PERFORMANCE REPORT
    const execMap = {};
    for (const lead of leadsList) {
      const execName = lead.executive_name || 'Unassigned';
      if (!execMap[execName]) {
        execMap[execName] = {
          executiveName: execName,
          role: 'Sales Executive',
          totalAssigned: 0,
          converted: 0,
          conversionRate: 0,
          siteVisitsDone: 0,
          totalRevenue: 0,
        };
      }
      execMap[execName].totalAssigned += 1;
      if ((lead.lead_status || '').toLowerCase().includes('convert')) {
        execMap[execName].converted += 1;
      }
    }

    for (const visit of visitsList) {
      const execName = visit.executive_name || 'Unassigned';
      if (execMap[execName]) {
        if (['completed', 'trip_completed'].includes(String(visit.status || '').toLowerCase())) {
          execMap[execName].siteVisitsDone += 1;
        }
      }
    }

    for (const sale of salesList) {
      const execName = sale.executive_name || 'Unassigned';
      if (execMap[execName]) {
        execMap[execName].totalRevenue += (Number(sale.total_revenue) || 0);
      }
    }

    const execList = Object.values(execMap).map(e => ({
      ...e,
      conversionRate: e.totalAssigned > 0 ? (e.converted / e.totalAssigned) * 100 : 0,
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    const bestPerformer = execList.length > 0 ? execList[0].executiveName : 'None';

    const executivePerformanceReport = {
      totalExecutives: execList.length,
      bestPerformer,
      totalLeadsAssigned: leadsList.length,
      detailedRegister: execList,
    };

    return res.json({
      siteVisitsReport,
      leadsReport,
      salesReport,
      executivePerformanceReport,
    });
  } catch (err) {
    console.error('Reports route error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
