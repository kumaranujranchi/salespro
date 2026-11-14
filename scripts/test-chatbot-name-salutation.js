import assert from 'node:assert';
import {
  isCompanyOrBusinessName,
  isGenericOrHandle,
  extractCleanPersonalName,
  extractCompanyName,
} from '../server/src/utils/nameHelper.js';
import { evaluateVisitorIntent } from '../server/src/services/whatsappHubService.js';

console.log('Testing WhatsApp Chatbot Name & Company Salutation Logic...\n');

// 1. Test Company Detection
const companyCases = [
  'AR developer',
  'AR developers',
  'A.R. Developers',
  'Shivam Real Estate',
  'Apex Realty',
  'Skyline Builders',
  'DLF Properties',
  'Galaxy Infra',
  'Om Enterprises',
  'Tech Solutions',
  'Aggarwal Associates',
  'Choudhary Group',
  'Dream Homes',
  'ABC Pvt Ltd',
  'Patna Realty Services',
  'Property Advisors & Consultants',
  'info@shivamrealty.com',
  'www.apexrealty.in',
  '+91 98765 43210',
];

for (const comp of companyCases) {
  assert.strictEqual(
    isCompanyOrBusinessName(comp),
    true,
    `Failed: "${comp}" should be detected as a company name`
  );
  assert.strictEqual(
    extractCleanPersonalName(comp),
    null,
    `Failed: "${comp}" should NOT return a personal human name`
  );
  console.log(`✓ Company correctly detected: "${comp}" -> personal name: null`);
}

// 2. Test Real Human Personal Names
const personalCases = [
  { input: 'Aditya', expected: 'Aditya' },
  { input: 'Aditya Kumar', expected: 'Aditya Kumar' },
  { input: 'Rahul Sharma', expected: 'Rahul Sharma' },
  { input: 'Pooja Gupta', expected: 'Pooja Gupta' },
  { input: 'Vikram Singh', expected: 'Vikram Singh' },
  { input: 'Dr. Rajesh', expected: 'Dr. Rajesh' },
  { input: 'Amit', expected: 'Amit' },
];

for (const { input, expected } of personalCases) {
  assert.strictEqual(
    isCompanyOrBusinessName(input),
    false,
    `Failed: "${input}" should NOT be detected as a company`
  );
  const clean = extractCleanPersonalName(input);
  assert.strictEqual(
    clean,
    expected,
    `Failed: "${input}" clean name mismatch: got "${clean}", expected "${expected}"`
  );
  console.log(`✓ Personal name correctly identified: "${input}" -> "${clean}"`);
}

// 3. Test Compound Profile Names (Person + Company)
const compoundCases = [
  { input: 'Anuj | AR Developer', expectedName: 'Anuj', expectedCompany: 'AR Developer' },
  { input: 'Rahul - Apex Realty', expectedName: 'Rahul', expectedCompany: 'Apex Realty' },
  { input: 'Amit / Shivam Properties', expectedName: 'Amit', expectedCompany: 'Shivam Properties' },
];

for (const { input, expectedName, expectedCompany } of compoundCases) {
  const cleanName = extractCleanPersonalName(input);
  const comp = extractCompanyName(input);
  assert.strictEqual(cleanName, expectedName, `Compound name failed for "${input}"`);
  assert.strictEqual(comp, expectedCompany, `Compound company failed for "${input}"`);
  console.log(`✓ Compound name parsed: "${input}" -> Person: "${cleanName}", Company: "${comp}"`);
}

// 4. Test Generic / Bot / Placeholder Handles
const genericCases = [
  'Hey',
  'Visitor',
  'User',
  'Website Visitor',
  'Guest',
  'WhatsApp User',
  'MyDigitalEra',
  '12345678',
  '???',
  '',
];

for (const gen of genericCases) {
  assert.strictEqual(
    extractCleanPersonalName(gen),
    null,
    `Failed: "${gen}" should NOT be recognized as a personal name`
  );
  console.log(`✓ Generic handle filtered out: "${gen}"`);
}

// 5. Test evaluateVisitorIntent Greetings and Handover Salutations
console.log('\nTesting evaluateVisitorIntent Salutation Behaviors:');

// 5A. Company Profile Name: "AR developer"
const companyGreeting = evaluateVisitorIntent('hello', 'AR developer');
console.log(`Company greeting reply:\n"${companyGreeting.reply}"\n`);
assert.strictEqual(
  companyGreeting.reply.includes('AR developer ji'),
  false,
  'CRITICAL REGRESSION: Must NEVER say "AR developer ji"!'
);
assert.strictEqual(
  companyGreeting.reply.includes('shubh naam'),
  true,
  'Must politely ask for the person\'s real name when only company is provided'
);
console.log('✓ Company profile NEVER gets "ji" attached; politely asks for real human name');

// 5B. Company Handover: "5"
const companyHandover = evaluateVisitorIntent('5', 'AR developer');
assert.strictEqual(
  companyHandover.reply.includes('AR developer ji'),
  false,
  'CRITICAL REGRESSION: Handover must NEVER say "AR developer ji"!'
);
assert.strictEqual(
  companyHandover.reply.includes('Ji bilkul sir!'),
  true,
  'Handover should use respectful "sir" when human personal name is unknown'
);
console.log('✓ Company profile handover addresses as "sir", not "Company ji"');

// 5C. Personal Name: "Rahul"
const personGreeting = evaluateVisitorIntent('hi', 'Rahul');
console.log(`Personal greeting reply:\n"${personGreeting.reply}"\n`);
assert.strictEqual(
  personGreeting.reply.includes('Rahul ji'),
  true,
  'Must respectfully greet human personal name with "Rahul ji"'
);
console.log('✓ Human personal name correctly greeted with "Rahul ji"');

// 5D. Personal Handover: "5" with "Rahul"
const personHandover = evaluateVisitorIntent('5', 'Rahul');
assert.strictEqual(
  personHandover.reply.includes('Ji bilkul Rahul ji!'),
  true,
  'Personal handover should address respectfully as "Ji bilkul Rahul ji!"'
);
console.log('✓ Human personal handover addresses as "Ji bilkul Rahul ji!"');

console.log('\nAll Contact Name, Company Salutation & Intent Greeting tests PASSED PERFECTLY!');
