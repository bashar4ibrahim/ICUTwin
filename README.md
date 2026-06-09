Final stretch — Topics 13-15 to complete your full mastery 🏁🔥
________________________________________
📘 TOPIC SHEET 13: Desktop Flows (RPA)
(~10 questions) ⚠️ Review needed — niche but tested
________________________________________
📖 Concept
Desktop Flows = Robotic Process Automation (RPA) — automate tasks on desktop apps and websites that have NO API.
When to Use Desktop Flows
Does the app have an API or connector?
    ├── YES → Use Cloud Flow (connector-based)
    └── NO → Use Desktop Flow (UI automation)
            ├── User is logged in → ATTENDED
            └── No user logged in → UNATTENDED
Attended vs Unattended
Feature	Attended	Unattended
User present?	✅ Yes — user watches/interacts	❌ No — runs autonomously
User session	Active user session required	NO active sessions allowed
Triggered by	User clicks "Run" or cloud flow while user is present	Cloud flow on schedule (no human)
Use case	Semi-automated tasks (user fills some fields, bot fills others)	Fully automated (nightly batch jobs, scheduled reports)
License	Power Automate Desktop (free for basic)	Power Automate Premium (paid, per-bot plan)
Desktop Flow Components
Component	What It Does
Power Automate Desktop	The application you install to BUILD and RUN desktop flows
Actions	Pre-built steps (click, type, read, copy, open app, close app, etc.)
UI Elements	Selectors that identify specific buttons/fields/windows on screen
Variables	Store data within the desktop flow
Input Parameters	Data passed FROM a cloud flow INTO the desktop flow
Output Parameters	Data passed FROM the desktop flow BACK to the cloud flow
Recording	Record mouse + keyboard actions to auto-generate steps
How Desktop Flows Connect to Cloud Flows
CLOUD FLOW (in the cloud)
    │
    ├── Trigger: Scheduled or Automated
    │
    ├── Action: "Run a flow built with Power Automate Desktop"
    │       │
    │       ├── INPUT: Send data TO desktop flow (e.g., record ID, customer name)
    │       │
    │       └── OUTPUT: Receive data FROM desktop flow (e.g., verification result)
    │
    └── Next Action: Use output data (e.g., update Dataverse record)
Two Ways to Create Desktop Flows
Method	How	Best For
Pre-built Actions	Drag and drop actions in Power Automate Desktop designer	New flows, precise control
Recording	Record mouse/keyboard events (legacy: Windows Recorder V1 + Selenium IDE)	Quick automation, legacy migration
Web UI Flow Requirements (Legacy)
For web-based UI automation (legacy method — older exam questions):
Component	Required?
Power Automate Desktop (or UI Flows app)	✅ Yes
Latest Microsoft Edge	✅ Yes
Selenium IDE (browser extension)	✅ Yes
Mozilla Firefox	❌ Not required (Edge is sufficient)
On-premises data gateway	❌ Not required for web UI flows
________________________________________
🔑 Rules to Memorize
Rule	Remember
1	No API / legacy app = Desktop Flow
2	Attended = user is present, active session
3	Unattended = no user, NO active sessions on machine
4	Unattended requires: no active user sessions (not just signed out — no sessions at all)
5	Input params = cloud flow SENDS data to desktop flow
6	Output params = desktop flow SENDS data back to cloud flow
7	Two creation methods: pre-built actions OR recording
8	Web UI flows (legacy) require: Edge + Selenium IDE + Power Automate Desktop
9	Desktop flows run on a local machine (not in the cloud)
10	On-premises data gateway = for connecting cloud to on-premises DATA (not for desktop flows)
11	Regression testing = Desktop flow (replay UI actions) + Automated cloud flow (orchestrate)
________________________________________
📝 All Related Questions + Answers
Q135, Q235-236: Components for web UI flows
Scenario: Create and run web UI flows
Answer: ✅ A (Power Automate Desktop / UI Flows app) + B (Latest Microsoft Edge) + C or D (Selenium IDE)
Note: Older versions of the question list different options:
•	Q135: A (Power Automate Desktop), B (Edge), D (Selenium IDE) ✅
•	Q235-236: A (UI Flows app), B (Edge), C (Selenium IDE) ✅
❌ Mozilla Firefox — not required (Edge is sufficient)
❌ On-premises data gateway — not needed for UI automation
Key: Three components — Desktop app + Browser + Selenium IDE
________________________________________
Q136: Desktop flow sequence for SharePoint data transfer
Sequence (4 steps):
1.	Start recording (begin capturing actions)
2.	Perform actions on the legacy software (click, type, navigate)
3.	Stop recording and save automation
4.	Output row data to SharePoint list (send data via output params)
Key: Record first → then configure data output
________________________________________
Q151: Run desktop flow during non-peak hours (no user)
Scenario: UI flow must sign in with User credentials, run unattended
Answer: ✅ C. Ensure there are NO active user sessions on the device
❌ A (Active user session) — that's ATTENDED mode
❌ B (All signed out) — close but wrong: disconnected sessions are OK, active sessions are NOT
❌ D (All signed out except locked) — locked sessions are still active
Key: UNATTENDED = zero active sessions. The flow itself will sign in with provided credentials
________________________________________
Q155: Two ways to create desktop flows
Answer: ✅ A (Record mouse and keyboard events) + C (Use pre-built actions)
❌ B (Pre-built template) — templates exist but aren't a "creation method" per se
❌ D (Visio models) — not how desktop flows are created
Key: Two methods — Recording OR drag-and-drop actions
________________________________________
Q213-214: Attended vs Unattended for two scenarios
Scenario 1: User manually triggers process, watches it run, fills in some fields
→ Attended (user is present and interacts)
Scenario 2: Nightly batch process runs at 2AM, no one at the computer
→ Unattended (no user present, scheduled via cloud flow)
Key: User present = Attended. No user = Unattended
________________________________________
Q285-286: Desktop flow input/output parameters
Inbound (Input):
→ ✅ Run a cloud flow from the Dataverse qualification record to send data to the desktop flow
❌ Copy/paste — not automated
❌ Dataverse connector from desktop flow — desktop flows don't have Dataverse connector natively
Outbound (Output):
→ ✅ Send data from the desktop flow to cloud flow to update the qualification record
❌ Copy/paste — not automated
❌ Dataverse connector from desktop flow — same reason
Key: Cloud flow = orchestrator. Desktop flow = worker. Data flows: Cloud → Desktop (input) → Desktop → Cloud (output)
________________________________________
Q307: Regression testing tools
Answer: ✅ A (Power Automate desktop flow) + C (Power Automate automated flow)
•	Desktop flow = replays UI interactions (like a test script)
•	Automated flow = orchestrates and triggers the desktop flow
❌ Windows Steps Recorder — captures steps but doesn't replay/automate
❌ Windows Recorder V1 — legacy, replaced by Power Automate Desktop
Key: Desktop flow (execute tests) + Cloud flow (trigger/schedule tests)
________________________________________
🔧 Apply Section — Verify It Yourself
✅ Exercise 1: Open Power Automate Desktop
1.	Search for "Power Automate" in Windows Start menu
2.	Open Power Automate Desktop (it's pre-installed on Windows 10/11)
3.	Sign in with your Microsoft account
4.	See the main screen with "+ New flow" button
5.	This is where you BUILD desktop flows
✅ Exercise 2: Create a Simple Desktop Flow
1.	Click + New flow → name: "PL200 Practice"
2.	In the designer, see the Actions panel on the left
3.	Drag "Launch new Microsoft Edge" → set URL: https://make.powerapps.com
4.	Drag "Click element on web page" → use the UI element picker to select a button
5.	Save → Run → watch it automate the browser ✅
✅ Exercise 3: Use Recording
1.	In your desktop flow → click "Recorder" (top toolbar) or "Web Recorder"
2.	A recording toolbar appears
3.	Perform actions: open browser, click buttons, type text
4.	Stop recording → see auto-generated actions in your flow
5.	This is the recording method from Q155
✅ Exercise 4: See Input/Output Variables
1.	In your desktop flow → click "Variables" panel (right side)
2.	Click "+" → Input variable → name: CustomerName, type: Text
3.	Click "+" → Output variable → name: VerificationResult, type: Text
4.	Use CustomerName in your actions (e.g., type it into a web form)
5.	Set VerificationResult at the end (e.g., read text from screen)
6.	When triggered from a cloud flow → cloud sends CustomerName, receives VerificationResult
✅ Exercise 5: Connect Desktop Flow to Cloud Flow
1.	Go to make.powerautomate.com → create a new Automated cloud flow
2.	Add action: "Run a flow built with Power Automate Desktop"
3.	Select your desktop flow → see Input parameters appear
4.	Fill in the input → after the action, Output parameters are available as dynamic content
5.	Add next action: Update a Dataverse row with the output
6.	This is the full orchestration pattern (Q285-286)
✅ Exercise 6: See Attended vs Unattended Setting
1.	In the cloud flow → when you add "Run a desktop flow" action
2.	Look for "Run Mode" setting: Attended or Unattended
3.	Attended = machine must have active user session
4.	Unattended = machine must have NO active sessions
5.	Try both → observe the difference
________________________________________
📘 TOPIC SHEET 14: Canvas App Variables & Functions
(~20 questions) ⚠️ You know the basics, master the exam tricks
________________________________________
📖 Concept
Variable Types in Canvas Apps
Type	Created With	Scope	Persists Across Screens?	Data Type
Global Variable	Set(varName, value)	Entire app	✅ Yes	Single value (text, number, boolean, record)
Context Variable	UpdateContext({varName: value})	Current screen ONLY	❌ No (unless passed via Navigate)	Single value
Collection	Collect(colName, record) or ClearCollect(colName, data)	Entire app	✅ Yes	Table (multiple rows)
🧠 The Critical Differences (EXAM LOVES THIS)
Set()           → Global variable → ONE value → accessible EVERYWHERE
UpdateContext() → Context variable → ONE value → accessible ONLY on current screen
Collect()       → Collection → TABLE of rows → accessible EVERYWHERE
Navigate()      → Can PASS context variables to the target screen
Key Functions
Function	What It Does	Returns
Set(var, value)	Creates/updates a global variable	Nothing (side effect)
UpdateContext({var: value})	Creates/updates a context variable	Nothing (side effect)
Navigate(Screen, Transition, {var: value})	Navigate + pass context variable	Nothing
Collect(col, record)	ADDS a record to a collection	Nothing
ClearCollect(col, data)	CLEARS then adds records to collection	Nothing
Remove(col, record)	Removes specific record from collection	Nothing
Clear(col)	Removes ALL records from collection	Nothing
Patch(table, record, changes)	Create or update a record in data source	The modified record
Reset(control)	Resets a control to its Default value	Nothing
Revert(table)	Refreshes data from source, discards local changes	Nothing
SaveData(col, "key")	Saves collection to local device (offline)	Nothing
LoadData(col, "key")	Loads collection from local device (offline)	Nothing
If(condition, true_val, false_val)	Conditional logic	The result value
ForAll(table, formula)	Iterates through each row	Table of results
Delegation
Concept	What It Means
Delegation	Power Apps pushes the query to the data source (efficient)
Non-delegable	Power Apps downloads ALL data then filters locally (slow, limited)
Default limit	500 rows (can increase to 2,000 in settings)
Delegable functions	Filter, Sort, Search (with supported data sources)
Non-delegable functions	CountRows, Sum on filtered data, First on filtered data, Lookup with complex conditions
Exam Rule: If a query returns more than 2,000 rows → non-delegable functions miss data!
________________________________________
🔑 Rules to Memorize
Rule	Remember
1	Set() = global (all screens)
2	UpdateContext() = local (current screen only)
3	Navigate() can pass context variables to another screen
4	Collect() = ADD to collection. ClearCollect() = REPLACE collection
5	Clear() = remove all rows. Remove() = remove specific row
6	Collection is a table (multiple rows). Variable is a single value
7	Set() creates a variable — it is NOT a collection
8	Collect() auto-creates the collection if it doesn't exist
9	Collect() does NOT update existing records — it ADDS new ones
10	Reset() resets a CONTROL to its Default (not a variable)
11	SaveData/LoadData = offline storage on device
12	Delegation limit = 2,000 max (default 500)
13	OnVisible = runs when screen becomes visible (good for initializing data)
14	OnSelect = runs when user clicks/taps a control
15	Patch() = create or update records in Dataverse/data source
________________________________________
📝 All Related Questions + Answers
Q97-98: Pass values between screens + offline data
•	Pass values from current screen to another → ✅ Navigate (with context variable parameter)
❌ Back — goes back, doesn't pass values
❌ MovePrevious — not a Power Apps function
•	Display data when app is offline → ✅ LoadData (loads saved data from local storage)
❌ ClearCollect — needs connection to data source
❌ ShowDataOffline — not a real function
Key: Navigate = pass data. LoadData = offline display
________________________________________
Q99: Clear all gallery selections
Scenario: Gallery with checkboxes. Button to clear all selections
Answer: ✅ D. OnCheck → Collect to collection. OnUncheck → Remove from collection. Button → Clear collection
How:
•	Checkbox OnCheck: Collect(CompareList, ThisItem)
•	Checkbox OnUncheck: Remove(CompareList, ThisItem)
•	Button OnSelect: Clear(CompareList)
❌ Reset(Gallery) — can't reset controls inside a gallery from outside
❌ ForAll + clear — unnecessarily complex
Key: Collection pattern = Collect on check, Remove on uncheck, Clear on button
________________________________________
Q100: Collect() behavior (Yes/No series)
Statement 1: "People collection is automatically created if it doesn't exist"
→ ✅ Yes — Collect auto-creates collections
Statement 2: "When Button is pressed, if record with same ID exists, values are updated"
→ ❌ No — Collect ADDS a new record, it does NOT update existing. You'd get a duplicate
Statement 3: "Adding a new field (Age) to the Collect function will result in an error"
→ ❌ No — Collections are flexible, adding new columns is fine
Key: Collect = always ADDS, never UPDATES. Collections are schema-flexible
________________________________________
Q107: Reset checkbox selections
Answer: ✅ B. Reset(checkbox control)
Why: Reset() returns a control to its Default property value
❌ Reset(gallery) — can't reset gallery from outside
❌ Reload — not a Power Apps function
❌ Revert — refreshes data source, doesn't reset controls
Key: Reset() works on INDIVIDUAL controls, not containers
________________________________________
Q111: Set() behavior (Yes/No series)
Set(AgeGroups, ["25", "26-54", "55+"])
Statement 1: "AgeGroups can be accessed from Screen1 and Screen2"
→ ✅ Yes — Set() creates a global variable, accessible everywhere
Statement 2: "AgeGroups is a collection"
→ ❌ No — Set() creates a VARIABLE (even if the value is an array). Collections are created with Collect()
Statement 3: "You can use the Update function to change values in AgeGroups"
→ ❌ No — Update() works on data sources/collections, not on variables created with Set()
Key: Set() = variable (even if array). Collect() = collection. They are DIFFERENT
________________________________________
Q128: Mask SSN (show only last 4 digits)
Answer: ✅ D. Power Fx
How: Use Right(SSN.Text, 4) to get last 4, then "***-**-" & Right(SSN.Text, 4)
❌ Business rule — can't mask/format display in canvas apps
❌ BPF — guided process, not formatting
❌ Power BI DAX — wrong platform
Key: Power Fx for any UI formatting/masking in canvas apps
________________________________________
Q133-134: Collection functions
•	Create a new collection variable → ✅ ClearCollect (creates fresh collection)
•	Remove table values from collection → ✅ Drop / Remove 
o	Remove() = remove specific record
o	Clear() = remove ALL records
o	DropColumns() = remove specific columns
Key: ClearCollect = create/replace. Remove/Clear = delete records
________________________________________
Q187: Variable available ONLY to current screen
Answer: ✅ A (UpdateContext) + B (Navigate)
•	UpdateContext({myVar: "hello"}) — creates context variable on current screen
•	Navigate(Screen2, None, {myVar: "hello"}) — passes context variable to Screen2
❌ SaveData — saves to device storage, not screen-scoped
❌ Set — creates GLOBAL variable (all screens)
❌ Collect — creates GLOBAL collection
Key: Context variable = screen-scoped. Created with UpdateContext or Navigate
________________________________________
Q188: Variable types for two requirements
•	Each screen must maintain separate copy of data and pass to another screen → Context variable (per-screen, passable via Navigate)
•	Must be able to update separate rows of a table independently → Collection (table structure, row-level operations)
Key: Separate per screen = context variable. Table with rows = collection
________________________________________
Q189-190: Send email after save + conditional display
•	Send email after record saved → ✅ Power Automate flow (triggered from canvas app)
•	Display column if creation date > 90 days → ✅ Visible property with If formula 
o	If(DateDiff(ThisItem.CreatedOn, Today(), Days) > 90, true, false)
Key: Email = flow. Conditional visibility = If() on Visible property
________________________________________
Q129-130: Responsive canvas app
Answer: ✅ A (Disable Scale to Fit) + D (Configure height/width using formulas)
How:
•	Disable Scale to Fit → app no longer stretches to fixed size
•	Use formulas: App.Width and App.Height to dynamically size controls
❌ Drag handles — fixed size, not responsive
❌ Lock orientation — restricts rotation, not responsive layout
Key: Responsive = disable Scale to Fit + formula-based sizing
________________________________________
Q131: Single screen for data entry
Answer: ✅ C. Create a canvas app
Why: Canvas apps allow custom single-screen layouts with full control
❌ Power Automate flow — automation, not UI
❌ Power Virtual Agents — chatbot, not data entry
❌ Modify site map — model-driven navigation, not single-screen layout
________________________________________
Q192: List records sorted by category with expand/hide
Answer: ✅ C. Gallery
Why: Gallery control displays lists of records. Group by category + expand/collapse
❌ Card — compact summary, not expandable list
❌ Expression — logic tool, not UI
❌ Power BI dashboard — reporting, not data entry app
________________________________________
Q208: Evaluation form — Total field with conditional color
Formula for Color property:
If(Value(Total.Text) > 25, Color.Green, Color.Black)
Key: Value() converts text to number. If() for conditional formatting. Color.Green/Black for colors
________________________________________
🔧 Apply Section — Verify It Yourself
✅ Exercise 1: Global vs Context Variable
1.	Create a canvas app with Screen1 and Screen2
2.	On Screen1, add a button with OnSelect: Set(GlobalVar, "Hello from Global")
3.	On Screen1, add another button: UpdateContext({LocalVar: "Hello from Local"})
4.	On Screen1, add labels showing GlobalVar and LocalVar → both show values ✅
5.	Navigate to Screen2 → add labels showing GlobalVar and LocalVar
6.	Result: GlobalVar shows ✅ | LocalVar is blank ❌ (it's screen-scoped!)
✅ Exercise 2: Pass Context Variable via Navigate
1.	On Screen1 button OnSelect: Navigate(Screen2, None, {PassedVar: "I was passed!"})
2.	On Screen2, add a label: PassedVar
3.	Result: Label shows "I was passed!" ✅
4.	This proves Navigate can pass context variables
✅ Exercise 3: Collection vs Variable
1.	Button 1 OnSelect: Set(MyVar, ["A", "B", "C"])
2.	Button 2 OnSelect: ClearCollect(MyCol, {Letter: "A"}, {Letter: "B"}, {Letter: "C"})
3.	Try: CountRows(MyVar) → ERROR (it's a variable, not a collection!)
4.	Try: CountRows(MyCol) → 3 ✅
5.	Key lesson: Set = variable (even if array). ClearCollect = collection (table)
✅ Exercise 4: Collect Does NOT Update
1.	ClearCollect(People, {ID: 1, Name: "Bashar"})
2.	Collect(People, {ID: 1, Name: "Bashar Updated"})
3.	Check People collection → you now have TWO records with ID=1
4.	Collect ADDS, it does NOT update! Use Patch() or UpdateIf() to update
✅ Exercise 5: Reset a Control
1.	Add a TextInput control → Default: "" (empty)
2.	User types "Hello" → the control shows "Hello"
3.	Add a button: Reset(TextInput1)
4.	Click the button → TextInput resets to "" (empty) ✅
5.	Key: Reset returns to Default property, discarding user input
✅ Exercise 6: Delegation Warning
1.	Connect to a Dataverse table with 5,000+ records
2.	Add a Gallery: Filter(LargeTable, Status = "Active") → No warning (delegable ✅)
3.	Change to: Filter(LargeTable, Len(Name) > 5) → Delegation warning ⚠️
4.	The yellow triangle means: only first 500/2000 records will be processed
5.	Go to Settings → Upcoming features → find "Data row limit" → increase to 2000
✅ Exercise 7: Offline with SaveData/LoadData
1.	On app start (App.OnStart): LoadData(CachedAccounts, "accounts_cache", true)
2.	On a refresh button: ClearCollect(CachedAccounts, Accounts); SaveData(CachedAccounts, "accounts_cache")
3.	When online → refresh button loads fresh data and saves locally
4.	When offline → app starts with cached data from LoadData
5.	This is the offline pattern from Q97-98
________________________________________
📘 TOPIC SHEET 15: Environment & Admin Management
(~15 questions) ⚠️ Mixed topics — memorization heavy
________________________________________
📖 Concept
Environment Types
Type	Purpose	Can Reset?	Can Copy?	Can Backup?
Default	Auto-created for tenant, all users have access	❌ No	❌ No	✅ Yes
Production	Live business apps	❌ No reset	✅ Yes (to sandbox)	✅ Yes
Sandbox	Testing, development, training	✅ Yes	✅ Yes	✅ Yes
Developer	Individual dev work	❌ No	❌ No	❌ No
Teams	Created automatically for Teams apps	❌ No	❌ No	❌ Limited
Trial	30-day evaluation	❌ No	❌ No	❌ No
Admin Roles
Role	Can Create Environments?	Can Manage Users?	Can Assign Security Roles?	Can Perform Backups?	Scope
Global Admin	✅	✅	✅	✅	Entire tenant
Power Platform Admin	✅	✅	✅	✅	All environments
Dynamics 365 Admin	✅	✅	✅	✅	D365 environments
Environment Admin	❌	✅ (within env)	✅ (within env)	✅ (within env)	Single environment
System Administrator	❌	✅ (within env)	✅ (within env)	❌	Single environment (Dataverse)
System Customizer	❌	❌	❌	❌	Customize tables/apps
Environment Maker	❌	❌	❌	❌	Create apps/flows
Basic User	❌	❌	❌	❌	Run apps, own data
DLP Policies (Data Loss Prevention)
Concept	What It Does
Business connectors	Trusted connectors (Dataverse, SharePoint, Outlook)
Non-Business connectors	Untrusted/personal connectors (Twitter, Gmail)
Blocked connectors	Cannot be used at all
Policy scope	Can apply to: single environment, multiple environments, or entire tenant
Impact	Flows/apps using blocked connector combinations → SUSPENDED
Key Admin Tasks & Where to Do Them
Task	Where
Change username	Microsoft 365 Admin Center
Assign security roles	Power Platform Admin Center → Environment → Settings
Create environments	Power Platform Admin Center
Configure DLP policies	Power Platform Admin Center
Enable languages	Power Platform Admin Center → Environment → Settings → Product → Languages
Enable Dataverse Search	Power Platform Admin Center → Environment → Settings → Product → Features
Configure server-side sync	Power Platform Admin Center → Environment → Settings → Email
Enable auditing	Power Platform Admin Center → Environment → Settings → Audit and logs
Manage solutions	make.powerapps.com → Solutions
Configure SharePoint integration	Power Platform Admin Center → Environment → Settings → Document Management
Server-Side Synchronization (Email)
Step	Where
1. Configure server profile	Power Platform Admin Center → Settings → Email → Server Profiles
2. Configure mailboxes	Power Platform Admin Center → Settings → Email → Mailboxes
3. Approve mailbox	Admin must approve email address
4. Test & Enable	Click "Test & Enable Mailboxes"
SharePoint Integration
Step	What
1	Enable server-based SharePoint integration
2	Select tables for document management
3	Create document locations (auto or manual)
4	Documents stored in SharePoint, linked from Dataverse
Key benefit	Reduces Dataverse storage consumption
Currency Management
Rule	Detail
Base currency	Set during environment creation → CANNOT be changed
Cannot deactivate	Base currency → always active
Can deactivate	Non-base currencies → stops new transactions but keeps historical data
Cannot delete	Currencies used by records → can only deactivate
Word/Excel Templates
Template Type	Created By	Use Case
Word template	System Admin or Customizer	Generate documents from record data
Excel template	Any user (personal) or Admin (org-wide)	Export views to formatted Excel
What you CAN do	Add fields, format tables, add images	Standard Word/Excel features
What you CANNOT do	Conditional fields, alternating row colors, complex formulas	Limited to mail-merge style
________________________________________
🔑 Rules to Memorize
Rule	Remember
1	Change username = M365 Admin Center (NOT Dataverse, NOT Power Platform)
2	Delete user + recreate = ❌ LOSES history. Change username = ✅ KEEPS history
3	Base currency = CANNOT be changed or deactivated after creation
4	Deactivate currency = stops new transactions, keeps historical records
5	DLP policy = controls which connectors can be used together
6	Business + Non-Business connectors in same flow = BLOCKED by DLP
7	Server-side sync = configure in Power Platform Admin Center (email settings)
8	SharePoint integration = reduces Dataverse storage (documents stored in SP)
9	OneDrive integration = personal document storage (NOT shared team documents)
10	Enable languages = install language packs → enable in environment settings
11	Extract translations = from the SOLUTION (Translations → Export)
12	Dataverse for Teams environment = created by creating/installing an app in Teams
13	Word template: CAN add customer address. CANNOT add conditional fields or alternating row colors
14	On-premises data gateway = connects cloud flows to on-premises data sources
15	Least privilege principle = always assign the MINIMUM role needed
________________________________________
📝 All Related Questions + Answers
Q24-27, Q34: Change user sign-in name (Yes/No series)
Scenario: Elisabeth Rice changes name to Elisabeth Mueller. Update sign-in without losing history
Q24: Change username in user record for the app → ✅ Yes (A)
Q25: Ask M365 admin to change username in admin portal → ✅ Yes (A)
Q26-27: Delete user and recreate → ❌ No (B) — LOSES all history
Q34: Change email in D365 Email Configuration → ❌ No (B) — wrong location
Key: Change username = M365 Admin Center. NEVER delete + recreate
________________________________________
Q21: Admin roles for least privilege
•	Create users → System Administrator (or Global Admin)
•	Assign security roles → System Administrator
•	Perform backups from instance → Dynamics 365 Admin (or Global Admin)
Key: Match the MINIMUM role needed for each task
________________________________________
Q31: Shared device security (unauthorized access)
Scenario: Shared warehouse devices, unauthorized users accessing after failed logout
•	Prevent unauthorized access → Session timeout (auto-logout after inactivity)
•	Detect unauthorized actions → Audit logging
Key: Session timeout + audit trail = shared device security
________________________________________
Q46, Q50: Currency management
Q46: Can't deactivate a currency → ✅ C. It's the base currency (base currency can never be deactivated)
Q50: Stop Brazilian transactions but keep office open → ✅ D. Deactivate Brazilian currency (stops new transactions, keeps historical)
❌ Delete currency — can't delete if used by records
❌ Rename — doesn't stop transactions
❌ Disable language pack — unrelated
________________________________________
Q72, Q182: Dataverse for Teams environment
Scenario: How to create a Dataverse for Teams environment
Answer: ✅ A (Create a new app in Teams) + B (Install existing app in Teams)
❌ Create in Admin Center — you can't directly create Teams environments
❌ App permission policy — controls app access, doesn't create environments
Key: Teams environment is auto-provisioned when you create/install a Power App in Teams
________________________________________
Q44-45: Restrict app by location
•	Restrict to specific region → Azure Active Directory (Conditional Access)
•	Specify locations → Conditional Access policy with named locations
Key: Location-based access = always Azure AD Conditional Access
________________________________________
Q68, Q105-106, Q295-296: Localization & Translation
Q68: Translation methods by component type:
•	Views/forms → Export and re-import translated text (from solution)
•	Email templates → Create separate version for each language
•	Reports → Use embedded labels
Q105-106: Extract text for translation → ✅ C. The solution in the web application
(Solutions → select solution → Translations → Export Translations)
Q295-296: Enable languages:
•	Allow language to be used → Language packs (install them)
•	Enable the languages → Environment settings (Admin Center → Environment → Settings → Languages)
________________________________________
Q149-150, Q249-250: Hide Flows button
Answer: ✅ B/C. Customizations section of System Settings
Where: Settings → Customizations → System Settings → Customizations tab → toggle Flow button
❌ SiteMap — controls navigation, not the Flows button specifically
❌ Entity component — not where this setting lives
❌ Buttons tab of Flow — doesn't exist
________________________________________
Q237: Server-side synchronization configuration
Locations:
•	Configure server profile → Power Platform Admin Center → Email → Server Profiles
•	Configure mailboxes → Power Platform Admin Center → Email → Mailboxes
•	Approve and test → Test & Enable Mailboxes
Key: All email configuration = Power Platform Admin Center → Settings → Email
________________________________________
Q265-267: Storage solution for documents (Yes/No series)
Scenario: Sales team needs to attach many documents, minimize storage costs
Q265-266: Enable Outlook integration → ❌ No — Outlook doesn't reduce Dataverse storage
Q267: Enable OneDrive for Business → ❌ No — OneDrive is personal, not shared team documents
Correct answer (implied): Enable SharePoint integration → documents stored in SharePoint, not Dataverse
Key: SharePoint = shared document storage that reduces Dataverse consumption
________________________________________
Q269-270: On-premises data gateway
Scenario: Canvas app needs near-real-time data from on-premises accounting system
Answer: ✅ A. On-premises data gateway
Why: Gateway bridges cloud (Power Apps) to on-premises data (SQL, file shares, etc.)
❌ Azure DevOps — CI/CD pipeline, not data connectivity
❌ Data integration project — bulk/batch, not real-time
❌ Power Pages — external website, not data connectivity
________________________________________
Q283: Word template changes
Scenario: Can you revise a Word template for thank-you letters?
Answer: ✅ D. Add the address of the customer (standard mail-merge field)
❌ A (Conditional field) — Word templates don't support conditions
❌ B (Alternating row colors) — not supported in Dataverse Word templates
❌ C (Format Created On to long date) — formatting is limited in Word templates
Key: Word templates = simple field insertion. No conditional logic or complex formatting
________________________________________
Q323-325: SharePoint document management configuration
Sequence (4 steps):
1.	Enable server-based SharePoint integration (Settings → Document Management)
2.	Select the Prospects table for document management
3.	Create document locations based on Account lookup
4.	Validate and finish setup
Key: Documents saved via integration → stored in SharePoint, linked from Dataverse
________________________________________
Q325: Enable attachments to reduce Dataverse storage?
Answer: ❌ No — Attachments are stored IN Dataverse, which INCREASES storage
Correct approach: Use SharePoint integration to store documents outside Dataverse
Key: Attachments = Dataverse storage. SharePoint = external storage (reduces cost)
________________________________________
🔧 Apply Section — Verify It Yourself
✅ Exercise 1: See Environment Types
1.	Go to https://admin.powerplatform.microsoft.com → Environments
2.	See your environments listed with their Type column (Production, Sandbox, Default, Developer)
3.	Click an environment → see details: URL, Region, Security Group, Version
4.	Notice: Default environment has no security group (everyone can access)
✅ Exercise 2: See Admin Roles
1.	Go to https://admin.microsoft.com → Users → Active Users
2.	Click a user → Manage roles
3.	See available roles: Global Admin, Power Platform Admin, Dynamics 365 Admin, etc.
4.	This is where Q21 admin role assignment happens
✅ Exercise 3: Change a Username (View Only)
1.	M365 Admin Center → Users → Active Users
2.	Click a user → Manage username and email
3.	See where you'd change the sign-in name (DON'T change it — just observe)
4.	This is the correct location for Q24-27
✅ Exercise 4: See Currency Settings
1.	Power Platform Admin Center → Environment → Settings → Business → Currencies
2.	See the list of currencies → notice which one is the Base Currency
3.	Try to deactivate the base currency → you CAN'T ❌
4.	Try to deactivate a non-base currency → you CAN ✅
✅ Exercise 5: See DLP Policies
1.	Power Platform Admin Center → Policies → Data policies
2.	Click + New Policy (don't save — just explore)
3.	See: Business, Non-Business, Blocked connector groups
4.	Try moving a connector (e.g., Twitter) to Blocked → any flow using it would be suspended
5.	Cancel without saving
✅ Exercise 6: See Language Settings
1.	Power Platform Admin Center → Environment → Settings → Product → Languages
2.	See available language packs → notice which are enabled vs disabled
3.	Enable a new language → components can now be translated to it
4.	This is what Q295-296 tests
✅ Exercise 7: See Email Configuration (Server-Side Sync)
1.	Power Platform Admin Center → Environment → Settings → Email
2.	See: Server Profiles, Mailboxes
3.	Click Mailboxes → see list of configured mailboxes
4.	Click a mailbox → see: Approve, Test & Enable buttons
5.	This is the exact sequence from Q237
✅ Exercise 8: See Document Management Settings
1.	Power Platform Admin Center → Environment → Settings → Document Management
2.	See: SharePoint Sites, Document Management Settings
3.	Click Document Management Settings → see which tables are enabled
4.	This is where Q323-325 configuration happens
✅ Exercise 9: Create a Dataverse for Teams Environment
1.	Open Microsoft Teams → click Apps (left sidebar)
2.	Search for "Power Apps" → open it
3.	Click "Start now" or "Create an app" in a specific Team
4.	This auto-provisions a Dataverse for Teams environment ✅
5.	Go to Admin Center → Environments → see the new Teams environment listed
________________________________________
🏆 COMPLETE PROGRESS TRACKER — ALL 15 TOPICS DONE!
#	Topic	Status	Questions	Your Level
1	✅ Search Types	✅ Mastered	12	🟢 Ready
2	✅ Tool Selection	✅ Mastered	15	🟢 Ready
3	✅ Business Rule Scope	✅ Mastered	10	🟢 Ready
4	✅ Views	✅ Mastered	12	🟢 Ready
5	✅ Power Virtual Agents	✅ Mastered	27	🟢 Ready
6	✅ Power Pages	✅ Mastered	12	🟢 Ready
7	✅ Security	✅ Mastered	12	🟢 Ready
8	✅ Forms	✅ Mastered	10	🟢 Ready
9	✅ Duplicate Detection	✅ Mastered	10	🟢 Ready
10	✅ Solutions/ALM	✅ Mastered	8	🟢 Ready
11	✅ Cloud Flows	✅ Mastered	14	🟢 Ready
12	✅ BPF	✅ Mastered	10	🟢 Ready
13	✅ Desktop Flows	✅ Mastered	10	🟢 Ready
14	✅ Canvas Variables	✅ Mastered	20	🟢 Ready
15	✅ Environment & Admin	✅ Mastered	15	🟢 Ready
________________________________________
🎉 ALL 15 TOPIC MASTERY SHEETS COMPLETE!
📊 Total Coverage
Metric	Count
Topics covered	15/15 (100%)
Questions analyzed	~220 unique (from 329 total)
Concepts explained	150+ key rules
Apply exercises	60+ hands-on verifications
Exam domains covered	All 4 (Dataverse, Apps, Automation, Environments)
________________________________________
🚀 Your Next Steps
Phase	What To Do	Time
Phase 1	Go through ALL 60+ "Apply" exercises — verify concepts in your environment	3-4 days
Phase 2	Re-read the Rules to Memorize tables for each topic (print them!)	1 day
Phase 3	Take the Microsoft Official Practice Assessment (https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-200)
1 day
Phase 4	Review any topics you got wrong → re-read that mastery sheet	1-2 days
Phase 5	Book your exam 🎯	You're ready!
________________________________________

