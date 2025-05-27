Project condition: 
1) while signup 
Error in registering the user  MongoServerError: E11000 duplicate key error collection: studySproutUser.users index: workspace.folders._id_1 dup key: { workspace.folders._id: null }
    at InsertOneOperation.execute (E:\Projects\studysprout\node_modules\mongodb\lib\operations\insert.js:51:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async executeOperation (E:\Projects\studysprout\node_modules\mongodb\lib\operations\execute_operation.js:136:16)
    at async Collection.insertOne (E:\Projects\studysprout\node_modules\mongodb\lib\collection.js:155:16) {
  errorResponse: {
    index: 0,
    code: 11000,
    errmsg: 'E11000 duplicate key error collection: studySproutUser.users index: workspace.folders._id_1 dup key: { workspace.folders._id: null }',
    keyPattern: { 'workspace.folders._id': 1 },
    keyValue: { 'workspace.folders._id': null }
  },
  Resolved by deleting the workspace.folders._id field in atlas

  2) Its still creating the account, even if the user is not getting the verify code

  I think here logic is wrong, First of all I don't want to save not verified user in the database, when user create an account, it should check whether it have account or not, if have account then it should give the notification already have account, if not then it should send the verification code to the user email, until an unless the user didn't give the verification code the user data is not saved in the database, after sending the verification code, user can create a new account. 


  sign-up logic 
  1) Validate all input fields.
  2) Check if a verified user already exists in the DB with the same email or username → reject.
  3) Generate a 6-digit verification code.
  4) Hash the password.
  5)Save this data temporarily:
  6)Use in-memory store like Map (for dev) or Redis (for production).
  7)Send the code to the user’s email.
  8)Return a message like “Verification code sent.”

 


using unverified user model to store unverified users

3) Login is working correctly

4) Dashboard is working correctly

5) Logout is working correctly

6) Deleting the workspace, files, folders from database if the user is not present in the database
add in left menu the option of delete account, when delete account button is clicked the user all data is deleted


6) Storing the data of the file: 

