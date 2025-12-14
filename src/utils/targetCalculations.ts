import { Target, Sale, Profile } from '../types/database';

interface CalculationResult {
  target: number;
  achievement: number;
  missingTargets: string[];
  leaderTarget: number;
  teamTarget: number;
  leaderAchievement: number;
  teamAchievement: number;
}

/**
 * Calculates Team Leader targets and achievements based on specific business rules.
 * 
 * Logic:
 * - Team Leader Target = Sum of all Team Members' Targets + Team Leader's Individual Target (if assigned)
 * - Team Leader Achievement = Sum of all Team Members' Achievements + Team Leader's Achievement (if they have sales)
 * 
 * @param leaderId - The ID of the Team Leader
 * @param teamMembers - List of team members (sales executives) reporting to the leader
 * @param targets - usage: sales_targets table data
 * @param sales - usage: sales table data
 * @param periodFilter - Function to filter data by date/period mainly
 */
export const calculateTeamPerformance = (
  leaderId: string,
  teamMembers: Profile[],
  targets: Target[],
  sales: Sale[],
  filterFn: (date: string) => boolean
): CalculationResult => {
  // 1. Identify all relevant user IDs (Leader + Active Members)
  // Ensure we only look at active team members for target calculations to avoid ghosts
  const activeMembers = teamMembers.filter(m => m.is_active !== false); // Explicit check if is_active exists
  const memberIds = activeMembers.map(m => m.id);
  const allIds = [leaderId, ...memberIds];

  // 2. Aggregate Targets
  // Filter targets for the specific period
  const relevantTargets = targets.filter(t => 
    t.start_date && filterFn(t.start_date) && allIds.includes(t.user_id)
  );

  // Split targets
  const leaderTargetObj = relevantTargets.find(t => t.user_id === leaderId);
  const leaderTarget = Number(leaderTargetObj?.target_sqft) || 0;

  // Calculate sum of members' targets
  let memberSum = 0;
  const missingTargets: string[] = [];

  activeMembers.forEach(member => {
    const memberTarget = relevantTargets.find(t => t.user_id === member.id);
    if (memberTarget) {
      memberSum += (Number(memberTarget.target_sqft) || 0);
    } else {
      // Log warning / track missing target
      missingTargets.push(member.full_name || 'Unknown User');
    }
  });

  const totalTarget = leaderTarget + memberSum;

  // 3. Calculate Achievement (Actuals)
  // Achievement is sum of all actuals from the group (Leader + Team)
  // Filter sales for the period and relevant users
  const relevantSales = sales.filter(s => 
    s.sale_date && filterFn(s.sale_date) && allIds.includes(s.sales_executive_id)
  );

  const leaderSales = relevantSales.filter(s => s.sales_executive_id === leaderId);
  const teamSales = relevantSales.filter(s => memberIds.includes(s.sales_executive_id));

  const leaderAchievement = leaderSales.reduce((sum, s) => sum + (Number(s.area_sqft) || 0), 0);
  const teamAchievement = teamSales.reduce((sum, s) => sum + (Number(s.area_sqft) || 0), 0);
  
  const totalAchievement = leaderAchievement + teamAchievement;

  return {
    target: totalTarget,
    achievement: totalAchievement,
    missingTargets,
    leaderTarget,
    teamTarget: memberSum,
    leaderAchievement,
    teamAchievement
  };
};

/**
 * Validates the scenarios requested.
 * Run this function to verify logic.
 */
export const runScenarioTests = () => {
  console.log("Running Scenario Tests...");

  // Mock Objects
  const leaderId = "leader";
  const members = [
    { id: "m1", full_name: "M1", reporting_manager_id: "leader" },
    { id: "m2", full_name: "M2", reporting_manager_id: "leader" },
    { id: "m3", full_name: "M3", reporting_manager_id: "leader" },
    { id: "m4", full_name: "M4", reporting_manager_id: "leader" },
  ] as Profile[];

  const filterFn = () => true;

  // Scenario 1: No Individual Target (for Leader), 4 members @ 1500
  const targets1 = [
    { user_id: "m1", target_sqft: 1500, start_date: "2024-01-01" },
    { user_id: "m2", target_sqft: 1500, start_date: "2024-01-01" },
    { user_id: "m3", target_sqft: 1500, start_date: "2024-01-01" },
    { user_id: "m4", target_sqft: 1500, start_date: "2024-01-01" },
  ] as Target[];
  
  // Sales: M1 sells 1000, Leader sells 0
  const sales1 = [
    { sales_executive_id: "m1", area_sqft: 1000, sale_date: "2024-01-15" }
  ] as Sale[];

  const result1 = calculateTeamPerformance(leaderId, members, targets1, sales1, filterFn);
  console.log("Scenario 1 Check:", 
    result1.target === 6000 && result1.achievement === 1000 ? "PASS" : `FAIL (Got T:${result1.target}, A:${result1.achievement})`
  );

  // Scenario 2: With Individual Target (Leader 1500), 2 members @ 1500
  const members2 = members.slice(0, 2); // M1, M2
  const targets2 = [
    { user_id: "leader", target_sqft: 1500, start_date: "2024-01-01" },
    { user_id: "m1", target_sqft: 1500, start_date: "2024-01-01" },
    { user_id: "m2", target_sqft: 1500, start_date: "2024-01-01" },
  ] as Target[];
  
  const result2 = calculateTeamPerformance(leaderId, members2, targets2, sales1, filterFn); /// sales1 has M1 selling 1000
  console.log("Scenario 2 Check:", 
    result2.target === 4500 && result2.achievement === 1000 ? "PASS" : `FAIL (Got T:${result2.target}, A:${result2.achievement})`
  );

  return { result1, result2 };
};
