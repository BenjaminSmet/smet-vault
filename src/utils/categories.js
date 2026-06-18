// Full category taxonomy — Category > Subcategory.
// Used for transactions, fixed costs, and fixed incomes.

export const EXPENSE_CATEGORIES = [
  { name: 'Fixed Expenses', emoji: '🏠', subs: ['Housing','Daycare','Insurance','Gas','Oil (or Fuel oil)','Loans','Internet/TV/Mobile','Electricity','Utilities','Water','Alimony','Pocket money','Other'] },
  { name: 'Household', emoji: '🧺', subs: ['Groceries','House and garden','Pets','Other'] },
  { name: 'Restaurants and bars', emoji: '🍽️', subs: ['Bars and cafes','Snacks','Restaurants','Other'] },
  { name: 'Shopping', emoji: '🛍️', subs: ['Clothes','Accessories','Electronics and software','Online shopping','Gifts','Other'] },
  { name: 'Transport', emoji: '🚗', subs: ['Car','Fuel','Parking','Public transport','Flights','Taxi','Bicycle','Other'] },
  { name: 'Well-being', emoji: '🧖', subs: ['Wellness','Beauty care','Other'] },
  { name: 'Leisure and hobbies', emoji: '🎮', subs: ['Events','Sports','Leisure activities','Holidays','Books and magazines','Games','Music and theatre','Movies','Lottery','Other'] },
  { name: 'Other expenses', emoji: '📦', subs: ['Cash','Credit card','Transfers','Charity','Education','Taxes','Extra loan repayment','Savings','Investments','Business expenses','Public services','Other'] },
  { name: 'Debt to own account', emoji: '🔁', subs: ['Savings','Current account','Investment account','Other'] },
  { name: 'Uncategorised', emoji: '❓', subs: ['Uncategorised'] },
]

export const INCOME_CATEGORIES = [
  { name: 'Credit from own account', emoji: '🔁', subs: ['Savings account','Current account','Investment account'] },
  { name: 'Income', emoji: '💸', subs: ['Salary','Pension','Allowances and reimbursements','Rental income','Transfers','Alimony','Investment income','Cash deposit','Other'] },
  { name: 'Returns', emoji: '↩️', subs: ['Refunds and reimbursements','Tax returns'] },
  { name: 'Other income', emoji: '🎁', subs: ['Commercial gesture','Gifts and donations','Mortgage'] },
  { name: 'Uncategorized', emoji: '❓', subs: ['Uncategorized'] },
]

/** Flat list of "Category: Subcategory" strings, grouped, for <select><optgroup>. */
export function categoryGroups(type) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

/** Emoji for a top-level category name. */
export function categoryEmoji(categoryName, type = 'expense') {
  const list = categoryGroups(type)
  return list.find(c => c.name === categoryName)?.emoji || '📦'
}

/** Default fallback category for unrecognized / unmapped transactions. */
export const UNCATEGORIZED = {
  expense: { category: 'Uncategorised', subcategory: 'Uncategorised' },
  income:  { category: 'Uncategorized', subcategory: 'Uncategorized' },
}
