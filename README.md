Let's keep the momentum — Topics 9-12 🔥
________________________________________
📘 TOPIC SHEET 9: Duplicate Detection
(~10 questions) ✅ You know the basics, master the edge cases
________________________________________
📖 Concept
Duplicate detection in Dataverse has 3 components:
1. DUPLICATE DETECTION RULES
   → Define WHAT is a duplicate (which tables + which fields to compare)
   
2. DUPLICATE DETECTION SETTINGS
   → Define WHEN to check (on create, on update, during import)
   
3. DUPLICATE DETECTION JOBS
   → Run scheduled bulk scans for existing duplicates
How a Rule Works
Setting	What It Means	Example
Base Record Type	The table you're CREATING a record in	Opportunity
Matching Record Type	The table you're CHECKING AGAINST	Lead
Base Record Field	The field on the new record	Originating Lead
Matching Record Field	The field on the existing record	Topic
Match Criteria	Exact match, Same First Characters, etc.	Exact Match
🧠 The Cross-Entity Trick (Exam Favorite)
"Ensure no leads exist before creating an opportunity"
This means:
•	Base Record Type = Opportunity (the record being created)
•	Matching Record Type = Lead (checking against existing leads)
•	Base Record Field = Originating Lead (or Company Name)
•	Matching Record Field = Topic (or Company Name)
⚠️ The base is the NEW record. The match is the EXISTING record you check against.
Duplicate Prevention Methods Comparison
Method	What It Does	Prevents Creation?	Works on Import?
Duplicate Detection Rule	Warns or blocks when duplicate found	⚠️ Warns (user can override)	✅ If enabled
Alternate Key	Enforces uniqueness at database level	✅ Hard block (error)	✅ Always
Business Rule	Form-level validation	❌ Cannot check other records	❌ No
Power Fx Formula	Column formula	❌ Cannot check other records	❌ No
________________________________________
🔑 Rules to Memorize
Rule	Remember
1	Base record = the record being CREATED/UPDATED
2	Matching record = the EXISTING record to check against
3	Cross-entity detection is possible (Opportunity vs Lead)
4	Rules must be published before they work
5	During data import option must be explicitly ENABLED
6	Alternate Key = hard enforcement (error on duplicate)
7	Duplicate Detection Rule = soft enforcement (warning, user can override)
8	Business rules CANNOT detect duplicates (they only see current record)
9	Power Fx CANNOT detect duplicates
10	Duplicate detection jobs = scheduled bulk scans of existing data
11	Three ways to delete audit/duplicate data: by record, by date range, by table
________________________________________
📝 All Related Questions + Answers
Q14-15: No leads before creating opportunity
Base Record Type = Opportunity (you're creating this)
Matching Record Type = Lead (checking against these)
Base Record Field = Originating Lead
Matching Record Field = Topic (or relevant identifying field)
Key: Base = new record. Match = existing records to check against
________________________________________
Q74-75: Duplicate detection during data import
Scenario: Import records, delete duplicates without user intervention
Answer: ✅ A. Enable the "During data import" option
❌ Templates for Data Import — templates define mapping, not duplicate rules
❌ Disable Allow Duplicates — this is a per-user setting, not import setting
❌ When record is created or updated — this triggers on manual create, not bulk import
Key: There's a SPECIFIC setting for imports — it must be enabled separately
________________________________________
Q85-86: Alternate key for duplicate prevention?
Scenario: Table with Name, Company, Contacted On — no duplicate rows
Solution: Create an alternate key for the columns
Answer: ✅ Yes — Alternate key enforces uniqueness at database level
Why: If someone tries to create a record with the same Name + Company + Contacted On → hard error
Key: Alternate key = strongest duplicate prevention (no user override)
________________________________________
Q87: Power Fx formula for duplicate prevention?
Answer: ❌ No — Power Fx formulas are calculated values on a single record. They cannot query other records to check for duplicates
Key: Power Fx = single record scope only
________________________________________
Q88: Duplicate detection rule for duplicate prevention?
Answer: ✅ Yes — Duplicate detection rules can prevent duplicates on create/update
But: Users can override the warning (unless you customize the behavior)
Key: Detection rules = soft block (warning). Alternate keys = hard block (error)
________________________________________
Q89-90: Business rule for duplicate prevention?
Answer: ❌ No — Business rules operate on the current form/record only. They cannot query other records in the table to check for duplicates
Key: Business rules = form-level only. Cannot check across records
________________________________________
Q297: Admin staff duplicate management
Scenario: Admin staff must receive weekly duplicate list. No alerts when saving new contact
Answer: ✅ C. Create one duplicate detection rule + one duplicate detection job + update settings
•	Rule = defines what's a duplicate (same email + last name)
•	Job = scheduled weekly scan to find existing duplicates
•	Settings = disable "When a record is created or updated" (no alert on save)
Key: Disable real-time detection + enable scheduled job = weekly report without save interruptions
________________________________________
🔧 Apply Section — Verify It Yourself
✅ Exercise 1: Create a Duplicate Detection Rule
1.	Settings → Data Management → Duplicate Detection Rules
2.	Click + New
3.	Base Record Type: Contact
4.	Matching Record Type: Contact (same-entity detection)
5.	Add criteria: Email Address = Exact Match → Email Address
6.	Click Publish → rule is now active
7.	Try creating two contacts with same email → see the warning
✅ Exercise 2: Cross-Entity Detection Rule
1.	Create a new rule: 
o	Base Record Type: Opportunity
o	Matching Record Type: Lead
o	Criteria: Company Name = Exact Match → Company
2.	Publish → try creating an Opportunity with a company name that exists as a Lead
3.	You should get a duplicate warning ✅
✅ Exercise 3: Create an Alternate Key
1.	make.powerapps.com → Tables → Contact → Keys
2.	Click + New key → name: "Email Uniqueness"
3.	Add column: Email Address
4.	Save → wait for key to be created (may take a few minutes)
5.	Try creating two contacts with the same email → you get a hard error (not just warning)
6.	Compare: Detection rule = warning. Alternate key = error
✅ Exercise 4: Schedule a Duplicate Detection Job
1.	Settings → Data Management → Duplicate Detection Jobs
2.	Click + New → select table (e.g., Contact)
3.	Set schedule: Weekly
4.	Run → see results showing potential duplicates
5.	This is what Q297 tests — scheduled bulk scan
✅ Exercise 5: See Duplicate Detection Settings
1.	Settings → Data Management → Duplicate Detection Settings
2.	See three checkboxes: 
o	✅ When a record is created or updated
o	✅ When Microsoft Dynamics 365 goes online
o	✅ During data import
3.	Toggle them → understand when detection triggers
________________________________________
📘 TOPIC SHEET 10: Solutions & ALM
(~8 questions) ⚠️ You need to review this
________________________________________
📖 Concept
Solution Types
Type	Editable?	What Happens on DELETE?	Use Case
Unmanaged	✅ Yes (full edit)	Components REMAIN in environment	Development environment
Managed	❌ No (locked)	Components are REMOVED	Production/Test deployment
Default Solution	✅ Yes	Cannot be deleted	Contains ALL components in environment
🧠 The Critical Difference (EXAM TRICK)
DELETE an UNMANAGED solution:
    → Solution is removed
    → Components STAY (tables, columns, flows still exist)
    → Data STAYS

DELETE a MANAGED solution:
    → Solution is removed
    → Components are REMOVED (tables, columns, flows deleted)
    → Data in those tables is DELETED
Solution Lifecycle
DEV environment (Unmanaged)
    → Export as MANAGED
        → Import to TEST environment (Managed)
            → Import to PROD environment (Managed)
Import Options
Option	What It Does	When to Use
Update	Overwrites existing components, keeps deleted components	Quick patch, no cleanup needed
Upgrade	Overwrites + REMOVES components that were deleted from source	Clean deployment, removes old components
Stage for Upgrade	Imports but doesn't apply upgrade yet	Preview changes before applying
Solution Patches
Concept	What It Does
Patch	Contains ONLY the changes (delta), not the full solution
Clone to Patch	Creates a new patch from the parent solution
After patching	Must eventually merge patches back into a full solution for upgrade
Publisher & Prefix
Setting	What It Is	Why It Matters
Publisher	Identity of who created the solution	Controls the prefix
Prefix	Added to all new components (e.g., cr4b2_fieldname)	Prevents naming conflicts across solutions
________________________________________
🔑 Rules to Memorize
Rule	Remember
1	Unmanaged = development. Managed = deployment
2	Delete unmanaged → components STAY. Delete managed → components REMOVED
3	Always export as Managed to production
4	Upgrade = clean (removes old). Update = overlay (keeps old)
5	Prefix prevents naming conflicts across solutions/publishers
6	Cannot change publisher after solution is created
7	Solution Checker = validates for performance, accessibility, deprecated APIs
8	Managed properties control what can be customized in managed solution
9	Environment variables = store configuration values that change per environment
10	Default value = set by publisher. Current value = overridden per environment
________________________________________
📝 All Related Questions + Answers
Q241: Prevent display name changes after promotion
Scenario: Table display names must NOT be changed in UAT
Answer: ✅ C. Managed solution
Why: Managed solutions lock components — users can't modify display names
❌ Unmanaged — fully editable
❌ Default solution — contains everything, always editable
❌ Segmented solution — not a real concept for locking
________________________________________
Q263-264: Effects of removing solutions
Scenario 1: Unmanaged solution with custom table + parent-child relationship
→ Delete solution → Solution only removed. Table, relationship, and data STAY
Scenario 2: Managed solution PATCH with updated column label
→ Delete patch → Solution and the updated column label removed (reverts to original)
Scenario 3: Managed ISV solution with custom table + sitemap changes
→ Delete solution → Solution, table, and any data in the table removed
Key: Managed = everything removed. Unmanaged = only solution container removed
________________________________________
Q275-276: Package JavaScript web resource for deployment
Scenario: Your JS uses a third-party library. ISV has it but may not be installed everywhere
Answer: ✅ A (Create new JS web resource from library + add both) AND C (Merge library code into your JS)
Why: You must include the dependency in YOUR solution since ISV may not exist
❌ B — Can't copy from ISV's managed solution
❌ D — Adding only the library without your code doesn't work
________________________________________
Q284: Avoid naming conflicts during import
Answer: ✅ D. Prefix
Why: Each publisher has a unique prefix (e.g., contoso_, cr4b2_). This prevents AccountType from one solution conflicting with AccountType from another
❌ Package type, Configuration page, Marketplace, Version — none prevent naming conflicts
________________________________________
Q104: Where to create solution package for promotion
Answer: ✅ B. Power Apps designer (make.powerapps.com → Solutions)
❌ Azure DevOps — used for CI/CD pipelines, not manual solution creation
❌ Power Platform Admin Center — environment management, not solution packaging
❌ Azure portal — not for Power Platform solutions
________________________________________
Q246: Environment variable issue after deployment
Scenario: Power BI report shows dev data in production after managed solution import
Answer: ✅ B. Remove the environment variable current value
Why: The current value from dev was included in the solution. Removing it lets the default value (or production-specific value) take effect
❌ Update default value — default is set by publisher, shouldn't change per environment
❌ Create new variable — unnecessary, just fix the current value
Key: Current value = environment-specific override. Default value = publisher's baseline
________________________________________
Q65: Transport methods for different components
•	Customizations (tables, columns, forms) → Solution export/import
•	Data (records) → Data import (CSV/Excel) or Configuration Migration Tool
Key: Solutions transport SCHEMA (structure). Data must be transported separately
________________________________________
Q261: Deployment options for managed solutions
•	Changes to unrelated table → Deploy a full copy of the new solution using upgrade option
•	Automation enhancements → Deploy the new solution then deploy full copy of original. Upgrade both
Key: Upgrade option = cleanest deployment (removes old, adds new)
________________________________________
Q105-106: Extract text for translation
Answer: ✅ C. The solution in the web application
How: Solutions → select solution → Translations → Export Translations
This exports an XML file with all localizable text for translation
❌ Tables in web app — too granular
❌ Admin center — no translation export feature
❌ Individual components — must be done at solution level
________________________________________
🔧 Apply Section — Verify It Yourself
✅ Exercise 1: Create & Export an Unmanaged Solution
1.	make.powerapps.com → Solutions → + New solution
2.	Name: "PL200 Practice" → Publisher: select or create → Create
3.	Add components: a table, a column, a form
4.	Click Export → choose Unmanaged → download the ZIP
5.	This is your development export
✅ Exercise 2: Export as Managed
1.	Same solution → click Export → choose Managed
2.	Download the ZIP → notice it's a different file
3.	Key difference: If imported to another environment, components will be LOCKED
✅ Exercise 3: See What Happens When You Delete
1.	Import your unmanaged solution to a test environment
2.	Delete the solution → check: table still exists ✅, data still exists ✅
3.	Now import the managed version
4.	Delete the managed solution → check: table is GONE ❌, data is GONE ❌
5.	This is the #1 exam concept for ALM
✅ Exercise 4: See Solution Prefix
1.	Solutions → open your solution → Settings (gear icon)
2.	See the Publisher → click to see the Prefix
3.	Create a new column in this solution → notice the prefix auto-added (e.g., cr4b2_newfield)
4.	This prefix prevents naming conflicts (Q284)
✅ Exercise 5: Environment Variables
1.	In your solution → + New → More → Environment Variable
2.	Name: "APIEndpoint" → Type: Text
3.	Set Default Value: https://dev.api.contoso.com
4.	Set Current Value: https://prod.api.contoso.com
5.	Export solution → import to another environment → current value can be different per environment
6.	This is what Q246 tests
✅ Exercise 6: Solution Checker
1.	Solutions → select your solution → Solution Checker → Run
2.	Wait for results → see issues flagged: 
o	Performance issues
o	Accessibility problems
o	Deprecated APIs
o	Unsupported customizations
3.	Fix issues before deploying to production
________________________________________
📘 TOPIC SHEET 11: Cloud Flows (Power Automate)
(~14 questions) ✅ You're strong here, but master the exam tricks
________________________________________
📖 Concept
Flow Types
Flow Type	Trigger	Use Case
Automated	Event-based (record created, email received)	React to data changes
Instant	Manual button press (Power Apps, Teams, mobile)	On-demand actions
Scheduled	Time-based (daily, weekly, hourly)	Recurring tasks
Desktop	Triggered from cloud flow or manually	Legacy app automation
Dataverse Connector — Key Actions
Action	What It Does	When to Use
Add a new row	Creates a record	New record automation
Update a row	Updates specific columns	Modify existing record
List rows	Query multiple records	Get filtered data
Get a row by ID	Retrieve one specific record	Lookup by GUID
Delete a row	Removes a record	Cleanup automation
Perform a bound action	Run action tied to a specific row	Custom API on a record
Perform an unbound action	Run action NOT tied to a specific row	Global custom API
Perform a changeset request	Multiple operations as single transaction	All-or-nothing operations
Dataverse Triggers
Trigger	Fires When	Key Setting
When a row is added	New record created	Table name
When a row is added, modified or deleted	Any change	Table name + Change type + Column filter
Column Filter & Filtering Attributes
Setting	What It Does
Column filter (on trigger)	ONLY fire when THESE specific columns change
Filter rows (on trigger)	ONLY fire for rows matching this condition
Trigger condition	Advanced: OData expression that must be true to fire
________________________________________
🔑 Rules to Memorize
Rule	Remember
1	Automated flow = event trigger (record change, email, etc.)
2	Scheduled flow = time trigger (every day at 9AM, every Monday, etc.)
3	Instant flow = manual trigger (button in app, Teams, mobile)
4	Column filter on trigger = only fires when specific columns change (saves runs)
5	Perform a bound action = Custom API/action on a SPECIFIC record
6	Perform an unbound action = Custom API/action NOT tied to a record
7	Perform a changeset request = multiple CUD operations as ONE transaction
8	Run after settings = control what happens after success/failure/skip/timeout
9	Scope = try-catch equivalent (group actions, handle errors)
10	Apply to Each = loop through array/collection
11	Condition = if/else branching
12	Switch = multi-branch (like multiple if/else)
13	Expressions: formatDateTime(), addDays(), utcNow(), coalesce()
14	Approvals = Start and Wait for Approval action (built-in connector)
15	OR condition in filter = or(condition1, condition2)
16	Cloud flows have inherent delay (seconds to minutes) — NOT truly real-time
________________________________________
📝 All Related Questions + Answers
Q144: Flow types for different tasks
•	Repetitive actions in legacy app with no API → Desktop flow (automate UI)
•	Send email on contact's birthday → Automated flow (triggered by date)
Key: No API = Desktop flow. Event-based = Automated. Time-based = Scheduled
________________________________________
Q148: Twitter hashtag → mobile notification + email
Sequence:
1.	Create a connection to Twitter
2.	Set trigger: When a new tweet with specific hashtag
3.	Add condition: Check hashtag matches
4.	Add action: Send email notification
Key: Connection first → Trigger → Condition → Action
________________________________________
Q152: Expression for overdue invoices (≥ 7 days)
Answer: ✅ @greaterOrEquals(triggerBody()?['OverdueDate'], 7)
Key: greaterOrEquals for ≥ comparison in expressions
________________________________________
Q156: OR filter condition (sales < 500K OR credit hold)
Expression: or(less(item()?['sales'], 500000), equals(item()?['credithold'], 'true'))
Key: or() wraps two conditions. less() for <. equals() for =
________________________________________
Q164: Canvas app button to send email
Answer: ✅ B. Power Automate cloud flow
How: Create instant flow → trigger from Power Apps button → Send email action
❌ Classic workflow — can't trigger from canvas app button
❌ Azure Logic App — overkill, not Power Platform native
❌ BPF — guided process, not single action
________________________________________
Q169-170: Approval process without code
Answer: ✅ A. Power Automate cloud flow (with Approvals connector)
How: Trigger on revenue > $1M → Start and Wait for Approval → If approved → proceed
❌ PCF — UI component, not process automation
❌ Column Expression — calculated value, not approval workflow
________________________________________
Q171: Daily email with YTD totals
Answer: ✅ A. Loop (Apply to Each)
Why: Need to iterate through records to calculate YTD totals and include in email
❌ Wait — pauses flow, doesn't loop
❌ Condition — single branch, doesn't iterate
❌ Parallel branch — runs actions simultaneously, doesn't loop
________________________________________
Q224: Flow sequence for automated email
Sequence: Trigger → Condition → Action
1.	Trigger: When a new maintenance request is created
2.	Condition: Check the department in the request
3.	Action: Send email to the department's manager
Key: Always Trigger first → then logic → then action
________________________________________
Q229-230: Dataverse connector actions
•	Run custom API on existing Account row → Perform a bound action
•	Create three rows, rollback if error → Perform a changeset request (transaction)
•	Execute create/delete/update as single transaction → Perform a changeset request
•	Execute complex operations on multiple rows → Perform an unbound action
Key: Bound = on a specific record. Unbound = global. Changeset = transaction
________________________________________
Q298-299: Automation for qualification verification
Answer: ✅ A (Dataverse connector) + B (Outlook connector)
Why: Dataverse connector to read/update qualification records. Outlook connector to send email with results
❌ On-premises gateway — data is in Dataverse, not on-premises
❌ Update/Create records — these are actions, not the connectors needed
________________________________________
Q310: Service request completion process
Answer: ✅ A (Power Automate flow) + B (Connection reference)
Why: Flow automates the process. Connection reference = solution-aware way to store connector credentials (works across environments)
❌ Connection — not solution-aware (breaks on import)
❌ BPF — guided process for users, not automated background process
________________________________________
Q311: Format Current Date for consent email
Answer: ✅ D. Expression — formatDateTime(utcNow(), 'MMMM dd, yyyy')
This produces: "May 25, 2026"
❌ Condition — branching logic, not formatting
❌ Switch — multi-branch, not formatting
❌ Dynamic content — gives raw date, not formatted
________________________________________
Q318-319: Flow trigger settings for qualification verification
Trigger: Set Table name to Qualification and Column filter to statuscode
Logic: Loop through related qualification records and complete if ALL are in Complete status
Why: Trigger fires when a qualification status changes → then check all related qualifications
________________________________________
Q159: Troubleshoot flow in test environment
•	Enable changes to flow → Turn on (enable the flow)
•	Enable changes to the object → Edit (open in designer)
Key: Managed flows must be turned on + edited to troubleshoot
________________________________________
🔧 Apply Section — Verify It Yourself
✅ Exercise 1: Create an Automated Flow
1.	make.powerautomate.com → + Create → Automated cloud flow
2.	Trigger: "When a row is added" → Table: Account
3.	Action: "Send an email (V2)" → To: your email → Subject: "New Account!"
4.	Save → Create a new Account → check inbox
✅ Exercise 2: Add Column Filter to Trigger
1.	Open your flow → click the trigger
2.	Find "Select columns" (Column filter) → type: name,telephone1
3.	Now the flow ONLY fires when Account Name or Phone changes
4.	Change a different field (e.g., address) → flow does NOT fire ✅
✅ Exercise 3: Use Expressions
1.	Add an action → Compose (for testing expressions)
2.	Click in the value → switch to Expression tab
3.	Type: formatDateTime(utcNow(), 'MMMM dd, yyyy')
4.	Save & Test → see output: "May 25, 2026"
5.	Try: addDays(utcNow(), 7, 'yyyy-MM-dd') → date 7 days from now
✅ Exercise 4: Build an OR Condition
1.	Add a Condition action
2.	Click "Add row" → set first condition: Sales < 500000
3.	Click "Add row" → set second condition: CreditHold = true
4.	Change the operator at the top from "And" to "Or"
5.	Now the condition is true if EITHER condition matches
✅ Exercise 5: Perform a Changeset Request
1.	Add action: "Perform a changeset request"
2.	Inside, add: Create Row 1, Create Row 2, Create Row 3
3.	If Row 2 fails → Row 1 is automatically rolled back
4.	This is a DATABASE TRANSACTION — all or nothing
✅ Exercise 6: Error Handling with Run After
1.	Add two actions in sequence: Action A → Action B
2.	Click ⋯ on Action B → Configure run after
3.	See options: ✅ has succeeded, ☐ has failed, ☐ is skipped, ☐ has timed out
4.	Check "has failed" → now Action B runs ONLY when Action A fails
5.	This is the try-catch pattern in Power Automate
________________________________________
📘 TOPIC SHEET 12: Business Process Flows (BPF)
(~10 questions) ✅ You're strong, master the exam-specific tricks
________________________________________
📖 Concept
What is a BPF?
A guided visual process that sits at the top of a form with stages and steps:
[Stage 1: Qualify] → [Stage 2: Develop] → [Stage 3: Propose] → [Stage 4: Close]
     ↑                      ↑                     ↑                    ↑
  Data steps            Data steps            Data steps          Data steps
  (required fields)     (required fields)     (required fields)   (required fields)
Key BPF Facts
Feature	Detail
Max stages	30 per BPF
Max steps per stage	30
Cross-entity	✅ Yes — BPF can span multiple tables (e.g., Lead → Opportunity)
BPF Table	Every BPF creates its own Dataverse table to store instances
Multiple BPFs per table	✅ Yes — users can switch between them
Branching	✅ Yes — conditional branching based on field values
Security	Control via security role privileges on the BPF table
Offline	✅ Supported — but only if BPF references ONE table
Stage Events (Workflow Integration)
Event	When It Fires	Use Case
On Enter (Stage Entry)	When user ENTERS a stage	Auto-create task, send notification
On Exit (Stage Exit)	When user LEAVES a stage	Validate completion, update status
How to Prevent Users from Using a BPF
Method	What It Does
Deactivate the BPF	Removes from all users — no one can use it
Remove security privileges	Removes access for specific roles — granular control
❌ Business rule	Cannot control BPF access
❌ Change display order	Moves it down but doesn't prevent switching to it
________________________________________
🔑 Rules to Memorize
Rule	Remember
1	Deactivate = remove for ALL users
2	Remove privileges = remove for SPECIFIC roles
3	Stage events = On Enter + On Exit (attach workflows)
4	On-demand workflow on a stage = runs when stage completes
5	BPF creates its own table — each instance is a record
6	Cross-entity BPF = spans multiple tables (e.g., Lead → Opportunity → Quote)
7	Offline BPF = must reference ONLY ONE table
8	Branching = conditional paths based on field values (If/Switch)
9	Switch = best for multiple conditions in single evaluation (e.g., ratings 0-100)
10	Action Step = call an on-demand action/workflow from within a BPF stage
11	For Action Step to work: entity must match + action must have at least one step
12	Users CAN switch between BPFs unless restricted
________________________________________
📝 All Related Questions + Answers
Q9, Q255: Prevent users from using BPFA
Scenario: Multiple BPFs on Prospect entity. Users must NOT use BPFA
Answer: ✅ B (Deactivate BPFA) + D (Remove all privileges for BPFA)
❌ A (Business rule) — cannot control BPF access
❌ C (Change display order) — moves it down but users can still switch to it
Key: Two valid methods — deactivate (all users) or remove privileges (specific roles)
________________________________________
Q137-138: Update BPF while minimizing effort
•	Combine classic workflows together on a specific stage → Classic workflow (attach to stage On Enter/On Exit)
•	Add branching for specific stages → Branching (conditional path in BPF designer)
•	Check conditions in multiple places → Action (call reusable action from BPF)
Key: Workflows on stages + branching + actions = BPF extensibility
________________________________________
Q139: Action not available in Action Step
Scenario: Created an action but it doesn't appear in BPF Action Step
Answer: ✅ A (entity must match BPF stage entity) + B (action must have at least one step)
❌ C (Run as on-demand) — not required for Action Step
❌ D (Activate) — must be activated, but the question says it's already created
Key: Two requirements — matching entity + at least one step inside the action
________________________________________
Q145-146: BPF branching for probability ratings
Scenario: Ratings 0-100 with different likelihoods
Answer: Use Switch step (evaluates one expression, branches to multiple outcomes)
Why: Switch = single evaluation with multiple branches. Better than nested conditions
Key: Multiple ranges from one value = Switch. Two outcomes = Condition
________________________________________
Q153-154: Workflow runs when user completes final stage
Answer: ✅ C. Available to run: As an on-demand process
Why: On-demand workflows can be attached to BPF stages. They trigger on stage entry/exit
❌ Record status changes — triggers on record status, not BPF stage
❌ Run in background — this is about execution mode, not trigger
❌ As a child process — called from another process, not from BPF
________________________________________
Q161-162: BPF offline + send email on create
•	Available offline → Ensure BPF references ONE table per stage (offline requires single table)
•	Send email when record created → Create a required column (no — this should be a flow/workflow, but the question's options suggest BPF configuration)
Key: Offline BPF = one table only. Multi-table BPF = NOT available offline
________________________________________
Q277-278: New BPF version impact on existing records
•	Existing accounts → Show the new BPF (existing records get updated to new version)
•	New accounts (if ProcessId not set) → No BPF is linked (system defaults based on configuration)
Key: When you update a BPF, existing records that had the old version get the new version. New records follow the system's BPF defaulting logic
________________________________________
🔧 Apply Section — Verify It Yourself
✅ Exercise 1: Create a Simple BPF
1.	make.powerapps.com → Solutions → open your solution
2.	+ New → Automation → Process → Business Process Flow
3.	Select table: Account
4.	Add 3 stages: "Qualify" → "Develop" → "Close"
5.	Add data steps (required fields) to each stage
6.	Save & Activate → open an Account record → see the BPF at the top
✅ Exercise 2: Deactivate a BPF
1.	Go to your BPF → click Deactivate
2.	Open an Account record → the BPF is GONE for ALL users
3.	Reactivate → it's back
4.	This is how Q9/Q255 works
✅ Exercise 3: See BPF Security Privileges
1.	Settings → Security Roles → open a role
2.	Go to Custom Entities tab → find your BPF table (it has the BPF name)
3.	Remove Read/Write/Create privileges → users with this role can't use the BPF
4.	This is the second method from Q9/Q255
✅ Exercise 4: Add Branching
1.	Open your BPF in designer
2.	Click on a stage → click + Add Branch
3.	Set condition: If Account Rating = "Hot" → go to "Fast Track" stage
4.	If Account Rating = "Cold" → go to "Standard" stage
5.	Save & Activate → test with different ratings
✅ Exercise 5: Attach Workflow to Stage
1.	Create a classic workflow: Table = Account, Available to run = As an on-demand process
2.	Add a step: Send email
3.	Open your BPF designer → click on a stage
4.	Drag a Workflow step into the stage
5.	Select your on-demand workflow
6.	Now when a user completes this stage → email is sent
✅ Exercise 6: BPF Table in Dataverse
1.	After creating and activating a BPF → go to Tables
2.	Search for your BPF name → you'll find a NEW table created by the system
3.	This table stores BPF instances (each record = one process instance)
4.	Open it → see columns like Active Stage, Completed On, etc.
________________________________________
📋 Progress Tracker (Updated)
#	Topic	Status	Questions	Your Level
1	✅ Search Types	✅ Done	12	Now mastered
2	✅ Tool Selection	✅ Done	15	Now mastered
3	✅ Business Rule Scope	✅ Done	10	Now mastered
4	✅ Views	✅ Done	12	Now mastered
5	✅ Power Virtual Agents	✅ Done	27	Now mastered
6	✅ Power Pages	✅ Done	12	Now mastered
7	✅ Security	✅ Done	12	Now mastered
8	✅ Forms	✅ Done	10	Now mastered
9	✅ Duplicate Detection	✅ Done	10	Now mastered
10	✅ Solutions/ALM	✅ Done	8	Now mastered
11	✅ Cloud Flows	✅ Done	14	Now mastered
12	✅ BPF	✅ Done	10	Now mastered
13	🔜 Desktop Flows	Next		
14	🔜 Canvas App (Variables/Functions)	Next		
15	🔜 Environment & Admin	Next		
________________________________________
🔥 You've now covered 12/15 topics = ~87% of exam content mastered!
Only 3 topics left — Desktop Flows, Canvas App Variables, and Environment & Admin. These are your final stretch!

# ICUTwin.
